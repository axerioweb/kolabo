-- ============================================================
-- Kolabo — 0007_collaboration.sql
-- Upiti za saradnju (brief, isporuke, kompenzacija, statusi), poruke
-- vezane za upit, sačuvani kreatori, ocene, prijave zloupotrebe i
-- obaveštenja kroz trigere.
-- ============================================================

-- ---------- COLLABORATION REQUESTS ----------

create table public.collaboration_requests (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.profiles (id) on delete cascade,
  influencer_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 3 and 120),
  goal text check (goal is null or char_length(goal) <= 500),
  brief text not null check (char_length(brief) between 20 and 3000),
  key_messages text check (key_messages is null or char_length(key_messages) <= 1000),
  restrictions text check (restrictions is null or char_length(restrictions) <= 1000),
  -- Isporuke: tip usluge + količina (paralelni nizovi iste dužine)
  deliverables public.service_type[] not null default '{}'
    check (cardinality(deliverables) between 1 and 11),
  deliverable_counts smallint[] not null default '{}',
  compensation public.compensation_type not null default 'paid',
  budget_amount int check (budget_amount is null or budget_amount >= 0),
  currency public.currency not null default 'EUR',
  barter_description text
    check (barter_description is null or char_length(barter_description) <= 500),
  barter_value int check (barter_value is null or barter_value >= 0),
  usage_rights public.usage_rights not null default 'organic_only',
  revisions smallint not null default 1 check (revisions between 0 and 5),
  start_date date,
  end_date date,
  respond_by date,
  -- Firma potvrđuje da će sadržaj biti označen kao reklama (Zakon o oglašavanju čl. 13)
  ad_disclosure_ack boolean not null default false check (ad_disclosure_ack),
  status public.request_status not null default 'pending',
  viewed_at timestamptz,
  decline_reason text check (decline_reason is null or char_length(decline_reason) <= 500),
  responded_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint request_parties check (company_id <> influencer_id),
  constraint request_deliverable_counts check (
    cardinality(deliverable_counts) = cardinality(deliverables)
    and 1 <= all (deliverable_counts) and 20 >= all (deliverable_counts)
  ),
  constraint request_dates check (start_date is null or end_date is null or start_date <= end_date),
  constraint request_paid_has_budget check (
    compensation = 'barter' or budget_amount is not null
  ),
  constraint request_barter_has_description check (
    compensation = 'paid' or barter_description is not null
  )
);

create index requests_influencer_idx
  on public.collaboration_requests (influencer_id, updated_at desc);
create index requests_company_idx
  on public.collaboration_requests (company_id, updated_at desc);
-- Jedan otvoren upit po paru firma–kreator (sprečava spam)
create unique index requests_one_pending_per_pair
  on public.collaboration_requests (company_id, influencer_id)
  where status = 'pending';

alter table public.collaboration_requests enable row level security;

create policy "requests: select participants or admin" on public.collaboration_requests
  for select to authenticated
  using (
    company_id = (select auth.uid())
    or influencer_id = (select auth.uid())
    or (select public.is_admin())
  );

-- Upit šalje samo aktivna firma (završen onboarding), samo vidljivom kreatoru
create policy "requests: insert by active company" on public.collaboration_requests
  for insert to authenticated
  with check (
    company_id = (select auth.uid())
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'company' and p.status = 'active'
    )
    and public.is_discoverable(influencer_id)
  );

create policy "requests: update participants or admin" on public.collaboration_requests
  for update to authenticated
  using (
    company_id = (select auth.uid())
    or influencer_id = (select auth.uid())
    or (select public.is_admin())
  )
  with check (
    company_id = (select auth.uid())
    or influencer_id = (select auth.uid())
    or (select public.is_admin())
  );

-- Pre unosa: uvek kreće kao pending + limit od 20 upita dnevno po firmi
create or replace function public.requests_before_insert()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.status := 'pending';
  new.responded_at := null;
  new.completed_at := null;
  new.decline_reason := null;
  new.viewed_at := null;
  -- Neverifikovana firma: 5 upita dnevno, verifikovana: 30
  if (
    select count(*) from public.collaboration_requests
    where company_id = new.company_id and created_at > now() - interval '1 day'
  ) >= (
    select case when verified_at is null then 5 else 30 end
    from public.profiles where id = new.company_id
  ) then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger requests_before_insert
  before insert on public.collaboration_requests
  for each row execute function public.requests_before_insert();

