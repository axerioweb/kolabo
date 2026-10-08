-- ============================================================
-- Kolabo — 0008_rpc_and_storage.sql
-- RPC: pretraga kreatora, inbox upita, kontakt posle prihvatanja.
-- Storage bucket za avatare i logotipe.
-- ============================================================

-- ---------- RPC: pretraga kreatora ----------

-- security invoker → važe RLS polise (anon vidi samo javne kolone/profile).
-- Vraća jedan JSON po kreatoru + ukupan broj rezultata za paginaciju.
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
security invoker
set search_path = public
as $$
  with filtered as (
    select p.id, p.full_name, p.username, p.avatar_url, p.bio, p.city,
           p.country, p.verified_at, p.created_at
    from public.profiles p
    where p.role = 'influencer'
      and p.status = 'active'
      and p.onboarding_completed
      and p.username is not null
      and (
        p_q is null
        or p.full_name ilike '%' || p_q || '%'
        or p.username ilike '%' || p_q || '%'
        or p.bio ilike '%' || p_q || '%'
      )
      and (p_country is null or p.country = p_country)
      and (p_city is null or p.city ilike p_city || '%')
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
  )
  select
    jsonb_build_object(
      'id', c.id,
      'full_name', c.full_name,
      'username', c.username,
      'avatar_url', c.avatar_url,
      'bio', c.bio,
      'city', c.city,
      'country', c.country,
      'verified', c.verified_at is not null,
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
        from public.social_accounts s where s.profile_id = c.id
      ), '[]'::jsonb),
      'categories', coalesce((
        select jsonb_agg(pc.category_slug)
        from public.profile_categories pc where pc.profile_id = c.id
      ), '[]'::jsonb),
      'min_price_eur', (
        select min(public.to_eur(sv.price_min, sv.currency))
        from public.services sv where sv.profile_id = c.id
      ),
      'barter', (
        select cp.barter from public.collaboration_prefs cp where cp.profile_id = c.id
      ),
      'rating', (
        select round(avg(r.rating)::numeric, 1)
        from public.reviews r where r.reviewee_id = c.id
      ),
      'reviews_count', (
        select count(*) from public.reviews r where r.reviewee_id = c.id
      )
    ) as profile,
    c.total as total_count
  from counted c
  order by
    case when p_sort = 'recommended' then (c.verified_at is not null)::int else 0 end desc,
    case when p_sort = 'recommended' then (c.avatar_url is not null)::int else 0 end desc,
    c.created_at desc
  limit least(greatest(p_limit, 1), 48)
  offset greatest(p_offset, 0);
$$;

revoke execute on function public.search_influencers from public;
grant execute on function public.search_influencers to anon, authenticated;

-- ---------- RPC: inbox (upiti sa poslednjom porukom) ----------

create or replace function public.my_requests(p_status public.request_status default null)
returns setof jsonb
language sql
stable
security invoker
set search_path = public
as $$
  select jsonb_build_object(
    'id', r.id,
    'title', r.title,
    'status', r.status,
    'compensation', r.compensation,
    'budget_amount', r.budget_amount,
    'currency', r.currency,
    'deliverables', r.deliverables,
    'respond_by', r.respond_by,
    'viewed_at', r.viewed_at,
    'created_at', r.created_at,
    'updated_at', r.updated_at,
    'company', (
      select jsonb_build_object(
        'id', p.id,
        'name', coalesce(nullif(c.name, ''), p.full_name),
        'logo_url', c.logo_url,
        'verified', p.verified_at is not null
      )
      from public.profiles p left join public.companies c on c.profile_id = p.id
      where p.id = r.company_id
    ),
    'influencer', (
      select jsonb_build_object(
        'id', p.id,
        'full_name', p.full_name,
        'username', p.username,
        'avatar_url', p.avatar_url,
        'verified', p.verified_at is not null
      )
      from public.profiles p where p.id = r.influencer_id
    ),
    'unread', (
      select count(*) from public.messages m
      where m.request_id = r.id and m.recipient_id = auth.uid() and m.read_at is null
    ),
    'last_message', (
      select jsonb_build_object(
        'body', left(m.body, 140),
        'created_at', m.created_at,
        'mine', m.sender_id = auth.uid()
      )
      from public.messages m
      where m.request_id = r.id
      order by m.created_at desc
      limit 1
    )
  )
  from public.collaboration_requests r
  where (r.company_id = auth.uid() or r.influencer_id = auth.uid())
    and (p_status is null or r.status = p_status)
  order by r.updated_at desc
  limit 200;
$$;

revoke execute on function public.my_requests from public, anon;
grant execute on function public.my_requests to authenticated;

-- ---------- RPC: kontakt posle prihvaćenog upita ----------

-- Vraća kontakt druge strane SAMO kada je upit prihvaćen/završen,
-- i samo kanale koje je ta strana dozvolila (allowed_channels).
create or replace function public.get_request_contact(rid uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  r public.collaboration_requests;
  other uuid;
  c public.contact_prefs;
  v_email text;
begin
  select * into r from public.collaboration_requests where id = rid;
  if not found or uid is null or uid not in (r.company_id, r.influencer_id) then
    return null;
  end if;
  if r.status not in ('accepted', 'delivered', 'completed') then
    return null;
  end if;

  other := case when uid = r.company_id then r.influencer_id else r.company_id end;
  select * into c from public.contact_prefs where profile_id = other;
  if not found then
    return jsonb_build_object('channels', '[]'::jsonb);
  end if;

  v_email := c.contact_email;
  if v_email is null and 'email' = any (c.allowed_channels) then
    select email into v_email from auth.users where id = other;
  end if;

  return jsonb_build_object(
    'preferred_channel', c.preferred_channel,
    'channels', to_jsonb(c.allowed_channels),
    'email', case when 'email' = any (c.allowed_channels) then v_email end,
    'phone', case
      when c.allowed_channels && array['phone', 'whatsapp', 'viber']::public.contact_channel[]
        then c.phone
    end,
    'instagram', case
      when 'instagram_dm' = any (c.allowed_channels) then (
        select s.handle from public.social_accounts s
        where s.profile_id = other and s.platform = 'instagram'
        limit 1
      )
    end
  );
end;
$$;

revoke execute on function public.get_request_contact(uuid) from public, anon;
grant execute on function public.get_request_contact(uuid) to authenticated;

-- ---------- STORAGE: avatari i logotipi ----------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars', 'avatars', true, 2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- Putanja: avatars/<user_id>/<fajl> — svako piše samo u svoj folder
create policy "avatars: owner select" on storage.objects
  for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "avatars: owner insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "avatars: owner update" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
