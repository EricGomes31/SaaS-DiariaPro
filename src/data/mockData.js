import { subDays, format, getDay, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export const PIX_KEY_TYPES = [
  { value: 'cpf',    label: 'CPF' },
  { value: 'phone',  label: 'Telefone' },
  { value: 'email',  label: 'E-mail' },
  { value: 'random', label: 'Chave Aleatória' },
]

export const LOCATIONS = [
  { id: 'loc1', name: 'Galpão 1', color: '#6366f1', shortName: 'G1', address: 'Av. Industrial, 1200', city: 'São Paulo' },
  { id: 'loc2', name: 'Galpão 2', color: '#f59e0b', shortName: 'G2', address: 'Rua das Fábricas, 450', city: 'São Paulo' },
  { id: 'loc3', name: 'Galpão 3', color: '#10b981', shortName: 'G3', address: 'Rod. Anhanguera, Km 28', city: 'Guarulhos' },
  { id: 'loc4', name: 'Depósito Central', color: '#f43f5e', shortName: 'DC', address: 'Av. Logística, 800', city: 'Osasco' },
]

export const DEPARTMENTS = ['Operações', 'Logística', 'Manutenção', 'Segurança', 'Administrativo']

export const JOB_TITLES = [
  'Operador de Empilhadeira',
  'Auxiliar de Estoque',
  'Conferente',
  'Motorista',
  'Segurança Patrimonial',
  'Auxiliar Administrativo',
  'Eletricista',
  'Mecânico',
  'Líder de Turno',
  'Ajudante Geral',
]

export const WORKERS = [
  {
    id: 'w1',
    name: 'Carlos Eduardo Silva',
    department: 'Operações',
    jobTitle: 'Operador de Empilhadeira',
    weekdayRate: 180,
    weekendRate: 260,
    locations: ['loc1', 'loc2'],
    schedule: 'Turno A (06h–14h)',
    status: 'active',
    avatar: 'CE',
    avatarColor: '#6366f1',
    phone: '(11) 98765-4321',
    startDate: '2024-03-15',
    pixKeyType: 'cpf',
    pixKey: '123.456.789-01',
  },
  {
    id: 'w2',
    name: 'Fernanda Souza',
    department: 'Logística',
    jobTitle: 'Conferente',
    weekdayRate: 160,
    weekendRate: 230,
    locations: ['loc2', 'loc3'],
    schedule: 'Turno B (14h–22h)',
    status: 'active',
    avatar: 'FS',
    avatarColor: '#f59e0b',
    phone: '(11) 91234-5678',
    startDate: '2024-01-08',
    pixKeyType: 'phone',
    pixKey: '+55 (11) 91234-5678',
  },
  {
    id: 'w3',
    name: 'Roberto Lima',
    department: 'Manutenção',
    jobTitle: 'Eletricista',
    weekdayRate: 200,
    weekendRate: 290,
    locations: ['loc1', 'loc3', 'loc4'],
    schedule: 'Turno C (22h–06h)',
    status: 'active',
    avatar: 'RL',
    avatarColor: '#10b981',
    phone: '(11) 97654-3210',
    startDate: '2023-11-20',
    pixKeyType: 'email',
    pixKey: 'roberto.lima@email.com',
  },
  {
    id: 'w4',
    name: 'Juliana Martins',
    department: 'Administrativo',
    jobTitle: 'Auxiliar Administrativo',
    weekdayRate: 150,
    weekendRate: 210,
    locations: ['loc4'],
    schedule: 'Comercial (08h–17h)',
    status: 'inactive',
    avatar: 'JM',
    avatarColor: '#f43f5e',
    phone: '(11) 96543-2109',
    startDate: '2024-05-10',
    pixKeyType: 'random',
    pixKey: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  },
  {
    id: 'w5',
    name: 'Marcos Oliveira',
    department: 'Segurança',
    jobTitle: 'Segurança Patrimonial',
    weekdayRate: 170,
    weekendRate: 245,
    locations: ['loc1', 'loc2', 'loc3', 'loc4'],
    schedule: 'Turno A (06h–18h)',
    status: 'active',
    avatar: 'MO',
    avatarColor: '#8b5cf6',
    phone: '(11) 95432-1098',
    startDate: '2024-02-14',
    pixKeyType: 'cpf',
    pixKey: '987.654.321-00',
  },
  {
    id: 'w6',
    name: 'Patrícia Costa',
    department: 'Logística',
    jobTitle: 'Líder de Turno',
    weekdayRate: 220,
    weekendRate: 320,
    locations: ['loc2', 'loc3'],
    schedule: 'Turno B (14h–22h)',
    status: 'active',
    avatar: 'PC',
    avatarColor: '#06b6d4',
    phone: '(11) 94321-0987',
    startDate: '2023-09-01',
    pixKeyType: 'email',
    pixKey: 'patriciacosta@empresa.com.br',
  },
  {
    id: 'w7',
    name: 'André Ferreira',
    department: 'Operações',
    jobTitle: 'Auxiliar de Estoque',
    weekdayRate: 145,
    weekendRate: 210,
    locations: ['loc1'],
    schedule: 'Turno A (06h–14h)',
    status: 'active',
    avatar: 'AF',
    avatarColor: '#f59e0b',
    phone: '(11) 93210-9876',
    startDate: '2024-07-22',
    pixKeyType: 'phone',
    pixKey: '+55 (11) 93210-9876',
  },
  {
    id: 'w8',
    name: 'Luciana Santos',
    department: 'Manutenção',
    jobTitle: 'Mecânico',
    weekdayRate: 195,
    weekendRate: 280,
    locations: ['loc3', 'loc4'],
    schedule: 'Comercial (08h–17h)',
    status: 'inactive',
    avatar: 'LS',
    avatarColor: '#10b981',
    phone: '(11) 92109-8765',
    startDate: '2024-04-18',
    pixKeyType: 'cpf',
    pixKey: '456.789.012-34',
  },
]

export const HOLIDAYS_2025 = ['2025-01-01', '2025-04-21', '2025-05-01', '2025-09-07', '2025-10-12', '2025-11-02', '2025-11-15', '2025-12-25']

export function isWeekendOrHoliday(dateStr, holidays = HOLIDAYS_2025) {
  const date = new Date(dateStr)
  const dayOfWeek = getDay(date)
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
  const isHoliday = holidays.includes(dateStr)
  return isWeekend || isHoliday
}

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
      const rate = isSpecial ? worker.weekendRate : worker.weekdayRate
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

export const WORK_DAYS = [
  ...generateWorkDays('w1', 22),
  ...generateWorkDays('w2', 18),
  ...generateWorkDays('w3', 20),
  ...generateWorkDays('w4', 8),
  ...generateWorkDays('w5', 25),
  ...generateWorkDays('w6', 19),
  ...generateWorkDays('w7', 15),
  ...generateWorkDays('w8', 6),
]

export function getWorkerStats(workerId, allWorkDays = WORK_DAYS) {
  const days = allWorkDays.filter(d => d.workerId === workerId)
  const totalEarnings = days.reduce((sum, d) => sum + d.earnings, 0)
  const weekdayDays = days.filter(d => !d.isWeekend)
  const weekendDays = days.filter(d => d.isWeekend)
  return {
    totalDays: days.length,
    totalEarnings,
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
    const dayLabel = format(date, 'EEE')
    const dayWork = workDays.filter(d => d.date === dateStr)
    last7days.push({
      day: dayLabel,
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

  return {
    activeWorkers,
    totalWorkers: workers.length,
    totalEarnings,
    totalDays,
    avgEarningPerDay,
    last7days,
    last30days,
    byLocation,
  }
}

export const HOLIDAYS = HOLIDAYS_2025 // legacy alias

// Group a worker's work days into monthly payment periods
export function getPaymentHistory(workerId, allWorkDays = WORK_DAYS) {
  const days = allWorkDays.filter(d => d.workerId === workerId)
    .sort((a, b) => a.date.localeCompare(b.date))

  if (days.length === 0) return []

  const today = new Date()
  const months = eachMonthOfInterval({
    start: subMonths(today, 3),
    end: today,
  })

  return months.map((monthDate, idx) => {
    const monthStr = format(monthDate, 'yyyy-MM')
    const monthDays = days.filter(d => d.date.startsWith(monthStr))
    const total = monthDays.reduce((s, d) => s + d.earnings, 0)
    const weekdayDays = monthDays.filter(d => !d.isWeekend)
    const weekendDays = monthDays.filter(d => d.isWeekend)

    const isCurrentMonth = format(today, 'yyyy-MM') === monthStr
    const isPrevMonth   = idx === months.length - 2

    let status
    if (isCurrentMonth) {
      status = 'pending'
    } else if (isPrevMonth && total > 0) {
      status = 'processing'
    } else {
      status = total > 0 ? 'paid' : 'no-work'
    }

    const paidDate = status === 'paid'
      ? format(endOfMonth(monthDate), 'dd/MM/yyyy')
      : null

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
      paidDate,
    }
  }).reverse()
}
