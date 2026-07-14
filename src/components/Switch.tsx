import * as RadixSwitch from '@radix-ui/react-switch'

interface SwitchProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  label?: React.ReactNode
  disabled?: boolean
}

/* Radix Switch for boolean settings — replaces bare <input type="checkbox">
   toggle rows with a proper on/off switch matching our theme. */
export function Switch({ checked, onCheckedChange, label, disabled }: SwitchProps) {
  const switchEl = (
    <RadixSwitch.Root className="rt-switch-root" checked={checked} onCheckedChange={onCheckedChange} disabled={disabled}>
      <RadixSwitch.Thumb className="rt-switch-thumb" />
    </RadixSwitch.Root>
  )

  if (!label) return switchEl

  return (
    <label className="rt-switch-row" style={{ opacity: disabled ? 0.6 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}>
      <span>{label}</span>
      {switchEl}
    </label>
  )
}
