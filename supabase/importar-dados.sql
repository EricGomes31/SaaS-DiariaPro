-- ============================================================
-- DIÁRIA PRO — IMPORTAÇÃO DE DADOS (30 e 31/05/2026)
-- Execute no Supabase SQL Editor
-- TRANSAÇÃO: se qualquer linha falhar, NADA é salvo (rollback automático)
-- ============================================================

BEGIN;

-- 1. Adicionar coluna worker_type (se ainda não existir)
ALTER TABLE public.workers ADD COLUMN IF NOT EXISTS worker_type text DEFAULT 'diarista';
ALTER TABLE public.workers ADD COLUMN IF NOT EXISTS email text;

-- 2. Limpar dados existentes
DELETE FROM public.activity_logs;
DELETE FROM public.payment_records;
DELETE FROM public.work_days;
DELETE FROM public.workers;
DELETE FROM public.locations;
DELETE FROM public.holidays;

-- 3. Locais
INSERT INTO public.locations (id, name, color, short_name) VALUES
  ('loc-porto-canoa', 'Porto Canoa', '#6366f1', 'PC'),
  ('loc-arteb',       'ARTEB',       '#f59e0b', 'ARTEB');

-- 4. Diaristas
INSERT INTO public.workers (id, name, department, job_title, weekday_rate, weekend_rate, sunday_rate, locations, status, pix_key_type, pix_key, worker_type) VALUES
  -- Doca / Porto Canoa
  ('elizeu-neves',           'ELIZEU NEVES DOS SANTOS',              'Total',      'Doca',          170, 170, 180, ARRAY['loc-porto-canoa'], 'active', 'telefone', '(27)99721-8048',    'diarista'),
  ('kaique-anacleto',        'KAIQUE RUBENS ANACLETO',               'Total',      'Doca',          200, 200, 230, ARRAY['loc-porto-canoa'], 'active', 'telefone', '(27)99578-9142',    'diarista'),
  ('leonardo-rodrigues',     'LEONARDO DA SILVA RODRIGUES',          'Total',      'Doca',          170, 170, 170, ARRAY['loc-porto-canoa'], 'active', 'telefone', '(27)99835-0768',    'diarista'),
  ('diego-vieira-lucas',     'DIEGO VIEIRA LUCAS',                   'Total',      'Doca',          170, 170, 180, ARRAY['loc-porto-canoa'], 'active', 'cpf',      '122.587.616-89',    'diarista'),
  ('gerferson-cardoso',      'GERFERSON DA SILVA CARDOSO',           'Total',      'Doca',          170, 170, 180, ARRAY['loc-porto-canoa'], 'active', 'cpf',      '147.228.504-29',    'diarista'),
  ('eliton-aguiar',          'ELITON GOMES DE AGUIAR',               'Total',      'Doca',          170, 170, 180, ARRAY['loc-porto-canoa'], 'active', 'telefone', '(27)98119-3686',    'diarista'),
  ('gabriel-pereira-santos', 'GABRIEL PEREIRA DOS SANTOS',           'Total',      'Doca',          170, 170, 170, ARRAY['loc-porto-canoa'], 'active', 'cpf',      '065.931.997-70',    'diarista'),
  ('wemerson-souza',         'WEMERSON DE SOUZA',                    'Total',      'Doca',          170, 170, 170, ARRAY['loc-porto-canoa'], 'active', 'cpf',      '154.434.707-36',    'diarista'),
  ('bruno-rezende',          'BRUNO DA SILVA REZENDE',               'Total',      'Doca',          170, 170, 170, ARRAY['loc-porto-canoa'], 'active', 'cpf',      '214.771.437-26',    'diarista'),
  ('leoncio-ataide',         'LEONCIO ATAIDE SANTOS',                'Serra Park', 'Doca',          170, 170, 180, ARRAY['loc-porto-canoa'], 'active', 'cpf',      '184.528.147-04',    'diarista'),
  ('jhonathan-barcelos',     'JHONATHAN LASCKOSK BARCELOS',          'Total',      'Doca',          170, 170, 180, ARRAY['loc-porto-canoa'], 'active', 'cpf',      '120.681.037-88',    'diarista'),
  ('denilson-machado',       'DENILSON MACHADO ALVES',               'Total',      'Doca',          170, 170, 180, ARRAY['loc-porto-canoa'], 'active', 'telefone', '(27)98815-5705',    'diarista'),
  ('saygho-oliveira',        'SAYGHO DE OLIVEIRA',                   'Total',      'Doca',          180, 180, 180, ARRAY['loc-porto-canoa'], 'active', 'email',    'SAYGHO_15@HOTMAIL.COM', 'diarista'),
  ('italo-giovane-rocha',    'ITALO GIOVANE GONCALVES DA ROCHA',     'Total',      'Doca',          180, 180, 180, ARRAY['loc-porto-canoa'], 'active', 'cpf',      '192.530.036-69',    'diarista'),
  ('wellington-santos',      'WELLINGTON SANTOS',                    'Total',      'Doca',          180, 180, 180, ARRAY['loc-porto-canoa'], 'active', 'cpf',      '068.027.645-98',     'diarista'),
  -- Funcionários / Serra Park
  ('kleison-spadetto',       'KLEISON SPADETTO',                     'Serra Park', 'Usaflex',       130, 130, 160, ARRAY['loc-porto-canoa'], 'active', 'telefone', '(27)99847-3611',    'funcionario'),
  ('joao-vitor-souza',       'JOAO VITOR PEREIRA DE SOUZA',          'Serra Park', 'Usaflex',       110, 110, 160, ARRAY['loc-porto-canoa'], 'active', 'cpf',      '217.068.357-79',    'funcionario'),
  ('wilson-nascimento',      'WILSON DOS SANTOS NASCIMENTO',         'Serra Park', 'Macrolub',      120, 120, 160, ARRAY['loc-porto-canoa'], 'active', 'telefone', '(27)99692-8486',    'funcionario'),
  ('gracieli-areia',         'GRACIELI AREIA SANTOS',                'Serra Park', 'Usaflex',       110, 110, 110, ARRAY['loc-porto-canoa'], 'active', 'cpf',      '136.042.597-70',    'funcionario'),
  ('renildo-tolentino',      'RENILDO TOLENTINO JESUS',              'Serra Park', 'Usaflex',       130, 130, 160, ARRAY['loc-porto-canoa'], 'active', 'telefone', '(27)99799-4073',    'funcionario'),
  ('everaldo-lima',          'EVERALDO DE SOUZA LIMA',               'Serra Park', 'Macrolub',      200, 200, 200, ARRAY['loc-porto-canoa'], 'active', 'cpf',      '020.108.737-50',    'funcionario'),
  ('elizeth-candeia',        'ELIZETH DA SILVA CANDEIA DOS SANTOS',  'Serra Park', 'Limpeza',       110, 110, 160, ARRAY['loc-porto-canoa'], 'active', 'telefone', '(27)99717-5115',    'funcionario'),
  ('grazielle-figueredo',    'GRAZIELLE SILVA FIGUEREDO',            'Serra Park', 'Usaflex',       120, 120, 160, ARRAY['loc-porto-canoa'], 'active', 'cpf',      '113.496.235-55',    'funcionario'),
  ('ivis-guimaraes',         'IVIS GUIMARAES',                       'Serra Park', 'Usaflex',       140, 140, 170, ARRAY['loc-porto-canoa'], 'active', 'cpf',      '114.148.687-31',    'funcionario'),
  ('diego-nasc-oliveira',    'DIEGO NASCIMENTO DE OLIVEIRA',         'Serra Park', 'Usaflex',       130, 130, 160, ARRAY['loc-porto-canoa'], 'active', 'cpf',      '122.625.147-12',    'funcionario'),
  ('aruatam-rocha',          'ARUATAM ROCHA',                        'Serra Park', 'Repremig',      130, 130, 160, ARRAY['loc-porto-canoa'], 'active', 'cpf',      '035.708.795-00',    'funcionario'),
  ('jessica-oliveira',       'JESSICA COSTA DE OLIVEIRA SANTOS',     'Serra Park', 'Usaflex',       110, 110, 160, ARRAY['loc-porto-canoa'], 'active', 'telefone', '(27)99944-0476',    'funcionario'),
  ('rutiane-dutra',          'RUTIANE DUTRA DOS SANTOS',             'Serra Park', 'Usaflex',       110, 110, 160, ARRAY['loc-porto-canoa'], 'active', 'cpf',      '162.190.117-32',    'funcionario'),
  ('aline-sena',             'ALINE SENA GUIMARAES',                 'Serra Park', 'Macrolub',      110, 110, 160, ARRAY['loc-porto-canoa'], 'active', 'cpf',      '106.682.647-13',    'funcionario'),
  ('ana-paula-procopio',     'ANA PAULA PROCOPIO',                   'Serra Park', 'Usaflex',       110, 110, 160, ARRAY['loc-porto-canoa'], 'active', 'cpf',      '155.720.587-69',    'funcionario'),
  ('kaillane-oliveira',      'KAILLANE JESUS OLIVEIRA',              'Serra Park', 'Usaflex',       110, 110, 110, ARRAY['loc-porto-canoa'], 'active', 'telefone', '(27)99922-4436',    'funcionario'),
  ('fabiola-nogueira',       'FABIOLA ROSA NOGUEIRA',                'Serra Park', 'Usaflex',       110, 110, 160, ARRAY['loc-porto-canoa'], 'active', 'telefone', '(27)99623-2503',    'funcionario'),
  ('isabel-pereira-silva',   'ISABEL PEREIRA DA SILVA',              'Serra Park', 'Repremig',      110, 110, 110, ARRAY['loc-porto-canoa'], 'active', 'telefone', '(27)99899-0486',    'funcionario'),
  ('vinicius-rocha',         'VINICIUS ROCHA DA SILVA',              'Serra Park', 'Usaflex',       110, 110, 110, ARRAY['loc-porto-canoa'], 'active', 'cpf',      '153.894.257-74',    'funcionario'),
  ('janderson-campos',       'JANDERSON CAMPOS RIBEIRO',             'Serra Park', 'Macrolub',      130, 130, 160, ARRAY['loc-porto-canoa'], 'active', 'telefone', '(27)98118-1719',    'funcionario'),
  ('eliel-silva',            'ELIEL DA SILVA',                       'Serra Park', 'Macrolub',      130, 130, 160, ARRAY['loc-porto-canoa'], 'active', 'cpf',      '129.299.034-14',    'funcionario'),
  ('lucas-araujo-carmo',     'LUCAS ARAUJO DO CARMO',                'Serra Park', 'Macrolub',      110, 110, 160, ARRAY['loc-porto-canoa'], 'active', 'telefone', '(27)99880-3884',    'funcionario'),
  ('luiz-otavio-paula',      'LUIZ OTAVIO DE PAULA',                 'Serra Park', 'Macrolub',      110, 110, 160, ARRAY['loc-porto-canoa'], 'active', 'telefone', '(27)99809-3584',    'funcionario'),
  ('adriano-bandeira',       'ADRIANO BANDEIRA MUNIZ',               'Serra Park', 'Macrolub',      130, 130, 160, ARRAY['loc-porto-canoa'], 'active', 'cpf',      '105.273.347-66',    'funcionario'),
  ('joao-marcos-martins',    'JOAO MARCOS SOARES MARTINS',           'Serra Park', 'Macrolub',      130, 130, 160, ARRAY['loc-porto-canoa'], 'active', 'email',    'JOAOMINHO13@HOTMAIL.COM', 'funcionario'),
  ('wesley-muniz',           'WESLEY MUNIZ DIAS DE MOURA',           'Serra Park', 'Usaflex',       130, 130, 160, ARRAY['loc-porto-canoa'], 'active', 'cpf',      '147.050.936-90',    'funcionario'),
  ('leiza-sampaio',          'LEIZA RAQUEL SAMPAIO PORTO',           'Serra Park', 'Macrolub',      110, 110, 160, ARRAY['loc-porto-canoa'], 'active', 'telefone', '(27)99276-2737',    'funcionario'),
  ('maria-eduarda-santana',  'MARIA EDUARDA DOS SANTOS SANTANA',     'Serra Park', 'Macrolub',      110, 110, 160, ARRAY['loc-porto-canoa'], 'active', 'cpf',      '081.329.205-03',    'funcionario'),
  ('eric-pereira-souza',     'ERIC PEREIRA DE SOUZA',                'Serra Park', 'Usaflex',       150, 150, 150, ARRAY['loc-porto-canoa'], 'active', 'cpf',      '062.740.867-22',    'funcionario'),
  ('jose-fellipe-souza',     'JOSE FELLIPE DE SOUZA',                'Serra Park', 'Usaflex',       110, 110, 160, ARRAY['loc-porto-canoa'], 'active', 'telefone', '(27)98839-1674',    'funcionario'),
  ('priscila-aprijo',        'PRISCILA APRIJO DOS REIS',             'Serra Park', 'Repremig',      140, 140, 170, ARRAY['loc-porto-canoa'], 'active', 'telefone', '(27)99787-0744',    'funcionario'),
  ('rafael-ramos-alves',     'RAFAEL RAMOS ALVES',                   'Serra Park', 'Repremig',      130, 130, 160, ARRAY['loc-porto-canoa'], 'active', 'telefone', '(27)99820-7853',    'funcionario'),
  ('rosana-jesus-silva',     'ROSANA DE JESUS DA SILVA',             'Serra Park', 'Usaflex',       150, 150, 150, ARRAY['loc-porto-canoa'], 'active', 'cpf',      '034.775.697-25',    'funcionario'),
  ('daiane-cabral',          'DAIANE CABRAL SILVA',                  'Serra Park', 'Macrolub',      120, 120, 160, ARRAY['loc-porto-canoa'], 'active', 'telefone', '(27)99640-0513',    'funcionario'),
  ('gabrielly-barros',       'GABRIELLY BARROS DA SILVA',            'Total',      'Administrativo',160, 160, 160, ARRAY['loc-porto-canoa'], 'active', 'telefone', '(27)99936-6808',   'funcionario'),
  ('jose-rodrigues-silva',   'JOSE RODRIGUES DA SILVA',              'Serra Park', 'Repremig',      200, 200, 200, ARRAY['loc-porto-canoa'], 'active', 'telefone', '(27)98852-3700',    'funcionario'),
  ('joao-alvaro-ribeiro',    'JOAO ALVARO RIBEIRO',                  'Serra Park', 'Seguranca',     150, 150, 150, ARRAY['loc-porto-canoa'], 'active', 'telefone', '(27)99929-3313',    'funcionario'),
  ('junior-gonzalez',        'JUNIOR ALMAGUER GONZALEZ',             'Serra Park', 'Macrolub',      160, 160, 160, ARRAY['loc-porto-canoa'], 'active', 'telefone', '(27)99802-6222',    'funcionario'),
  ('william-ramos',          'WILLIAM RAMOS',                        'Serra Park', 'Seguranca',     160, 160, 160, ARRAY['loc-porto-canoa'], 'active', 'cpf',      '121.593.417-38',    'funcionario'),
  ('geilton-freitas',        'GEILTON SILVA SANTOS FREITAS',         'Serra Park', 'Seguranca',     160, 160, 160, ARRAY['loc-porto-canoa'], 'active', 'telefone', '(27)99627-9516',    'funcionario'),
  ('andre-rocha-santos',     'ANDRE ROCHA DOS SANTOS',               'Serra Park', 'Operador',      160, 160, 160, ARRAY['loc-porto-canoa'], 'active', 'cpf',      '010.557.785-51',    'funcionario'),
  -- ARTEB
  ('fagner-resende',         'FAGNER DE OLIVEIRA RESENDE',           'Total',      'Doca',          100, 100, 110, ARRAY['loc-arteb'],       'active', 'cpf',      '174.116.337-47',    'diarista'),
  ('hugo-vieira',            'HUGO VIEIRA DE OLIVEIRA',              'Total',      'Doca',          100, 100, 110, ARRAY['loc-arteb'],       'active', 'telefone', '(27)99502-1640',    'diarista'),
  ('claudio-augusto',        'CLAUDIO AUGUSTO',                      'Total',      'Doca',          100, 100, 110, ARRAY['loc-arteb'],       'active', 'telefone', '(27)99739-1287',    'diarista'),
  ('walace-santos',          'WALACE SANTOS ALVES DA CONCEICAO',     'Total',      'Doca',          100, 100, 110, ARRAY['loc-arteb'],       'active', 'cpf',      '094.711.125-59',    'diarista');

