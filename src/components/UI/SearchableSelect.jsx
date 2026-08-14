import { useState } from 'react'
import { Search, X, Plus } from 'lucide-react'

/**
 * SearchableSelect — filtro com campo de busca + dropdown.
 * Padrão visual do projeto Diária Pro.
 *
 * Props:
 *  value      — valor selecionado atual (string)
 *  onChange   — callback(value: string)
 *  options    — [{ value, label }] — o primeiro item é tratado como "todos"
 *  placeholder — texto exibido quando nada está selecionado
 *  minWidth   — largura mínima do container (default: 200)
 *  fontSize   — tamanho da fonte (default: 13)
 *  padding    — padding do input (default: '10px 34px')
 *  allowCustom — true → permite digitar um valor fora da lista ("Adicionar '...'")
 */
export default function SearchableSelect({
  value,
  onChange,
  options = [],
  placeholder = 'Selecionar...',
  minWidth = 200,
  fontSize = 13,
  padding = '10px 34px',
  clearable = true,   // false → não mostra botão X (para campos de form obrigatórios)
  allowCustom = false,
}) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)

  // Em filtros (clearable), a primeira opção é o "todos" e fica oculta quando
  // selecionada. Em campos de formulário (clearable=false) toda opção é real.
  const allValue   = options[0]?.value ?? 'all'
  const isDefault  = clearable ? (!value || value === allValue) : !value
  const selectedLabel = options.find(o => o.value === value)?.label
    ?? (allowCustom && value ? value : '')

  // Quando aberto: mostra o texto digitado; quando fechado: mostra o label selecionado
  const displayText = open ? search : (isDefault ? '' : selectedLabel)

  const filtered = search
    ? options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))
    : options

  // Valor digitado que não existe na lista → oferece "Adicionar"
  const typed = search.trim()
  const hasExactMatch = options.some(o => o.label.toLowerCase() === typed.toLowerCase())
  const showAddCustom = allowCustom && typed.length > 0 && !hasExactMatch

  const handleSelect = (opt) => {
    onChange(opt.value)
    setSearch('')
    setOpen(false)
  }

  const handleAddCustom = () => {
    onChange(typed)
    setSearch('')
    setOpen(false)
  }

  const handleKeyDown = (e) => {
    if (e.key !== 'Enter' || !open) return
    e.preventDefault()
    if (showAddCustom) handleAddCustom()
    else if (filtered.length > 0) handleSelect(filtered[0])
  }

  const handleClear = () => {
    onChange(allValue)
    setSearch('')
    setOpen(false)
  }

  const [paddingTop, paddingRight = paddingTop, paddingBottom = paddingTop] =
    padding.split(' ')

  const inputPadding = `${paddingTop} ${paddingRight} ${paddingBottom} 34px`

  return (
    <div style={{ position: 'relative', minWidth }}>
      {/* Input */}
      <div style={{ position: 'relative' }}>
        <Search
          size={14}
          style={{
            position: 'absolute', left: 12, top: '50%',
            transform: 'translateY(-50%)',
            color: 'rgba(148,163,184,0.5)', pointerEvents: 'none',
          }}
        />
        <input
          type="text"
          value={displayText}
          onChange={e => { setSearch(e.target.value); setOpen(true) }}
          onFocus={() => { setSearch(''); setOpen(true) }}
          onBlur={() => setTimeout(() => setOpen(false), 160)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="input-premium"
          style={{
            width: '100%',
            padding: inputPadding,
            borderRadius: 12,
            fontSize,
            boxSizing: 'border-box',
          }}
          autoComplete="off"
        />

        {/* Botão limpar */}
        {clearable && !isDefault && (
          <button
            onMouseDown={handleClear}
            style={{
              position: 'absolute', right: 10, top: '50%',
              transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'rgba(148,163,184,0.5)',
              display: 'flex', alignItems: 'center', padding: 2,
            }}
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position: 'absolute', top: 'calc(100% + 4px)',
            left: 0, right: 0, zIndex: 300,
            background: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            borderRadius: 12,
            boxShadow: '0 8px 28px rgba(0,0,0,0.4)',
            maxHeight: 230, overflowY: 'auto',
          }}
        >
          {showAddCustom && (
            <div
              onMouseDown={handleAddCustom}
              style={{
                padding: '9px 14px',
                fontSize,
                cursor: 'pointer',
                color: '#818cf8', fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 7,
                borderBottom: filtered.length > 0 ? '1px solid var(--inner-border)' : 'none',
                background: 'rgba(99,102,241,0.06)',
                transition: 'background 0.13s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.14)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(99,102,241,0.06)'}
            >
              <Plus size={13} />
              Adicionar "{typed}"
            </div>
          )}
          {filtered.length > 0 ? filtered.map((opt, i) => (
            <div
              key={opt.value}
              onMouseDown={() => handleSelect(opt)}
              style={{
                padding: '9px 14px',
                fontSize,
                cursor: 'pointer',
                color: value === opt.value ? '#818cf8' : 'var(--card-heading)',
                fontWeight: value === opt.value ? 700 : 400,
                borderBottom: i < filtered.length - 1 ? '1px solid var(--inner-border)' : 'none',
                background: value === opt.value ? 'rgba(99,102,241,0.1)' : 'transparent',
                transition: 'background 0.13s',
              }}
              onMouseEnter={e => { if (value !== opt.value) e.currentTarget.style.background = 'var(--inner-bg)' }}
              onMouseLeave={e => { if (value !== opt.value) e.currentTarget.style.background = 'transparent' }}
            >
              {opt.label}
            </div>
          )) : !showAddCustom && (
            <div style={{
              padding: '10px 14px', fontSize: 12,
              color: 'var(--card-muted)', textAlign: 'center',
            }}>
              Nenhum resultado
            </div>
          )}
        </div>
      )}
    </div>
  )
}
