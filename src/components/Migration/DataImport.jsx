import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Download, FileSpreadsheet, CheckCircle2, AlertTriangle, RotateCcw, Users, CalendarDays, DollarSign, Layers, X } from 'lucide-react'
import { useIsMobile } from '../../hooks/useIsMobile'
import { useToast } from '../UI/Toast'
import { log } from '../../lib/logger'
import { isValidCPF } from '../../data/mockData'

// ── Traduções (padrão local) ─────────────────────────────────────────────────
const UI = {
  pt: {
    title: 'Importar Dados (CSV)',
    subtitle: 'Migre seus dados para o portal usando planilhas CSV',
    typeWorkers: 'Diaristas',
    typeWorkDays: 'Dias trabalhados',
    typePayments: 'Pagamentos',
    typeAll: 'Tudo (1 arquivo)',
    allHint: 'Uma coluna "tipo" por linha (diarista, dia ou pagamento). Os diaristas são importados primeiro. Obrigatórios por tipo — diarista: chave_pix · dia: data · pagamento: valor_total.',
    reasonInvalidType: 'Tipo inválido (use: diarista, dia ou pagamento)',
    howTitle: 'Como migrar seus dados',
    steps: [
      'Escolha acima o que importar (diaristas, dias trabalhados ou pagamentos).',
      'Baixe o modelo de planilha no botão abaixo.',
      'Preencha uma linha por registro. Os campos marcados como obrigatório não podem ficar vazios.',
      'Salve como CSV e envie. Linhas com campos obrigatórios vazios voltam num CSV para você corrigir.',
    ],
    workerMatchHint: 'A coluna diarista precisa bater com um diarista já cadastrado — importe os diaristas primeiro.',
    downloadTemplate: 'Baixar modelo CSV',
    columnsTitle: 'Colunas da planilha',
    required: 'obrigatório',
    optional: 'opcional',
    uploadHint: 'Arraste o CSV aqui ou clique para selecionar',
    importedOk: (n) => `${n} registro(s) importado(s) com sucesso.`,
    nothingImported: 'Nenhuma linha válida para importar.',
    rejectedMsg: (n) => `${n} linha(s) não foram importadas (campos obrigatórios vazios ou inválidos).`,
    downloadRejected: 'Baixar linhas rejeitadas (CSV)',
    importAgain: 'Importar outro arquivo',
    previewTitle: 'Confira antes de importar',
    previewSub: 'Nada é gravado até você clicar em confirmar.',
    confirmImport: 'Confirmar importação',
    cancelImport: 'Cancelar',
    previewRejected: (n) => `${n} linha(s) serão ignoradas (campos obrigatórios vazios ou inválidos).`,
    doneTitle: 'Importação concluída!',
    emptyFile: 'O arquivo está vazio ou não tem linhas de dados.',
    reasonCol: 'motivo',
    reasonRequired: (f) => `Campo(s) obrigatório(s) vazio(s): ${f}`,
    reasonWorkerNotFound: (n) => `Diarista não encontrada: ${n}`,
    reasonInvalidDate: 'Data inválida (use AAAA-MM-DD)',
    reasonDuplicateName: (n) => `Já existe um diarista cadastrado com esse nome: ${n}`,
    reasonDuplicateCpf: (n) => `Já existe um diarista cadastrado com esse CPF: ${n}`,
    reasonInvalidCpf: (n) => `CPF inválido: ${n}`,
  },
  en: {
    title: 'Import Data (CSV)',
    subtitle: 'Migrate your data into the portal using CSV spreadsheets',
    typeWorkers: 'Workers',
    typeWorkDays: 'Work days',
    typePayments: 'Payments',
    typeAll: 'Everything (1 file)',
    allHint: 'One "tipo" column per row (diarista, dia or pagamento). Workers are imported first. Required per type — diarista: chave_pix · dia: data · pagamento: valor_total.',
    reasonInvalidType: 'Invalid type (use: diarista, dia or pagamento)',
    howTitle: 'How to migrate your data',
    steps: [
      'Choose above what to import (workers, work days or payments).',
      'Download the spreadsheet template with the button below.',
      'Fill one row per record. Fields marked as required cannot be empty.',
      'Save as CSV and upload. Rows with empty required fields come back as a CSV to fix.',
    ],
    workerMatchHint: 'The worker column must match an existing worker — import workers first.',
    downloadTemplate: 'Download CSV template',
    columnsTitle: 'Spreadsheet columns',
    required: 'required',
    optional: 'optional',
    uploadHint: 'Drag the CSV here or click to select',
    importedOk: (n) => `${n} record(s) imported successfully.`,
    nothingImported: 'No valid rows to import.',
    rejectedMsg: (n) => `${n} row(s) were not imported (empty required fields or invalid).`,
    downloadRejected: 'Download rejected rows (CSV)',
    importAgain: 'Import another file',
    previewTitle: 'Review before importing',
    previewSub: 'Nothing is saved until you click confirm.',
    confirmImport: 'Confirm import',
    cancelImport: 'Cancel',
    previewRejected: (n) => `${n} row(s) will be skipped (empty required fields or invalid).`,
    doneTitle: 'Import complete!',
    emptyFile: 'The file is empty or has no data rows.',
    reasonCol: 'reason',
    reasonRequired: (f) => `Empty required field(s): ${f}`,
    reasonWorkerNotFound: (n) => `Worker not found: ${n}`,
    reasonInvalidDate: 'Invalid date (use YYYY-MM-DD)',
    reasonDuplicateName: (n) => `A worker with this name is already registered: ${n}`,
    reasonDuplicateCpf: (n) => `A worker with this CPF is already registered: ${n}`,
    reasonInvalidCpf: (n) => `Invalid CPF: ${n}`,
  },
  es: {
    title: 'Importar Datos (CSV)',
    subtitle: 'Migra tus datos al portal usando planillas CSV',
    typeWorkers: 'Trabajadores',
    typeWorkDays: 'Días trabajados',
    typePayments: 'Pagos',
    typeAll: 'Todo (1 archivo)',
    allHint: 'Una columna "tipo" por fila (diarista, dia o pagamento). Los trabajadores se importan primero. Obligatorios por tipo — diarista: chave_pix · dia: data · pagamento: valor_total.',
    reasonInvalidType: 'Tipo inválido (usa: diarista, dia o pagamento)',
    howTitle: 'Cómo migrar tus datos',
    steps: [
      'Elige arriba qué importar (trabajadores, días o pagos).',
      'Descarga la plantilla con el botón de abajo.',
      'Completa una fila por registro. Los campos marcados como obligatorio no pueden quedar vacíos.',
      'Guarda como CSV y súbelo. Las filas con campos obligatorios vacíos vuelven en un CSV para corregir.',
    ],
    workerMatchHint: 'La columna trabajador debe coincidir con uno ya registrado — importa los trabajadores primero.',
    downloadTemplate: 'Descargar plantilla CSV',
    columnsTitle: 'Columnas de la planilla',
    required: 'obligatorio',
    optional: 'opcional',
    uploadHint: 'Arrastra el CSV aquí o haz clic para seleccionar',
    importedOk: (n) => `${n} registro(s) importado(s) con éxito.`,
    nothingImported: 'Ninguna fila válida para importar.',
    rejectedMsg: (n) => `${n} fila(s) no se importaron (campos obligatorios vacíos o inválidos).`,
    downloadRejected: 'Descargar filas rechazadas (CSV)',
    importAgain: 'Importar otro archivo',
    previewTitle: 'Revisa antes de importar',
    previewSub: 'No se guarda nada hasta que confirmes.',
    confirmImport: 'Confirmar importación',
    cancelImport: 'Cancelar',
    previewRejected: (n) => `${n} fila(s) se ignorarán (campos obligatorios vacíos o inválidos).`,
    doneTitle: '¡Importación completada!',
    emptyFile: 'El archivo está vacío o no tiene filas de datos.',
    reasonCol: 'motivo',
    reasonRequired: (f) => `Campo(s) obligatorio(s) vacío(s): ${f}`,
    reasonWorkerNotFound: (n) => `Trabajador no encontrado: ${n}`,
    reasonInvalidDate: 'Fecha inválida (usa AAAA-MM-DD)',
    reasonDuplicateName: (n) => `Ya existe un trabajador registrado con ese nombre: ${n}`,
    reasonDuplicateCpf: (n) => `Ya existe un trabajador registrado con ese CPF: ${n}`,
    reasonInvalidCpf: (n) => `CPF inválido: ${n}`,
  },
}

