import { create } from 'zustand';
import type {
  OpenClawClient,
  AgentActivity,
  CronJob,
  Alert,
  TaskRecord,
  ClientStatus,
  BridgeResponse,
} from '../types/openclaw';

interface CommandCenterState {
  clients: OpenClawClient[];
  selectedClientId: string | null;
  clientStatuses: Record<string, ClientStatus>;
  activities: AgentActivity[];
  cronJobs: CronJob[];
  alerts: Alert[];
  tasks: TaskRecord[];
  loading: boolean;
  error: string | null;

  addClient: (client: Omit<OpenClawClient, 'id' | 'status' | 'lastSeen'>) => void;
  removeClient: (id: string) => void;
  selectClient: (id: string | null) => void;
  fetchClientStatus: (clientId: string) => Promise<void>;
  fetchActivities: (clientId: string) => Promise<void>;
  fetchCronJobs: (clientId: string) => Promise<void>;
  fetchTasks: (clientId: string) => Promise<void>;
  fetchAllForClient: (clientId: string) => Promise<void>;
  refreshAll: () => Promise<void>;
  resolveAlert: (alertId: string) => void;
}

const generateId = () => Math.random().toString(36).substring(2, 10);

const apiFetch = async <T>(host: string, port: number, path: string): Promise<T | null> => {
  try {
    const res = await fetch(`http://${host}:${port}${path}`, {
      signal: AbortSignal.timeout(5000),
    });
    const json: BridgeResponse<T> = await res.json();
    if (json.success) return json.data ?? null;
    return null;
  } catch {
    return null;
  }
};

const mockClients: OpenClawClient[] = [
  {
    id: 'jacob-001',
    name: "Jacob's Assistant",
    botName: 'Andrew',
    host: '10.0.0.144',
    port: 3200,
    ownerName: 'Jacob',
    ownerPhone: '+14045146154',
    status: 'online',
    lastSeen: new Date().toISOString(),
  },
];

const mockActivities: AgentActivity[] = [
  {
    id: 'a1',
    clientId: 'jacob-001',
    type: 'email_sent',
    description: 'Sent email to jacob@mistorakitchen.com — "On my way"',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    channel: 'gmail',
    status: 'success',
  },
  {
    id: 'a2',
    clientId: 'jacob-001',
    type: 'message_received',
    description: 'Jacob: "Send an email to jacob@mistorakitchen.com"',
    timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    channel: 'imessage',
    status: 'success',
  },
  {
    id: 'a3',
    clientId: 'jacob-001',
    type: 'message_sent',
    description: 'Sent iMessage to Jacob — notified about corrected email address',
    timestamp: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    channel: 'imessage',
    status: 'success',
  },
  {
    id: 'a4',
    clientId: 'jacob-001',
    type: 'memory_indexed',
    description: 'Memory reindexed — 3 files, vector search ready',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    status: 'success',
  },
  {
    id: 'a5',
    clientId: 'jacob-001',
    type: 'skill_executed',
    description: 'gmail-send skill executed — test email to pnkaraya@gmail.com',
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    status: 'success',
  },
  {
    id: 'a6',
    clientId: 'jacob-001',
    type: 'gateway_restart',
    description: 'Gateway restarted — all workspace files reloaded',
    timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    status: 'success',
  },
];

const mockCronJobs: CronJob[] = [
  {
    id: 'c1',
    clientId: 'jacob-001',
    name: 'Memory Health Check',
    schedule: 'Every 30 minutes',
    lastRun: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    nextRun: new Date(Date.now() + 1000 * 60 * 18).toISOString(),
    status: 'active',
    type: 'memory_watchdog',
  },
  {
    id: 'c2',
    clientId: 'jacob-001',
    name: 'Fact Extraction',
    schedule: 'Every 30 minutes',
    lastRun: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    nextRun: new Date(Date.now() + 1000 * 60 * 18).toISOString(),
    status: 'active',
    type: 'heartbeat',
  },
  {
    id: 'c3',
    clientId: 'jacob-001',
    name: 'Consolidate Learnings → USER.md',
    schedule: 'Every 2 hours',
    lastRun: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
    nextRun: new Date(Date.now() + 1000 * 60 * 25).toISOString(),
    status: 'active',
    type: 'heartbeat',
  },
  {
    id: 'c4',
    clientId: 'jacob-001',
    name: 'Daily Digest for Jacob',
    schedule: 'Daily at 8:00 AM',
    lastRun: new Date(Date.now() - 1000 * 60 * 60 * 14).toISOString(),
    nextRun: new Date(Date.now() + 1000 * 60 * 60 * 10).toISOString(),
    status: 'active',
    type: 'scheduled_task',
  },
];

const mockAlerts: Alert[] = [
  {
    id: 'al1',
    clientId: 'jacob-001',
    severity: 'info',
    title: '[[reply_to:]] tags in iMessage',
    description: 'Known bug — internal routing tags leak in iMessage delivery. Cosmetic only.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    resolved: false,
    category: 'channel',
  },
  {
    id: 'al2',
    clientId: 'jacob-001',
    severity: 'warning',
    title: 'apple-notes skill unavailable',
    description: 'memo brew tap not available. Skill cannot be installed.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    resolved: false,
    category: 'skill',
  },
];

