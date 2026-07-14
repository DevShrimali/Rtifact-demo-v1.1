import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { CheckCircle2, CircleDot, Megaphone, MessageSquare, Lock, Send, User } from 'lucide-react'
import { cases } from '../../mock/support'
import { SeverityBadge } from '../../components/SeverityBadge'
import { TimeAgo } from '../../components/TimeAgo'

/* Screen 33 — case detail: context, timeline, resolution actions, chat and status changing. */
export function CaseDetailPage() {
  const { caseId } = useParams()
  const c = cases.find((x) => x.id === caseId)

  if (!c) {
    return (
      <div className="error-panel" role="alert">
        <div className="error-title">Case {caseId} not found</div>
      </div>
    )
  }

  const [resolved, setResolved] = useState(c.status === 'Resolved')
  const [escalated, setEscalated] = useState(false)
  const [status, setStatus] = useState<string>(c.status)
  
  // Custom timeline state to allow posting new chat messages dynamically
  const [timelineItems, setTimelineItems] = useState<any[]>(
    c.timeline.map(t => ({ ...t, isComment: false }))
  )
  const [activeTab, setActiveTab] = useState<'public' | 'internal'>('public')
  const [message, setMessage] = useState('')

  const handlePostMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return

    const newItem = {
      label: message.trim(),
      at: Date.now(),
      actor: 'A. Rivera',
      isComment: true,
      isInternal: activeTab === 'internal',
    }

    setTimelineItems((prev) => [...prev, newItem])
    setMessage('')
  }

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus)
    if (newStatus === 'Resolved') {
      setResolved(true)
    } else {
      setResolved(false)
    }
  }

  const handleResolveClick = () => {
    if (resolved) {
      handleStatusChange('Investigating')
    } else {
      handleStatusChange('Resolved')
    }
  }

  return (
    <>
      <div className={`sev-banner sev-${c.severity}${resolved ? ' resolved' : ''}`}>
        <SeverityBadge severity={c.severity} />
        <span className="row-id">{c.id}</span>
        <span className="sev-banner-title">{c.title}</span>
        <span className="badge neutral">{resolved ? 'Resolved' : status}</span>
        <TimeAgo timestamp={c.openedAt} />
      </div>

      <div className="incident-actions" style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
        <button className={`btn ${resolved ? 'btn-secondary' : 'btn-primary'}`} onClick={handleResolveClick}>
          <CheckCircle2 size={14} strokeWidth={2.2} />
          {resolved ? 'Reopen case' : 'Resolve case'}
        </button>
        <button className="btn btn-secondary" disabled={escalated || resolved} onClick={() => setEscalated(true)}>
          <Megaphone size={14} strokeWidth={2.2} />
          {escalated ? 'Escalated to engineering' : 'Escalate to engineering'}
        </button>
        
        {/* Status Dropdown selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 8 }}>
          <span className="kv-label" style={{ fontSize: 12, color: 'var(--muted)' }}>Status:</span>
          <select
            className="text-input select"
            style={{ fontSize: 12, padding: '4px 28px 4px 10px', height: 28, minWidth: 130 }}
            value={status}
            onChange={(e) => handleStatusChange(e.target.value)}
          >
            <option value="Triage">Triage</option>
            <option value="Investigating">Investigating</option>
            <option value="Fixing">Fixing</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>

        <span className="incident-owner" style={{ marginLeft: 'auto' }}>
          Assignee: <span className="mono">{c.assignee}</span>
        </span>
      </div>

      <div className="detail-grid">
        <div className="detail-main" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Chat & Post Customer Update panel */}
          <section className="panel" style={{ padding: 18 }}>
            <div className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <MessageSquare size={16} strokeWidth={2.2} />
              <span>Communication Hub</span>
            </div>

            <div className="pipeline-tabs" style={{ marginBottom: 12, borderBottom: '1px solid var(--border-default)' }}>
              <button
                className={`pipeline-tab${activeTab === 'public' ? ' active' : ''}`}
                onClick={() => setActiveTab('public')}
                style={{ padding: '6px 12px', fontSize: 12.5 }}
              >
                Customer Update (Public)
              </button>
              <button
                className={`pipeline-tab${activeTab === 'internal' ? ' active' : ''}`}
                onClick={() => setActiveTab('internal')}
                style={{ padding: '6px 12px', fontSize: 12.5 }}
              >
                Internal Note
              </button>
            </div>

            <form onSubmit={handlePostMessage} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <textarea
                className="text-input"
                style={{
                  width: '100%',
                  minHeight: 80,
                  fontSize: 13,
                  lineHeight: 1.5,
                  padding: 10,
                  background: activeTab === 'internal' ? 'rgba(234, 179, 8, 0.03)' : 'transparent',
                  borderColor: activeTab === 'internal' ? 'var(--warn-text)' : 'var(--border-default)',
                }}
                placeholder={
                  activeTab === 'public'
                    ? 'Type a message to send directly to the customer...'
                    : 'Type a private team note (will not be seen by the customer)...'
                }
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8 }}>
                {activeTab === 'internal' && (
                  <span style={{ fontSize: 11, color: 'var(--warn-text)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Lock size={12} /> Internal team members only
                  </span>
                )}
                <button type="submit" className="btn btn-primary" style={{ padding: '6px 14px', height: 32 }}>
                  <Send size={12} />
                  Post Update
                </button>
              </div>
            </form>
          </section>

          {/* Timeline & Chat History */}
          <section className="panel" style={{ padding: 18 }}>
            <div className="panel-title" style={{ marginBottom: 16 }}>Timeline & Activity</div>
            <ul className="pipeline" style={{ margin: 0, padding: 0 }}>
              {timelineItems.map((t, idx) => {
                if (t.isComment) {
                  return (
                    <li
                      key={idx}
                      className="pipe-step"
                      style={{
                        padding: '12px 14px',
                        background: t.isInternal ? 'rgba(234, 179, 8, 0.03)' : 'rgba(59, 130, 246, 0.03)',
                        border: `1px solid ${t.isInternal ? 'rgba(234, 179, 8, 0.15)' : 'rgba(59, 130, 246, 0.15)'}`,
                        borderRadius: 8,
                        marginBottom: 10,
                        alignItems: 'flex-start',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, width: '100%' }}>
                        {t.isInternal ? (
                          <Lock size={13} style={{ color: 'var(--warn-text)' }} />
                        ) : (
                          <User size={13} style={{ color: 'var(--info)' }} />
                        )}
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                          {t.actor}
                        </span>
                        <span className="badge neutral mono" style={{ fontSize: 9, padding: '1px 5px' }}>
                          {t.isInternal ? 'Internal Note' : 'Customer Update'}
                        </span>
                        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--faint)' }}>
                          <TimeAgo timestamp={t.at} />
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: 'var(--text-secondary)' }}>
                        {t.label}
                      </p>
                    </li>
                  )
                }

                return (
                  <li key={idx} className="pipe-step" style={{ marginBottom: 10 }}>
                    <CircleDot size={14} strokeWidth={2} className="pipe-icon pending" />
                    <span style={{ fontSize: 13 }}>
                      {t.label}
                      <span style={{ color: 'var(--faint)' }}> — {t.actor}</span>
                    </span>
                    <span style={{ marginLeft: 'auto' }}>
                      <TimeAgo timestamp={t.at} />
                    </span>
                  </li>
                )
              })}
              {resolved && (
                <li className="pipe-step" style={{ marginBottom: 10 }}>
                  <CheckCircle2 size={14} strokeWidth={2} className="pipe-icon done" />
                  <span style={{ fontSize: 13, fontWeight: 500 }}>Case resolved</span>
                  <span style={{ marginLeft: 'auto' }} className="time-ref">
                    just now
                  </span>
                </li>
              )}
            </ul>
          </section>
        </div>

        <div className="detail-side">
          <section className="panel">
            <div className="panel-title">Context</div>
            {c.context.map((kv) => (
              <div key={kv.label} className="kv-row">
                <span className="kv-label">{kv.label}</span>
                <span className="kv-value" style={{ fontSize: 11.5 }}>
                  {kv.value}
                </span>
              </div>
            ))}
          </section>
        </div>
      </div>
    </>
  )
}
