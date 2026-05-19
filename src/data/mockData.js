import { subDays, format, getDay, parseISO, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export const PIX_KEY_TYPES = [
  { value: 'cpf',    label: 'CPF' },
  { value: 'phone',  label: 'Telefone' },
  { value: 'email',  label: 'E-mail' },
  { value: 'random', label: 'Chave Aleatória' },
]

export const LOCATIONS = [
  { id: 'porto-canoa', name: 'Porto Canoa', color: '#6366f1', shortName: 'PC', address: '', city: 'Serra' },
  { id: 'taquara',     name: 'Taquara',     color: '#f59e0b', shortName: 'TQ', address: '', city: 'Serra' },
  { id: 'wap',         name: 'WAP',          color: '#10b981', shortName: 'WP', address: '', city: 'Serra' },
  { id: 'arteb',       name: 'ARTEB',        color: '#f43f5e', shortName: 'AT', address: '', city: 'Serra' },
]

export const DEPARTMENTS = ['Serra Park', 'Total']

export const JOB_TITLES = [
  'Salon Line', 'CCB', 'Doca', 'Shopee', 'Macrolub', 'Arteb',
  'BR BRAND', 'Beneficiamento', 'Auxiliar', 'Limpeza', 'Puxada',
  'Leroy', 'Etiquetagem', 'Rheem', 'Jorge Bischoff', 'Leonfer',
  'Extra beneficiamento', 'Diarista',
]

export const HOLIDAYS_2025 = [
  '2025-01-01', '2025-04-21', '2025-05-01', '2025-09-07',
  '2025-10-12', '2025-11-02', '2025-11-15', '2025-12-25',
]

export const HOLIDAYS_2026 = [
  '2026-01-01', // Confraternização Universal
  '2026-02-16', // Carnaval
  '2026-02-17', // Carnaval
  '2026-04-03', // Sexta-feira Santa
  '2026-04-21', // Tiradentes
  '2026-05-01', // Dia do Trabalho
  '2026-06-04', // Corpus Christi
  '2026-09-07', // Independência
  '2026-10-12', // Nossa Senhora Aparecida
  '2026-11-02', // Finados
  '2026-11-15', // Proclamação da República
  '2026-11-20', // Consciência Negra
  '2026-12-25', // Natal
]

export function isWeekendOrHoliday(dateStr, holidays = HOLIDAYS_2026) {
  const d = getDay(parseISO(dateStr))
  return d === 0 || d === 6 || holidays.includes(dateStr)
}

export function getWorkerDayRate(worker, dateStr, holidays = HOLIDAYS_2026) {
  const d = getDay(parseISO(dateStr))
  if (holidays.includes(dateStr) || d === 0) return worker.sundayRate ?? worker.weekdayRate
  if (d === 6) return worker.saturdayRate ?? worker.weekdayRate
  return worker.weekdayRate
}

// ── helpers ───────────────────────────────────────────────────────────────────
const _C = ['#6366f1','#f59e0b','#10b981','#f43f5e','#8b5cf6','#06b6d4','#ec4899','#84cc16','#f97316','#a78bfa']
const _L = { 'Porto Canoa': 'porto-canoa', Taquara: 'taquara', WAP: 'wap', ARTEB: 'arteb' }

function _av(name) {
  const clean = name.trim().replace(/\s*\([^)]*\)/g, '').trim()
  const p = clean.split(/\s+/).filter(Boolean)
  if (p.length >= 2) return (p[0][0] + p[1][0]).toUpperCase()
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

function _pix(pix) {
  if (!pix || !pix.trim()) return { pixKeyType: 'cpf', pixKey: '' }
  const p = pix.trim()
  if (p.includes('@')) return { pixKeyType: 'email', pixKey: p.replace(/\s+/g, '') }
  if (/^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(p)) return { pixKeyType: 'cpf', pixKey: p }
  if (/^\d{14}$/.test(p)) return { pixKeyType: 'random', pixKey: p }
  if (/^[0-9a-f]{8}-[0-9a-f]{4}/i.test(p)) return { pixKeyType: 'random', pixKey: p }
  if (p.startsWith('(') || p.startsWith('+')) return { pixKeyType: 'phone', pixKey: p }
  if (/^\d/.test(p) && /\d{4,}-\d{4}$/.test(p)) return { pixKeyType: 'phone', pixKey: p }
  return { pixKeyType: 'random', pixKey: p }
}

// Raw data: [name, area, empresa, pix, unidade]
const _D = [
  ['ANA CLARA SANTOS MOTTA','Salon Line','Serra Park','(27)99630-0425','Porto Canoa'],
  ['ANA PAULA DOS SANTOS NASCIMENTO','CCB','Serra Park','218.226.027-77','Porto Canoa'],
  ['BEATRIZ DOS SANTOS ARAUJO','CCB','Serra Park','(27)99616-1297','Porto Canoa'],
  ['LAIANA DA SILVA TEODORO','Salon Line','Serra Park','134.951.207-93','Porto Canoa'],
  ['DANIELA ESTEVÃO MARTINS','','Serra Park','','Taquara'],
  ['PRISCILLA DIESTER','','Serra Park','','Taquara'],
  ['ROBERTA BORTOLOZZO','','Serra Park','','Taquara'],
  ['ALAISE DE SOUZA','','Serra Park','','Taquara'],
  ['Francisco Horto (OPERADOR)','','Serra Park','','Taquara'],
  ['SOL AMARAL (PORTARIA)','','Serra Park','','Taquara'],
  ['REGINALDO DE BRITO FERREIRA','','Serra Park','','Taquara'],
  ['MATHEUS FERNANDES','Doca','Total','','Taquara'],
  ['MARCELO DE SOUZA','Doca','Total','','Taquara'],
  ['MAICON DE OLIVEIRA','Doca','Total','','Taquara'],
  ['BRENO RAFAEL B. MOREIRA','CCB','Serra Park','173.988.707-79','Porto Canoa'],
  ['FABIANA FERREIRA DA COSTA','Salon Line','Serra Park','071.752.477-96','Porto Canoa'],
  ['ALESSANDRA DE OLIVEIRA SILVA','','Serra Park','','Taquara'],
  ['ARETHA EMILLY','','Serra Park','','Taquara'],
  ['DOUGLAS GABRIEL','Doca','Total','','Taquara'],
  ['ALFREDY PEREIRA LIMA','Salon Line','Serra Park','(27)99524-1419','Porto Canoa'],
  ['VANDEILSON COSTA BARBOSA','CCB','Serra Park','(27)99986-2760','Porto Canoa'],
  ['VANESSA ROCHA DA COSTA','Salon Line','Serra Park','(27)99987-1315','Porto Canoa'],
  ['VITORIA CARLA DOS SANTOS SOUSA','Salon Line','Serra Park','(27)99607-7643','Porto Canoa'],
  ['RITA DE CÁSSIA GONÇALVES','Shopee','Total','(27)98853-3667','Porto Canoa'],
  ['AMANDA DE ANDRADE','','Serra Park','','Taquara'],
  ['ANDRÉ SANTOS OLIVEIRA','','Serra Park','','Taquara'],
  ['ALICE DA CRUZ ESTEVÃO','','Serra Park','','Taquara'],
  ['CAUÃ BARBOSA SILVA','','Serra Park','','Taquara'],
  ['CRISTINA RAMOS','','Serra Park','','Taquara'],
  ['ELAINE NUNES','','Serra Park','','Taquara'],
  ['ELAINE OLIVEIRA DOS SANTOS','','Serra Park','','Taquara'],
  ['FRANCIELE DIAS MANUEL','','Serra Park','','Taquara'],
  ['FABIANA FALZINO VIANNA','','Serra Park','','Taquara'],
  ['JANAINA SILVESTRE','','Serra Park','','Taquara'],
  ['JAQUELINE BASTO EDUARDO','','Serra Park','','Taquara'],
  ['KAMILA DE JESUS PEREIRA','','Serra Park','','Taquara'],
  ['KERULLEN VESPER DIAS DOS SANTOS','','Serra Park','','Taquara'],
  ['KAILANE (PORTARIA)','','Serra Park','','Taquara'],
  ['KATIUCE BONNA','','Serra Park','','Taquara'],
  ['KRIS LOREN','','Serra Park','','Taquara'],
  ['LILIAN DE ASSIS','','Serra Park','','Taquara'],
  ['MARCIELE SANTOS SANTANA','','Serra Park','','Taquara'],
  ['MARIA LUIZA DOS SANTOS','','Serra Park','','Taquara'],
  ['NYCOLAS MIGUEL RIBEIRO','','Serra Park','','Taquara'],
  ['QUESEDE NAFTALI DE SOUZA','','Serra Park','','Taquara'],
  ['SELMA DOS SANTOS SIQUEIRA','','Serra Park','','Taquara'],
  ['SIDLANE SILVA MOTA','','Serra Park','','Taquara'],
  ['VANESSA BRASILEIRA DOS SANTOS','','Serra Park','','Taquara'],
  ['SAYONARA LUIS GOMES','Doca','Total','','Taquara'],
  ['ALESSANDRA DE OLIVEIRA','Doca','Total','','Taquara'],
  ['JULIANO WILLYAN DA SILVA','Doca','Total','','Taquara'],
  ['BRENDA MIRANDA','Doca','Total','','Taquara'],
  ['NILSON','Doca','Total','','Taquara'],
  ['INOAH','Doca','Total','','Taquara'],
  ['RAYK PEREIRA DE FREITAS','Doca','Total','','Taquara'],
  ['RONALD GOULARTE','Doca','Total','','Taquara'],
  ['HEARLES DA SILVA','Doca','Total','','Taquara'],
  ['CARLOS EMANUEL EMILIO','Doca','Total','','Taquara'],
  ['ALESSANDRO SANTOS','Doca','Total','','Taquara'],
  ['FABIO SILVA','Doca','Total','','Taquara'],
  ['DAVI DA SILVA','Doca','Total','','Taquara'],
  ['LUCAS FELIX','Doca','Total','','Taquara'],
  ['MARCIO ROCHA','Doca','Total','','Taquara'],
  ['EDISON VINICIUS BASSETE MIRANDA (ARTEB)','Arteb','Total','EDISONVINICIUS71@GMAIL.COM','Porto Canoa'],
  ['DAIANA CRISTINA MOREIRA','BR BRAND','Serra Park','','Taquara'],
  ['JULIANA DE OLIVEIRA FERNANDES','BR BRAND','Serra Park','','Taquara'],
  ['ADRIEL BRAIAN MARINS','Shopee','Total','(27)99833-0883','Porto Canoa'],
  ['ANDREIA RIBEIRO JOSE','Shopee','Total','(27)99890-1229','Porto Canoa'],
  ['FLAVIA HELENA ALMEIDA','Shopee','Total','(27)93300-2495','Porto Canoa'],
  ['JOSIANE GONÇALVES SOARES','Shopee','Total','(27)999831-5529','Porto Canoa'],
  ['KAIQUE RUBENS ANALETO (120,00)','Doca','Total','(27)99578-9142','Porto Canoa'],
  ['RAFAEL PRATES SANTOS','Doca','Total','(27)99513-6369','Porto Canoa'],
  ['RITA DE CÁSSIA','Shopee','Total','(27)98853-3667','Porto Canoa'],
  ['VANDERLANIO PIRES DE OLIVEIRA','Shopee','Total','187.691.707-54','Porto Canoa'],
  ['ALCEMIR SOUZA GOMES','CCB','Serra Park','077.126.867-00','Porto Canoa'],
  ['DENIS RUBENS GERALDO TORRES','CCB','Serra Park','109.558.157-03','Porto Canoa'],
  ['VERGINIA MORAES DA SILVA','Macrolub','Serra Park','VERGINIAMORAES775@GMAIL.COM','Porto Canoa'],
  ['KAYK ROCHA DA CRUZ','Salon Line','Serra Park','223.867.457-83','Porto Canoa'],
  ['MARIA LEONORA','Macrolub','Serra Park','(27)98810-8781','Porto Canoa'],
  ['CLEVERTON MARINS ROCHA','CCB','Serra Park','(27)99734-9718','Porto Canoa'],
  ['ADRIEL BRAIAN MARINS ROCHA','Shopee','Total','(27)99833-0883','Porto Canoa'],
  ['RELTON COSTA SOUZA','Shopee','Total','071.752.477-96','Porto Canoa'],
  ['HERON LEITE DE LIMA','Salon Line','Serra Park','181.397.357-10','Porto Canoa'],
  ['GUSTAVO LYRIO','Doca','Total','(27)98901-0566','Porto Canoa'],
  ['PAMELA SAMPAIO DE OLIVEIRA DE LIMA','CCB','Serra Park','PAMELASAMPAIO495@GMAIL.COM','Porto Canoa'],
  ['NYLFFARNEY ARAUJO DOS SANTOS','CCB','Serra Park','173.885.187-70','Porto Canoa'],
  ['RAFAEL MOURA FELISDORIO','Auxiliar','Serra Park','136.605.767-86','WAP'],
  ['LUIS FERNANDO EREMITA','Doca','Total','202.211.747-61','WAP'],
  ['WARLEY DO NASCIMENTO DE JESUS','CCB','Serra Park','(28)99930-0421','Porto Canoa'],
  ['JHEYNI MIRELLI BARROS SILVA MATOS','Salon Line','Serra Park','(27)99707-5811','Porto Canoa'],
  ['STEPHANY MIRANDA RODRIGUES','Salon Line','Serra Park','(27)99663-0190','Porto Canoa'],
  ['ALCEMIR DE SOUZA GOMES','Beneficiamento','Total','077.126.867-00','WAP'],
  ['ELISSON DE JESUS BARROS','Beneficiamento','Total','140.993.627-95','WAP'],
  ['FRANCIENE LOPES PEREIRA','Beneficiamento','Total','FRANCIENNELOPESPEREIRA23@GMAIL.COM','WAP'],
  ['MURILO COSTA NETO','Doca','Total','202.825.107-70','WAP'],
  ['JAINE SANTOS DE ANDRADE','Auxiliar','Serra Park','JAINE.LOIRAANDRADE@GMAIL.COM','WAP'],
  ['NATHALIA ATAIDE','Auxiliar','Serra Park','202.276.917-17','WAP'],
  ['RAQUEL NASCIMENTO SENA','Auxiliar','Serra Park','(27)99232-5063','WAP'],
  ['MATHEUS FELIPE','Doca','Total','94matheusfelipe@gmail.com','WAP'],
  ['LUIZ EMERITA','Doca','Total','202.211.747-61','WAP'],
  ['UDEKSON NEVES DUTRA','CCB','Serra Park','101.756.627-54','Porto Canoa'],
  ['MATEUS RORIZ DA SILVA STORCK','CCB','Serra Park','(27)99772-4269','Porto Canoa'],
  ['BRENDHA GOMES PEREIRA','CCB','Serra Park','brendhabgfreelancer@gmail.com','Porto Canoa'],
  ['MAYQUE DOS SANTOS BARBOSA','Salon Line','Serra Park','(27)99761-9966','Porto Canoa'],
  ['SCHEILA FIRMINO RODRIGUES','Macrolub','Serra Park','FIRMINOSHEILA978@GMAIL.COM','Porto Canoa'],
  ['RICARDO ALEXANDRE MARTINS OLIVEIRA','Doca','Total','(31)99948-6880','Porto Canoa'],
  ['GUSTAVO DE ANDRADE PEREIRA','Doca','Total','226.812.897-00','ARTEB'],
  ['GABRIEL ARCANJO DE SOUZA PEREIRA','Doca','Total','139.241.137-85','ARTEB'],
  ['MARCOS PAULO SANTOS COELHO','Doca','Total','180.614.037-30','ARTEB'],
  ['DANILO FRANÇA','Beneficiamento','Total','42436281000170','WAP'],
  ['CRISTIANO MATTOS','Doca','Total','','WAP'],
  ['JHONATA HENRIQUE DE SENA','Doca','Total','7444ea6c-7d89-4f59-b8f8-1c09bac6c724','WAP'],
  ['BRENO AUGUSTO SANTANA SILVA','Doca','Total','','WAP'],
  ['DANIELE SILVA SALVADOR','Auxiliar','Total','','WAP'],
  ['JAINE SANTOS ANDRADE','Auxiliar','Total','','WAP'],
  ['ADIR VIEIRA MENDES','Limpeza','Serra Park','','WAP'],
  ['RAQUEL NASCIMENTO DE SENA','Auxiliar','Total','','WAP'],
  ['GILSON SILVA DE OLIVEIRA','Auxiliar','Total','(27)99859-1133','WAP'],
  ['EDUARDO PAIVA SIQUEIRA','Doca','Total','','WAP'],
  ['KAIQUE RUBENS ANALETO','Doca','Total','(27)99578-9142','Porto Canoa'],
  ['YURI DOS SANTOS BAPTISTA','CCB','Serra Park','(27)99603-6049','Porto Canoa'],
  ['RONALD DE OLIVEIRA','CCB','Serra Park','190.602.767-60','Porto Canoa'],
  ['AMANDA SOUZA LIMA','Macrolub','Serra Park','(27)99794-4768','Porto Canoa'],
  ['BRUNA SANTOS ALVES','Macrolub','Serra Park','(73)98206-6488','Porto Canoa'],
  ['JOSIANE GONÇALVES SOARES DA SILVA','Shopee','Total','(27)999831-5529','Porto Canoa'],
  ['IAGO DE SOUZA SILVA','CCB','Serra Park','(27)99823-6535','Porto Canoa'],
  ['MIRIAN SOUSA DOS SANTOS','CCB','Serra Park','078.869.677-71','Porto Canoa'],
  ['GUSTAVO ALVARINO','Doca','Total','157.055.647-40','ARTEB'],
  ['KELLY SOARES DA SILVA','Auxiliar','Serra Park','','WAP'],
  ['LUIZ FERNANDO MENDONÇA','Doca','Total','(27)99868-0217','WAP'],
  ['SILVIA MAURA FIAUX JORDÃO','Salon Line','Serra Park','(27)99620-3688','Porto Canoa'],
  ['ALCIONE ROSA PROCOPIO','Salon Line','Serra Park','124.469.857-18','Porto Canoa'],
  ['ANDREIA RIBEIRO JOSÉ','Shopee','Total','(27)99890-1229','Porto Canoa'],
  ['LAVINIA CESAR NUNES','Shopee','Total','(27)98867-8212','Porto Canoa'],
  ['VANDERLANIO PIRES DE OLIVEIRA JUNIOR','Shopee','Total','187.691.707-54','Porto Canoa'],
  ['GIOVANNI CARDOSO SILVA','Doca','Total','169.118.747-00','ARTEB'],
  ['EDISON VINICIUS BASSETE MIRANDA','Doca','Total','EDISONVINICIUS71@GMAIL.COM','ARTEB'],
  ['MURILO DA SILVA GOMES','Auxiliar','Total','217.046.527-82','WAP'],
  ['GETULIO VELOSO','Doca','Total','(27)99865-8790','WAP'],
  ['PEDRO HENRIQUE PALMEIRA DOS SANTOS','CCB','Serra Park','151.686.077-21','Porto Canoa'],
  ['CARLOS EDUARDO ALVES ROCHA','Salon Line','Serra Park','203.205.027-75','Porto Canoa'],
  ['GIZELI SOEIRO SANTOS','Salon Line','Serra Park','(94)98408-3241','Porto Canoa'],
  ['JOSIANE ROSA CORREIA','Salon Line','Serra Park','107.253.617-00','Porto Canoa'],
  ['LAIANA TEODORO DA SILVA','Salon Line','Serra Park','134.951.207-93','Porto Canoa'],
  ['MARCOS VINICIUS SAMPAIO CARVALHO','Salon Line','Serra Park','187.601.327-36','Porto Canoa'],
  ['VITOR SOUZA ESTEVÃO','Salon Line','Serra Park','(27)99661-8206','Porto Canoa'],
  ['MEIRIELLY BRUMATI DIAS','Auxiliar','Total','126.053.757-90','WAP'],
  ['ITALO MORAIS TEIXEIRA','Doca','Total','','WAP'],
  ['THYAGO ALEX ROCHA TEIXEIRA','Doca','Total','','WAP'],
  ['GUILHERME NASCIMENTO MACHADO','CCB','Serra Park','(27)99666-6780','Porto Canoa'],
  ['SILVANO GANDRA DIAS','CCB','Serra Park','836.748.296-49','Porto Canoa'],
  ['TIAGO GUIMARÃES DA SILVA','CCB','Serra Park','211.763.117-78','Porto Canoa'],
  ['RUAN CARLOS DA CONCEIÇÃO','CCB','Serra Park','866.674.695-54','Porto Canoa'],
  ['CLARICE SCHEREDER SCHWANS','Macrolub','Serra Park','(27)99749-6151','Porto Canoa'],
  ['ELIECIA NASCIMENTO DA SILVA','Shopee','Total','023.977.645-39','Porto Canoa'],
  ['FLAVIA HELENA ALMEIDA DOS SANTOS','Shopee','Total','(27)93300-2495','Porto Canoa'],
  ['BRUNA LOURENÇO DE MORAES','Beneficiamento','Total','113.016.327-08','WAP'],
  ['GABRIEL NASCIMENTO PEREIRA','Beneficiamento','Total','207.863.717-30','WAP'],
  ['DIEGO VIEIRA LUCAS','Doca','Total','122.587.616-89','WAP'],
  ['SAVIO MARTINS','Doca','Total','(27)98855-4765','WAP'],
  ['DAVI MARTINELLI DOS SANTOS','Doca','Total','(27)99691-5822','WAP'],
  ['PRISCILA DOS SANTOS LIMA','Auxiliar','Serra Park','','WAP'],
  ['THAYNA DA SILVA GONÇALVES','Auxiliar','Serra Park','','WAP'],
  ['EVELYN SOARES DA SILVA','Shopee','Total','(27)99527-6724','Porto Canoa'],
  ['JOSIANE GONÇALVES SOARES DA SILVA','Shopee','Total','(27)999831-5529','Porto Canoa'],
  ['RITA DE CASSIA GONÇALVES','Shopee','Total','(27)98853-3667','Porto Canoa'],
  ['GUSTAVO DE OLIVEIRA DA SILVA','Beneficiamento','Total','','WAP'],
  ['EVELYN BUENO DE FREITAS','Beneficiamento','Total','(27)99803-2405','WAP'],
  ['GUSTAVO BATISTA MATOS','Rheem','Serra Park','218.606.437-52','Porto Canoa'],
  ['GUILHERME OLIVEIRA DE CEZAR','Rheem','Serra Park','092.117.035-14','Porto Canoa'],
  ['RAFAELA DOS SANTOS SILVA','Beneficiamento','Total','(27)98866-9801','WAP'],
  ['MIRIAM FERREIRA','CCB','Serra Park','(27)99738-4485','Porto Canoa'],
  ['VITORIA DOS SANTOS SILVA','Salon Line','Serra Park','(27)99573-1763','Porto Canoa'],
  ['ERLAINE SANTOS DE OLIVEIRA','Macrolub','Serra Park','119.346.337-80','Porto Canoa'],
  ['JOSE VITOR MORAIS CORREA','Beneficiamento','Total','(27)99812-3077','WAP'],
  ['WALLACE CHAGAS DOS SANTOS','Doca','Total','181.028.697-20','ARTEB'],
  ['LUAN VITOR MOTA MAIA','CCB','Serra Park','218.034.927-08','Porto Canoa'],
  ['PEDRO HENRIQUE FERREIRA MOTA','CCB','Serra Park','185.070.147-47','Porto Canoa'],
  ['JOAO VITOR DAS NEVES COSTA','Jorge Bischoff','Serra Park','(27)99937-2267','Porto Canoa'],
  ['ANDRESSA FLORES','Salon Line','Serra Park','(27)99299-5395','Porto Canoa'],
  ['IVONETE DE OLIVEIRA GONÇALVES','Salon Line','Serra Park','(27)98881-5488','Porto Canoa'],
  ['JOZIELLE DA SILVA ALCANTARA','Salon Line','Serra Park','136.727.807-40','Porto Canoa'],
  ['FLAVIO DOS SANTOS GOMES SANTANA','Doca','Total','136.168.537-96','Porto Canoa'],
  ['PEDRO HENRIQUE SANTOS DA SILVA','Puxada','Total','739.812.613-59','WAP'],
  ['GETULIO VELOZO','Doca','Total','(27)99865-8790','WAP'],
  ['LUIZ FERNANDO MENDONCA','Doca','Total','(27)99868-0217','WAP'],
  ['PAULO HENRIQUE CAMPGNANE','Doca','Total','166.363.457-21','WAP'],
  ['RYAN ANDRADE SILVA','CCB','Serra Park','160.375.346-08','Porto Canoa'],
  ['YASMIN FREITAS BARBOSA','Leonfer','Serra Park','(27)99640-5776','Porto Canoa'],
  ['ADRIANA CAMPOS DOS SANTOS','Macrolub','Serra Park','(27)99202-2200','Porto Canoa'],
  ['ARTHUR GOMES','Doca','Total','135.899.947-38','Porto Canoa'],
  ['ELITON GOMES','Doca','Total','(27)98119-3686','Porto Canoa'],
  ['GABRIEL PEREIRA DOS SANTOS','Doca','Total','065.931.997-70','Porto Canoa'],
  ['ISAQUE AZEVEDO','Doca','Total','(27)99297-3463','Porto Canoa'],
  ['LEONARDO DA SILVA RODRIGUES','Doca','Total','(27)99835-0768','Porto Canoa'],
  ['ARTHUR GOUVEIA DA GLORIA','Doca','Total','183.825.807-85','ARTEB'],
  ['KAMILA DE OLIVEIRA SILVA','Beneficiamento','Total','(27)98864-2298','WAP'],
  ['NAIARA DOS SANTOS BARBOSA','Beneficiamento','Total','200.050.767-06','WAP'],
  ['RAVENNA MILENA DE JESUS DE MELO','Beneficiamento','Total','210.342.427-17','WAP'],
  ['FRANCIELE DA SILVA DE OLIVEIRA','Beneficiamento','Total','123.663.397-04','WAP'],
  ['GUSTAVO SILVA DE OLIVEIRA DA SILVA','Beneficiamento','Total','167.767.257-99','WAP'],
  ['HANNYELLE DOS SANTOS TATAGIBA','Beneficiamento','Total','(27)99939-3931','WAP'],
  ['THAINARA CORREA ROMANHI','Beneficiamento','Total','(27)99266-3309','WAP'],
  ['ROSIANE PEREIRA NASCIMENTO','Beneficiamento','Total','(27)99701-7282','WAP'],
  ['SANDRA FREITAS LEAO','Beneficiamento','Total','(27)99527-3061','WAP'],
  ['VANESSA SILVA DE OLIVEIRA','Beneficiamento','Total','107.648.027-63','WAP'],
  ['ARTHUR ALMEIDA GONÇALVES','Beneficiamento','Total','154.658.827-27','WAP'],
  ['BRUNO JOSE DE CASTRO PAZ','Beneficiamento','Total','516.590.468-74','WAP'],
  ['BRUNO DA SILVA REZENDE','Doca','Total','214.771.437-26','WAP'],
  ['GUILHERME RAMOS','Doca','Total','215.415.497-24','WAP'],
  ['PAULO HENRIQUE PEREIRA','Doca','Total','(27)99745-1999','WAP'],
  ['ANDRYEL SANTOS','Doca','Total','(27)99657-9280','WAP'],
  ['MARCIO OLIVEIRA','Doca','Total','113.325.557-48','WAP'],
  ['GILSON SILVA DOS SANTOS','Doca','Total','(27)99859-1133','WAP'],
  ['MATHEUS FELIPE SILVA DE SOUZA','Doca','Total','94matheusfelipe@gmail.com','WAP'],
  ['VINICIUS PEREIRA','Doca','Total','(27)99618-9270','WAP'],
  ['MICAEL DE JESUS SILVA','Doca','Total','(27)99269-3103','WAP'],
  ['ALISSON RAFAEL','Doca','Total','c2927b2e-6b52-4e60-b59e-94c4bc6d9e34','WAP'],
  ['MATHEUS DE JESUS GUIMARAES','Doca','Total','(27)99944-8698','WAP'],
  ['FELIPE SIMOES NEVES','Doca','Total','Fneves16@hotmail.com','WAP'],
  ['GERFERSON DA SILVA CARDOSO','Doca','Total','147.228.504-29','WAP'],
  ['ITALO GIOVANE GONÇALVES DA ROCHA','Doca','Total','192.530.036-69','WAP'],
  ['EDSON COSTA AMORIM','Doca','Total','097.685.817-78','WAP'],
  ['RONALDO COSTA AMORIM','Doca','Total','101.447.787-50','WAP'],
  ['PEDRO DE OLIVEIRA','Doca','Total','dopedro38@gmail.com','WAP'],
  ['GUILHERME JARDIM OLIVEIRA','Doca','Total','170.133.517-41','WAP'],
  ['FELIPE SILVA MIRANDA','Doca','Total','(27)99832-7854','WAP'],
  ['LUIZ FERNANDO EREMITA DOS SANTOS','Doca','Total','202.211.747-61','WAP'],
  ['ELIZEU NEVES','Doca','Total','(27)99721-8048','WAP'],
  ['WALLACE PEREIRA','Doca','Total','211.681.817-63','WAP'],
  ['LEONARDO SARUBI','Puxada','Total','739.916.928-20','WAP'],
  ['MURILO SILVA','Puxada','Total','217.046.527-82','WAP'],
  ['MARCELO DO NASCIMENTO','Limpeza','Serra Park','(27)99241-5747','WAP'],
  ['MARIA REGINA CORREA','Leroy','Serra Park','094.273.067-42','WAP'],
  ['MARGILSON SATU JUNIO','Leroy','Serra Park','232.546.667.12','WAP'],
  ['LORANE DA SILVA SOUSA DOS SANTOS','Etiquetagem','Serra Park','143.791.617-14','WAP'],
  ['SHIRLEI DUTRA DE DEUS','Etiquetagem','Serra Park','126.895.717-81','WAP'],
  ['JESSICA CRISTINA DE JESUS','Etiquetagem','Serra Park','181.064.917-06','WAP'],
  ['TELMA LUANA FALCÃO','Etiquetagem','Serra Park','(27)98851-1149','WAP'],
  ['BRUNA SOARES MADEIRA','Etiquetagem','Serra Park','137.983.387-60','WAP'],
  ['RAQUEL AMORIM LEITE','Etiquetagem','Serra Park','(27)99811-6716','WAP'],
  ['CRISLANE SANTANA DA SILVA','Etiquetagem','Serra Park','cryssantana413@gmail.com','WAP'],
  ['GABRIELLY BARROS DA SILVA','','Total','(27)99936-6808','Porto Canoa'],
  ['ALINE NASCIMENTO DOS SANTOS','Extra beneficiamento','Total','059.314.977-73','WAP'],
  ['ELIENE DE JESUS BONFIM','Limpeza','Serra Park','(27)99840-9254','WAP'],
  ['CARLOS ROBERT ARAUJO GOMES','CCB','Serra Park','(27)99616-4370','Porto Canoa'],
  ['ROSIMEIRE NASCIMENTO FERRO','CCB','Serra Park','(27)99726-3345','Porto Canoa'],
  ['VITORIA DA SILVA CARVALHO','CCB','Serra Park','181.537.487-00','Porto Canoa'],
  ['GUSTAVO BATISTA MOTA','CCB','Serra Park','218.606.437-52','Porto Canoa'],
  ['DANIEL SILVA SANTOS','CCB','Serra Park','(27)98840-3341','Porto Canoa'],
  ['WILLIAM DOS SANTOS SILVA','CCB','Serra Park','(27)99737-8921','Porto Canoa'],
  ['ELITON GOMES DE AGUIAR','Doca','Total','(27)98119-3686','Porto Canoa'],
  ['JHONATHAN LASCKOSK BARCELOS','Doca','Total','120.681.037-88','Porto Canoa'],
  ['KAIQUE RUBENS ANACLETO','Doca','Total','(27)99578-9142','Porto Canoa'],
  ['LEONCIO ATAIDE SANTOS','Doca','Total','184.528.147-04','Porto Canoa'],
  ['WELTOM SOUZA ANDRADE DA SILVA','Doca','Total','144.116.457-00','Porto Canoa'],
  ['WEMERSON DE SOUZA','Doca','Total','154.434.707-36','Porto Canoa'],
  ['RAFAEL DOS SANTOS NOGUEIRA','Doca','Total','219.770.795-70','ARTEB'],
  ['FAGNER DE OLIVEIRA RESENDE','Doca','Total','174.116.337-47','ARTEB'],
  ['JOAO MARCOS VIEIRA DA SILVA','Doca','Total','183.836.447-10','ARTEB'],
]

export const WORKERS = _D.map(([name, area, empresa, pix, unidade], i) => {
  const { pixKeyType, pixKey } = _pix(pix)
  return {
    id: `w${i + 1}`,
    name,
    department: empresa || 'Serra Park',
    jobTitle: area || 'Diarista',
    weekdayRate: 150,
    saturdayRate: 200,
    sundayRate: 230,
    locations: [_L[unidade] ?? 'taquara'],
    schedule: '',
    status: 'active',
    avatar: _av(name),
    avatarColor: _C[i % _C.length],
    phone: '',
    startDate: '2025-01-01',
    pixKeyType,
    pixKey,
  }
})

function generateWorkDays(workerId, count) {
  const days = []
  const today = new Date()
  const usedDates = new Set()
  let i = 1
  while (days.length < count && i < 90) {
    const date = subDays(today, i)
    const dateStr = format(date, 'yyyy-MM-dd')
    if (!usedDates.has(dateStr) && Math.random() > 0.3) {
      usedDates.add(dateStr)
      const worker = WORKERS.find(w => w.id === workerId)
      const isSpecial = isWeekendOrHoliday(dateStr)
      const rate = getWorkerDayRate(worker, dateStr)
      const locIndex = Math.floor(Math.random() * worker.locations.length)
      days.push({
        id: `${workerId}-${dateStr}`,
        workerId,
        date: dateStr,
        locationId: worker.locations[locIndex],
        isWeekend: isSpecial,
        rate,
        earnings: rate,
      })
    }
    i++
  }
  return days
}

const _COUNTS = [22,18,20,8,25,19,15,6,12,14,10,16,22,8,18,20,25,6,14,10,15,18,12,20,8,22,16,10,14,18]

export const WORK_DAYS = _COUNTS.flatMap((count, i) => generateWorkDays(`w${i + 1}`, count))

export function getWorkerStats(workerId, allWorkDays = WORK_DAYS) {
  const days = allWorkDays.filter(d => d.workerId === workerId)
  const totalEarnings = days.reduce((sum, d) => sum + d.earnings, 0)
  const totalOvertime = days.reduce((sum, d) => sum + (d.overtime || 0), 0)
  const weekdayDays = days.filter(d => !d.isWeekend)
  const weekendDays = days.filter(d => d.isWeekend)
  return {
    totalDays: days.length,
    totalEarnings,
    totalOvertime,
    weekdayDays: weekdayDays.length,
    weekendDays: weekendDays.length,
    weekdayEarnings: weekdayDays.reduce((sum, d) => sum + d.earnings, 0),
    weekendEarnings: weekendDays.reduce((sum, d) => sum + d.earnings, 0),
    recentDays: days.slice(0, 7),
  }
}

export function getDashboardStats(workers = WORKERS, workDays = WORK_DAYS, locations = LOCATIONS) {
  const activeWorkers = workers.filter(w => w.status === 'active').length
  const totalEarnings = workDays.reduce((sum, d) => sum + d.earnings, 0)
  const totalDays = workDays.length
  const avgEarningPerDay = totalDays > 0 ? totalEarnings / totalDays : 0

  const last7days = []
  for (let i = 6; i >= 0; i--) {
    const date = subDays(new Date(), i)
    const dateStr = format(date, 'yyyy-MM-dd')
    const dayWork = workDays.filter(d => d.date === dateStr)
    last7days.push({
      day: format(date, 'EEE'),
      date: dateStr,
      workers: dayWork.length,
      earnings: dayWork.reduce((sum, d) => sum + d.earnings, 0),
    })
  }

  const last30days = []
  for (let i = 29; i >= 0; i--) {
    const date = subDays(new Date(), i)
    const dateStr = format(date, 'yyyy-MM-dd')
    const dayWork = workDays.filter(d => d.date === dateStr)
    last30days.push({
      date: dateStr,
      day: format(date, 'dd/MM'),
      workers: dayWork.length,
      earnings: dayWork.reduce((sum, d) => sum + d.earnings, 0),
    })
  }

  const byLocation = locations.map(loc => {
    const locDays = workDays.filter(d => d.locationId === loc.id)
    return {
      name: loc.name,
      shortName: loc.shortName,
      color: loc.color,
      days: locDays.length,
      earnings: locDays.reduce((sum, d) => sum + d.earnings, 0),
    }
  })

  return { activeWorkers, totalWorkers: workers.length, totalEarnings, totalDays, avgEarningPerDay, last7days, last30days, byLocation }
}

export const HOLIDAYS = HOLIDAYS_2026

export function getPaymentHistory(workerId, allWorkDays = WORK_DAYS) {
  const days = allWorkDays.filter(d => d.workerId === workerId)
    .sort((a, b) => a.date.localeCompare(b.date))

  if (days.length === 0) return []

  const today = new Date()
  const months = eachMonthOfInterval({ start: subMonths(today, 3), end: today })

  return months.map((monthDate, idx) => {
    const monthStr = format(monthDate, 'yyyy-MM')
    const monthDays = days.filter(d => d.date.startsWith(monthStr))
    const total = monthDays.reduce((s, d) => s + d.earnings, 0)
    const weekdayDays = monthDays.filter(d => !d.isWeekend)
    const weekendDays = monthDays.filter(d => d.isWeekend)

    const isCurrentMonth = format(today, 'yyyy-MM') === monthStr
    const isPrevMonth = idx === months.length - 2

    let status
    if (isCurrentMonth) status = 'pending'
    else if (isPrevMonth && total > 0) status = 'processing'
    else status = total > 0 ? 'paid' : 'no-work'

    return {
      id: `${workerId}-${monthStr}`,
      period: format(monthDate, "MMMM 'de' yyyy", { locale: ptBR }),
      monthStr,
      totalDays: monthDays.length,
      weekdayDays: weekdayDays.length,
      weekendDays: weekendDays.length,
      weekdayEarnings: weekdayDays.reduce((s, d) => s + d.earnings, 0),
      weekendEarnings: weekendDays.reduce((s, d) => s + d.earnings, 0),
      total,
      status,
      paidDate: status === 'paid' ? format(endOfMonth(monthDate), 'dd/MM/yyyy') : null,
    }
  }).reverse()
}
