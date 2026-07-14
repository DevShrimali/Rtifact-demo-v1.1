import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  CalendarClock, ChevronDown, Clock, Download, FileText,
  Library, Sparkles, ArrowDownToLine, FileArchive
} from 'lucide-react'
import { useEnv } from '../../state/env'
import {
  aggregateCostTotal,
  aggregateReliability,
  aggregateRollup,
  aggregateSecurity,
  formatUsd,
} from '../../mock/review'
import { Sparkline } from '../../components/Sparkline'
import { useEnvLoad, ListSkeleton } from '../../components/PageLoad'

const REPORT_TEMPLATES = [
  { id: 'weekly-exec',  name: 'Weekly executive package',  cadence: 'Every Mon 08:00', pillars: 'Security · Cost · Reliability', desc: 'Cost, reliability & risk digest for leadership. Plain-language AI summary + trend charts.', tag: 'Most used', formats: 'PDF · Slides' },
  { id: 'finops',       name: 'FinOps savings deep-dive',  cadence: 'Monthly',          pillars: 'Cost', desc: 'FinOps line items, projected savings and right-sizing recommendations.', tag: 'FinOps', formats: 'PDF · CSV' },
  { id: 'soc2',         name: 'SOC2 audit snapshot',       cadence: 'On demand',        pillars: 'Security · Access', desc: 'Controls, evidence sources and drift log mapped to trust-service criteria.', tag: 'Compliance', formats: 'PDF · Auditor pkg' },
  { id: 'reliability',  name: 'Reliability & SLO review',  cadence: 'Bi-weekly',        pillars: 'Reliability', desc: 'Incident volume, MTTR trend and SLO budget burn by service.', tag: 'SRE', formats: 'PDF · CSV' },
]

// Schedules database with status toggles
interface ReportSchedule {
  id: string
  name: string
  nextRun: string
  sendTo: string
  format: string
  active: boolean
}

const INITIAL_SCHEDULES: ReportSchedule[] = [
  { id: 'sch-1', name: 'Weekly executive package', nextRun: 'Mon Jul 13 · 08:00', sendTo: 'leadership@rtifact.io +4', format: 'PDF', active: true },
  { id: 'sch-2', name: 'FinOps savings deep-dive', nextRun: 'Aug 01 · 09:00', sendTo: 'finops@rtifact.io', format: 'CSV', active: true },
  { id: 'sch-3', name: 'Reliability & SLO review', nextRun: 'Jul 14 · 07:00', sendTo: '#sre-reports (Slack)', format: 'PDF', active: true },
]

const HISTORY: {
  id: string; name: string; when: string; by: string
  format: 'PDF' | 'ZIP'; sizeMb: number; status: 'ready' | 'generating'
}[] = [
  { id: 'r-4471', name: 'Weekly executive package', when: 'Mon Jul 7, 08:00', by: 'Scheduled',    format: 'PDF', sizeMb: 1.2, status: 'ready'      },
  { id: 'r-4460', name: 'FinOps savings deep-dive', when: 'Jul 1, 09:12',     by: 'Raj Patel',    format: 'PDF', sizeMb: 0.8, status: 'ready'      },
  { id: 'r-4455', name: 'SOC2 audit snapshot',      when: 'Jun 28, 14:03',    by: 'Priya Sharma', format: 'ZIP', sizeMb: 4.6, status: 'ready'      },
  { id: 'r-4441', name: 'Weekly executive package', when: 'Mon Jun 30, 08:00',by: 'Scheduled',    format: 'PDF', sizeMb: 1.1, status: 'ready'      },
  { id: 'r-4438', name: 'Reliability & SLO review', when: 'Jun 25, 11:45',    by: 'J. Okafor',    format: 'PDF', sizeMb: 0.6, status: 'ready'      },
  { id: 'r-4490', name: 'Weekly executive package', when: 'Jul 8, 08:00',     by: 'Scheduled',    format: 'PDF', sizeMb: 0,   status: 'generating' },
]

