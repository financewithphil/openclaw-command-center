import { useState } from 'react';
import { useCommandCenterStore } from '../store/useCommandCenterStore';
import {
  Activity,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Send,
  MessageSquare,
  Mail,
  Zap,
  Server,
  RefreshCw,
  XCircle,
  Heart,
  Shield,
  Calendar,
  Code,
  AlertCircle,
  Info,
  FileText,
  BookOpen,
  Bell,
  Key,
  ChevronDown,
  ChevronUp,
  Cpu,
  Package,
  Lock,
  Globe,
  Users,
  GitBranch,
  ArrowRight,
} from 'lucide-react';
import type { AgentActivity, CronJob, Alert as AlertType, TaskRecord, SkillInfo, ModelInfo, AgentNode } from '../types/openclaw';

type TabKey = 'activity' | 'cron' | 'alerts' | 'tasks' | 'skills' | 'models' | 'agents';

function formatTimeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function ClientDetail() {
  const {
    clients, selectedClientId, clientStatuses,
    activities, cronJobs, alerts, tasks, skills, models, agents, resolveAlert,
  } = useCommandCenterStore();

  const [activeTab, setActiveTab] = useState<TabKey>('activity');
  const client = clients.find((c) => c.id === selectedClientId);
  const status = selectedClientId ? clientStatuses[selectedClientId] : undefined;

  if (!client) {
    return (
      <div style={styles.empty}>
        <Server size={48} color="var(--border)" />
        <p style={{ color: 'var(--text-muted)', marginTop: 16, fontSize: 16 }}>
          Select a client to view details
        </p>
      </div>
    );
  }

  const clientActivities = activities
    .filter((a) => a.clientId === client.id)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const clientCrons = cronJobs.filter((c) => c.clientId === client.id);
  const clientAlerts = alerts
    .filter((a) => a.clientId === client.id)
    .sort((a, b) => {
      if (a.resolved !== b.resolved) return a.resolved ? 1 : -1;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  const clientTasks = tasks
    .filter((t) => t.clientId === client.id)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const clientSkills = skills.filter((s) => s.clientId === client.id);
  const clientModels = models.filter((m) => m.clientId === client.id);
  const clientAgents = agents.filter((a) => a.clientId === client.id);

  const unresolvedAlerts = clientAlerts.filter((a) => !a.resolved).length;
  const readySkills = clientSkills.filter((s) => s.status === 'ready').length;

  const tabs: { key: TabKey; label: string; icon: React.ReactNode; badge?: number }[] = [
    { key: 'activity', label: 'Activity', icon: <Activity size={14} /> },
    { key: 'cron', label: 'Cron Jobs', icon: <Clock size={14} /> },
    { key: 'alerts', label: 'Alerts', icon: <AlertTriangle size={14} />, badge: unresolvedAlerts },
    { key: 'tasks', label: 'Tasks', icon: <CheckCircle2 size={14} /> },
    { key: 'agents', label: 'Agents', icon: <Users size={14} />, badge: clientAgents.length },
    { key: 'skills', label: 'Skills', icon: <Zap size={14} />, badge: readySkills },
    { key: 'models', label: 'Models', icon: <Code size={14} /> },
  ];

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={{
            ...styles.statusDot,
            backgroundColor: client.status === 'online' ? 'var(--success)' : client.status === 'degraded' ? 'var(--warning)' : 'var(--error)',
          }} />
          <div>
            <h2 style={styles.headerTitle}>{client.name}</h2>
            <span style={styles.headerSub}>{client.botName} — {client.host}:{client.port}</span>
          </div>
        </div>
        <span style={styles.lastSeen}>Last seen: {formatTimeAgo(client.lastSeen)}</span>
      </div>

      {/* Status Overview */}
      {status && (
        <div style={styles.statusGrid}>
          <div style={styles.statusCard}>
            <span style={styles.statusValue}>{status.version}</span>
            <span style={styles.statusLabel}>Version</span>
          </div>
          <div style={styles.statusCard}>
            <span style={styles.statusValue}>{status.uptime}</span>
            <span style={styles.statusLabel}>Uptime</span>
          </div>
          <div style={styles.statusCard}>
            <span style={styles.statusValue}>{status.skillsReady}/{status.skillsTotal}</span>
            <span style={styles.statusLabel}>Skills</span>
          </div>
          <div style={styles.statusCard}>
            <span style={{
              ...styles.statusValue,
              color: status.memoryStatus === 'healthy' ? 'var(--success)' : 'var(--warning)',
            }}>
              {status.memoryChunks}
            </span>
            <span style={styles.statusLabel}>Memory Chunks</span>
          </div>
          <div style={styles.statusCard}>
            <span style={{ ...styles.statusValue, fontSize: 13 }}>{status.activeModel}</span>
            <span style={styles.statusLabel}>Model</span>
          </div>
          <div style={styles.statusCard}>
            <span style={{ ...styles.statusValue, color: 'var(--primary)', fontSize: 14 }}>
              {status.channelsOnline.join(' + ')}
            </span>
            <span style={styles.statusLabel}>Channels</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={styles.tabBar}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            style={{
              ...styles.tab,
              ...(activeTab === tab.key ? styles.tabActive : {}),
            }}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.badge ? <span style={styles.tabBadge}>{tab.badge}</span> : null}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={styles.tabContent}>
        {activeTab === 'activity' && <ActivityTab activities={clientActivities} />}
        {activeTab === 'cron' && <CronTab cronJobs={clientCrons} />}
        {activeTab === 'alerts' && <AlertsTab alerts={clientAlerts} onResolve={resolveAlert} />}
        {activeTab === 'tasks' && <TasksTab tasks={clientTasks} />}
        {activeTab === 'agents' && <AgentsTab agents={clientAgents} />}
        {activeTab === 'skills' && <SkillsTab skills={clientSkills} />}
        {activeTab === 'models' && <ModelsTab models={clientModels} />}
      </div>
    </div>
  );
}

function activityIcon(type: AgentActivity['type']) {
  switch (type) {
    case 'message_sent': return <Send size={12} />;
    case 'message_received': return <MessageSquare size={12} />;
    case 'email_sent': return <Mail size={12} />;
    case 'skill_executed': return <Zap size={12} />;
    case 'memory_indexed': return <Server size={12} />;
    case 'gateway_restart': return <RefreshCw size={12} />;
    case 'error': return <XCircle size={12} />;
    default: return <Activity size={12} />;
  }
}

function activityColor(type: AgentActivity['type']) {
  switch (type) {
    case 'message_sent': return 'var(--primary)';
    case 'message_received': return '#6C63FF';
    case 'email_sent': return 'var(--success)';
    case 'skill_executed': return 'var(--warning)';
    case 'memory_indexed': return 'var(--accent)';
    case 'gateway_restart': return 'var(--text-muted)';
    case 'error': return 'var(--error)';
    default: return 'var(--text-muted)';
  }
}

function ActivityTab({ activities }: { activities: AgentActivity[] }) {
  return (
    <div>
      {activities.map((a, i) => (
        <div key={a.id} style={styles.timelineItem}>
          <div style={styles.timelineLeft}>
            <div style={{ ...styles.timelineDot, background: activityColor(a.type) }}>
              {activityIcon(a.type)}
            </div>
            {i < activities.length - 1 && <div style={styles.timelineLine} />}
          </div>
          <div style={styles.timelineBody}>
            <div style={styles.timelineText}>{a.description}</div>
            <div style={styles.timelineMeta}>
              {a.channel && <span style={styles.timelineChannel}>{a.channel}</span>}
              <span style={styles.timelineTime}>{formatTimeAgo(a.timestamp)}</span>
            </div>
          </div>
        </div>
      ))}
      {activities.length === 0 && <div style={styles.emptyTab}>No recent activity</div>}
    </div>
  );
}

function cronIcon(type: CronJob['type']) {
  switch (type) {
    case 'heartbeat': return <Heart size={16} color="var(--primary)" />;
    case 'memory_watchdog': return <Shield size={16} color="var(--primary)" />;
    case 'scheduled_task': return <Calendar size={16} color="var(--primary)" />;
    default: return <Code size={16} color="var(--primary)" />;
  }
}

function CronTab({ cronJobs }: { cronJobs: CronJob[] }) {
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {cronJobs.map((job) => (
        <div key={job.id} style={styles.card}>
          <div style={styles.cardRow}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {cronIcon(job.type)}
              <span style={{ fontWeight: 600, fontSize: 14 }}>{job.name}</span>
            </div>
            <div style={{
              ...styles.statusPill,
              background: job.status === 'active' ? 'rgba(0,255,102,0.15)' : job.status === 'paused' ? 'rgba(255,200,0,0.15)' : 'rgba(255,61,113,0.15)',
              color: job.status === 'active' ? 'var(--success)' : job.status === 'paused' ? 'var(--warning)' : 'var(--error)',
            }}>
              {job.status}
            </div>
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 6, marginLeft: 26 }}>
            {job.schedule}
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 6, marginLeft: 26 }}>
            {job.lastRun && <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>Last: {formatTimeAgo(job.lastRun)}</span>}
            {job.nextRun && <span style={{ color: 'var(--primary)', fontSize: 11 }}>Next: {formatTimeAgo(job.nextRun)}</span>}
          </div>
        </div>
      ))}
      {cronJobs.length === 0 && <div style={styles.emptyTab}>No cron jobs configured</div>}
    </div>
  );
}

