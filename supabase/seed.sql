-- ============================================================
-- Kolabo — seed.sql
-- Šifarnik kategorija (mora ostati sinhronizovan sa
-- src/lib/taxonomy.ts → CATEGORIES).
-- ============================================================

insert into public.categories (slug, group_slug, name_sr, name_en, emoji, sort) values
  ('fashion',        'style',         'Moda i stil',                'Fashion & Style',               '👗', 10),
  ('beauty',         'style',         'Lepota i šminka',            'Beauty & Makeup',               '💄', 20),
  ('skincare',       'style',         'Nega kože i kose',           'Skincare & Hair',               '✨', 30),
  ('fitness',        'health',        'Fitnes i trening',           'Fitness & Training',            '💪', 40),
  ('wellness',       'health',        'Zdravlje i wellness',        'Health & Wellness',             '🧘', 50),
  ('sports',         'health',        'Sport',                      'Sports',                        '⚽', 60),
  ('food',           'food',          'Hrana i kuvanje',            'Food & Cooking',                '🍳', 70),
  ('restaurants',    'food',          'Restorani i kafići',         'Restaurants & Cafés',           '☕', 80),
  ('travel',         'life',          'Putovanja',                  'Travel',                        '✈️', 90),
  ('lifestyle',      'life',          'Lifestyle',                  'Lifestyle',                     '🌿', 100),
  ('parenting',      'life',          'Roditeljstvo i porodica',    'Parenting & Family',            '👶', 110),
  ('home',           'life',          'Dom i enterijer',            'Home & Interior',               '🏠', 120),
  ('diy',            'life',          'DIY i ručni radovi',         'DIY & Crafts',                  '🧵', 130),
  ('pets',           'life',          'Kućni ljubimci',             'Pets',                          '🐾', 140),
  ('music',          'entertainment', 'Muzika',                     'Music',                         '🎵', 150),
  ('movies',         'entertainment', 'Film i serije',              'Movies & TV',                   '🎬', 160),
  ('comedy',         'entertainment', 'Humor i zabava',             'Comedy & Entertainment',        '😂', 170),
  ('art',            'entertainment', 'Umetnost i dizajn',          'Art & Design',                  '🎨', 180),
  ('photography',    'entertainment', 'Fotografija',                'Photography',                   '📸', 190),
  ('books',          'entertainment', 'Knjige',                     'Books',                         '📚', 200),
  ('nightlife',      'entertainment', 'Noćni život i događaji',     'Nightlife & Events',            '🎉', 210),
  ('business',       'knowledge',     'Biznis i preduzetništvo',    'Business & Entrepreneurship',   '💼', 220),
  ('finance',        'knowledge',     'Finansije i investicije',    'Finance & Investing',           '📈', 230),
  ('education',      'knowledge',     'Obrazovanje',                'Education',                     '🎓', 240),
  ('science',        'knowledge',     'Nauka',                      'Science',                       '🔬', 250),
  ('sustainability', 'knowledge',     'Ekologija i održivost',      'Sustainability',                '🌍', 260),
  ('gaming',         'tech',          'Gejming',                    'Gaming',                        '🎮', 270),
  ('tech',           'tech',          'Tehnologija i gedžeti',      'Tech & Gadgets',                '📱', 280),
  ('auto',           'tech',          'Auto-moto',                  'Cars & Moto',                   '🚗', 290),
  ('ugc',            'other',         'UGC kreator',                'UGC Creator',                   '🎥', 300)
on conflict (slug) do update set
  group_slug = excluded.group_slug,
  name_sr = excluded.name_sr,
  name_en = excluded.name_en,
  emoji = excluded.emoji,
  sort = excluded.sort;
