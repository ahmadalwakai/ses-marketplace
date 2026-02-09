'use client';

import { useState, useEffect, useCallback } from 'react';

const COOKIE_KEY = 'ses-cookie-consent';

type ConsentState = {
  analytics: boolean;
  marketing: boolean;
  decided: boolean;
};

function getStoredConsent(): ConsentState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(COOKIE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function persistConsent(consent: ConsentState) {
  localStorage.setItem(COOKIE_KEY, JSON.stringify(consent));
  // also set a lightweight cookie so server can read it
  document.cookie = `ses-consent=${consent.analytics ? '1' : '0'}${consent.marketing ? '1' : '0'};path=/;max-age=31536000;SameSite=Lax`;
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [showCustomise, setShowCustomise] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    const stored = getStoredConsent();
    if (!stored || !stored.decided) {
      setVisible(true);
    }
  }, []);

  const accept = useCallback(() => {
    const consent: ConsentState = { analytics: true, marketing: true, decided: true };
    persistConsent(consent);
    setVisible(false);
  }, []);

  const decline = useCallback(() => {
    const consent: ConsentState = { analytics: false, marketing: false, decided: true };
    persistConsent(consent);
    setVisible(false);
  }, []);

  const saveCustom = useCallback(() => {
    const consent: ConsentState = { analytics, marketing, decided: true };
    persistConsent(consent);
    setShowCustomise(false);
    setVisible(false);
  }, [analytics, marketing]);

  if (!visible) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.banner}>
        {/* Customise modal */}
        {showCustomise && (
          <div style={styles.customisePanel}>
            <p style={styles.customiseTitle}>تخصيص ملفات تعريف الارتباط</p>

            <label style={styles.toggleRow}>
              <span>التحليلات</span>
              <input
                type="checkbox"
                checked={analytics}
                onChange={(e) => setAnalytics(e.target.checked)}
              />
            </label>

            <label style={styles.toggleRow}>
              <span>التسويق</span>
              <input
                type="checkbox"
                checked={marketing}
                onChange={(e) => setMarketing(e.target.checked)}
              />
            </label>

            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button style={styles.btnSave} onClick={saveCustom}>
                حفظ
              </button>
              <button
                style={styles.btnCancel}
                onClick={() => setShowCustomise(false)}
              >
                إلغاء
              </button>
            </div>
          </div>
        )}

        {/* Main banner */}
        {!showCustomise && (
          <>
            <p style={styles.text}>
              نستخدم ملفات تعريف الارتباط لتحسين تجربتك. يمكنك اختيار تفضيلاتك أدناه.
            </p>
            <div style={styles.btnRow}>
              <button style={styles.btnAccept} onClick={accept}>
                قبول الكل
              </button>
              <button style={styles.btnDecline} onClick={decline}>
                رفض الكل
              </button>
              <button
                style={styles.btnCustomise}
                onClick={() => setShowCustomise(true)}
              >
                تخصيص الخيارات
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ---------- inline styles ---------- */
const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    display: 'flex',
    justifyContent: 'center',
    padding: 16,
    pointerEvents: 'none',
  },
  banner: {
    pointerEvents: 'auto',
    background: '#0b0b0b',
    color: '#fff',
    borderRadius: 14,
    padding: '20px 24px',
    maxWidth: 520,
    width: '100%',
    boxShadow: '0 -4px 24px rgba(0,0,0,.25)',
    fontFamily: 'inherit',
    direction: 'rtl',
  },
  text: {
    fontSize: 14,
    lineHeight: '1.6',
    marginBottom: 14,
  },
  btnRow: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 8,
  },
  btnAccept: {
    flex: 1,
    minWidth: 120,
    padding: '10px 0',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 14,
    background: '#00f5d4',
    color: '#0b0b0b',
  },
  btnDecline: {
    flex: 1,
    minWidth: 120,
    padding: '10px 0',
    border: '1px solid #555',
    borderRadius: 8,
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 14,
    background: 'transparent',
    color: '#fff',
  },
  btnCustomise: {
    flex: 1,
    minWidth: 120,
    padding: '10px 0',
    border: '1px solid #00f5d4',
    borderRadius: 8,
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 14,
    background: 'transparent',
    color: '#00f5d4',
  },
  customisePanel: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 10,
  },
  customiseTitle: {
    fontWeight: 700,
    fontSize: 15,
    marginBottom: 4,
  },
  toggleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 0',
    borderBottom: '1px solid #333',
    cursor: 'pointer',
  },
  btnSave: {
    flex: 1,
    padding: '10px 0',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 14,
    background: '#00f5d4',
    color: '#0b0b0b',
  },
  btnCancel: {
    flex: 1,
    padding: '10px 0',
    border: '1px solid #555',
    borderRadius: 8,
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 14,
    background: 'transparent',
    color: '#fff',
  },
};
