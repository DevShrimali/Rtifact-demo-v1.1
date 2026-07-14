/**
 * Header links, subscribe toggle, welcome message & the groups/services picker —
 * shared by the create (SitesPage) and edit (SiteDetailPage) status site flows.
 *
 * Groups and services are NOT authored here — they're defined once in the
 * Service Registry. This picks an ordered, flat selection of them onto the page.
 */
import { useState } from 'react'
import { ArrowDown, ArrowUp, Layers, Plus, Server, Trash2 } from 'lucide-react'
import {
  getServiceGroups,
  normalizeHealth,
  type HeaderLink,
  type PageEntry,
  type PublicPageConfig,
  type RegistryService,
  type ServiceGroup,
} from '../mock/support'
import { Select, type SelectOption } from './Select'

interface PublicPageContentFieldsProps {
  config: PublicPageConfig
  onChange: (patch: Partial<PublicPageConfig>) => void
}

const HEALTH_DOT: Record<'operational' | 'degraded' | 'outage', string> = {
  operational: 'healthy',
  degraded: 'degraded',
  outage: 'critical',
}

function entryKey(entry: PageEntry) {
  return `${entry.type}:${entry.refId}`
}

function groupWorstHealth(group: ServiceGroup): 'operational' | 'degraded' | 'outage' {
  if (group.services.some((s) => normalizeHealth(s.health) === 'outage')) return 'outage'
  if (group.services.some((s) => normalizeHealth(s.health) === 'degraded')) return 'degraded'
  return 'operational'
}