-- 5. Dias de trabalho
-- Obs: 30/05/2026 = Sábado, 31/05/2026 = Domingo (ambos is_weekend = true)
-- user_id preenchido automaticamente com o primeiro usuário autenticado

INSERT INTO public.work_days (id, worker_id, date, location_id, is_weekend, rate, earnings, overtime, user_id)
SELECT id, worker_id, date::date, location_id, is_weekend, rate, earnings, overtime,
       (SELECT id FROM auth.users LIMIT 1)
FROM (VALUES
  -- 30/05/2026 (Sábado) — Porto Canoa
  ('wd-30-elizeu-neves',         'elizeu-neves',         '2026-05-30', 'loc-porto-canoa', true, 170, 170, 0),
  ('wd-30-kaique-anacleto',      'kaique-anacleto',      '2026-05-30', 'loc-porto-canoa', true, 200, 200, 0),
  ('wd-30-leonardo-rodrigues',   'leonardo-rodrigues',   '2026-05-30', 'loc-porto-canoa', true, 170, 170, 0),
  ('wd-30-diego-vieira-lucas',   'diego-vieira-lucas',   '2026-05-30', 'loc-porto-canoa', true, 170, 170, 0),
  ('wd-30-gerferson-cardoso',    'gerferson-cardoso',    '2026-05-30', 'loc-porto-canoa', true, 170, 170, 0),
  ('wd-30-eliton-aguiar',        'eliton-aguiar',        '2026-05-30', 'loc-porto-canoa', true, 170, 170, 0),
  ('wd-30-gabriel-pereira',      'gabriel-pereira-santos','2026-05-30','loc-porto-canoa', true, 170, 170, 0),
  ('wd-30-wemerson-souza',       'wemerson-souza',       '2026-05-30', 'loc-porto-canoa', true, 170, 170, 0),
  ('wd-30-bruno-rezende',        'bruno-rezende',        '2026-05-30', 'loc-porto-canoa', true, 170, 170, 0),
  ('wd-30-leoncio-ataide',       'leoncio-ataide',       '2026-05-30', 'loc-porto-canoa', true, 170, 170, 0),
  ('wd-30-jhonathan-barcelos',   'jhonathan-barcelos',   '2026-05-30', 'loc-porto-canoa', true, 170, 170, 0),
  ('wd-30-denilson-machado',     'denilson-machado',     '2026-05-30', 'loc-porto-canoa', true, 170, 170, 0),
  ('wd-30-kleison-spadetto',     'kleison-spadetto',     '2026-05-30', 'loc-porto-canoa', true, 130, 130, 0),
  ('wd-30-joao-vitor-souza',     'joao-vitor-souza',     '2026-05-30', 'loc-porto-canoa', true, 110, 110, 0),
  ('wd-30-wilson-nascimento',    'wilson-nascimento',    '2026-05-30', 'loc-porto-canoa', true, 120, 120, 0),
  ('wd-30-gracieli-areia',       'gracieli-areia',       '2026-05-30', 'loc-porto-canoa', true, 110, 110, 0),
  ('wd-30-renildo-tolentino',    'renildo-tolentino',    '2026-05-30', 'loc-porto-canoa', true, 130, 130, 0),
  ('wd-30-everaldo-lima',        'everaldo-lima',        '2026-05-30', 'loc-porto-canoa', true, 200, 200, 0),
  ('wd-30-elizeth-candeia',      'elizeth-candeia',      '2026-05-30', 'loc-porto-canoa', true, 110, 110, 0),
  ('wd-30-grazielle-figueredo',  'grazielle-figueredo',  '2026-05-30', 'loc-porto-canoa', true, 120, 120, 0),
  ('wd-30-ivis-guimaraes',       'ivis-guimaraes',       '2026-05-30', 'loc-porto-canoa', true, 140, 140, 0),
  ('wd-30-diego-nasc-oliveira',  'diego-nasc-oliveira',  '2026-05-30', 'loc-porto-canoa', true, 130, 130, 0),
  ('wd-30-aruatam-rocha',        'aruatam-rocha',        '2026-05-30', 'loc-porto-canoa', true, 130, 130, 0),
  ('wd-30-jessica-oliveira',     'jessica-oliveira',     '2026-05-30', 'loc-porto-canoa', true, 110, 110, 0),
  ('wd-30-rutiane-dutra',        'rutiane-dutra',        '2026-05-30', 'loc-porto-canoa', true, 110, 110, 0),
  ('wd-30-aline-sena',           'aline-sena',           '2026-05-30', 'loc-porto-canoa', true, 110, 110, 0),
  ('wd-30-ana-paula-procopio',   'ana-paula-procopio',   '2026-05-30', 'loc-porto-canoa', true, 110, 110, 0),
  ('wd-30-kaillane-oliveira',    'kaillane-oliveira',    '2026-05-30', 'loc-porto-canoa', true, 110, 110, 0),
  ('wd-30-fabiola-nogueira',     'fabiola-nogueira',     '2026-05-30', 'loc-porto-canoa', true, 110, 110, 0),
  ('wd-30-isabel-pereira',       'isabel-pereira-silva', '2026-05-30', 'loc-porto-canoa', true, 110, 110, 0),
  ('wd-30-vinicius-rocha',       'vinicius-rocha',       '2026-05-30', 'loc-porto-canoa', true, 110, 110, 0),
  ('wd-30-janderson-campos',     'janderson-campos',     '2026-05-30', 'loc-porto-canoa', true, 130, 130, 0),
  ('wd-30-eliel-silva',          'eliel-silva',          '2026-05-30', 'loc-porto-canoa', true, 130, 130, 0),
  ('wd-30-lucas-araujo-carmo',   'lucas-araujo-carmo',   '2026-05-30', 'loc-porto-canoa', true, 110, 110, 0),
  ('wd-30-luiz-otavio-paula',    'luiz-otavio-paula',    '2026-05-30', 'loc-porto-canoa', true, 110, 110, 0),
  ('wd-30-adriano-bandeira',     'adriano-bandeira',     '2026-05-30', 'loc-porto-canoa', true, 130, 130, 0),
  ('wd-30-joao-marcos-martins',  'joao-marcos-martins',  '2026-05-30', 'loc-porto-canoa', true, 130, 130, 0),
  ('wd-30-wesley-muniz',         'wesley-muniz',         '2026-05-30', 'loc-porto-canoa', true, 130, 130, 0),
  ('wd-30-leiza-sampaio',        'leiza-sampaio',        '2026-05-30', 'loc-porto-canoa', true, 110, 110, 0),
  ('wd-30-maria-eduarda',        'maria-eduarda-santana','2026-05-30', 'loc-porto-canoa', true, 110, 110, 0),
  ('wd-30-eric-pereira',         'eric-pereira-souza',   '2026-05-30', 'loc-porto-canoa', true, 150, 150, 0),
  ('wd-30-jose-fellipe',         'jose-fellipe-souza',   '2026-05-30', 'loc-porto-canoa', true, 110, 110, 0),
  ('wd-30-priscila-aprijo',      'priscila-aprijo',      '2026-05-30', 'loc-porto-canoa', true, 140, 140, 0),
  ('wd-30-rafael-ramos',         'rafael-ramos-alves',   '2026-05-30', 'loc-porto-canoa', true, 130, 130, 0),
  ('wd-30-rosana-jesus',         'rosana-jesus-silva',   '2026-05-30', 'loc-porto-canoa', true, 150, 150, 0),
  ('wd-30-daiane-cabral',        'daiane-cabral',        '2026-05-30', 'loc-porto-canoa', true, 120, 120, 0),
  ('wd-30-gabrielly-barros',     'gabrielly-barros',     '2026-05-30', 'loc-porto-canoa', true, 160, 160, 0),
  ('wd-30-jose-rodrigues',       'jose-rodrigues-silva', '2026-05-30', 'loc-porto-canoa', true, 200, 200, 0),
  ('wd-30-joao-alvaro',          'joao-alvaro-ribeiro',  '2026-05-30', 'loc-porto-canoa', true, 150, 150, 0),
  -- 30/05/2026 — ARTEB
  ('wd-30-fagner-resende',       'fagner-resende',       '2026-05-30', 'loc-arteb',       true, 100, 100, 0),
  ('wd-30-hugo-vieira',          'hugo-vieira',          '2026-05-30', 'loc-arteb',       true, 100, 100, 0),
  ('wd-30-claudio-augusto',      'claudio-augusto',      '2026-05-30', 'loc-arteb',       true, 100, 100, 0),
  ('wd-30-walace-santos',        'walace-santos',        '2026-05-30', 'loc-arteb',       true, 100, 100, 0),

  -- 31/05/2026 (Domingo) — Porto Canoa
  ('wd-31-gabrielly-barros',     'gabrielly-barros',     '2026-05-31', 'loc-porto-canoa', true, 160, 160, 0),
  ('wd-31-diego-vieira-lucas',   'diego-vieira-lucas',   '2026-05-31', 'loc-porto-canoa', true, 180, 180, 0),
  ('wd-31-saygho-oliveira',      'saygho-oliveira',      '2026-05-31', 'loc-porto-canoa', true, 180, 180, 0),
  ('wd-31-jhonathan-barcelos',   'jhonathan-barcelos',   '2026-05-31', 'loc-porto-canoa', true, 180, 180, 0),
  ('wd-31-denilson-machado',     'denilson-machado',     '2026-05-31', 'loc-porto-canoa', true, 180, 180, 0),
  ('wd-31-elizeu-neves',         'elizeu-neves',         '2026-05-31', 'loc-porto-canoa', true, 180, 180, 0),
  ('wd-31-gerferson-cardoso',    'gerferson-cardoso',    '2026-05-31', 'loc-porto-canoa', true, 180, 180, 0),
  ('wd-31-kaique-anacleto',      'kaique-anacleto',      '2026-05-31', 'loc-porto-canoa', true, 230, 230, 0),
  ('wd-31-italo-giovane',        'italo-giovane-rocha',  '2026-05-31', 'loc-porto-canoa', true, 180, 180, 0),
  ('wd-31-eliton-aguiar',        'eliton-aguiar',        '2026-05-31', 'loc-porto-canoa', true, 180, 180, 0),
  ('wd-31-rosana-jesus',         'rosana-jesus-silva',   '2026-05-31', 'loc-porto-canoa', true, 150, 150, 0),
  ('wd-31-junior-gonzalez',      'junior-gonzalez',      '2026-05-31', 'loc-porto-canoa', true, 160, 160, 0),
  ('wd-31-leoncio-ataide',       'leoncio-ataide',       '2026-05-31', 'loc-porto-canoa', true, 180, 180, 0),
  ('wd-31-renildo-tolentino',    'renildo-tolentino',    '2026-05-31', 'loc-porto-canoa', true, 160, 160, 0),
  ('wd-31-william-ramos',        'william-ramos',        '2026-05-31', 'loc-porto-canoa', true, 160, 160, 0),
  ('wd-31-kleison-spadetto',     'kleison-spadetto',     '2026-05-31', 'loc-porto-canoa', true, 160, 160, 0),
  ('wd-31-ivis-guimaraes',       'ivis-guimaraes',       '2026-05-31', 'loc-porto-canoa', true, 170, 170, 0),
  ('wd-31-joao-vitor-souza',     'joao-vitor-souza',     '2026-05-31', 'loc-porto-canoa', true, 160, 160, 0),
  ('wd-31-leiza-sampaio',        'leiza-sampaio',        '2026-05-31', 'loc-porto-canoa', true, 160, 160, 0),
  ('wd-31-everaldo-lima',        'everaldo-lima',        '2026-05-31', 'loc-porto-canoa', true, 200, 200, 0),
  ('wd-31-jessica-oliveira',     'jessica-oliveira',     '2026-05-31', 'loc-porto-canoa', true, 160, 160, 0),
  ('wd-31-elizeth-candeia',      'elizeth-candeia',      '2026-05-31', 'loc-porto-canoa', true, 160, 160, 0),
  ('wd-31-eliel-silva',          'eliel-silva',          '2026-05-31', 'loc-porto-canoa', true, 160, 160, 0),
  ('wd-31-lucas-araujo-carmo',   'lucas-araujo-carmo',   '2026-05-31', 'loc-porto-canoa', true, 160, 160, 0),
  ('wd-31-aline-sena',           'aline-sena',           '2026-05-31', 'loc-porto-canoa', true, 160, 160, 0),
  ('wd-31-fabiola-nogueira',     'fabiola-nogueira',     '2026-05-31', 'loc-porto-canoa', true, 160, 160, 0),
  ('wd-31-ana-paula-procopio',   'ana-paula-procopio',   '2026-05-31', 'loc-porto-canoa', true, 160, 160, 0),
  ('wd-31-priscila-aprijo',      'priscila-aprijo',      '2026-05-31', 'loc-porto-canoa', true, 170, 170, 0),
  ('wd-31-janderson-campos',     'janderson-campos',     '2026-05-31', 'loc-porto-canoa', true, 160, 160, 0),
  ('wd-31-adriano-bandeira',     'adriano-bandeira',     '2026-05-31', 'loc-porto-canoa', true, 160, 160, 0),
  ('wd-31-rutiane-dutra',        'rutiane-dutra',        '2026-05-31', 'loc-porto-canoa', true, 160, 160, 0),
  ('wd-31-wilson-nascimento',    'wilson-nascimento',    '2026-05-31', 'loc-porto-canoa', true, 160, 160, 0),
  ('wd-31-diego-nasc-oliveira',  'diego-nasc-oliveira',  '2026-05-31', 'loc-porto-canoa', true, 160, 160, 0),
  ('wd-31-grazielle-figueredo',  'grazielle-figueredo',  '2026-05-31', 'loc-porto-canoa', true, 160, 160, 0),
  ('wd-31-wesley-muniz',         'wesley-muniz',         '2026-05-31', 'loc-porto-canoa', true, 160, 160, 0),
  ('wd-31-joao-marcos-martins',  'joao-marcos-martins',  '2026-05-31', 'loc-porto-canoa', true, 160, 160, 0),
  ('wd-31-jose-fellipe',         'jose-fellipe-souza',   '2026-05-31', 'loc-porto-canoa', true, 160, 160, 0),
  ('wd-31-maria-eduarda',        'maria-eduarda-santana','2026-05-31', 'loc-porto-canoa', true, 160, 160, 0),
  ('wd-31-geilton-freitas',      'geilton-freitas',      '2026-05-31', 'loc-porto-canoa', true, 160, 160, 0),
  ('wd-31-aruatam-rocha',        'aruatam-rocha',        '2026-05-31', 'loc-porto-canoa', true, 160, 160, 0),
  ('wd-31-rafael-ramos',         'rafael-ramos-alves',   '2026-05-31', 'loc-porto-canoa', true, 160, 160, 0),
  ('wd-31-andre-rocha',          'andre-rocha-santos',   '2026-05-31', 'loc-porto-canoa', true, 160, 160, 0),
  ('wd-31-jose-rodrigues',       'jose-rodrigues-silva', '2026-05-31', 'loc-porto-canoa', true, 200, 200, 0),
  ('wd-31-wellington-santos',    'wellington-santos',    '2026-05-31', 'loc-porto-canoa', true, 180, 180, 0),
  ('wd-31-daiane-cabral',        'daiane-cabral',        '2026-05-31', 'loc-porto-canoa', true, 160, 160, 0),
  ('wd-31-luiz-otavio-paula',    'luiz-otavio-paula',    '2026-05-31', 'loc-porto-canoa', true, 160, 160, 0),
  -- 31/05/2026 — ARTEB
  ('wd-31-fagner-resende',       'fagner-resende',       '2026-05-31', 'loc-arteb',       true, 110, 110, 0),
  ('wd-31-hugo-vieira',          'hugo-vieira',          '2026-05-31', 'loc-arteb',       true, 110, 110, 0),
  ('wd-31-claudio-augusto',      'claudio-augusto',      '2026-05-31', 'loc-arteb',       true, 110, 110, 0),
  ('wd-31-walace-santos',        'walace-santos',        '2026-05-31', 'loc-arteb',       true, 110, 110, 0)
) AS t(id, worker_id, date, location_id, is_weekend, rate, earnings, overtime);

COMMIT;

-- ============================================================
-- FIM DO SCRIPT
-- Se aparecer erro: o ROLLBACK é automático — dados anteriores preservados
-- Total: 57 trabalhadores | 97 dias de trabalho registrados
-- ============================================================
