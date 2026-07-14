import { useState } from 'react'
import { MessageSquare, MonitorSmartphone, ShieldCheck, Star } from 'lucide-react'
import { minutesAgo } from '../../lib/time'
import { TimeAgo } from '../../components/TimeAgo'

const NOTIFY_PREFS = [
  { key: 'slack-dm', label: 'Slack DMs for assigned alerts', hint: 'recommended for real-time response', on: true },
  { key: 'email-digest', label: 'Daily email digest', hint: '08:00 local — yesterday’s incidents + contribution', on: true },
  { key: 'pager', label: 'PagerDuty escalations', hint: 'sev-critical only, follows on-call schedule', on: true },
  { key: 'mentions', label: 'Email on @mentions', hint: 'comments on cases and incidents', on: false },
]

const SESSIONS = [
  { device: 'MacBook Pro · Chrome', location: 'Bengaluru, IN', current: true, lastActive: minutesAgo(0) },
  { device: 'iPhone 15 · Rtifact app', location: 'Bengaluru, IN', current: false, lastActive: minutesAgo(180) },
  { device: 'Workstation · Firefox', location: 'Office VPN', current: false, lastActive: minutesAgo(4300) },
]

/* Screen 65 — Personal Profile: notification prefs, 2FA, sessions, Slack. */
export function ProfilePage() {
  const [prefs, setPrefs] = useState(NOTIFY_PREFS)
  const [sessions, setSessions] = useState(SESSIONS)

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">Settings · Personal</div>
          <h1 className="page-title">Profile</h1>
          <p className="page-sub">Priya Sharma · priya@acme.com · SRE Lead</p>
        </div>
      </div>

      <div className="detail-grid">
        <div className="detail-main">
          <section className="panel">
            <div className="panel-title">Notification preferences</div>
            {prefs.map((p) => (
              <div key={p.key} className="row" style={{ borderRadius: 8, paddingLeft: 4, paddingRight: 4 }}>
                <span className="row-title">
                  {p.label}
                  <span style={{ display: 'block', fontSize: 11, color: 'var(--muted)', fontWeight: 400 }}>
                    {p.hint}
                  </span>
                </span>
                <button
                  role="switch"
                  aria-checked={p.on}
                  aria-label={p.label}
                  className={`switch${p.on ? ' on' : ''}`}
                  onClick={() =>
                    setPrefs((prev) => prev.map((x) => (x.key === p.key ? { ...x, on: !x.on } : x)))
                  }
                >
                  <span className="switch-knob" />
                </button>
              </div>
            ))}
          </section>

          <section className="panel">
            <div className="panel-title">Active sessions</div>
            {sessions.map((s) => (
              <div key={s.device} className="row" style={{ borderRadius: 8, paddingLeft: 4, paddingRight: 4 }}>
                <MonitorSmartphone size={15} strokeWidth={2} className="nav-icon" />
                <span className="row-title">
                  {s.device}
                  {s.current && (
                    <span className="badge sev-healthy" style={{ marginLeft: 8 }}>
                      this device
                    </span>
                  )}
                  <span style={{ display: 'block', fontSize: 11, color: 'var(--muted)', fontWeight: 400 }}>
                    {s.location}
                  </span>
                </span>
                <TimeAgo timestamp={s.lastActive} />
                {!s.current && (
                  <button
                    className="btn btn-secondary"
                    style={{ height: 26 }}
                    onClick={() => setSessions((prev) => prev.filter((x) => x.device !== s.device))}
                  >
                    Revoke
                  </button>
                )}
              </div>
            ))}
          </section>
        </div>

        <div className="detail-side">
          <section className="panel">
            <div className="panel-title">Two-factor authentication</div>
            <div className="kv-row">
              <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5 }}>
                <ShieldCheck size={14} strokeWidth={2} style={{ color: 'var(--success)' }} />
                Authenticator app
              </span>
              <span className="badge sev-healthy">enabled</span>
            </div>
            <button className="btn btn-secondary" style={{ marginTop: 10, width: '100%', justifyContent: 'center' }}>
              Manage 2FA
            </button>
          </section>

          <section className="panel">
            <div className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              Slack connection
              <span className="badge sev-healthy" style={{ gap: 4 }}>
                <Star size={10} strokeWidth={2.4} />
                recommended
              </span>
            </div>
            <div className="kv-row">
              <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5 }}>
                <MessageSquare size={14} strokeWidth={2} />
                @priya · acme.slack.com
              </span>
              <span className="badge sev-healthy">connected</span>
            </div>
            <div className="panel-foot-note">
              Slack deeplinks drop you straight into an alert’s current DAAV state — the fastest
              path from page to fix.
            </div>
          </section>
        </div>
      </div>
    </>
  )
}