-- Dozvoljeni prelazi statusa:
--   kreator: pending → accepted | declined
--   firma:   pending → cancelled
--   oboje:   accepted → completed | cancelled
-- Sadržaj upita menja samo firma dok je upit pending.
create or replace function public.requests_guard_update()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  allowed boolean;
begin
  new.updated_at := now();
  if uid is null or public.is_admin() then
    return new;
  end if;

  new.company_id := old.company_id;
  new.influencer_id := old.influencer_id;
  new.created_at := old.created_at;
  new.responded_at := old.responded_at;
  new.completed_at := old.completed_at;

  -- viewed_at: kreator ga postavlja jednom (otvaranje upita)
  if old.viewed_at is not null or uid <> old.influencer_id then
    new.viewed_at := old.viewed_at;
  elsif new.viewed_at is not null then
    new.viewed_at := now();
  end if;

  if new.status is distinct from old.status then
    allowed := case
      when old.status = 'pending' and new.status in ('accepted', 'declined')
        then uid = old.influencer_id
      when old.status = 'pending' and new.status = 'cancelled'
        then uid = old.company_id
      when old.status = 'accepted' and new.status = 'delivered'
        then uid = old.influencer_id
      when old.status = 'accepted' and new.status = 'cancelled'
        then uid in (old.company_id, old.influencer_id)
      -- firma prihvata isporuku ili traži izmene
      when old.status = 'delivered' and new.status in ('completed', 'accepted')
        then uid = old.company_id
      else false
    end;
    if not allowed then
      raise exception 'invalid_status_transition' using errcode = 'P0001';
    end if;
    if old.status = 'pending' then
      new.responded_at := now();
    end if;
    if new.status = 'completed' then
      new.completed_at := now();
    end if;
  end if;

  if not (new.status = 'declined' and old.status = 'pending' and uid = old.influencer_id) then
    new.decline_reason := old.decline_reason;
  end if;

  if uid <> old.company_id or old.status <> 'pending' then
    new.title := old.title;
    new.goal := old.goal;
    new.brief := old.brief;
    new.key_messages := old.key_messages;
    new.restrictions := old.restrictions;
    new.deliverables := old.deliverables;
    new.deliverable_counts := old.deliverable_counts;
    new.compensation := old.compensation;
    new.budget_amount := old.budget_amount;
    new.currency := old.currency;
    new.barter_description := old.barter_description;
    new.barter_value := old.barter_value;
    new.usage_rights := old.usage_rights;
    new.revisions := old.revisions;
    new.start_date := old.start_date;
    new.end_date := old.end_date;
    new.respond_by := old.respond_by;
    new.ad_disclosure_ack := old.ad_disclosure_ack;
  end if;

  return new;
end;
$$;

create trigger requests_guard_update
  before update on public.collaboration_requests
  for each row execute function public.requests_guard_update();

-- Obaveštenja za upite
create or replace function public.requests_notify()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company text;
  v_influencer text;
begin
  select coalesce(nullif(c.name, ''), p.full_name) into v_company
  from public.profiles p left join public.companies c on c.profile_id = p.id
  where p.id = new.company_id;
  select full_name into v_influencer from public.profiles where id = new.influencer_id;

  if tg_op = 'INSERT' then
    perform public.notify(
      new.influencer_id, 'collaboration', 'request_new',
      jsonb_build_object('request_id', new.id, 'name', v_company, 'title', new.title)
    );
  elsif new.status is distinct from old.status then
    if new.status in ('accepted', 'declined') and old.status = 'pending' then
      perform public.notify(
        new.company_id, 'collaboration', 'request_' || new.status::text,
        jsonb_build_object('request_id', new.id, 'name', v_influencer, 'title', new.title)
      );
    elsif new.status = 'cancelled' then
      perform public.notify(
        case when auth.uid() = new.company_id then new.influencer_id else new.company_id end,
        'collaboration', 'request_cancelled',
        jsonb_build_object(
          'request_id', new.id,
          'name', case when auth.uid() = new.company_id then v_company else v_influencer end,
          'title', new.title
        )
      );
    elsif new.status = 'delivered' then
      perform public.notify(new.company_id, 'collaboration', 'request_delivered',
        jsonb_build_object('request_id', new.id, 'name', v_influencer, 'title', new.title));
    elsif new.status = 'accepted' and old.status = 'delivered' then
      perform public.notify(new.influencer_id, 'collaboration', 'request_revision',
        jsonb_build_object('request_id', new.id, 'name', v_company, 'title', new.title));
    elsif new.status = 'completed' then
      perform public.notify(new.company_id, 'collaboration', 'request_completed',
        jsonb_build_object('request_id', new.id, 'name', v_influencer, 'title', new.title));
      perform public.notify(new.influencer_id, 'collaboration', 'request_completed',
        jsonb_build_object('request_id', new.id, 'name', v_company, 'title', new.title));
    end if;
  end if;
  return null;
