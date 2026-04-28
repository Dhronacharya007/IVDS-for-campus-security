import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { SERVER_URL } from '../config';

// `<input type="datetime-local">` produces values like "2026-04-28T14:30". This
// helper builds the same shape (local time, no seconds, no timezone) so
// defaults and quick-picks line up with whatever the user types in.
function toLocalIsoMinute(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

function parseLocalIso(value) {
  // datetime-local strings are local time; new Date(s) treats them as local
  // on every modern browser, but for safety we parse manually so we don't
  // depend on that quirk.
  if (!value) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value);
  if (!m) return null;
  return new Date(
    Number(m[1]),
    Number(m[2]) - 1,
    Number(m[3]),
    Number(m[4]),
    Number(m[5])
  );
}

function formatPretty(value) {
  const d = parseLocalIso(value);
  if (!d) return '—';
  return d.toLocaleString();
}

const QUICK_DURATIONS = [
  { label: '+30 min', minutes: 30 },
  { label: '+1 hr', minutes: 60 },
  { label: '+2 hr', minutes: 120 },
  { label: '+4 hr', minutes: 240 },
  { label: '+8 hr', minutes: 480 },
  { label: '+1 day', minutes: 60 * 24 },
];

export default function GeneratePassScreen() {
  const navigate = useNavigate();
  const [form, setForm] = useState(() => {
    const start = new Date();
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
    return {
      name: '',
      phone: '',
      in_time: toLocalIsoMinute(start),
      out_time: toLocalIsoMinute(end),
    };
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    setIsDemo(localStorage.getItem('demoMode') === 'true');
  }, []);

  const durationMinutes = useMemo(() => {
    const a = parseLocalIso(form.in_time);
    const b = parseLocalIso(form.out_time);
    if (!a || !b) return null;
    return Math.round((b.getTime() - a.getTime()) / 60_000);
  }, [form.in_time, form.out_time]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleQuickDuration = (minutes) => {
    const start = parseLocalIso(form.in_time) || new Date();
    const end = new Date(start.getTime() + minutes * 60_000);
    setForm((prev) => ({
      ...prev,
      in_time: toLocalIsoMinute(start),
      out_time: toLocalIsoMinute(end),
    }));
  };

  const handleStartNow = () => {
    const start = new Date();
    const minutes = durationMinutes && durationMinutes > 0 ? durationMinutes : 120;
    const end = new Date(start.getTime() + minutes * 60_000);
    setForm((prev) => ({
      ...prev,
      in_time: toLocalIsoMinute(start),
      out_time: toLocalIsoMinute(end),
    }));
  };

  const generatePass = async () => {
    setError(null);
    if (!form.name.trim() || !form.phone.trim() || !form.in_time || !form.out_time) {
      setError('Please fill in name, phone, start time and end time.');
      return;
    }
    const start = parseLocalIso(form.in_time);
    const end = parseLocalIso(form.out_time);
    if (!start || !end) {
      setError("Couldn't read those times. Use the date pickers.");
      return;
    }
    if (end.getTime() <= start.getTime()) {
      setError('End time must be after the start time.');
      return;
    }

    if (isDemo) {
      setResult({
        demo: true,
        visitor_id: 'demo-' + Date.now().toString(36),
        name: form.name,
        phone: form.phone,
        in_time: form.in_time,
        out_time: form.out_time,
      });
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${SERVER_URL}/generate-pass`, {
        name: form.name.trim(),
        phone: form.phone.trim(),
        in_time: form.in_time,
        out_time: form.out_time,
      });
      const data = res.data || {};
      setResult({
        ...data,
        name: form.name,
        phone: form.phone,
        in_time: form.in_time,
        out_time: form.out_time,
      });
    } catch (err) {
      console.error('generate-pass failed', err);
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        'Could not generate pass.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const issueAnother = () => {
    const start = new Date();
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
    setForm({
      name: '',
      phone: '',
      in_time: toLocalIsoMinute(start),
      out_time: toLocalIsoMinute(end),
    });
    setResult(null);
    setError(null);
  };

  if (result) {
    // Construct URLs from visitor_id as a fallback if the backend response
    // doesn't include qr_url / pdf_url (older backend, or partial response).
    // The backend always writes passes/<visitor_id>.png and .pdf, so this is
    // the canonical location regardless.
    const qrSrc =
      !result.demo && result.visitor_id
        ? result.qr_url
          ? `${SERVER_URL}${result.qr_url}`
          : `${SERVER_URL}/passes/${result.visitor_id}.png`
        : null;
    const pdfHref =
      !result.demo && result.visitor_id
        ? result.pdf_url
          ? `${SERVER_URL}${result.pdf_url}`
          : `${SERVER_URL}/passes/${result.visitor_id}.pdf`
        : null;

    return (
      <div className="app-page">
        <div className="bg-aurora" />
        <div style={styles.topBar}>
          <button style={styles.backBtn} onClick={() => navigate(-1)}>← Back</button>
        </div>

        <div style={styles.content}>
          <div style={styles.header}>
            <p style={styles.eyebrow}>Pass Issued</p>
            <h1 style={styles.title}>Visitor Pass Ready</h1>
            <p style={styles.subtitle}>
              {result.demo
                ? 'Demo mode — no QR was generated, but the flow is the same.'
                : 'Hand the QR over to the visitor — security can scan it on entry.'}
            </p>
          </div>

          <div style={styles.resultCard}>
            <div style={styles.resultGrid}>
              <div style={styles.qrPanel}>
                {qrSrc && !result.demo ? (
                  <img src={qrSrc} alt="Visitor pass QR" style={styles.qrImage} />
                ) : (
                  <div style={styles.qrPlaceholder}>QR Preview</div>
                )}
                <p style={styles.visitorIdMono}>ID: {result.visitor_id}</p>
              </div>

              <div style={styles.resultMeta}>
                <div>
                  <p style={styles.metaLabel}>VISITOR</p>
                  <p style={styles.metaValue}>{result.name}</p>
                </div>
                <div>
                  <p style={styles.metaLabel}>PHONE</p>
                  <p style={styles.metaValue}>{result.phone}</p>
                </div>
                <div>
                  <p style={styles.metaLabel}>VALID FROM</p>
                  <p style={styles.metaValue}>{formatPretty(result.in_time)}</p>
                </div>
                <div>
                  <p style={styles.metaLabel}>VALID UNTIL</p>
                  <p style={styles.metaValue}>{formatPretty(result.out_time)}</p>
                </div>
              </div>
            </div>

            {!result.demo && (qrSrc || pdfHref) && (
              <div style={styles.actionRow}>
                {qrSrc && (
                  <a
                    href={qrSrc}
                    download={`pass-${result.visitor_id}.png`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={styles.downloadBtn}
                  >
                    ⬇ Download QR (PNG)
                  </a>
                )}
                {pdfHref && (
                  <a
                    href={pdfHref}
                    download={`pass-${result.visitor_id}.pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={styles.downloadPrimary}
                  >
                    ⬇ Download Pass (PDF)
                  </a>
                )}
              </div>
            )}

            <button onClick={issueAnother} style={styles.secondaryBtn}>
              Issue another pass
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-page">
      <div className="bg-aurora" />
      <div style={styles.topBar}>
        <button style={styles.backBtn} onClick={() => navigate(-1)}>← Back</button>
      </div>

      <div style={styles.content}>
        <div style={styles.header}>
          <p style={styles.eyebrow}>Visitor Management</p>
          <h1 style={styles.title}>Generate Visitor Pass</h1>
          <p style={styles.subtitle}>
            Issue a digital pass with a custom validity window.
          </p>
        </div>

        <div style={styles.card}>
          <div style={styles.field}>
            <label style={styles.label}>Visitor name</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. John Smith"
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Phone number</label>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="e.g. 9876543210"
              style={styles.input}
              inputMode="tel"
            />
          </div>

          <div style={styles.row}>
            <div style={styles.field}>
              <div style={styles.labelRow}>
                <label style={styles.label}>Valid from</label>
                <button
                  type="button"
                  style={styles.miniLink}
                  onClick={handleStartNow}
                >
                  Use now
                </button>
              </div>
              <input
                type="datetime-local"
                name="in_time"
                value={form.in_time}
                onChange={handleChange}
                style={styles.input}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Valid until</label>
              <input
                type="datetime-local"
                name="out_time"
                value={form.out_time}
                onChange={handleChange}
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Quick duration</label>
            <div style={styles.chipRow}>
              {QUICK_DURATIONS.map((q) => {
                const active = durationMinutes === q.minutes;
                return (
                  <button
                    type="button"
                    key={q.minutes}
                    onClick={() => handleQuickDuration(q.minutes)}
                    style={{
                      ...styles.chip,
                      ...(active ? styles.chipActive : null),
                    }}
                  >
                    {q.label}
                  </button>
                );
              })}
            </div>
            <p style={styles.hint}>
              Sets the end time relative to the start time you picked.
            </p>
          </div>

          {durationMinutes !== null && (
            <div style={styles.previewBox}>
              <span style={styles.previewLabel}>Pass valid for</span>
              <span style={styles.previewValue}>
                {durationMinutes <= 0
                  ? '— end time is before start time —'
                  : durationMinutes < 60
                  ? `${durationMinutes} min`
                  : durationMinutes < 60 * 24
                  ? `${(durationMinutes / 60).toFixed(durationMinutes % 60 === 0 ? 0 : 1)} hr`
                  : `${(durationMinutes / (60 * 24)).toFixed(1)} day(s)`}
              </span>
            </div>
          )}

          {error && <div style={styles.errorBanner}>{error}</div>}

          <button
            onClick={generatePass}
            style={{ ...styles.button, opacity: loading ? 0.7 : 1 }}
            disabled={loading}
          >
            {loading ? 'Generating...' : 'Generate Pass'}
            {!loading && <span>→</span>}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  topBar: {
    width: '100%',
    maxWidth: 720,
    marginBottom: '2rem',
  },
  backBtn: {
    padding: '0.5rem 1rem',
    borderRadius: 10,
    border: '1px solid rgba(255, 255, 255, 0.08)',
    background: 'rgba(255, 255, 255, 0.04)',
    color: '#f5f7fb',
    fontSize: '0.85rem',
    fontWeight: 500,
  },
  content: {
    width: '100%',
    maxWidth: 720,
    display: 'flex',
    flexDirection: 'column',
    gap: '1.75rem',
  },
  header: {
    textAlign: 'left',
  },
  eyebrow: {
    fontSize: '0.85rem',
    color: '#7c5cff',
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    marginBottom: '0.4rem',
  },
  title: {
    fontSize: '2.2rem',
    fontWeight: 700,
    color: '#f5f7fb',
    marginBottom: '0.4rem',
    background: 'linear-gradient(135deg, #f5f7fb 0%, #a8b3cf 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  subtitle: {
    color: '#a8b3cf',
    fontSize: '0.95rem',
  },
  card: {
    padding: '2rem',
    borderRadius: 20,
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.1rem',
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  labelRow: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: '0.5rem',
  },
  label: {
    fontSize: '0.8rem',
    fontWeight: 500,
    color: '#a8b3cf',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  miniLink: {
    background: 'transparent',
    border: 'none',
    color: '#00d4ff',
    fontSize: '0.75rem',
    fontWeight: 600,
    cursor: 'pointer',
    padding: 0,
  },
  input: {
    width: '100%',
    padding: '0.9rem 1rem',
    borderRadius: 12,
    border: '1px solid rgba(255, 255, 255, 0.1)',
    background: 'rgba(255, 255, 255, 0.04)',
    color: '#f5f7fb',
    fontSize: '0.95rem',
    fontFamily: 'inherit',
    colorScheme: 'dark',
  },
  chipRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  chip: {
    padding: '0.5rem 0.95rem',
    borderRadius: 999,
    border: '1px solid rgba(255, 255, 255, 0.12)',
    background: 'rgba(255, 255, 255, 0.04)',
    color: '#f5f7fb',
    fontSize: '0.85rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  chipActive: {
    background: 'linear-gradient(135deg, rgba(124, 92, 255, 0.18), rgba(0, 212, 255, 0.18))',
    borderColor: 'rgba(124, 92, 255, 0.5)',
    color: '#a78bfa',
  },
  hint: {
    color: '#6b7691',
    fontSize: '0.78rem',
    margin: 0,
  },
  previewBox: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.75rem 1rem',
    borderRadius: 12,
    background: 'rgba(124, 92, 255, 0.08)',
    border: '1px solid rgba(124, 92, 255, 0.2)',
  },
  previewLabel: {
    fontSize: '0.78rem',
    color: '#a8b3cf',
    fontWeight: 600,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  },
  previewValue: {
    fontSize: '0.95rem',
    color: '#a78bfa',
    fontWeight: 700,
    fontFamily: "'Space Grotesk', monospace",
  },
  errorBanner: {
    padding: '0.75rem 1rem',
    borderRadius: 10,
    background: 'rgba(255, 77, 109, 0.12)',
    border: '1px solid rgba(255, 77, 109, 0.3)',
    color: '#ff8fa3',
    fontSize: '0.85rem',
  },
  button: {
    marginTop: '0.5rem',
    padding: '0.95rem 1.25rem',
    borderRadius: 12,
    border: 'none',
    background: 'linear-gradient(135deg, #7c5cff 0%, #00d4ff 100%)',
    color: '#fff',
    fontSize: '0.95rem',
    fontWeight: 600,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    boxShadow: '0 8px 24px rgba(124, 92, 255, 0.4)',
    cursor: 'pointer',
  },

  // Result card
  resultCard: {
    padding: '2rem',
    borderRadius: 20,
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  resultGrid: {
    display: 'grid',
    gridTemplateColumns: '220px 1fr',
    gap: '1.5rem',
    alignItems: 'center',
  },
  qrPanel: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '1rem',
    borderRadius: 16,
    background: '#fff',
    boxShadow: '0 12px 40px rgba(124, 92, 255, 0.25)',
  },
  qrImage: {
    width: 180,
    height: 180,
    imageRendering: 'pixelated',
  },
  qrPlaceholder: {
    width: 180,
    height: 180,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#6b7691',
    fontSize: '0.85rem',
    background:
      'repeating-linear-gradient(45deg, #f5f7fb, #f5f7fb 8px, #e5e7ef 8px, #e5e7ef 16px)',
    borderRadius: 8,
  },
  visitorIdMono: {
    fontFamily: "'Space Grotesk', monospace",
    fontSize: '0.7rem',
    color: '#0a0e1a',
    margin: 0,
  },
  resultMeta: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem 1.25rem',
  },
  metaLabel: {
    fontSize: '0.7rem',
    color: '#6b7691',
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    margin: '0 0 0.25rem',
  },
  metaValue: {
    fontSize: '0.95rem',
    color: '#f5f7fb',
    fontWeight: 600,
    margin: 0,
  },
  actionRow: {
    display: 'flex',
    gap: '0.75rem',
    flexWrap: 'wrap',
  },
  downloadBtn: {
    padding: '0.75rem 1.25rem',
    borderRadius: 10,
    border: '1px solid rgba(255, 255, 255, 0.15)',
    background: 'rgba(255, 255, 255, 0.04)',
    color: '#f5f7fb',
    fontSize: '0.9rem',
    fontWeight: 600,
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.4rem',
  },
  downloadPrimary: {
    padding: '0.75rem 1.25rem',
    borderRadius: 10,
    border: 'none',
    background: 'linear-gradient(135deg, #7c5cff 0%, #00d4ff 100%)',
    color: '#fff',
    fontSize: '0.9rem',
    fontWeight: 700,
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.4rem',
    boxShadow: '0 8px 24px rgba(124, 92, 255, 0.35)',
  },
  secondaryBtn: {
    padding: '0.7rem 1.25rem',
    borderRadius: 10,
    border: '1px solid rgba(255, 255, 255, 0.1)',
    background: 'rgba(255, 255, 255, 0.04)',
    color: '#a8b3cf',
    fontSize: '0.9rem',
    fontWeight: 600,
    cursor: 'pointer',
    alignSelf: 'flex-start',
  },
};