function severityColor(severity: AlertType['severity']) {
  switch (severity) {
    case 'critical': return 'var(--error)';
    case 'warning': return 'var(--warning)';
    case 'info': return 'var(--primary)';
  }
}

function severityIcon(severity: AlertType['severity']) {
  switch (severity) {
    case 'critical': return <AlertCircle size={16} />;
    case 'warning': return <AlertTriangle size={16} />;
    case 'info': return <Info size={16} />;
  }
}

function AlertsTab({ alerts, onResolve }: { alerts: AlertType[]; onResolve: (id: string) => void }) {
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {alerts.map((alert) => (
        <div
          key={alert.id}
          style={{
            ...styles.card,
            borderLeft: `4px solid ${severityColor(alert.severity)}`,
            opacity: alert.resolved ? 0.5 : 1,
          }}
        >
          <div style={styles.cardRow}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: alert.resolved ? 'var(--text-muted)' : severityColor(alert.severity) }}>
              {severityIcon(alert.severity)}
              <span style={{
                fontWeight: 600,
                fontSize: 14,
                color: 'var(--text)',
                textDecoration: alert.resolved ? 'line-through' : 'none',
              }}>
                {alert.title}
              </span>
            </div>
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 6, lineHeight: 1.5 }}>
            {alert.description}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{formatTimeAgo(alert.timestamp)}</span>
            {!alert.resolved ? (
              <button style={styles.resolveBtn} onClick={() => onResolve(alert.id)}>
                Resolve
              </button>
            ) : (
              <span style={{ color: 'var(--text-muted)', fontSize: 12, fontStyle: 'italic' }}>Resolved</span>
            )}
          </div>
        </div>
      ))}
      {alerts.length === 0 && <div style={styles.emptyTab}>No alerts — all clear!</div>}
    </div>
  );
}