end;
$$;

create trigger requests_notify_insert
  after insert on public.collaboration_requests
  for each row execute function public.requests_notify();

create trigger requests_notify_update
  after update of status on public.collaboration_requests
  for each row execute function public.requests_notify();

-- ---------- MESSAGES: poruke pripadaju upitu ----------

-- Postojeća (prazna) tabela se proširuje vezom ka upitu. recipient_id
-- ostaje kao denormalizacija (brzi brojači nepročitanog), ali ga uvek
-- postavlja trigger iz upita — klijent ga ne može podmetnuti.

create or replace function public.is_request_participant(rid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.collaboration_requests
    where id = rid
      and (company_id = auth.uid() or influencer_id = auth.uid())
  );
$$;

create or replace function public.can_message(rid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.collaboration_requests
    where id = rid
      and (company_id = auth.uid() or influencer_id = auth.uid())
      and status in ('pending', 'accepted', 'delivered', 'completed')
  );
$$;

alter table public.messages
  add column request_id uuid not null
    references public.collaboration_requests (id) on delete cascade;

create index messages_request_idx on public.messages (request_id, created_at);
create index messages_sender_idx on public.messages (sender_id);
create index messages_unread_idx on public.messages (recipient_id) where read_at is null;

alter policy "messages: participants read" on public.messages
  to authenticated
  using (
    sender_id = (select auth.uid())
    or recipient_id = (select auth.uid())
    or (select public.is_admin())
  );

alter policy "messages: send as self" on public.messages
  to authenticated
  with check (sender_id = (select auth.uid()) and public.can_message(request_id));

alter policy "messages: recipient mark read" on public.messages
  to authenticated
  using (recipient_id = (select auth.uid()))
  with check (recipient_id = (select auth.uid()));

-- Primalac = druga strana u upitu; vreme i status čitanja postavlja baza
create or replace function public.messages_before_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.collaboration_requests;
begin
  select * into r from public.collaboration_requests where id = new.request_id;
  if not found then
    raise exception 'request_not_found' using errcode = 'P0001';
  end if;
  new.recipient_id := case
    when new.sender_id = r.company_id then r.influencer_id
    else r.company_id
  end;
  new.created_at := now();
  new.read_at := null;
  return new;
end;
$$;

create trigger messages_before_insert
  before insert on public.messages
  for each row execute function public.messages_before_insert();

-- Nova poruka: osveži upit (sortiranje inboxa) + jedno obaveštenje po razgovoru
create or replace function public.messages_after_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.collaboration_requests;
  v_recipient uuid;
  v_sender_name text;
begin
  select * into r from public.collaboration_requests where id = new.request_id;
  update public.collaboration_requests set updated_at = now() where id = new.request_id;

  v_recipient := new.recipient_id;
  if new.sender_id = r.company_id then
    select coalesce(nullif(c.name, ''), p.full_name) into v_sender_name
    from public.profiles p left join public.companies c on c.profile_id = p.id
    where p.id = new.sender_id;
  else
    select full_name into v_sender_name from public.profiles where id = new.sender_id;
  end if;

  if not exists (
    select 1 from public.notifications
    where profile_id = v_recipient
      and template = 'message_new'
      and read_at is null
      and data ->> 'request_id' = new.request_id::text
  ) then
    perform public.notify(
      v_recipient, 'message', 'message_new',
      jsonb_build_object('request_id', new.request_id, 'name', v_sender_name, 'title', r.title)
    );
  end if;
  return null;
end;
$$;

create trigger messages_after_insert
  after insert on public.messages
  for each row execute function public.messages_after_insert();

