import { useCommandCenterStore } from '../store/useCommandCenterStore';
import { Terminal, Plus, RefreshCw } from 'lucide-react';
import type { OpenClawClient } from '../types/openclaw';

function statusColor(status: OpenClawClient['status']) {
  switch (status) {
    case 'online': return 'var(--success)';
    case 'degraded': return 'var(--warning)';
    default: return 'var(--error)';
  }
}

export default function Sidebar({ onAddClient }: { onAddClient: () => void }) {
  const { clients, selectedClientId, selectClient, alerts, refreshAll, loading } =
    useCommandCenterStore();

  const unresolvedAlerts = alerts.filter((a) => !a.resolved).length;

  return (
    <aside style={styles.sidebar}>
      <div style={styles.logo}>
        <Terminal size={22} color="var(--primary)" />
        <span style={styles.logoText}>OpenClaw</span>
        <span style={styles.logoSub}>Command Center</span>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <span style={styles.sectionTitle}>CLIENTS</span>
          <button style={styles.iconBtn} onClick={onAddClient} title="Add Client">
            <Plus size={16} />
          </button>
        </div>

        {clients.map((client) => {
          const clientAlerts = alerts.filter(
            (a) => a.clientId === client.id && !a.resolved
          ).length;

          return (
            <button
              key={client.id}
              style={{
                ...styles.clientBtn,
                ...(selectedClientId === client.id ? styles.clientBtnActive : {}),
              }}
              onClick={() => selectClient(client.id)}
            >
              <div style={{ ...styles.dot, backgroundColor: statusColor(client.status) }} />
              <div style={styles.clientInfo}>
                <div style={styles.clientName}>{client.name}</div>
                <div style={styles.clientBot}>{client.botName} — {client.host}</div>
              </div>
              {clientAlerts > 0 && (
                <span style={styles.badge}>{clientAlerts}</span>
              )}
            </button>
          );
        })}

        {clients.length === 0 && (
          <div style={styles.empty}>No clients configured</div>
        )}
      </div>

      <div style={styles.bottom}>
        <div style={styles.summaryRow}>
          <div style={styles.summaryItem}>
            <span style={{ color: 'var(--success)', fontWeight: 700, fontSize: 18 }}>
              {clients.filter((c) => c.status === 'online').length}
            </span>
            <span style={styles.summaryLabel}>Online</span>
          </div>
          <div style={styles.summaryItem}>
            <span style={{ color: 'var(--warning)', fontWeight: 700, fontSize: 18 }}>
              {unresolvedAlerts}
            </span>
            <span style={styles.summaryLabel}>Alerts</span>
          </div>
        </div>
        <button style={styles.refreshBtn} onClick={refreshAll} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
          {loading ? 'Refreshing...' : 'Refresh All'}
        </button>
      </div>
    </aside>
  );
}

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    width: 280,
    minWidth: 280,
    height: '100vh',
    background: 'var(--surface)',
    borderRight: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  logo: {
    padding: '20px 16px',
    borderBottom: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  logoText: {
    fontWeight: 800,
    fontSize: 18,
    color: 'var(--text)',
  },
  logoSub: {
    fontSize: 10,
    color: 'var(--text-muted)',
    fontWeight: 600,
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
    width: '100%',
    marginLeft: 32,
    marginTop: -4,
  },
  section: {
    flex: 1,
    overflow: 'auto',
    padding: '16px 12px',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 1.5,
    color: 'var(--text-muted)',
  },
  iconBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--primary)',
    cursor: 'pointer',
    padding: 4,
    borderRadius: 6,
    display: 'flex',
    alignItems: 'center',
  },
  clientBtn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 12px',
    borderRadius: 10,
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    marginBottom: 4,
    textAlign: 'left' as const,
    transition: 'background 0.15s',
  },
  clientBtnActive: {
    background: 'var(--bg)',
    border: '1px solid var(--border)',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  clientInfo: {
    flex: 1,
    minWidth: 0,
  },
  clientName: {
    color: 'var(--text)',
    fontSize: 14,
    fontWeight: 600,
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  clientBot: {
    color: 'var(--text-muted)',
    fontSize: 11,
    marginTop: 2,
  },
  badge: {
    background: 'var(--warning)',
    color: 'var(--bg)',
    fontSize: 10,
    fontWeight: 700,
    borderRadius: 8,
    padding: '1px 6px',
    minWidth: 18,
    textAlign: 'center' as const,
  },
  empty: {
    color: 'var(--text-muted)',
    fontSize: 13,
    textAlign: 'center' as const,
    padding: '24px 0',
  },
  bottom: {
    borderTop: '1px solid var(--border)',
    padding: 16,
  },
  summaryRow: {
    display: 'flex',
    gap: 16,
    marginBottom: 12,
  },
  summaryItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    flex: 1,
  },
  summaryLabel: {
    fontSize: 10,
    color: 'var(--text-muted)',
    fontWeight: 600,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  refreshBtn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '10px 0',
    borderRadius: 8,
    border: '1px solid var(--border)',
    background: 'transparent',
    color: 'var(--text-muted)',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
};
