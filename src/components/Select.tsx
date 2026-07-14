import * as RadixSelect from '@radix-ui/react-select'
import { Check, ChevronDown, X } from 'lucide-react'

export interface SelectOption {
  value: string
  label: React.ReactNode
  disabled?: boolean
}

interface SelectProps {
  value: string
  onValueChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  disabled?: boolean
  triggerStyle?: React.CSSProperties
  triggerClassName?: string
  /** `filter` = compact Linear-style facet trigger (toolbar filters). */
  variant?: 'default' | 'filter'
  /** Facet label for filter variant, e.g. "Site". */
  label?: string
  /** Value that means "no filter" for filter variant (default: `all`). */
  emptyValue?: string
}

/* Radix-backed dropdown, themed to match .text-input — replaces native
   <select> everywhere we need real keyboard nav + a styleable menu. */
export function Select({
  value,
  onValueChange,
  options,
  placeholder,
  disabled,
  triggerStyle,
  triggerClassName,
  variant = 'default',
  label,
  emptyValue = 'all',
}: SelectProps) {
  const selected = options.find((o) => o.value === value)
  const isFiltered = variant === 'filter' && value !== emptyValue
  const triggerClasses =
    variant === 'filter'
      ? `rt-select-trigger rt-filter-facet${isFiltered ? ' active' : ''}${triggerClassName ? ` ${triggerClassName}` : ''}`
      : `rt-select-trigger text-input${triggerClassName ? ` ${triggerClassName}` : ''}`

  const filterDisplay =
    variant === 'filter' && label ? (
      isFiltered ? (
        <>
          <span className="rt-filter-facet-key">{label}</span>
          <span className="rt-filter-facet-value">{selected?.label}</span>
        </>
      ) : (
        label
      )
    ) : null

  return (
    <RadixSelect.Root value={value} onValueChange={onValueChange} disabled={disabled}>
      <RadixSelect.Trigger className={triggerClasses} style={triggerStyle}>
        <span
          className="rt-select-value"
          style={filterDisplay ? { display: 'inline-flex', alignItems: 'center', gap: 6 } : undefined}
        >
          {filterDisplay ?? <RadixSelect.Value placeholder={placeholder}>{selected?.label}</RadixSelect.Value>}
        </span>
        {isFiltered ? (
          <span
            role="button"
            tabIndex={0}
            className="rt-filter-facet-clear"
            aria-label={`Clear ${label ?? 'filter'}`}
            onPointerDown={(e) => {
              // Prevent Select from opening when clearing
              e.preventDefault()
              e.stopPropagation()
            }}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onValueChange(emptyValue)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                e.stopPropagation()
                onValueChange(emptyValue)
              }
            }}
          >
            <X size={12} strokeWidth={2.4} />
          </span>
        ) : (
          <RadixSelect.Icon className="rt-select-chevron">
            <ChevronDown size={14} />
          </RadixSelect.Icon>
        )}
      </RadixSelect.Trigger>
      <RadixSelect.Portal>
        <RadixSelect.Content className="rt-select-content" position="popper" sideOffset={6}>
          <RadixSelect.Viewport className="rt-select-viewport">
            {options.map((opt) => (
              <RadixSelect.Item key={opt.value} value={opt.value} disabled={opt.disabled} className="rt-select-item">
                <RadixSelect.ItemText>{opt.label}</RadixSelect.ItemText>
                <RadixSelect.ItemIndicator className="rt-select-item-indicator">
                  <Check size={13} />
                </RadixSelect.ItemIndicator>
              </RadixSelect.Item>
            ))}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  )
}