-- Realtime za poruke (RLS važi i za realtime pretplate)
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.messages;
  end if;
end;
$$;

-- ---------- SAVED INFLUENCERS (shortlista firme) ----------

create table public.saved_influencers (
  company_id uuid not null references public.profiles (id) on delete cascade,
  influencer_id uuid not null references public.profiles (id) on delete cascade,
  note text check (note is null or char_length(note) <= 300),
  created_at timestamptz not null default now(),
  primary key (company_id, influencer_id)
);

create index saved_influencers_influencer_idx on public.saved_influencers (influencer_id);

alter table public.saved_influencers enable row level security;

create policy "saved: select own" on public.saved_influencers
  for select to authenticated
  using (company_id = (select auth.uid()));

create policy "saved: insert own" on public.saved_influencers
  for insert to authenticated
  with check (
    company_id = (select auth.uid())
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'company'
    )
    and public.is_discoverable(influencer_id)
  );

create policy "saved: update own" on public.saved_influencers
  for update to authenticated
  using (company_id = (select auth.uid()))
  with check (company_id = (select auth.uid()));

-- ---------- REVIEWS (ocene posle završene saradnje) ----------

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.collaboration_requests (id) on delete cascade,
  reviewer_id uuid not null references public.profiles (id) on delete cascade,
  reviewee_id uuid not null references public.profiles (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text check (comment is null or char_length(comment) <= 1000),
  created_at timestamptz not null default now(),
  unique (request_id, reviewer_id),
  constraint review_not_self check (reviewer_id <> reviewee_id)
);

create index reviews_reviewee_idx on public.reviews (reviewee_id, created_at desc);
create index reviews_reviewer_idx on public.reviews (reviewer_id);

alter table public.reviews enable row level security;

create policy "reviews: select" on public.reviews
  for select to anon, authenticated
  using (
    reviewer_id = (select auth.uid())
    or reviewee_id = (select auth.uid())
    or (select public.is_admin())
    or public.is_discoverable(reviewee_id)
  );

create policy "reviews: insert after completed" on public.reviews
  for insert to authenticated
  with check (
    reviewer_id = (select auth.uid())
    and exists (
      select 1 from public.collaboration_requests r
      where r.id = request_id
        and r.status = 'completed'
        and (
          (r.company_id = (select auth.uid()) and r.influencer_id = reviewee_id)
          or (r.influencer_id = (select auth.uid()) and r.company_id = reviewee_id)
        )
    )
  );

create or replace function public.reviews_notify()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.notify(
    new.reviewee_id, 'system', 'review_new',
    jsonb_build_object('request_id', new.request_id, 'rating', new.rating)
  );
  return null;
end;
$$;

create trigger reviews_notify
  after insert on public.reviews
  for each row execute function public.reviews_notify();

-- ---------- REPORTS: prijava zloupotrebe ----------

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  target_profile_id uuid not null references public.profiles (id) on delete cascade,
  request_id uuid references public.collaboration_requests (id) on delete set null,
  reason public.report_reason not null,
  details text check (details is null or char_length(details) <= 1000),
  status public.report_status not null default 'open',
  resolution_note text check (resolution_note is null or char_length(resolution_note) <= 1000),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  constraint report_not_self check (reporter_id <> target_profile_id)
);

create index reports_status_idx on public.reports (status, created_at desc);
create index reports_reporter_idx on public.reports (reporter_id);
create index reports_target_idx on public.reports (target_profile_id);
create index reports_request_idx on public.reports (request_id);

alter table public.reports enable row level security;

create policy "reports: select own or admin" on public.reports
  for select to authenticated
  using (reporter_id = (select auth.uid()) or (select public.is_admin()));

create policy "reports: insert own" on public.reports
  for insert to authenticated
  with check (reporter_id = (select auth.uid()) and status = 'open');

create policy "reports: admin update" on public.reports
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- ---------- Interni helperi: bez direktnog API pristupa ----------

revoke execute on function public.requests_before_insert() from public, anon, authenticated;
revoke execute on function public.requests_guard_update() from public, anon, authenticated;
revoke execute on function public.requests_notify() from public, anon, authenticated;
revoke execute on function public.messages_before_insert() from public, anon, authenticated;
revoke execute on function public.messages_after_insert() from public, anon, authenticated;
revoke execute on function public.reviews_notify() from public, anon, authenticated;