function taskIcon(type: TaskRecord['type']) {
  switch (type) {
    case 'email': return <Mail size={16} color="var(--primary)" />;
    case 'message': return <MessageSquare size={16} color="var(--primary)" />;
    case 'meeting_notes': return <FileText size={16} color="var(--primary)" />;
    case 'document_summary': return <BookOpen size={16} color="var(--primary)" />;
    case 'reminder': return <Bell size={16} color="var(--primary)" />;
    case 'skill_exec': return <Zap size={16} color="var(--primary)" />;
    default: return <Activity size={16} color="var(--primary)" />;
  }
}

function taskStatusColor(status: TaskRecord['status']) {
  switch (status) {
    case 'completed': return 'var(--success)';
    case 'failed': return 'var(--error)';
    case 'in_progress': return 'var(--warning)';
  }
}

function TasksTab({ tasks }: { tasks: TaskRecord[] }) {
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {tasks.map((task) => (
        <div key={task.id} style={{ ...styles.card, display: 'flex', gap: 12 }}>
          <div style={styles.taskIconBox}>
            {taskIcon(task.type)}
          </div>
          <div style={{ flex: 1 }}>
            <div style={styles.cardRow}>
              <span style={{ fontWeight: 600, fontSize: 14, flex: 1 }}>{task.title}</span>
              <div style={{
                ...styles.statusPill,
                background: taskStatusColor(task.status) + '22',
                color: taskStatusColor(task.status),
              }}>
                {task.status}
              </div>
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>{task.description}</div>
            <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
              <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{formatTimeAgo(task.timestamp)}</span>
              {task.duration && (
                <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{(task.duration / 1000).toFixed(1)}s</span>
              )}
            </div>
          </div>
        </div>
      ))}
      {tasks.length === 0 && <div style={styles.emptyTab}>No tasks recorded yet</div>}
    </div>
  );
}

