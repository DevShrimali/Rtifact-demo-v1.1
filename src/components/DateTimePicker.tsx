import { useState } from 'react'
import * as Popover from '@radix-ui/react-popover'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/style.css'
import { CalendarDays, Clock } from 'lucide-react'

interface DateTimePickerProps {
  value: Date | undefined
  onChange: (date: Date | undefined) => void
  placeholder?: string
  minDate?: Date
}

const formatDisplay = (d: Date) =>
  d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })

const formatTimeInput = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`

/* Popover + calendar grid + time field — the shadcn-style date/time picker
   used wherever we previously used a raw <input type="datetime-local">. */
export function DateTimePicker({ value, onChange, placeholder, minDate }: DateTimePickerProps) {
  const [open, setOpen] = useState(false)

  const handleDaySelect = (day: Date | undefined) => {
    if (!day) {
      onChange(undefined)
      return
    }
    const merged = new Date(day)
    if (value) {
      merged.setHours(value.getHours(), value.getMinutes(), 0, 0)
    } else {
      merged.setHours(9, 0, 0, 0)
    }
    onChange(merged)
  }

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [h, m] = e.target.value.split(':').map(Number)
    const base = value ? new Date(value) : new Date()
    base.setHours(h, m, 0, 0)
    onChange(base)
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button type="button" className="rt-select-trigger text-input" style={{ width: '100%' }}>
          <span className="rt-select-value" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <CalendarDays size={14} style={{ color: 'var(--faint)', flexShrink: 0 }} />
            {value ? formatDisplay(value) : <span style={{ color: 'var(--faint)' }}>{placeholder ?? 'Pick a date & time'}</span>}
          </span>
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content className="rt-popover-content" sideOffset={6} align="start">
          <DayPicker
            mode="single"
            selected={value}
            onSelect={handleDaySelect}
            disabled={minDate ? { before: minDate } : undefined}
            className="rt-calendar"
          />
          <div className="rt-datetime-time-row">
            <Clock size={13} style={{ color: 'var(--faint)' }} />
            <input
              type="time"
              className="text-input"
              style={{ flex: 1, padding: '6px 10px' }}
              value={value ? formatTimeInput(value) : ''}
              onChange={handleTimeChange}
              disabled={!value}
            />
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