const mockTasks: TaskRecord[] = [
  {
    id: 't1',
    clientId: 'jacob-001',
    type: 'email',
    title: 'Email sent to jacob@mistorakitchen.com',
    description: 'Subject: "On my way" — sent via gmail-send skill',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    status: 'completed',
    duration: 12000,
  },
  {
    id: 't2',
    clientId: 'jacob-001',
    type: 'email',
    title: 'Test email to pnkaraya@gmail.com',
    description: 'Subject: "Test from Andrew" — gmail-send skill validation',
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    status: 'completed',
    duration: 11000,
  },
  {
    id: 't3',
    clientId: 'jacob-001',
    type: 'email',
    title: 'Email to jacob@missdorakitch.com',
    description: 'Subject: "On my way" — wrong address (typo)',
    timestamp: new Date(Date.now() - 1000 * 60 * 75).toISOString(),
    status: 'completed',
    duration: 10000,
  },
  {
    id: 't4',
    clientId: 'jacob-001',
    type: 'message',
    title: 'iMessage to Jacob — email address correction',
    description: 'Notified about typo and asked to always type exact addresses',
    timestamp: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    status: 'completed',
    duration: 2000,
  },
  {
    id: 't5',
    clientId: 'jacob-001',
    type: 'skill_exec',
    title: 'Memory reindex',
    description: '3 files indexed — USER.md, IDENTITY.md, TECH_SUPPORT.md',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    status: 'completed',
    duration: 3000,
  },
  {
    id: 't6',
    clientId: 'jacob-001',
    type: 'message',
    title: 'iMessage to Phill — status update',
    description: 'Gmail-send skill installed, tested, and working',
    timestamp: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
    status: 'completed',
    duration: 1500,
  },
];

const mockClientStatuses: Record<string, ClientStatus> = {
  'jacob-001': {
    version: '2026.3.2',
    hostname: 'Andrews-Mac-mini.local',
    uptime: '4h 32m',
    skillsReady: 11,
    skillsTotal: 51,
    memoryStatus: 'healthy',
    memoryChunks: 47,
    channelsOnline: ['iMessage', 'WhatsApp'],
    activeModel: 'openai-codex/gpt-5.3-codex',
  },
};

export const useCommandCenterStore = create<CommandCenterState>((set, get) => ({
  clients: mockClients,
  selectedClientId: mockClients[0]?.id ?? null,
  clientStatuses: mockClientStatuses,
  activities: mockActivities,
  cronJobs: mockCronJobs,
  alerts: mockAlerts,
  tasks: mockTasks,
  loading: false,
  error: null,

  addClient: (clientData) => {
    const newClient: OpenClawClient = {
      ...clientData,
      id: generateId(),
      status: 'offline',
      lastSeen: new Date().toISOString(),
    };
    set((state) => ({ clients: [...state.clients, newClient] }));
  },

  removeClient: (id) => {
    set((state) => ({
      clients: state.clients.filter((c) => c.id !== id),
      activities: state.activities.filter((a) => a.clientId !== id),
      cronJobs: state.cronJobs.filter((c) => c.clientId !== id),
      alerts: state.alerts.filter((a) => a.clientId !== id),
      tasks: state.tasks.filter((t) => t.clientId !== id),
      selectedClientId: state.selectedClientId === id ? null : state.selectedClientId,
    }));
  },

  selectClient: (id) => set({ selectedClientId: id }),

  fetchClientStatus: async (clientId) => {
    const client = get().clients.find((c) => c.id === clientId);
    if (!client) return;
    const data = await apiFetch<ClientStatus>(client.host, client.port, '/api/status');
    if (data) {
      set((state) => ({
        clientStatuses: { ...state.clientStatuses, [clientId]: data },
        clients: state.clients.map((c) =>
          c.id === clientId ? { ...c, status: 'online' as const, lastSeen: new Date().toISOString() } : c
        ),
      }));
    } else {
      set((state) => ({
        clients: state.clients.map((c) =>
          c.id === clientId ? { ...c, status: 'offline' as const } : c
        ),
      }));
    }
  },

  fetchActivities: async (clientId) => {
    const client = get().clients.find((c) => c.id === clientId);
    if (!client) return;
    const data = await apiFetch<AgentActivity[]>(client.host, client.port, '/api/tasks');
    if (data) {
      set((state) => ({
        activities: [
          ...state.activities.filter((a) => a.clientId !== clientId),
          ...data.map((a) => ({ ...a, clientId })),
        ],
      }));
    }
  },

  fetchCronJobs: async (clientId) => {
    const client = get().clients.find((c) => c.id === clientId);
    if (!client) return;
    const data = await apiFetch<CronJob[]>(client.host, client.port, '/api/cron');
    if (data) {
      set((state) => ({
        cronJobs: [
          ...state.cronJobs.filter((c) => c.clientId !== clientId),
          ...data.map((c) => ({ ...c, clientId })),
        ],
      }));
    }
  },

  fetchTasks: async (clientId) => {
    const client = get().clients.find((c) => c.id === clientId);
    if (!client) return;
    const data = await apiFetch<TaskRecord[]>(client.host, client.port, '/api/tasks');
    if (data) {
      set((state) => ({
        tasks: [
          ...state.tasks.filter((t) => t.clientId !== clientId),
          ...data.map((t) => ({ ...t, clientId })),
        ],
      }));
    }
  },

  fetchAllForClient: async (clientId) => {
    set({ loading: true, error: null });
    try {
      await Promise.all([
        get().fetchClientStatus(clientId),
        get().fetchActivities(clientId),
        get().fetchCronJobs(clientId),
        get().fetchTasks(clientId),
      ]);
    } catch (e: unknown) {
      set({ error: e instanceof Error ? e.message : 'Unknown error' });
    } finally {
      set({ loading: false });
    }
  },

  refreshAll: async () => {
    set({ loading: true });
    const { clients } = get();
    await Promise.all(clients.map((c) => get().fetchAllForClient(c.id)));
    set({ loading: false });
  },

  resolveAlert: (alertId) => {
    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.id === alertId ? { ...a, resolved: true } : a
      ),
    }));
  },
}));
