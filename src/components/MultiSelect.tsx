import { useMemo, useState } from 'react'
import * as Popover from '@radix-ui/react-popover'
import * as RadixCheckbox from '@radix-ui/react-checkbox'
import { Check, ChevronDown, Search, X } from 'lucide-react'

export interface MultiSelectOption {
  value: string
  label: React.ReactNode
  /** Plain text used for search + filter summary (falls back to string labels). */
  searchText?: string
}

interface MultiSelectProps {
  values: string[]
  onValuesChange: (values: string[]) => void
  options: MultiSelectOption[]
  placeholder?: string
  /** Facet label shown on filter triggers, e.g. "Components". */
  label?: string
  /** `filter` = compact Linear-style facet trigger (toolbar filters). */
  variant?: 'default' | 'filter'
  triggerClassName?: string
  triggerStyle?: React.CSSProperties
  contentStyle?: React.CSSProperties
  searchable?: boolean
  searchPlaceholder?: string
}

function optionText(opt: MultiSelectOption): string {
  if (opt.searchText) return opt.searchText
  return typeof opt.label === 'string' ? opt.label : opt.value
}

/* Popover + checkable list — replaces bordered checkbox-list boxes with a
   single trigger, matching the Select component's visual language. */
export function MultiSelect({
  values,
  onValuesChange,
  options,
  placeholder,
  label,
  variant = 'default',
  triggerClassName,
  triggerStyle,
  contentStyle,
  searchable = false,
  searchPlaceholder = 'Search…',
}: MultiSelectProps) {
  const [query, setQuery] = useState('')

  const toggle = (value: string) => {
    if (values.includes(value)) {
      onValuesChange(values.filter((v) => v !== value))
    } else {
      onValuesChange([...values, value])
    }
  }

  const selected = options.filter((o) => values.includes(o.value))
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter((o) => optionText(o).toLowerCase().includes(q))
  }, [options, query])

  const triggerLabel = (() => {
    if (variant === 'filter' && label) {
      if (selected.length === 0) return label
      if (selected.length === 1) {
        return (
          <>
            <span className="rt-filter-facet-key">{label}</span>
            <span className="rt-filter-facet-value">{optionText(selected[0])}</span>
          </>
        )
      }
      return (
        <>
          <span className="rt-filter-facet-key">{label}</span>
          <span className="rt-filter-facet-value">{selected.length} selected</span>
        </>
      )
    }
    if (selected.length === 0) {
      return <span style={{ color: 'var(--faint)' }}>{placeholder ?? 'Select…'}</span>
    }
    return selected.map((o) => optionText(o)).join(', ')
  })()

  const triggerClasses =
    variant === 'filter'
      ? `rt-select-trigger rt-filter-facet${values.length > 0 ? ' active' : ''}${triggerClassName ? ` ${triggerClassName}` : ''}`
      : `rt-select-trigger text-input${triggerClassName ? ` ${triggerClassName}` : ''}`

  return (
    <Popover.Root
      onOpenChange={(open) => {
        if (!open) setQuery('')
      }}
    >
      <Popover.Trigger asChild>
        <button type="button" className={triggerClasses} style={triggerStyle}>
          <span className="rt-select-value" style={variant === 'filter' ? { display: 'inline-flex', alignItems: 'center', gap: 6 } : undefined}>
            {triggerLabel}
          </span>
          {variant === 'filter' && values.length > 0 ? (
            <span
              role="button"
              tabIndex={0}
              className="rt-filter-facet-clear"
              aria-label={`Clear ${label ?? 'filter'}`}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onValuesChange([])
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  e.stopPropagation()
                  onValuesChange([])
                }
              }}
            >
              <X size={12} strokeWidth={2.4} />
            </span>
          ) : (
            <ChevronDown size={14} className="rt-select-chevron" />
          )}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="rt-select-content"
          sideOffset={6}
          align="start"
          style={{
            width: variant === 'filter' ? 260 : 'var(--radix-popover-trigger-width)',
            ...contentStyle,
          }}
        >
          {searchable && (
            <div className="rt-filter-search-inline">
              <Search size={13} strokeWidth={2.2} />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
              />
            </div>
          )}
          <div className="rt-select-viewport">
            {filtered.length === 0 ? (
              <div className="rt-filter-empty">No matches</div>
            ) : (
              filtered.map((opt) => {
                const checked = values.includes(opt.value)
                return (
                  <label key={opt.value} className="rt-select-item" style={{ cursor: 'pointer' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <RadixCheckbox.Root className="rt-checkbox-root" checked={checked} onCheckedChange={() => toggle(opt.value)}>
                        <RadixCheckbox.Indicator className="rt-checkbox-indicator">
                          <Check size={11} strokeWidth={3} />
                        </RadixCheckbox.Indicator>
                      </RadixCheckbox.Root>
                      {opt.label}
                    </span>
                  </label>
                )
              })
            )}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