export function PublicPageContentFields({ config, onChange }: PublicPageContentFieldsProps) {
  const [newLinkLabel, setNewLinkLabel] = useState('')
  const [newLinkUrl, setNewLinkUrl] = useState('')
  const [addValue, setAddValue] = useState('')

  const registryGroups = getServiceGroups()
  const groupById = new Map(registryGroups.map((g) => [g.id, g]))
  const serviceById = new Map(registryGroups.flatMap((g) => g.services.map((s) => [s.id, { service: s, groupName: g.name }] as const)))

  const addHeaderLink = () => {
    if (!newLinkLabel.trim() || !newLinkUrl.trim()) return
    const link: HeaderLink = { label: newLinkLabel.trim(), url: newLinkUrl.trim() }
    onChange({ headerLinks: [...config.headerLinks, link] })
    setNewLinkLabel('')
    setNewLinkUrl('')
  }

  const removeHeaderLink = (idx: number) => {
    onChange({ headerLinks: config.headerLinks.filter((_, i) => i !== idx) })
  }

  const isAdded = (type: PageEntry['type'], refId: string) => config.entries.some((e) => e.type === type && e.refId === refId)

  const addEntry = (value: string) => {
    const [type, refId] = value.split(':') as [PageEntry['type'], string]
    if (!type || !refId || isAdded(type, refId)) {
      setAddValue('')
      return
    }
    onChange({ entries: [...config.entries, { type, refId }] })
    setAddValue('')
  }

  const removeEntry = (idx: number) => {
    onChange({ entries: config.entries.filter((_, i) => i !== idx) })
  }

  const moveEntry = (index: number, dir: -1 | 1) => {
    const target = index + dir
    if (target < 0 || target >= config.entries.length) return
    const entries = [...config.entries]
      ;[entries[index], entries[target]] = [entries[target], entries[index]]
    onChange({ entries })
  }

  const addOptions: SelectOption[] = [
    ...registryGroups
      .filter((g) => !isAdded('group', g.id))
      .map((g) => ({
        value: `group:${g.id}`,
        label: (
          <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <Layers size={13} style={{ flexShrink: 0, color: 'var(--muted)' }} />
            {g.name}
            <span style={{ color: 'var(--faint)', fontSize: 11 }}>Group · {g.services.length} services</span>
          </span>
        ),
      })),
    ...registryGroups
      .flatMap((g) => g.services.map((s) => ({ service: s, groupName: g.name })))
      .filter(({ service }) => !isAdded('service', service.id))
      .map(({ service, groupName }) => ({
        value: `service:${service.id}`,
        label: (
          <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <Server size={13} style={{ flexShrink: 0, color: 'var(--muted)' }} />
            {service.name}
            <span style={{ color: 'var(--faint)', fontSize: 11 }}>Service · {groupName}</span>
          </span>
        ),
      })),
  ]

  return (
    <>
      {/* Welcome message (optional) */}
      <div className="field">
        <span className="field-label">Welcome message (optional)</span>
        <textarea
          className="text-input"
          rows={2}
          placeholder="Shown above the status banner — leave blank to hide"
          value={config.welcomeMessage}
          onChange={(e) => onChange({ welcomeMessage: e.target.value })}
        />
      </div>

      {/* Header links */}
      <div className="field">
        <span className="field-label">Header links</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {config.headerLinks.map((link, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5 }}>
              <span style={{ flex: 1, padding: '7px 10px', border: '1px solid var(--border)', borderRadius: 7, background: 'var(--surface)' }}>{link.label}</span>
              <span className="mono" style={{ flex: 1, padding: '7px 10px', border: '1px solid var(--border)', borderRadius: 7, background: 'var(--surface)', color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{link.url}</span>
              <button type="button" onClick={() => removeHeaderLink(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--faint)', display: 'flex' }}>
                <Trash2 size={13} />
              </button>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 8 }}>
            <input className="text-input" placeholder="Label, e.g. Website" style={{ flex: 1 }} value={newLinkLabel} onChange={(e) => setNewLinkLabel(e.target.value)} />
            <input className="text-input" placeholder="https://…" style={{ flex: 1 }} value={newLinkUrl} onChange={(e) => setNewLinkUrl(e.target.value)} />
            <button type="button" className="btn btn-secondary" onClick={addHeaderLink} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
              <Plus size={13} /> Add
            </button>
          </div>
        </div>
      </div>

      {/* Groups & services */}
      <div className="field">
        <span className="field-label">Groups & services</span>
        <p style={{ fontSize: 11.5, color: 'var(--muted)', margin: '0 0 10px 0' }}>
          Pick from the Service Registry and arrange order. Groups expand as accordions; individual services stand alone.
        </p>

        {config.entries.length === 0 ? (
          <p style={{ fontSize: 11.5, color: 'var(--faint)', margin: '4px 0 10px 0' }}>Nothing added yet — pick a group or service below.</p>
        ) : (
          <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', marginBottom: 10 }}>
            {config.entries.map((entry, idx) => {
              const isGroup = entry.type === 'group'
              const group = isGroup ? groupById.get(entry.refId) : undefined
              const svcEntry = !isGroup ? serviceById.get(entry.refId) : undefined
              if (isGroup && !group) return null
              if (!isGroup && !svcEntry) return null

              const health = isGroup ? groupWorstHealth(group as ServiceGroup) : normalizeHealth((svcEntry as { service: RegistryService }).service.health)
              const name = isGroup ? (group as ServiceGroup).name : (svcEntry as { service: RegistryService }).service.name
              const meta = isGroup
                ? `Group · ${(group as ServiceGroup).services.length} services`
                : `Service · ${(svcEntry as { groupName: string }).groupName}`

              return (
                <div
                  key={entryKey(entry)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderBottom: idx === config.entries.length - 1 ? 'none' : '1px solid var(--border)', fontSize: 12.5 }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <button type="button" onClick={() => moveEntry(idx, -1)} disabled={idx === 0} title="Move up" style={{ background: 'none', border: 'none', padding: 1, cursor: idx === 0 ? 'not-allowed' : 'pointer', color: idx === 0 ? 'var(--faint)' : 'var(--muted)', display: 'flex' }}>
                      <ArrowUp size={11} />
                    </button>
                    <button type="button" onClick={() => moveEntry(idx, 1)} disabled={idx === config.entries.length - 1} title="Move down" style={{ background: 'none', border: 'none', padding: 1, cursor: idx === config.entries.length - 1 ? 'not-allowed' : 'pointer', color: idx === config.entries.length - 1 ? 'var(--faint)' : 'var(--muted)', display: 'flex' }}>
                      <ArrowDown size={11} />
                    </button>
                  </div>
                  {isGroup ? <Layers size={14} style={{ color: 'var(--muted)', flexShrink: 0 }} /> : <Server size={14} style={{ color: 'var(--muted)', flexShrink: 0 }} />}
                  <span className={`dot ${HEALTH_DOT[health]}`} style={{ flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: 'var(--fg)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
                    <div style={{ color: 'var(--faint)', fontSize: 11 }}>{meta}</div>
                  </div>
                  <button type="button" onClick={() => removeEntry(idx)} title="Remove" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--faint)', display: 'flex', flexShrink: 0 }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              )
            })}
          </div>
        )}

        <Select
          value={addValue}
          onValueChange={addEntry}
          options={addOptions}
          placeholder={addOptions.length === 0 ? 'All groups & services added' : '+ Add a group or service'}
          disabled={addOptions.length === 0}
        />
      </div>
    </>
  )
}
