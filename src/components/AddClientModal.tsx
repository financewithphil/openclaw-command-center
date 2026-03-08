import { useState } from 'react';
import { useCommandCenterStore } from '../store/useCommandCenterStore';
import { X, Wifi, Plus } from 'lucide-react';

export default function AddClientModal({ onClose }: { onClose: () => void }) {
  const addClient = useCommandCenterStore((s) => s.addClient);

  const [name, setName] = useState('');
  const [botName, setBotName] = useState('');
  const [host, setHost] = useState('');
  const [port, setPort] = useState('3200');
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'failed' | null>(null);

  const canSubmit = name && botName && host && ownerName;

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch(`http://${host}:${port}/api/info`, {
        signal: AbortSignal.timeout(5000),
      });
      const json = await res.json();
      setTestResult(json.success ? 'success' : 'failed');
    } catch {
      setTestResult('failed');
    } finally {
      setTesting(false);
    }
  };

  const handleSubmit = () => {
    addClient({
      name,
      botName,
      host,
      port: parseInt(port, 10) || 3200,
      ownerName,
      ownerPhone,
    });
    onClose();
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h3 style={styles.modalTitle}>Add Client</h3>
          <button style={styles.closeBtn} onClick={onClose}><X size={18} /></button>
        </div>

        <div style={styles.body}>
          <label style={styles.label}>Display Name</label>
          <input style={styles.input} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Jacob's Assistant" />

          <label style={styles.label}>Bot Name</label>
          <input style={styles.input} value={botName} onChange={(e) => setBotName(e.target.value)} placeholder="e.g. Andrew" />

          <label style={styles.label}>Owner Name</label>
          <input style={styles.input} value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="e.g. Jacob" />

          <label style={styles.label}>Owner Phone</label>
          <input style={styles.input} value={ownerPhone} onChange={(e) => setOwnerPhone(e.target.value)} placeholder="+14045551234" />

          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 2 }}>
              <label style={styles.label}>Mac Mini IP</label>
              <input style={styles.input} value={host} onChange={(e) => setHost(e.target.value)} placeholder="10.0.0.XXX" />
            </div>
            <div style={{ flex: 1 }}>
              <label style={styles.label}>Port</label>
              <input style={styles.input} value={port} onChange={(e) => setPort(e.target.value)} placeholder="3200" />
            </div>
          </div>

          <button style={styles.testBtn} onClick={testConnection} disabled={!host || testing}>
            <Wifi size={14} />
            {testing ? 'Testing...' : 'Test Connection'}
          </button>

          {testResult === 'success' && (
            <div style={{ ...styles.testResult, borderColor: 'var(--success)', color: 'var(--success)' }}>
              Connected to Bridge API
            </div>
          )}
          {testResult === 'failed' && (
            <div style={{ ...styles.testResult, borderColor: 'var(--error)', color: 'var(--error)' }}>
              Connection failed — ensure Bridge API is running on {host}:{port}
            </div>
          )}

          <button
            style={{ ...styles.submitBtn, opacity: canSubmit ? 1 : 0.4 }}
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            <Plus size={16} />
            Add Client
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  modal: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 16,
    width: 440,
    maxHeight: '85vh',
    overflow: 'auto',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid var(--border)',
  },
  modalTitle: {
    margin: 0,
    fontSize: 18,
    fontWeight: 700,
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    padding: 4,
  },
  body: {
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  label: {
    color: 'var(--text-muted)',
    fontSize: 12,
    fontWeight: 600,
    marginTop: 8,
  },
  input: {
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    padding: '10px 14px',
    color: 'var(--text)',
    fontSize: 14,
    outline: 'none',
    width: '100%',
  },
  testBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '10px 0',
    borderRadius: 8,
    border: '1px solid var(--primary)',
    background: 'transparent',
    color: 'var(--primary)',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: 12,
  },
  testResult: {
    border: '1px solid',
    borderRadius: 8,
    padding: '10px 14px',
    fontSize: 13,
    background: 'var(--bg)',
    marginTop: 4,
  },
  submitBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '12px 0',
    borderRadius: 10,
    border: 'none',
    background: 'var(--primary)',
    color: 'var(--bg)',
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    marginTop: 16,
  },
};
