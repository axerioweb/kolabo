-- ============================================================
-- Kolabo — 0014_hardening.sql
-- Nalazi bezbednosnog pregleda + vrednost za korisnike:
--   1. Suspendovani nalozi ne mogu da pišu (is_active)
--   2. Privatne kolone profila i firme vidi samo vlasnik/admin
--   3. avatar/logo URL samo iz našeg Storage-a (next/image inače puca)
--   4. Limiti: poruke, prijave, zaključavanje dnevnog limita upita
--   5. Brief se zaključava kada ga kreator otvori
--   6. Pretraga: security definer + trigram indeks + granice
--   7. Statistika odziva kreatora (creator_stats)
--   8. Isticanje upita i podsetnici (pg_cron)
--   9. Email obaveštenja kroz pg_net + Vault (resend_api_key)
--  10. Sitne stvari: notifications samo read_at, firma bez username-a
-- Bez DROP/DELETE naredbi (konektor traži ručnu potvrdu).
-- ============================================================

-- ---------- 1. is_active ----------

create or replace function public.is_active()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and status <> 'suspended'
  );
$$;
revoke execute on function public.is_active() from public, anon;
grant execute on function public.is_active() to authenticated;

create or replace function public.can_message(rid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_active() and exists (
    select 1 from public.collaboration_requests
    where id = rid
      and (company_id = auth.uid() or influencer_id = auth.uid())
      and status in ('pending', 'accepted', 'delivered', 'completed')
  );
$$;

alter policy "reviews: insert after completed" on public.reviews
  with check (
    (select public.is_active())
    and reviewer_id = (select auth.uid())
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

alter policy "reports: insert own" on public.reports
  with check ((select public.is_active()) and reporter_id = (select auth.uid()) and status = 'open');

alter policy "saved: insert own" on public.saved_influencers
  with check (
    (select public.is_active())
    and company_id = (select auth.uid())
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'company'
    )
    and public.is_discoverable(influencer_id)
  );

-- ---------- 2. Privatne kolone ----------

-- profiles: authenticated vidi samo javne kolone; svoje privatne kroz RPC
revoke select on public.profiles from authenticated;
grant select (
  id, role, status, full_name, username, avatar_url, bio, country, city,
  content_languages, onboarding_completed, verified_at, created_at, updated_at
) on public.profiles to authenticated;

create or replace function public.my_private_profile()
returns table (
  birth_year int,
  gender public.gender,
  marketing_opt_in boolean,
  terms_accepted_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select birth_year, gender, marketing_opt_in, terms_accepted_at
  from public.profiles
  where id = auth.uid();
$$;
revoke execute on function public.my_private_profile() from public, anon;
grant execute on function public.my_private_profile() to authenticated;

-- companies: PIB, MB, pravni naziv, kontakt osoba i budžet su privatni
revoke select on public.companies from authenticated;
grant select (
  profile_id, name, company_type, industry, size, website, instagram,
  country, city, description, logo_url, interested_categories, currency,
  created_at, updated_at
) on public.companies to authenticated;

-- Vlasnik: sopstvene privatne kolone; admin: sve firme (pid null) ili jedna
create or replace function public.company_private(pid uuid default null)
returns table (
  profile_id uuid,
  legal_name text,
  tax_id text,
  registration_number text,
  contact_name text,
  contact_role text,
  budget_min int,
  budget_max int
)
language sql
stable
security definer
set search_path = public
as $$
  select c.profile_id, c.legal_name, c.tax_id, c.registration_number,
         c.contact_name, c.contact_role, c.budget_min, c.budget_max
  from public.companies c
  where (c.profile_id = auth.uid() and (pid is null or pid = auth.uid()))
     or (public.is_admin() and (pid is null or c.profile_id = pid));
$$;
revoke execute on function public.company_private(uuid) from public, anon;
grant execute on function public.company_private(uuid) to authenticated;

-- ---------- 3. Slike samo iz našeg Storage-a ----------

alter table public.profiles
  add constraint avatar_url_origin check (
    avatar_url is null
    or avatar_url ~ '^https://[a-z0-9-]+\.supabase\.co/storage/v1/object/public/avatars/'
  );

alter table public.companies
  add constraint logo_url_origin check (
    logo_url is null
    or logo_url ~ '^https://[a-z0-9-]+\.supabase\.co/storage/v1/object/public/avatars/'
  );

-- ---------- 4. Limiti ----------

-- Poruke: najviše 60 u 10 minuta po pošiljaocu
create or replace function public.messages_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform pg_advisory_xact_lock(hashtext('msg:' || new.sender_id::text));
  if (
    select count(*) from public.messages
    where sender_id = new.sender_id and created_at > now() - interval '10 minutes'
  ) >= 60 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
revoke execute on function public.messages_rate_limit() from public, anon, authenticated;

create trigger messages_rate_limit
  before insert on public.messages
  for each row execute function public.messages_rate_limit();

-- Prijave: najviše 10 dnevno i jedna otvorena po prijavljenom nalogu
create or replace function public.reports_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform pg_advisory_xact_lock(hashtext('rep:' || new.reporter_id::text));
  if (
    select count(*) from public.reports
    where reporter_id = new.reporter_id and created_at > now() - interval '1 day'
  ) >= 10 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
revoke execute on function public.reports_rate_limit() from public, anon, authenticated;

create trigger reports_rate_limit
  before insert on public.reports
  for each row execute function public.reports_rate_limit();

create unique index reports_one_open_per_pair
  on public.reports (reporter_id, target_profile_id)
  where status = 'open';

-- Dnevni limit upita: zaključavanje protiv paralelnih umetanja
create or replace function public.requests_before_insert()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  perform pg_advisory_xact_lock(hashtext('req:' || new.company_id::text));
  new.status := 'pending';
  new.responded_at := null;
  new.completed_at := null;
  new.decline_reason := null;
  new.viewed_at := null;
  new.reminded_at := null;
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

-- ---------- 5. + 8. Guard: suspendovani, zaključan brief, podsetnik ----------

alter table public.collaboration_requests add column reminded_at timestamptz;

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
  -- zakazani poslovi (uid null) i admin prolaze bez ograničenja
  if uid is null or public.is_admin() then
    return new;
  end if;
  if not public.is_active() then
    raise exception 'suspended' using errcode = 'P0001';
  end if;

  new.company_id := old.company_id;
  new.influencer_id := old.influencer_id;
  new.created_at := old.created_at;
  new.responded_at := old.responded_at;
  new.completed_at := old.completed_at;
  new.reminded_at := old.reminded_at;

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

  -- Sadržaj menja samo firma, samo dok je upit na čekanju i NEotvoren
  if uid <> old.company_id or old.status <> 'pending' or old.viewed_at is not null then
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

-- Obaveštenja: + istekao upit
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
    elsif new.status = 'expired' then
      perform public.notify(new.company_id, 'collaboration', 'request_expired',
        jsonb_build_object('request_id', new.id, 'name', v_influencer, 'title', new.title));
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

-- Zakazani posao: istekli upiti + podsetnik dan pre roka
create or replace function public.expire_requests()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
begin
  update public.collaboration_requests
  set status = 'expired'
  where status = 'pending' and respond_by is not null and respond_by < current_date;

  for r in
    select id, influencer_id, title, company_id
    from public.collaboration_requests
    where status = 'pending'
      and respond_by = current_date + 1
      and reminded_at is null
  loop
    perform public.notify(
      r.influencer_id, 'reminder', 'request_reminder',
      jsonb_build_object(
        'request_id', r.id,
        'title', r.title,
        'name', (
          select coalesce(nullif(c.name, ''), p.full_name)
          from public.profiles p left join public.companies c on c.profile_id = p.id
          where p.id = r.company_id
        )
      )
    );
    update public.collaboration_requests set reminded_at = now() where id = r.id;
  end loop;
end;
$$;
revoke execute on function public.expire_requests() from public, anon, authenticated;

select cron.schedule('kolabo-expire-requests', '15 6 * * *', $$select public.expire_requests()$$);

-- ---------- 6. Pretraga: definer, trigram, granice ----------

create index profiles_search_trgm_idx on public.profiles
  using gin ((full_name || ' ' || coalesce(username, '') || ' ' || coalesce(bio, '')) extensions.gin_trgm_ops)
  where role = 'influencer';

-- ---------- 7. Statistika odziva ----------

-- Koliko brzo i koliko često kreator odgovara; kada je poslednji put aktivan.
-- Uzimaju se upiti iz poslednjih 180 dana koji su dobili odgovor ILI su
-- stariji od 48h (da se novi upiti ne računaju kao neodgovoreni).
create or replace function public.creator_stats(pid uuid)
returns table (
  response_rate int,
  median_response_hours int,
  last_active_at timestamptz,
  responded_count int
)
language sql
stable
security definer
set search_path = public
as $$
  with considered as (
    select responded_at, created_at
    from public.collaboration_requests
    where influencer_id = pid
      and created_at > now() - interval '180 days'
      and (responded_at is not null or created_at < now() - interval '48 hours')
  )
  select
    case when count(*) > 0
      then round(100.0 * count(responded_at) / count(*))::int end,
    case when count(responded_at) > 0
      then round(percentile_cont(0.5) within group (
        order by extract(epoch from responded_at - created_at) / 3600
      ))::int end,
    greatest(
      (select u.last_sign_in_at from auth.users u where u.id = pid),
      (select max(m.created_at) from public.messages m where m.sender_id = pid),
      (select p.updated_at from public.profiles p where p.id = pid)
    ),
    count(responded_at)::int
  from considered;
$$;
revoke execute on function public.creator_stats(uuid) from public;
grant execute on function public.creator_stats(uuid) to anon, authenticated;

create or replace function public.search_influencers(
  p_q text default null,
  p_category text default null,
  p_platform public.platform default null,
  p_min_followers public.follower_range default null,
  p_max_followers public.follower_range default null,
  p_country public.country_code default null,
  p_city text default null,
  p_barter boolean default null,
  p_max_price int default null,
  p_audience_gender public.audience_gender default null,
  p_audience_age public.age_range default null,
  p_language text default null,
  p_verified boolean default null,
  p_sort text default 'recommended',
  p_limit int default 24,
  p_offset int default 0
)
returns table (profile jsonb, total_count bigint)
language sql
stable
security definer
set search_path = public
as $$
  with filtered as (
    select p.id, p.full_name, p.username, p.avatar_url, p.bio, p.city,
           p.country, p.content_languages, p.verified_at, p.created_at
    from public.profiles p
    where p.role = 'influencer'
      and p.status = 'active'
      and p.onboarding_completed
      and p.username is not null
      and (
        p_q is null
        or (p.full_name || ' ' || coalesce(p.username, '') || ' ' || coalesce(p.bio, ''))
           ilike '%' || left(p_q, 80) || '%'
      )
      and (p_country is null or p.country = p_country)
      and (p_city is null or p.city ilike left(p_city, 60) || '%')
      and (p_verified is not true or p.verified_at is not null)
      and (p_language is null or p_language = any (p.content_languages))
      and (
        p_category is null
        or exists (
          select 1 from public.profile_categories pc
          where pc.profile_id = p.id and pc.category_slug = p_category
        )
      )
      and (
        (p_platform is null and p_min_followers is null and p_max_followers is null
          and p_audience_gender is null and p_audience_age is null)
        or exists (
          select 1 from public.social_accounts s
          where s.profile_id = p.id
            and (p_platform is null or s.platform = p_platform)
            and (p_min_followers is null or s.follower_range >= p_min_followers)
            and (p_max_followers is null or s.follower_range <= p_max_followers)
            and (p_audience_gender is null or s.audience_gender = p_audience_gender)
            and (p_audience_age is null or s.audience_top_age = p_audience_age)
        )
      )
      and (
        p_barter is not true
        or exists (
          select 1 from public.collaboration_prefs cp
          where cp.profile_id = p.id and cp.barter in ('yes', 'depends')
        )
      )
      and (
        p_max_price is null
        or exists (
          select 1 from public.services sv
          where sv.profile_id = p.id
            and sv.price_min is not null
            and public.to_eur(sv.price_min, sv.currency) <= p_max_price
        )
      )
  ),
  counted as (
    select f.*, count(*) over () as total from filtered f
  ),
  enriched as (
    select c.*, st.response_rate, st.median_response_hours, st.last_active_at
    from counted c
    cross join lateral public.creator_stats(c.id) st
  )
  select
    jsonb_build_object(
      'id', e.id,
      'full_name', e.full_name,
      'username', e.username,
      'avatar_url', e.avatar_url,
      'bio', e.bio,
      'city', e.city,
      'country', e.country,
      'verified', e.verified_at is not null,
      'socials', coalesce((
        select jsonb_agg(
          jsonb_build_object(
            'platform', s.platform,
            'handle', s.handle,
            'follower_range', s.follower_range,
            'engagement_rate', s.engagement_rate,
            'is_primary', s.is_primary
          )
          order by s.is_primary desc, s.follower_range desc
        )
        from public.social_accounts s where s.profile_id = e.id
      ), '[]'::jsonb),
      'categories', coalesce((
        select jsonb_agg(pc.category_slug)
        from public.profile_categories pc where pc.profile_id = e.id
      ), '[]'::jsonb),
      'min_price_eur', (
        select min(public.to_eur(sv.price_min, sv.currency))
        from public.services sv where sv.profile_id = e.id
      ),
      'barter', (
        select cp.barter from public.collaboration_prefs cp where cp.profile_id = e.id
      ),
      'rating', (
        select round(avg(r.rating)::numeric, 1)
        from public.reviews r where r.reviewee_id = e.id
      ),
      'reviews_count', (
        select count(*) from public.reviews r where r.reviewee_id = e.id
      ),
      'response_rate', e.response_rate,
      'median_response_hours', e.median_response_hours,
      'last_active_at', e.last_active_at
    ) as profile,
    e.total as total_count
  from enriched e
  order by
    case when p_sort = 'recommended' then (e.verified_at is not null)::int else 0 end desc,
    case when p_sort = 'recommended' then (e.avatar_url is not null)::int else 0 end desc,
    case when p_sort = 'recommended' then coalesce(e.response_rate, 50) else 0 end desc,
    e.created_at desc
  limit least(greatest(p_limit, 1), 48)
  offset least(greatest(p_offset, 0), 2400);
$$;

-- ---------- 9. Email obaveštenja (pg_net + Vault) ----------

-- Ključ se čuva u Vault-u:  select vault.create_secret('re_xxx', 'resend_api_key');
-- Opciono:                   select vault.create_secret('Kolabo <obavestenja@kolabo.rs>', 'email_from');
--                            select vault.create_secret('https://kolabo.rs', 'site_url');
-- Bez ključa funkcija ne radi ništa (nema greške) — in-app obaveštenja rade uvek.
create or replace function public.vault_secret(p_name text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select decrypted_secret from vault.decrypted_secrets where name = p_name limit 1;
$$;
revoke execute on function public.vault_secret(text) from public, anon, authenticated;

create or replace function public.email_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_key text;
  v_email text;
  v_name text;
  v_site text;
  v_subject text;
  v_body text;
  v_link text;
  v_who text := coalesce(new.data ->> 'name', '');
  v_title text := coalesce(new.data ->> 'title', '');
begin
  if new.template is null or new.template in ('welcome_influencer', 'welcome_company') then
    return null;
  end if;

  v_key := public.vault_secret('resend_api_key');
  if v_key is null then
    return null;
  end if;

  select u.email, p.full_name into v_email, v_name
  from auth.users u
  join public.profiles p on p.id = u.id
  left join public.contact_prefs cp on cp.profile_id = u.id
  where u.id = new.profile_id
    and coalesce(cp.email_notifications, true);
  if v_email is null then
    return null;
  end if;

  v_site := coalesce(public.vault_secret('site_url'), 'https://kolabo.rs');
  v_link := case
    when new.data ? 'request_id' then v_site || '/panel/upiti/' || (new.data ->> 'request_id')
    else v_site || '/panel'
  end;

  v_subject := case new.template
    when 'request_new'       then 'Novi upit za saradnju: ' || v_title
    when 'request_accepted'  then v_who || ' je prihvatio/la saradnju'
    when 'request_declined'  then 'Upit je odbijen: ' || v_title
    when 'request_cancelled' then 'Saradnja je otkazana: ' || v_title
    when 'request_delivered' then 'Sadržaj je isporučen: ' || v_title
    when 'request_revision'  then 'Tražene su izmene: ' || v_title
    when 'request_completed' then 'Saradnja je završena: ' || v_title
    when 'request_expired'   then 'Upit je istekao: ' || v_title
    when 'request_reminder'  then 'Podsetnik: sutra ističe rok za odgovor'
    when 'message_new'       then 'Nova poruka od: ' || v_who
    when 'review_new'        then 'Dobio/la si novu ocenu'
    when 'verified'          then 'Tvoj Kolabo profil je verifikovan'
    when 'company_info_needed' then 'Potrebne su dopune za verifikaciju firme'
    else 'Kolabo obaveštenje'
  end;

  v_body :=
    '<p>Zdravo ' || coalesce(nullif(split_part(v_name, ' ', 1), ''), '') || ',</p>'
    || '<p>' || v_subject || '.</p>'
    || case when new.data ? 'note' then '<p>' || (new.data ->> 'note') || '</p>' else '' end
    || '<p><a href="' || v_link || '" style="display:inline-block;padding:12px 22px;border-radius:999px;background:#6d28d9;color:#fff;text-decoration:none;font-weight:600">Otvori na Kolabo</a></p>'
    || '<p style="color:#6f6790;font-size:12px">Obaveštenja možeš isključiti u podešavanjima profila.</p>';

  perform net.http_post(
    url := 'https://api.resend.com/emails',
    body := jsonb_build_object(
      'from', coalesce(public.vault_secret('email_from'), 'Kolabo <noreply@kolabo.rs>'),
      'to', jsonb_build_array(v_email),
      'subject', v_subject,
      'html', v_body
    ),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_key
    ),
    timeout_milliseconds := 8000
  );
  return null;
exception when others then
  -- email nikad ne sme da obori upis obaveštenja
  return null;
end;
$$;
revoke execute on function public.email_notification() from public, anon, authenticated;

create trigger notifications_email
  after insert on public.notifications
  for each row execute function public.email_notification();

-- ---------- 10. Sitnice ----------

-- Korisnik na obaveštenju menja samo read_at
revoke update on public.notifications from anon, authenticated;
grant update (read_at) on public.notifications to authenticated;

-- Firma nema javni profil → ne može da zauzme korisničko ime
create or replace function public.protect_profile_columns()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    new.role := old.role;
    new.verified_at := old.verified_at;
    if old.role = 'company' then
      new.username := old.username;
    end if;
    if old.status = 'suspended' then
      new.status := old.status;
    else
      new.status := case
        when new.onboarding_completed then 'active'::public.profile_status
        else 'pending'::public.profile_status
      end;
    end if;
  end if;
  return new;
end;
$$;