function AgentsTab({ agents }: { agents: AgentNode[] }) {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  const topLevel = agents.filter((a) => a.reportsTo === null);
  const getChildren = (parentId: string) => agents.filter((a) => a.reportsTo === parentId);
  const getAgent = (id: string) => agents.find((a) => a.id === id);
  const selected = selectedAgent ? getAgent(selectedAgent) : null;

  const statusColor = (s: AgentNode['status']) => {
    switch (s) {
      case 'active': return 'var(--success)';
      case 'standby': return 'var(--warning)';
      default: return 'var(--error)';
    }
  };

  const renderNode = (agent: AgentNode, depth: number = 0) => {
    const children = getChildren(agent.id);
    const isSelected = selectedAgent === agent.id;
    return (
      <div key={agent.id}>
        <button
          onClick={() => setSelectedAgent(isSelected ? null : agent.id)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 14px',
            paddingLeft: 14 + depth * 24,
            borderRadius: 10,
            border: isSelected ? '1px solid var(--primary)' : '1px solid transparent',
            background: isSelected ? 'rgba(0,240,255,0.06)' : 'transparent',
            color: 'var(--text)',
            cursor: 'pointer',
            textAlign: 'left' as const,
            marginBottom: 2,
          }}
        >
          {depth > 0 && (
            <GitBranch size={12} color="var(--border)" style={{ marginRight: -4 }} />
          )}
          <span style={{ fontSize: 18 }}>{agent.emoji}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{agent.name}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 1 }}>{agent.role}</div>
          </div>
          <div style={{
            width: 8, height: 8, borderRadius: 4,
            backgroundColor: statusColor(agent.status),
            flexShrink: 0,
          }} />
        </button>
        {children.map((child) => renderNode(child, depth + 1))}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', gap: 16 }}>
      {/* Org Tree */}
      <div style={{ flex: '0 0 280px', minWidth: 0 }}>
        <div style={{
          fontSize: 11, fontWeight: 700, letterSpacing: 1.5,
          color: 'var(--text-muted)', marginBottom: 10, paddingLeft: 14,
        }}>
          ORG CHART
        </div>
        <div style={{
          background: 'var(--surface)',
          borderRadius: 12,
          border: '1px solid var(--border)',
          padding: '8px 4px',
        }}>
          {topLevel.map((agent) => renderNode(agent))}
        </div>
      </div>

      {/* Detail Panel */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {selected ? (
          <div style={{
            background: 'var(--surface)',
            borderRadius: 14,
            border: '1px solid var(--border)',
            padding: 20,
          }}>
            {/* Agent Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: 'rgba(0,240,255,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24,
              }}>
                {selected.emoji}
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>{selected.name}</h3>
                <div style={{ color: 'var(--primary)', fontSize: 13, fontWeight: 600, marginTop: 2 }}>
                  {selected.role}
                </div>
              </div>
              <div style={{
                marginLeft: 'auto',
                fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const,
                padding: '4px 10px', borderRadius: 8,
                background: statusColor(selected.status) + '22',
                color: statusColor(selected.status),
              }}>
                {selected.status}
              </div>
            </div>

            {/* Goal */}
            <div style={{ marginBottom: 16 }}>
              <div style={detailLabel}>Goal</div>
              <div style={{ color: 'var(--text)', fontSize: 14, lineHeight: 1.6 }}>
                {selected.goal}
              </div>
            </div>

            {/* Model */}
            <div style={{ marginBottom: 16 }}>
              <div style={detailLabel}>Model</div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '5px 12px', borderRadius: 8,
                background: 'var(--bg)', border: '1px solid var(--border)',
                fontSize: 13, fontWeight: 600,
              }}>
                <Cpu size={13} color="var(--primary)" />
                {selected.model}
              </div>
            </div>

            {/* Reports To */}
            {selected.reportsTo && (
              <div style={{ marginBottom: 16 }}>
                <div style={detailLabel}>Reports To</div>
                {(() => {
                  const parent = getAgent(selected.reportsTo!);
                  return parent ? (
                    <button
                      onClick={() => setSelectedAgent(parent.id)}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '5px 12px', borderRadius: 8,
                        background: 'var(--bg)', border: '1px solid var(--border)',
                        color: 'var(--text)', fontSize: 13, fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      <span>{parent.emoji}</span> {parent.name}
                    </button>
                  ) : null;
                })()}
              </div>
            )}

            {/* Communicates With */}
            {selected.communicatesWith.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={detailLabel}>Communicates With</div>
                <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6 }}>
                  {selected.communicatesWith.map((id) => {
                    const a = getAgent(id);
                    return a ? (
                      <button
                        key={id}
                        onClick={() => setSelectedAgent(a.id)}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          padding: '4px 10px', borderRadius: 8,
                          background: 'var(--bg)', border: '1px solid var(--border)',
                          color: 'var(--text)', fontSize: 12, cursor: 'pointer',
                        }}
                      >
                        <span>{a.emoji}</span> {a.name}
                        <ArrowRight size={10} color="var(--text-muted)" />
                      </button>
                    ) : null;
                  })}
                </div>
              </div>
            )}

            {/* Channels */}
            {selected.channels && selected.channels.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={detailLabel}>Channels</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {selected.channels.map((ch) => (
                    <span key={ch} style={{
                      padding: '4px 10px', borderRadius: 8,
                      background: 'rgba(0,240,255,0.08)',
                      color: 'var(--primary)', fontSize: 12, fontWeight: 600,
                    }}>
                      {ch}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Task Types */}
            <div>
              <div style={detailLabel}>Task Types</div>
              <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6 }}>
                {selected.taskTypes.map((t) => (
                  <span key={t} style={{
                    padding: '4px 10px', borderRadius: 8,
                    background: 'var(--bg)', border: '1px solid var(--border)',
                    color: 'var(--text-muted)', fontSize: 12,
                  }}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div style={{
            background: 'var(--surface)',
            borderRadius: 14,
            border: '1px solid var(--border)',
            padding: 40,
            textAlign: 'center' as const,
            color: 'var(--text-muted)',
          }}>
            <Users size={32} color="var(--border)" />
            <p style={{ marginTop: 12, fontSize: 14 }}>Select an agent to view details</p>
          </div>
        )}
      </div>
    </div>
  );
}