export function MetricsReportPage() {
  const { selectedIds, selectedEnvs, aggregating } = useEnv()
  const [searchParams] = useSearchParams()
  const loading = useEnvLoad()
  const forcedState = searchParams.get('state')

  // Top level tabs: Library, Scheduled, History
  const [activeTab, setActiveTab] = useState<'library' | 'scheduled' | 'history'>('library')
  
  // Library page states
  const [template, setTemplate] = useState(REPORT_TEMPLATES[0])
  const [libOpen, setLibOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [formatType, setFormatType] = useState<'PDF' | 'CSV' | 'ZIP'>('PDF')
  const libRef = useRef<HTMLDivElement>(null)
  const expRef = useRef<HTMLDivElement>(null)

  // Scheduled page states
  const [schedules, setSchedules] = useState<ReportSchedule[]>(INITIAL_SCHEDULES)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [newScheduleDest, setNewScheduleDest] = useState('')

  // History page states
  const [downloading, setDownloading] = useState<string | null>(null)

  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if (!libRef.current?.contains(e.target as Node)) setLibOpen(false)
      if (!expRef.current?.contains(e.target as Node)) setExportOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [])

  if (forcedState === 'error') {
    return (
      <div className="error-panel" role="alert">
        <div className="error-title">Couldn’t load report data</div>
        <div className="error-sub">
          The reporting pipeline is temporarily offline or data is still aggregating.
        </div>
      </div>
    )
  }

  if (forcedState === 'empty') {
    return (
      <div className="placeholder-panel">
        No report metrics available.
        <span className="mono">run your first workflow or collect telemetry to build reports</span>
      </div>
    )
  }

  const rollup = aggregateRollup(selectedIds)
  const sec = aggregateSecurity(selectedIds)
  const costTotal = aggregateCostTotal(selectedIds)
  const rel = aggregateReliability(selectedIds)
  const scope = aggregating ? `${selectedEnvs.length} environments` : selectedEnvs[0]?.name || 'default'

  const kpis = [
    { label: 'Revenue protected', value: formatUsd(rollup.costUsd), series: [1.2, 1.8, 2.4, 2.1, 3.0, 3.6, 4.9], accent: 'success' as const },
    { label: 'Eng-hours saved',   value: `${rollup.engHours}h`,     series: [2, 3, 4, 5, 6, 6.5, 7.1],            accent: 'success' as const },
    { label: 'Critical findings', value: `${sec.criticalCount}`,    series: [14, 13, 12, 11, 10, 9, sec.criticalCount], accent: sec.criticalCount > 0 ? ('error' as const) : ('success' as const) },
    { label: 'Savings ready',     value: `${formatUsd(costTotal)}/mo`, series: [2.1, 2.4, 3.0, 3.6, 4.2, 4.6, 4.8], accent: 'warn' as const },
    { label: 'Change-failure',    value: `${rel.deploys.failPct}%`,  series: [12, 10, 9, 8, 7.5, 7.2, rel.deploys.failPct], accent: 'warn' as const },
  ]

  const handleDownload = (id: string) => {
    setDownloading(id)
    setTimeout(() => setDownloading(null), 1800)
  }

  const toggleSchedule = (id: string) => {
    setSchedules(prev =>
      prev.map(s => s.id === id ? { ...s, active: !s.active } : s)
    )
  }

  const handleCreateSchedule = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newScheduleDest.trim()) return
    const newSch: ReportSchedule = {
      id: `sch-${schedules.length + 1}`,
      name: template.name,
      nextRun: 'Next run scheduled',
      sendTo: newScheduleDest,
      format: formatType,
      active: true
    }
    setSchedules(prev => [...prev, newSch])
    setNewScheduleDest('')
    setShowScheduleModal(false)
  }

  // Determine if currently selected template already has an active schedule
  const activeSchedule = schedules.find(s => s.name === template.name && s.active)

  return (
    <>
      {/* subnav tabs: Library, Scheduled, History */}
      <nav className="subnav" role="tablist" aria-label="Reports sections" style={{ marginBottom: 18 }}>
        <button
          role="tab"
          aria-selected={activeTab === 'library'}
          className={`subnav-item${activeTab === 'library' ? ' active' : ''}`}
          onClick={() => setActiveTab('library')}
        >
          <Library size={12} strokeWidth={2.2} style={{ marginRight: 4, verticalAlign: -1 }} />
          Library
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'scheduled'}
          className={`subnav-item${activeTab === 'scheduled' ? ' active' : ''}`}
          onClick={() => setActiveTab('scheduled')}
        >
          <CalendarClock size={12} strokeWidth={2.2} style={{ marginRight: 4, verticalAlign: -1 }} />
          Scheduled
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'history'}
          className={`subnav-item${activeTab === 'history' ? ' active' : ''}`}
          style={{ marginLeft: 'auto' }}
          onClick={() => setActiveTab('history')}
        >
          <Clock size={12} strokeWidth={2.2} style={{ marginRight: 4, verticalAlign: -1 }} />
          History
        </button>
      </nav>

      {activeTab === 'library' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Library view toolbar & Report Selector */}
          <div className="metrics-actions" style={{ marginBottom: 4, display: 'flex', alignItems: 'center', gap: 12 }}>
            
            {/* Template Selector dropdown (schedule time removed from list items) */}
            <div className="wl-inline" ref={libRef} style={{ position: 'relative' }}>
              <button className="btn btn-secondary" onClick={() => setLibOpen((o) => !o)} aria-expanded={libOpen} style={{ minWidth: 220 }}>
                <Library size={14} strokeWidth={2.2} />
                {template.name}
                <ChevronDown size={13} strokeWidth={2.2} />
              </button>
              {libOpen && (
                <div className="mini-menu" role="listbox" aria-label="Report templates selector" style={{ width: 280 }}>
                  <div className="mini-menu-label">Select Report Template</div>
                  {REPORT_TEMPLATES.map((t) => (
                    <button
                      key={t.id}
                      role="option"
                      aria-selected={t.id === template.id}
                      className={`mini-menu-item${t.id === template.id ? ' active' : ''}`}
                      onClick={() => { setTemplate(t); setLibOpen(false) }}
                    >
                      <span>{t.name}</span>
                      {/* Notice: Cadence/Schedule time has been removed from options list as requested */}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Schedule UI logic: show active schedule if exists, else show schedule button */}
            {activeSchedule ? (
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--success)',
                  background: 'rgba(34, 197, 94, 0.05)',
                  border: '1px solid rgba(34, 197, 94, 0.15)',
                  borderRadius: 6,
                  padding: '6px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <CalendarClock size={13} />
                <span>Active Schedule: {activeSchedule.nextRun.split('·')[0]}</span>
              </div>
            ) : (
              <button className="btn btn-secondary" onClick={() => setShowScheduleModal(true)}>
                <CalendarClock size={14} strokeWidth={2.2} />
                Schedule report
              </button>
            )}

            {/* Export options */}
            <div ref={expRef} style={{ position: 'relative', marginLeft: 'auto' }}>
              <button
                className="btn btn-primary"
                onClick={() => setExportOpen((o) => !o)}
                aria-expanded={exportOpen}
                disabled={downloading?.startsWith('export-')}
              >
                {downloading?.startsWith('export-') ? (
                  <>
                    <Download className="spin" size={14} strokeWidth={2.2} />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download size={14} strokeWidth={2.2} />
                    Export Live Report
                    <ChevronDown size={13} strokeWidth={2.2} />
                  </>
                )}
              </button>
              {exportOpen && (
                <div className="mini-menu mini-menu-right" role="menu" aria-label="Export formats list" style={{ width: 340 }}>
                  <button className="mini-menu-item" role="menuitem" onClick={() => { setExportOpen(false); handleDownload('export-pdf') }}>
                    <FileText size={13} strokeWidth={2.2} style={{ color: 'var(--brand)', flexShrink: 0 }} />
                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                      <span style={{ fontWeight: 600 }}>PDF format</span>
                      <span style={{ fontSize: 10.5, color: 'var(--faint)', fontWeight: 400 }}>Formatted, shareable document</span>
                    </div>
                    <span className="mini-menu-sub mono" style={{ flexShrink: 0, marginLeft: 12 }}>~1.2 MB</span>
                  </button>
                  <button className="mini-menu-item" role="menuitem" onClick={() => { setExportOpen(false); handleDownload('export-csv') }}>
                    <FileText size={13} strokeWidth={2.2} style={{ color: 'var(--success)', flexShrink: 0 }} />
                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                      <span style={{ fontWeight: 600 }}>CSV format</span>
                      <span style={{ fontSize: 10.5, color: 'var(--faint)', fontWeight: 400 }}>Raw telemetry metrics for BI</span>
                    </div>
                    <span className="mini-menu-sub mono" style={{ flexShrink: 0, marginLeft: 12 }}>~0.8 MB</span>
                  </button>
                  <button className="mini-menu-item" role="menuitem" onClick={() => { setExportOpen(false); handleDownload('export-zip') }}>
                    <FileArchive size={13} strokeWidth={2.2} style={{ color: 'var(--warn)', flexShrink: 0 }} />
                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                      <span style={{ fontWeight: 600 }}>Auditor Package (.zip)</span>
                      <span style={{ fontSize: 10.5, color: 'var(--faint)', fontWeight: 400 }}>Complete controls & evidence zip</span>
                    </div>
                    <span className="mini-menu-sub mono" style={{ flexShrink: 0, marginLeft: 12 }}>~4.6 MB</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {showScheduleModal && (
            <section className="panel form-panel" style={{ padding: 18, border: '1px solid var(--border-strong)' }}>
              <div className="panel-title" style={{ marginBottom: 12 }}>Schedule Report: {template.name}</div>
              <form onSubmit={handleCreateSchedule} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="field">
                  <span className="field-label">Notification destination (email or channel)</span>
                  <input
                    type="text"
                    className="text-input"
                    placeholder="e.g. engineering-reports@rtifact.io or #alerts-sre"
                    value={newScheduleDest}
                    onChange={(e) => setNewScheduleDest(e.target.value)}
                    required
                  />
                </div>
                <div className="field">
                  <span className="field-label">Report format</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {(['PDF', 'CSV', 'ZIP'] as const).map((fmt) => (
                      <button
                        key={fmt}
                        type="button"
                        className={`btn ${formatType === fmt ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setFormatType(fmt)}
                        style={{ flex: 1 }}
                      >
                        {fmt === 'ZIP' ? 'ZIP (Auditor pkg)' : fmt}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowScheduleModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Save Schedule</button>
                </div>
              </form>
            </section>
          )}

          {/* Live report contents */}
          {loading ? (
            <ListSkeleton rows={5} />
          ) : (
            <>
              <div className="section-label" style={{ marginTop: 0 }}>
                <Sparkles size={12} strokeWidth={2.2} style={{ verticalAlign: -1, marginRight: 5, color: 'var(--brand)' }} />
                {template.name} — live data · {scope}
              </div>

              <div className="report-kpis">
                {kpis.map((k) => (
                  <div key={k.label} className={`report-kpi accent-${k.accent}`}>
                    <div className="stat-label">{k.label}</div>
                    <div className="report-kpi-value mono">{k.value}</div>
                    <Sparkline
                      data={k.series}
                      width={150}
                      height={30}
                      stroke={k.accent === 'error' ? 'var(--error)' : k.accent === 'warn' ? 'var(--warn)' : 'var(--success)'}
                    />
                  </div>
                ))}
              </div>

              <div className="section-label">Report sections</div>
              <div className="charts-grid" style={{ marginBottom: 10 }}>
                {[
                  { t: 'Security posture',   v: `${sec.findingTypes} finding types`, s: 'across ' + sec.resourcesAtRisk + ' resources' },
                  { t: 'Cost optimization',  v: `${formatUsd(costTotal)}/mo`,         s: 'ready to capture' },
                  { t: 'Reliability',        v: `${rel.deploys.failPct}% CFR`,        s: `${rel.deploys.rolledBack}/${rel.deploys.total} deploys rolled back` },
                  { t: 'AI contribution',    v: `${rollup.incidents} incidents`,      s: `${rollup.workflows} workflow outcomes` },
                ].map((c) => (
                  <div key={c.t} className="panel chart-card">
                    <div className="chart-head">
                      <span className="chart-title">{c.t}</span>
                      <span className="mono chart-current">{c.v}</span>
                    </div>
                    <div className="stat-meta">{c.s}</div>
                  </div>
                ))}
              </div>

              {/* Template browse cards */}
              <div className="section-label">Available Report Templates</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
                {REPORT_TEMPLATES.map((r) => (
                  <div key={r.id} className="panel" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--text-primary)' }}>{r.name}</span>
                      <span className="badge neutral mono" style={{ fontSize: 10 }}>{r.tag}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-tertiary)', flex: 1, lineHeight: 1.5 }}>
                      {r.desc}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: '1px solid var(--border-subtle)' }}>
                      <span className="mono" style={{ fontSize: 11, color: 'var(--faint)' }}>{r.formats}</span>
                      <button className="btn btn-secondary" style={{ padding: '4px 10px', height: 26, fontSize: 11.5 }} onClick={() => setTemplate(r)}>
                        Preview Live
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'scheduled' && (
        <div className="panel" style={{ padding: '8px 4px' }}>
          <div style={{ padding: '12px 18px 8px', fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--muted)' }}>
            Active Scheduled Runs
          </div>
          <div className="row-list" style={{ border: 'none' }}>
            {schedules.map((s) => (
              <div key={s.id} className="row" style={{ borderTop: '1px solid var(--border-subtle)', borderRadius: 0, padding: '14px 18px', alignItems: 'center' }}>
                <button
                  role="switch"
                  aria-checked={s.active}
                  aria-label={`${s.name} status`}
                  className={`switch${s.active ? ' on' : ''}`}
                  onClick={() => toggleSchedule(s.id)}
                  style={{ marginRight: 12 }}
                >
                  <span className="switch-knob" />
                </button>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: s.active ? 'var(--text-primary)' : 'var(--muted)' }}>
                    {s.name}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--faint)', marginTop: 2 }}>
                    sending to {s.sendTo}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="mono" style={{ fontSize: 12, color: s.active ? 'var(--text-secondary)' : 'var(--faint)' }}>
                    {s.nextRun}
                  </div>
                  <div style={{ fontSize: 10.5, color: 'var(--faint)', marginTop: 2 }}>
                    Format: {s.format}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="panel" style={{ padding: '8px 4px' }}>
            <div style={{ padding: '12px 18px 8px', fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--muted)' }}>
              Download history — {HISTORY.filter((h) => h.status === 'ready').length} reports ready
            </div>
            
            <div className="row-list" style={{ border: 'none' }}>
              {HISTORY.map((h) => (
                <div key={h.id} className="row" style={{ borderTop: '1px solid var(--border-subtle)', borderRadius: 0, padding: '12px 18px', alignItems: 'center' }}>
                  <span className="history-format-icon" style={{ marginRight: 12 }}>
                    {h.format === 'ZIP' ? (
                      <FileArchive size={15} strokeWidth={2} style={{ color: 'var(--warn)' }} />
                    ) : (
                      <FileText size={15} strokeWidth={2} style={{ color: 'var(--brand)' }} />
                    )}
                  </span>
                  
                  <div className="row-title" style={{ flex: 1 }}>
                    {h.name}
                    <div style={{ fontSize: 11.5, color: 'var(--faint)', marginTop: 1, fontWeight: 400 }}>
                      {h.when} · triggered by {h.by}
                    </div>
                  </div>
                  
                  <span className={`badge ${h.format === 'ZIP' ? 'sev-warning' : 'neutral'} mono`} style={{ fontSize: 10, marginRight: 12 }}>
                    {h.format}
                  </span>
                  
                  {h.status === 'ready' && (
                    <span className="mono" style={{ fontSize: 11.5, color: 'var(--faint)', marginRight: 12, minWidth: 44, textAlign: 'right' }}>
                      {h.sizeMb.toFixed(1)} MB
                    </span>
                  )}
                  
                  {h.status === 'generating' ? (
                    <span className="badge neutral" style={{ minWidth: 88, justifyContent: 'center' }}>
                      Generating…
                    </span>
                  ) : (
                    <button
                      className={`btn btn-secondary${downloading === h.id ? ' disabled' : ''}`}
                      style={{ minWidth: 100, gap: 6 }}
                      disabled={downloading === h.id}
                      onClick={() => handleDownload(h.id)}
                    >
                      <ArrowDownToLine size={13} strokeWidth={2.2} />
                      {downloading === h.id ? 'Downloading…' : 'Download'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="panel-foot-note">
            Reports are retained for 90 days. Audit packages (.zip) include raw data exports and are
            suitable for compliance handoff.
          </div>
        </div>
      )}
    </>
  )
}