const AVATAR_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#f43f5e', '#8b5cf6', '#06b6d4']

// ── CSV helpers (ASCII-safe: sem BOM literal no código) ──────────────────────
const BOM = 0xFEFF
const stripBom = (text) => (text.charCodeAt(0) === BOM ? text.slice(1) : text)
const stripAccents = (s) => s.normalize('NFD').replace(/\p{Mn}/gu, '')
const normHeader = (h) => stripAccents(String(h || '').trim().toLowerCase()).replace(/[\s-]+/g, '_')

function detectDelimiter(text) {
  const line = stripBom(text).split(/\r?\n/)[0] || ''
  return line.split(';').length > line.split(',').length ? ';' : ','
}

function parseCSV(text, delimiter) {
  text = stripBom(text)
  const rows = []
  let row = [], field = '', inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++ }
      else if (c === '"') inQuotes = false
      else field += c
    } else {
      if (c === '"') inQuotes = true
      else if (c === delimiter) { row.push(field); field = '' }
      else if (c === '\r') { /* ignora */ }
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = '' }
      else field += c
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row) }
  return rows.filter(r => r.some(f => f.trim() !== ''))
}

function toCSV(headerArr, dataRows, delimiter = ';') {
  const esc = (v) => {
    const s = String(v ?? '')
    return /["\n\r;,]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const lines = [headerArr.map(esc).join(delimiter)]
  for (const r of dataRows) lines.push(r.map(esc).join(delimiter))
  return String.fromCharCode(BOM) + lines.join('\r\n')
}

function downloadCSV(filename, content) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

const parseNum = (v) => {
  const n = parseFloat(String(v ?? '').replace(',', '.').replace(/[^\d.]/g, ''))
  return Number.isFinite(n) && n >= 0 ? n : 0
}

function normPixType(v) {
  const s = normHeader(v)
  if (/^(tel|cel|fone|phone)/.test(s)) return 'phone'
  if (/^(email|e_mail)/.test(s)) return 'email'
  if (/^(aleat|random)/.test(s)) return 'random'
  return 'cpf'
}

const normWorkerType = (v) => (/^func/.test(normHeader(v)) ? 'funcionario' : 'diarista')

function matchLocations(v, locations) {
  if (!v) return []
  const parts = String(v).split(/[/|]/).map(s => s.trim().toLowerCase()).filter(Boolean)
  const ids = []
  for (const p of parts) {
    const loc = locations.find(l => l.name?.toLowerCase() === p || l.shortName?.toLowerCase() === p)
    if (loc && !ids.includes(loc.id)) ids.push(loc.id)
  }
  return ids
}

const findWorker = (workers, name) => {
  const q = String(name || '').trim().toLowerCase()
  return workers.find(w => w.name?.trim().toLowerCase() === q)
}

function normDate(v) {
  const s = String(v || '').trim()
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
  return ''
}

// Discriminador do arquivo único.
function normTipo(v) {
  const s = normHeader(v)
  if (s.startsWith('pag')) return 'pagamento'
  if (s.startsWith('diarista') || s.startsWith('trabalhador') || s.startsWith('func')) return 'diarista'
  if (s.startsWith('dia')) return 'dia'
  return ''
}

// ── Tipos de importação: colunas + como montar cada registro ─────────────────
const TYPES = {
  workers: {
    columns: [
      { key: 'name',         header: 'nome',           required: true, example: 'JOÃO DA SILVA' },
      { key: 'workerType',   header: 'tipo',           example: 'diarista' },
      { key: 'department',   header: 'departamento',   example: 'Serra Park' },
      { key: 'jobTitle',     header: 'cargo',          example: 'Doca' },
      { key: 'weekdayRate',  header: 'diaria_semana',  example: '170' },
      { key: 'saturdayRate', header: 'diaria_sabado',  example: '170' },
      { key: 'sundayRate',   header: 'diaria_domingo', example: '180' },
      { key: 'phone',        header: 'telefone',       example: '(27) 99999-9999' },
      { key: 'email',        header: 'email',          example: 'joao@email.com' },
      { key: 'cpf',          header: 'cpf',            example: '123.456.789-00' },
      { key: 'pixKeyType',   header: 'tipo_chave_pix', example: 'cpf' },
      { key: 'pixKey',       header: 'chave_pix',      required: true, example: '123.456.789-00' },
      { key: 'locais',       header: 'locais',         example: 'Porto Canoa' },
    ],
    build: (get, ctx, idx) => {
      const name = get('name')
      const pixKeyType = normPixType(get('pixKeyType'))
      const pixKey = get('pixKey')
      // Se não vier coluna cpf própria, aproveita a chave PIX quando ela já for o CPF.
      const cpf = get('cpf') || (pixKeyType === 'cpf' ? pixKey : '')

      const normCpf = cpf.replace(/\D/g, '')
      if (normCpf) {
        if (!isValidCPF(normCpf)) return { error: 'invalidCpf', param: name }
        if (ctx.workers.some(w => (w.cpf || '').replace(/\D/g, '') === normCpf)) {
          return { error: 'duplicateCpf', param: name }
        }
      }
      const normName = name.trim().toLowerCase()
      if (ctx.workers.some(w => w.name?.trim().toLowerCase() === normName)) {
        return { error: 'duplicateName', param: name }
      }

      const weekday = parseNum(get('weekdayRate'))
      const sat = get('saturdayRate') ? parseNum(get('saturdayRate')) : weekday
      const sun = get('sundayRate') ? parseNum(get('sundayRate')) : sat
      return {
        data: {
          id: `w${Date.now()}${idx}`,
          name,
          workerType: normWorkerType(get('workerType')),
          department: get('department'),
          jobTitle: get('jobTitle'),
          weekdayRate: weekday,
          saturdayRate: sat,
          sundayRate: sun,
          phone: get('phone'),
          email: get('email'),
          cpf,
          pixKeyType,
          pixKey,
          locations: matchLocations(get('locais'), ctx.locations),
          schedule: '',
          status: 'active',
          startDate: null,
          avatar: name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
          avatarColor: AVATAR_COLORS[Math.floor(Math.random() * 6)],
        },
      }
    },
  },

  workDays: {
    needsWorker: true,
    columns: [
      { key: 'worker',   header: 'diarista',  required: true, example: 'JOÃO DA SILVA' },
      { key: 'date',     header: 'data',      required: true, example: '2026-07-15' },
      { key: 'location', header: 'local',     example: 'Porto Canoa' },
      { key: 'rate',     header: 'valor',     example: '170' },
      { key: 'overtime', header: 'hora_extra', example: '0' },
      { key: 'bonus',    header: 'bonus',     example: '0' },
    ],
    build: (get, ctx, idx) => {
      const worker = findWorker(ctx.workers, get('worker'))
      if (!worker) return { error: 'workerNotFound', param: get('worker') }
      const date = normDate(get('date'))
      if (!date) return { error: 'invalidDate' }
      const dow = new Date(`${date}T00:00:00`).getDay()
      const isWeekend = dow === 0 || dow === 6
      const defRate = dow === 0
        ? (worker.sundayRate ?? worker.saturdayRate ?? worker.weekdayRate)
        : dow === 6 ? (worker.saturdayRate ?? worker.weekdayRate) : worker.weekdayRate
      const rate = get('rate') ? parseNum(get('rate')) : (defRate || 0)
      const overtime = parseNum(get('overtime'))
      const bonus = parseNum(get('bonus'))
      const locId = matchLocations(get('location'), ctx.locations)[0] || worker.locations?.[0] || null
      return {
        data: {
          id: `${worker.id}-${date}-${Date.now()}${idx}`,
          workerId: worker.id,
          date,
          locationId: locId,
          isWeekend,
          rate,
          earnings: rate + overtime + bonus,
          overtime,
          bonus,
        },
      }
    },
  },

  payments: {
    needsWorker: true,
    columns: [
      { key: 'worker',   header: 'diarista',        required: true, example: 'JOÃO DA SILVA' },
      { key: 'total',    header: 'valor_total',     required: true, example: '1700' },
      { key: 'paidDate', header: 'data_pagamento',  example: '2026-07-31' },
      { key: 'status',   header: 'status',          example: 'paid' },
      { key: 'period',   header: 'periodo',         example: 'Julho/2026' },
      { key: 'days',     header: 'dias',            example: '10' },
    ],
    build: (get, ctx, idx) => {
      const worker = findWorker(ctx.workers, get('worker'))
      if (!worker) return { error: 'workerNotFound', param: get('worker') }
      return {
        data: {
          id: `pay-${worker.id}-${Date.now()}${idx}`,
          workerId: worker.id,
          period: get('period') || '',
          monthStr: '',
          totalDays: Math.round(parseNum(get('days'))) || 0,
          weekdayDays: 0,
          weekendDays: 0,
          weekdayEarnings: 0,
          weekendEarnings: 0,
          total: parseNum(get('total')),
          status: get('status') || 'paid',
          paidDate: normDate(get('paidDate')) || new Date().toISOString().slice(0, 10),
          workDayIds: [],
        },
      }
    },
  },
}

// ── Modo "Tudo": um CSV único com coluna `tipo` por linha ────────────────────
// Reaproveita as colunas/keys dos tipos acima. A diarista é referenciada pela
// coluna `nome` em todos (o get do modo "all" mapeia 'worker' → 'name').
const ALL_COLUMNS = [
  { key: '_tipo',        header: 'tipo',            required: true },
  { key: 'name',         header: 'nome',            required: true },
  { key: 'workerType',   header: 'tipo_trabalhador' },
  { key: 'department',   header: 'departamento' },
  { key: 'jobTitle',     header: 'cargo' },
  { key: 'weekdayRate',  header: 'diaria_semana' },
  { key: 'saturdayRate', header: 'diaria_sabado' },
  { key: 'sundayRate',   header: 'diaria_domingo' },
  { key: 'phone',        header: 'telefone' },
  { key: 'email',        header: 'email' },
  { key: 'cpf',          header: 'cpf' },
  { key: 'pixKeyType',   header: 'tipo_chave_pix' },
  { key: 'pixKey',       header: 'chave_pix' },
  { key: 'locais',       header: 'locais' },
  { key: 'date',         header: 'data' },
  { key: 'location',     header: 'local' },
  { key: 'rate',         header: 'valor' },
  { key: 'overtime',     header: 'hora_extra' },
  { key: 'bonus',        header: 'bonus' },
  { key: 'total',        header: 'valor_total' },
  { key: 'paidDate',     header: 'data_pagamento' },
  { key: 'status',       header: 'status' },
  { key: 'period',       header: 'periodo' },
  { key: 'days',         header: 'dias' },
]

// Uma linha de exemplo por tipo (o resto das colunas fica em branco).
const ALL_EXAMPLES = [
  { tipo: 'diarista', nome: 'JOÃO DA SILVA', tipo_trabalhador: 'diarista', departamento: 'Serra Park', cargo: 'Doca', diaria_semana: '170', diaria_sabado: '170', diaria_domingo: '180', telefone: '(27) 99999-9999', email: 'joao@email.com', cpf: '123.456.789-00', tipo_chave_pix: 'cpf', chave_pix: '123.456.789-00', locais: 'Porto Canoa' },
  { tipo: 'dia', nome: 'JOÃO DA SILVA', data: '2026-07-15', local: 'Porto Canoa', valor: '170', hora_extra: '0', bonus: '0' },
  { tipo: 'pagamento', nome: 'JOÃO DA SILVA', valor_total: '1700', data_pagamento: '2026-07-31', status: 'paid', periodo: 'Julho/2026', dias: '10' },
]

const SUBTYPE_BY_TIPO = { diarista: 'workers', dia: 'workDays', pagamento: 'payments' }

export default function DataImport({
  lang = 'pt', locations = [],
  workers = [], setWorkers,
  setWorkDays, setPaymentRecords,
}) {
  const isMobile = useIsMobile()
  const { showToast } = useToast()
  const t = UI[lang] ?? UI.pt
  const fileRef = useRef(null)
  const [type, setType] = useState('workers')
  const [dragOver, setDragOver] = useState(false)
  const [preview, setPreview] = useState(null)  // dados analisados, aguardando confirmação
  const [result, setResult] = useState(null)

  const cfg = type === 'all' ? { columns: ALL_COLUMNS, needsWorker: true } : TYPES[type]
  const typeTabs = [
    { id: 'workers',  label: t.typeWorkers,  icon: Users },
    { id: 'workDays', label: t.typeWorkDays, icon: CalendarDays },
    { id: 'payments', label: t.typePayments, icon: DollarSign },
    { id: 'all',      label: t.typeAll,      icon: Layers },
  ]

  const reasonText = (code, param) =>
    code === 'workerNotFound' ? t.reasonWorkerNotFound(param)
    : code === 'invalidDate' ? t.reasonInvalidDate
    : code === 'invalidCpf' ? t.reasonInvalidCpf(param)
    : code === 'duplicateName' ? t.reasonDuplicateName(param)
    : code === 'duplicateCpf' ? t.reasonDuplicateCpf(param)
    : t.reasonRequired(param)

  const switchType = (id) => { setType(id); setResult(null); setPreview(null); if (fileRef.current) fileRef.current.value = '' }

  // Rótulo + ícone de cada subtipo, para o resumo da prévia.
  const countEntries = (byType) => [
    { key: 'workers',  label: t.typeWorkers,  icon: Users,        n: byType.workers.length },
    { key: 'workDays', label: t.typeWorkDays, icon: CalendarDays, n: byType.workDays.length },
    { key: 'payments', label: t.typePayments, icon: DollarSign,   n: byType.payments.length },
  ].filter(e => e.n > 0)

  const handleDownloadTemplate = () => {
    const header = cfg.columns.map(c => c.header)
    const rows = type === 'all'
      ? ALL_EXAMPLES.map(ex => header.map(h => ex[h] ?? ''))
      : [cfg.columns.map(c => c.example)]
    downloadCSV(`modelo-${type === 'all' ? 'tudo' : type}.csv`, toCSV(header, rows))
  }

  // Analisa o CSV e monta a prévia — NADA é gravado aqui. A gravação só
  // acontece em confirmImport(), depois que o usuário confirma.
  const analyzeText = (text, fileName = '') => {
    const rows = parseCSV(text, detectDelimiter(text))
    if (rows.length < 2) { showToast(t.emptyFile, 'error'); return }

    const originalHeader = rows[0]
    const rejectedHeader = [...originalHeader, t.reasonCol]

    // ── Modo "Tudo": um arquivo com linhas de tipos diferentes (coluna `tipo`) ──
    if (type === 'all') {
      const keyByColAll = originalHeader.map(h => {
        const nh = normHeader(h)
        const col = ALL_COLUMNS.find(c => normHeader(c.header) === nh)
        return col?.key ?? null
      })
      const makeGetAll = (cols) => (key) => {
        const k = key === 'worker' ? 'name' : key // dia/pagamento referenciam a diarista pela coluna nome
        const idx = keyByColAll.indexOf(k)
        return idx >= 0 ? String(cols[idx] ?? '').trim() : ''
      }

      const rejectedAll = []
      const groups = { diarista: [], dia: [], pagamento: [] }
      for (let r = 1; r < rows.length; r++) {
        const cols = rows[r]
        const get = makeGetAll(cols)
        const tp = normTipo(get('_tipo'))
        if (!tp) { rejectedAll.push([...cols, t.reasonInvalidType]); continue }
        groups[tp].push({ cols, get, r })
      }

      const byType = { workers: [], workDays: [], payments: [] }
      const liveWorkers = [...workers]
      for (const tp of ['diarista', 'dia', 'pagamento']) {
        const subtype = SUBTYPE_BY_TIPO[tp]
        const subCfg = TYPES[subtype]
        for (const { cols, get, r } of groups[tp]) {
          const missing = subCfg.columns.filter(c => c.required && !get(c.key)).map(c => c.header)
          if (missing.length) { rejectedAll.push([...cols, reasonText('required', missing.join(', '))]); continue }
          const res = subCfg.build(get, { workers: liveWorkers, locations }, r)
          if (res.error) { rejectedAll.push([...cols, reasonText(res.error, res.param)]); continue }
          byType[subtype].push(res.data)
          if (subtype === 'workers') liveWorkers.push(res.data)
        }
      }

      finishAnalysis('all', fileName, byType, rejectedHeader, rejectedAll)
      return
    }

    const keyByCol = originalHeader.map(h => {
      const nh = normHeader(h)
      const col = cfg.columns.find(c => normHeader(c.header) === nh)
      return col?.key ?? null
    })
    const makeGet = (cols) => (key) => {
      const idx = keyByCol.indexOf(key)
      return idx >= 0 ? String(cols[idx] ?? '').trim() : ''
    }

    const imported = []
    const rejectedRows = []
    // Cresce a cada diarista aceito, pra pegar duplicata entre linhas do mesmo arquivo.
    const liveWorkers = type === 'workers' ? [...workers] : workers
    for (let r = 1; r < rows.length; r++) {
      const cols = rows[r]
      const get = makeGet(cols)
      const missing = cfg.columns.filter(c => c.required && !get(c.key)).map(c => c.header)
      if (missing.length) { rejectedRows.push([...cols, reasonText('required', missing.join(', '))]); continue }
      const res = cfg.build(get, { workers: liveWorkers, locations }, r)
      if (res.error) { rejectedRows.push([...cols, reasonText(res.error, res.param)]); continue }
      imported.push(res.data)
      if (type === 'workers') liveWorkers.push(res.data)
    }

    const byType = { workers: [], workDays: [], payments: [] }
    byType[type] = imported
    finishAnalysis(type, fileName, byType, rejectedHeader, rejectedRows)
  }

  // Decide entre mostrar a prévia (há algo a importar) ou ir direto ao
  // resultado quando nenhuma linha é válida (nada a confirmar, nada é gravado).
  const finishAnalysis = (kind, fileName, byType, rejectedHeader, rejectedRows) => {
    const total = byType.workers.length + byType.workDays.length + byType.payments.length
    if (total === 0) {
      showToast(t.nothingImported, 'info')
      setResult({ imported: 0, rejectedHeader, rejectedRows })
      return
    }
    setPreview({ kind, fileName, byType, imported: total, rejectedHeader, rejectedRows })
  }

  // Grava de fato no estado/Supabase — só é chamado ao confirmar a prévia.
  const confirmImport = () => {
    if (!preview) return
    const { kind, byType, imported, rejectedHeader, rejectedRows } = preview
    if (byType.workers.length)  setWorkers(prev => [...prev, ...byType.workers])
    if (byType.workDays.length) setWorkDays(prev => [...prev, ...byType.workDays])
    if (byType.payments.length) setPaymentRecords(prev => [...prev, ...byType.payments])
    log('import_csv', kind === 'all'
      ? `Importação CSV (tudo): ${byType.workers.length} diaristas, ${byType.workDays.length} dias, ${byType.payments.length} pagamentos, ${rejectedRows.length} rejeitada(s)`
      : `Importação CSV (${kind}): ${imported} ok, ${rejectedRows.length} rejeitada(s)`)
    showToast(t.importedOk(imported), 'success')
    setResult({ imported, rejectedHeader, rejectedRows })
    setPreview(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const cancelPreview = () => { setPreview(null); if (fileRef.current) fileRef.current.value = '' }

  const handleFile = (file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = e => analyzeText(String(e.target.result || ''), file.name)
    reader.readAsText(file, 'utf-8')
  }

  const downloadRejected = (rejectedHeader, rejectedRows) => {
    if (!rejectedRows?.length) return
    downloadCSV(`${type}-rejeitados.csv`, toCSV(rejectedHeader, rejectedRows))
  }

  const reset = () => { setResult(null); setPreview(null); if (fileRef.current) fileRef.current.value = '' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 900 }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: isMobile ? 24 : 30, fontWeight: 800, color: 'var(--page-heading)', margin: 0, letterSpacing: '-0.02em' }}>
          {t.title}
        </h1>
        <p style={{ margin: '8px 0 0', color: 'var(--page-sub)', fontSize: 15 }}>{t.subtitle}</p>
      </motion.div>

      {/* Seletor de tipo */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {typeTabs.map(tab => {
          const sel = type === tab.id
          return (
            <motion.button key={tab.id} whileTap={{ scale: 0.97 }} onClick={() => switchType(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '11px 18px', borderRadius: 12, cursor: 'pointer',
                border: `1.5px solid ${sel ? 'rgba(99,102,241,0.5)' : 'var(--card-border)'}`,
                background: sel ? 'rgba(99,102,241,0.12)' : 'var(--card-bg)',
                color: sel ? '#818cf8' : 'var(--card-sub)', fontSize: 14, fontWeight: sel ? 700 : 500, transition: 'all 0.15s',
              }}>
              <tab.icon size={16} /> {tab.label}
            </motion.button>
          )
        })}
      </div>

      {/* Como migrar */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', boxShadow: 'var(--card-shadow)', borderRadius: 20, padding: '24px' }}>
        <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 17, fontWeight: 800, color: 'var(--card-heading)', marginBottom: 16 }}>
          {t.howTitle}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
          {t.steps.map((step, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{
                width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 800, color: '#818cf8',
              }}>{i + 1}</div>
              <span style={{ fontSize: 14, color: 'var(--card-sub)', lineHeight: 1.5, paddingTop: 2 }}>{step}</span>
            </div>
          ))}
        </div>

        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={handleDownloadTemplate} className="btn-primary"
          style={{ padding: '12px 22px', borderRadius: 12, fontSize: 14, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <Download size={16} /> {t.downloadTemplate}
        </motion.button>

        {/* Colunas */}
        <div style={{ marginTop: 22, paddingTop: 20, borderTop: '1px solid var(--inner-border)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--card-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
            {t.columnsTitle}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: 8 }}>
            {cfg.columns.map(c => (
              <div key={c.key} style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 10,
                background: 'var(--inner-bg)', border: '1px solid var(--inner-border)',
              }}>
                <code style={{ fontSize: 12, fontWeight: 700, color: 'var(--card-heading)', fontFamily: 'monospace' }}>{c.header}</code>
                <span style={{
                  marginLeft: 'auto', fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 100, textTransform: 'uppercase', letterSpacing: '0.04em',
                  background: c.required ? 'rgba(244,63,94,0.12)' : 'rgba(148,163,184,0.12)',
                  color: c.required ? '#fb7185' : 'var(--card-muted)',
                }}>
                  {c.required ? t.required : t.optional}
                </span>
              </div>
            ))}
          </div>
          {(type === 'all' || cfg.needsWorker) && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 12, fontSize: 12, color: '#f59e0b', lineHeight: 1.5 }}>
              <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: 2 }} /> {type === 'all' ? t.allHint : t.workerMatchHint}
            </div>
          )}
        </div>
      </motion.div>

      {/* Upload / Resultado */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', boxShadow: 'var(--card-shadow)', borderRadius: 20, padding: '24px' }}>
        <input ref={fileRef} type="file" accept=".csv,text/csv" style={{ display: 'none' }}
          onChange={e => handleFile(e.target.files?.[0])} />

        <AnimatePresence mode="wait">
          {!result && !preview ? (
            <motion.div key="drop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files?.[0]) }}
              onClick={() => fileRef.current?.click()}
              style={{
                border: `2px dashed ${dragOver ? 'rgba(99,102,241,0.6)' : 'var(--inner-border)'}`,
                background: dragOver ? 'rgba(99,102,241,0.06)' : 'var(--inner-bg)',
                borderRadius: 16, padding: '48px 24px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s',
              }}>
              <div style={{
                width: 56, height: 56, borderRadius: 16, margin: '0 auto 16px',
                background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Upload size={24} color="#818cf8" />
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--card-heading)' }}>{t.uploadHint}</div>
              <div style={{ marginTop: 6, fontSize: 12, color: 'var(--card-muted)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <FileSpreadsheet size={13} /> .csv
              </div>
            </motion.div>
          ) : preview ? (
            <motion.div key="preview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <FileSpreadsheet size={17} color="#818cf8" style={{ flexShrink: 0 }} />
                  <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 17, fontWeight: 800, color: 'var(--card-heading)' }}>{t.previewTitle}</span>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--card-muted)', paddingLeft: 27 }}>
                  {preview.fileName ? `${preview.fileName} · ${t.previewSub}` : t.previewSub}
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {countEntries(preview.byType).map(e => (
                  <div key={e.key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 14, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
                    <e.icon size={18} color="#818cf8" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--card-heading)' }}>
                      <strong style={{ color: '#818cf8', fontWeight: 800 }}>{e.n}</strong> {e.label}
                    </span>
                  </div>
                ))}
              </div>

              {preview.rejectedRows.length > 0 && (
                <div style={{ padding: '14px 16px', borderRadius: 14, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
                    <AlertTriangle size={17} color="#f59e0b" style={{ flexShrink: 0, marginTop: 1 }} />
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--card-sub)', lineHeight: 1.5 }}>
                      {t.previewRejected(preview.rejectedRows.length)}
                    </span>
                  </div>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => downloadRejected(preview.rejectedHeader, preview.rejectedRows)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 11, cursor: 'pointer',
                      border: '1px solid rgba(245,158,11,0.35)', background: 'rgba(245,158,11,0.12)', color: '#f59e0b', fontSize: 13, fontWeight: 700,
                    }}>
                    <Download size={15} /> {t.downloadRejected}
                  </motion.button>
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={confirmImport} className="btn-primary"
                  style={{ padding: '12px 22px', borderRadius: 12, fontSize: 14, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle2 size={16} /> {t.confirmImport}
                </motion.button>
                <button onClick={cancelPreview}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 7, padding: '12px 20px', borderRadius: 12,
                    border: '1px solid var(--card-border)', background: 'var(--inner-bg)', color: 'var(--card-sub)', cursor: 'pointer', fontSize: 14, fontWeight: 600,
                  }}>
                  <X size={15} /> {t.cancelImport}
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="result" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 18px', borderRadius: 14, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                <CheckCircle2 size={22} color="#10b981" style={{ flexShrink: 0 }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {result.imported > 0 && (
                    <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 800, color: 'var(--card-heading)' }}>{t.doneTitle}</span>
                  )}
                  <span style={{ fontSize: 14, fontWeight: result.imported > 0 ? 500 : 600, color: result.imported > 0 ? 'var(--card-sub)' : 'var(--card-heading)' }}>
                    {result.imported > 0 ? t.importedOk(result.imported) : t.nothingImported}
                  </span>
                </div>
              </div>

              {result.rejectedRows.length > 0 && (
                <div style={{ padding: '16px 18px', borderRadius: 14, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                    <AlertTriangle size={22} color="#f59e0b" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--card-heading)' }}>
                      {t.rejectedMsg(result.rejectedRows.length)}
                    </span>
                  </div>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => downloadRejected(result.rejectedHeader, result.rejectedRows)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 11, cursor: 'pointer',
                      border: '1px solid rgba(245,158,11,0.35)', background: 'rgba(245,158,11,0.12)', color: '#f59e0b', fontSize: 13, fontWeight: 700,
                    }}>
                    <Download size={15} /> {t.downloadRejected}
                  </motion.button>
                </div>
              )}

              <button onClick={reset}
                style={{
                  alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 18px', borderRadius: 11,
                  border: '1px solid var(--card-border)', background: 'var(--inner-bg)', color: 'var(--card-sub)', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                }}>
                <RotateCcw size={14} /> {t.importAgain}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