const detailLabel: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: 1.5,
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  marginBottom: 8,
};

function SkillsTab({ skills }: { skills: SkillInfo[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'ready' | 'missing'>('all');

  const filtered = filter === 'all' ? skills : skills.filter((s) => s.status === filter);
  const readyCount = skills.filter((s) => s.status === 'ready').length;
  const missingCount = skills.filter((s) => s.status === 'missing').length;

  return (
    <div>
      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {([
          { key: 'all' as const, label: `All (${skills.length})` },
          { key: 'ready' as const, label: `Ready (${readyCount})` },
          { key: 'missing' as const, label: `Missing (${missingCount})` },
        ]).map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              border: filter === f.key ? '1px solid var(--primary)' : '1px solid var(--border)',
              background: filter === f.key ? 'rgba(0,240,255,0.1)' : 'transparent',
              color: filter === f.key ? 'var(--primary)' : 'var(--text-muted)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gap: 6 }}>
        {filtered.map((skill) => {
          const isExpanded = expandedId === skill.id;
          return (
            <div key={skill.id}>
              <button
                onClick={() => setExpandedId(isExpanded ? null : skill.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 14px',
                  borderRadius: isExpanded ? '12px 12px 0 0' : 12,
                  border: '1px solid var(--border)',
                  borderBottom: isExpanded ? '1px solid var(--border)' : undefined,
                  background: 'var(--surface)',
                  color: 'var(--text)',
                  cursor: 'pointer',
                  textAlign: 'left' as const,
                }}
              >
                <span style={{ fontSize: 16 }}>{skill.emoji}</span>
                <span style={{ flex: 1, fontWeight: 600, fontSize: 14 }}>{skill.name}</span>
                <span style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: 'uppercase' as const,
                  padding: '2px 8px',
                  borderRadius: 6,
                  background: skill.status === 'ready' ? 'rgba(0,255,102,0.15)' : 'rgba(255,61,113,0.15)',
                  color: skill.status === 'ready' ? 'var(--success)' : 'var(--error)',
                }}>
                  {skill.status}
                </span>
                {isExpanded ? <ChevronUp size={14} color="var(--text-muted)" /> : <ChevronDown size={14} color="var(--text-muted)" />}
              </button>
              {isExpanded && (
                <div style={{
                  padding: '12px 14px',
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  borderTop: 'none',
                  borderRadius: '0 0 12px 12px',
                }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.6, margin: 0 }}>
                    {skill.description}
                  </p>
                  {skill.missingRequirement && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      marginTop: 8,
                      padding: '6px 10px',
                      borderRadius: 6,
                      background: 'rgba(255,61,113,0.08)',
                      color: 'var(--error)',
                      fontSize: 12,
                    }}>
                      <Package size={12} />
                      Missing: {skill.missingRequirement}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {filtered.length === 0 && <div style={styles.emptyTab}>No skills match this filter</div>}
    </div>
  );
}

function authMethodLabel(method: ModelInfo['authMethod']) {
  switch (method) {
    case 'api_key': return 'API Key';
    case 'oauth': return 'OAuth';
    case 'token': return 'Token';
    case 'free': return 'Free (Local)';
  }
}

function authMethodIcon(method: ModelInfo['authMethod']) {
  switch (method) {
    case 'api_key': return <Key size={14} />;
    case 'oauth': return <Globe size={14} />;
    case 'token': return <Lock size={14} />;
    case 'free': return <Cpu size={14} />;
  }
}

function authMethodColor(method: ModelInfo['authMethod']) {
  switch (method) {
    case 'api_key': return 'var(--warning)';
    case 'oauth': return 'var(--accent)';
    case 'token': return 'var(--primary)';
    case 'free': return 'var(--success)';
  }
}

function formatCtx(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(0)}k`;
  return `${n}`;
}

function ModelsTab({ models }: { models: ModelInfo[] }) {
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {models.map((model) => (
        <div key={model.id} style={{
          ...styles.card,
          borderLeft: model.isPrimary ? '4px solid var(--primary)' : undefined,
        }}>
          <div style={styles.cardRow}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Cpu size={18} color={model.isPrimary ? 'var(--primary)' : 'var(--text-muted)'} />
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>
                  {model.name}
                  {model.isPrimary && (
                    <span style={{
                      marginLeft: 8,
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 6,
                      background: 'rgba(0,240,255,0.15)',
                      color: 'var(--primary)',
                      textTransform: 'uppercase' as const,
                    }}>
                      Primary
                    </span>
                  )}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 2 }}>
                  {model.provider}
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' as const }}>
            {/* Auth Method */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 8,
              background: 'var(--bg)',
              border: '1px solid var(--border)',
            }}>
              <span style={{ color: authMethodColor(model.authMethod) }}>
                {authMethodIcon(model.authMethod)}
              </span>
              <span style={{ fontSize: 12, fontWeight: 600, color: authMethodColor(model.authMethod) }}>
                {authMethodLabel(model.authMethod)}
              </span>
            </div>

            {/* Context Window */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 8,
              background: 'var(--bg)',
              border: '1px solid var(--border)',
            }}>
              <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Context:</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>
                {formatCtx(model.contextWindow)} tokens
              </span>
            </div>

            {/* Max Output */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 8,
              background: 'var(--bg)',
              border: '1px solid var(--border)',
            }}>
              <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Max output:</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>
                {formatCtx(model.maxTokens)}
              </span>
            </div>

            {/* Cost */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 8,
              background: 'var(--bg)',
              border: '1px solid var(--border)',
            }}>
              <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Cost:</span>
              <span style={{
                fontSize: 12,
                fontWeight: 700,
                color: model.cost.input === 0 ? 'var(--success)' : 'var(--warning)',
              }}>
                {model.cost.input === 0 ? 'Free' : `$${model.cost.input}/$${model.cost.output} per 1M`}
              </span>
            </div>
          </div>
        </div>
      ))}
      {models.length === 0 && <div style={styles.emptyTab}>No models configured</div>}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    flex: 1,
    overflow: 'auto',
    padding: 24,
  },
  empty: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 800,
    margin: 0,
  },
  headerSub: {
    color: 'var(--text-muted)',
    fontSize: 13,
  },
  lastSeen: {
    color: 'var(--text-muted)',
    fontSize: 12,
  },
  statusGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: 10,
    marginBottom: 20,
  },
  statusCard: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    padding: '14px 16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
  },
  statusValue: {
    color: 'var(--text)',
    fontSize: 18,
    fontWeight: 700,
  },
  statusLabel: {
    color: 'var(--text-muted)',
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
  tabBar: {
    display: 'flex',
    background: 'var(--surface)',
    borderRadius: 10,
    padding: 4,
    marginBottom: 16,
    gap: 4,
  },
  tab: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: '10px 8px',
    borderRadius: 8,
    border: 'none',
    background: 'transparent',
    color: 'var(--text-muted)',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  tabActive: {
    background: 'var(--bg)',
    color: 'var(--primary)',
  },
  tabBadge: {
    background: 'var(--warning)',
    color: 'var(--bg)',
    fontSize: 10,
    fontWeight: 700,
    borderRadius: 8,
    padding: '1px 6px',
    minWidth: 16,
    textAlign: 'center' as const,
  },
  tabContent: {
    flex: 1,
  },
  // Timeline
  timelineItem: {
    display: 'flex',
    gap: 12,
  },
  timelineLeft: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: 28,
  },
  timelineDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    flexShrink: 0,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    background: 'var(--border)',
    margin: '4px 0',
  },
  timelineBody: {
    flex: 1,
    paddingBottom: 20,
  },
  timelineText: {
    fontSize: 14,
    lineHeight: 1.5,
  },
  timelineMeta: {
    display: 'flex',
    gap: 8,
    marginTop: 4,
  },
  timelineChannel: {
    color: 'var(--primary)',
    fontSize: 12,
    fontWeight: 600,
  },
  timelineTime: {
    color: 'var(--text-muted)',
    fontSize: 12,
  },
  // Cards
  card: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    padding: 14,
  },
  cardRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusPill: {
    fontSize: 10,
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    padding: '3px 10px',
    borderRadius: 10,
    letterSpacing: 0.5,
  },
  resolveBtn: {
    background: 'rgba(0,255,102,0.15)',
    color: 'var(--success)',
    border: 'none',
    borderRadius: 6,
    padding: '4px 12px',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
  },
  taskIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    background: 'rgba(0,240,255,0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  emptyTab: {
    color: 'var(--text-muted)',
    textAlign: 'center' as const,
    padding: '40px 0',
    fontSize: 14,
  },
};
