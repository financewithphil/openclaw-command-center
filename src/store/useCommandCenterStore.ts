import { create } from 'zustand';
import type {
  OpenClawClient,
  AgentActivity,
  CronJob,
  Alert,
  TaskRecord,
  ClientStatus,
  BridgeResponse,
  SkillInfo,
  ModelInfo,
} from '../types/openclaw';

interface CommandCenterState {
  clients: OpenClawClient[];
  selectedClientId: string | null;
  clientStatuses: Record<string, ClientStatus>;
  skills: SkillInfo[];
  models: ModelInfo[];
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
    id: 'kit-001',
    name: "Kit — Phil's Familiar",
    botName: 'Kit',
    host: '10.0.0.115',
    port: 3200,
    ownerName: 'Phil',
    ownerPhone: '',
    status: 'online',
    lastSeen: new Date().toISOString(),
  },
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
  // Kit's activities
  {
    id: 'k-a1',
    clientId: 'kit-001',
    type: 'skill_executed',
    description: 'Skool community pulse — 105 members, 5 online, Vg Lockedin & Jayden Rodney active, 5 new notifications',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    channel: 'discord',
    status: 'success',
  },
  {
    id: 'k-a2',
    clientId: 'kit-001',
    type: 'message_received',
    description: 'Discord message in #openclaw-main channel',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 7).toISOString(),
    channel: 'discord',
    status: 'success',
  },
  {
    id: 'k-a3',
    clientId: 'kit-001',
    type: 'gateway_restart',
    description: 'Gateway restarted — PID 1416, discord + iMessage providers online',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
    status: 'success',
  },
  {
    id: 'k-a4',
    clientId: 'kit-001',
    type: 'memory_indexed',
    description: 'Memory initialized — 23 files, 23 chunks, qmd vector ready',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
    status: 'success',
  },
  {
    id: 'k-a5',
    clientId: 'kit-001',
    type: 'skill_executed',
    description: 'Browser launched — Chrome profile "openclaw" on 127.0.0.1:18800',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    status: 'success',
  },
  // Jacob's activities
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
  // Kit's cron jobs
  {
    id: 'k-c1',
    clientId: 'kit-001',
    name: 'Heartbeat (main)',
    schedule: 'Every 30 minutes',
    lastRun: new Date(Date.now() - 1000 * 60 * 7).toISOString(),
    nextRun: new Date(Date.now() + 1000 * 60 * 23).toISOString(),
    status: 'active',
    type: 'heartbeat',
  },
  // Jacob's cron jobs
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
  // Kit's alerts
  {
    id: 'k-al1',
    clientId: 'kit-001',
    severity: 'warning',
    title: 'OpenClaw update available (2026.3.7)',
    description: 'Current version 2026.2.12 is behind stable. Run: openclaw update',
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    resolved: false,
    category: 'system',
  },
  {
    id: 'k-al2',
    clientId: 'kit-001',
    severity: 'warning',
    title: 'Model below recommended tier',
    description: 'claude-sonnet-4-20250514 is below Claude 4.5. Consider upgrading for better tool use and injection resistance.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    resolved: false,
    category: 'system',
  },
  {
    id: 'k-al3',
    clientId: 'kit-001',
    severity: 'info',
    title: 'Credentials dir readable by others',
    description: '~/.openclaw/credentials mode=755. Fix: chmod 700 ~/.openclaw/credentials',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    resolved: false,
    category: 'system',
  },
  {
    id: 'k-al4',
    clientId: 'kit-001',
    severity: 'info',
    title: 'Discord WebSocket reconnects',
    description: 'Multiple gateway resume attempts (code 1005/1006). Likely network hiccups — cosmetic only.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    resolved: false,
    category: 'channel',
  },
  // Jacob's alerts
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
  // Kit's tasks
  {
    id: 'k-t1',
    clientId: 'kit-001',
    type: 'skill_exec',
    title: 'Community pulse check — Skool',
    description: '105 members, 5 online, 5 new notifications, Vg Lockedin & Jayden Rodney active',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    status: 'completed',
    duration: 8000,
  },
  {
    id: 'k-t2',
    clientId: 'kit-001',
    type: 'message',
    title: 'Discord session — #openclaw-main',
    description: '17 active sessions, direct + group conversations',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 7).toISOString(),
    status: 'completed',
    duration: 3000,
  },
  {
    id: 'k-t3',
    clientId: 'kit-001',
    type: 'skill_exec',
    title: 'Browser session launched',
    description: 'Chrome profile "openclaw" on CDP port 18800',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    status: 'completed',
    duration: 4500,
  },
  {
    id: 'k-t4',
    clientId: 'kit-001',
    type: 'skill_exec',
    title: 'Memory reindex',
    description: '23 files indexed — qmd provider, vector search ready',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
    status: 'completed',
    duration: 5000,
  },
  // Jacob's tasks
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
  'kit-001': {
    version: '2026.2.12',
    hostname: 'Phillips-Mac-mini.local',
    uptime: '18h 52m',
    skillsReady: 17,
    skillsTotal: 61,
    memoryStatus: 'healthy',
    memoryChunks: 23,
    channelsOnline: ['Discord', 'iMessage'],
    activeModel: 'anthropic/claude-sonnet-4-20250514',
  },
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

const mockSkills: SkillInfo[] = [
  // Kit's skills (17 ready)
  { id: 'k-s1', clientId: 'kit-001', name: 'agent-swarm', emoji: '📦', description: 'Run a 5-6 agent swarm in Claude Code for real shipping projects. Specialized agent roles for frontend, backend, research, security, QA.', status: 'ready' },
  { id: 'k-s2', clientId: 'kit-001', name: 'brand-guidelines', emoji: '📦', description: 'Create and enforce brand identity systems including logos, colors, typography, and usage rules.', status: 'ready' },
  { id: 'k-s3', clientId: 'kit-001', name: 'canvas-design', emoji: '📦', description: 'Create visual designs using HTML Canvas, SVG, or CSS art. Generate illustrations, diagrams, infographics, posters.', status: 'ready' },
  { id: 'k-s4', clientId: 'kit-001', name: 'claude-api', emoji: '📦', description: 'Build apps with the Claude API or Anthropic SDK. Triggers on anthropic/@anthropic-ai/sdk imports.', status: 'ready' },
  { id: 'k-s5', clientId: 'kit-001', name: 'clawdcursor', emoji: '📦', description: 'AI desktop agent — control any app on Windows/macOS. Send natural language tasks to click, type, navigate.', status: 'ready' },
  { id: 'k-s6', clientId: 'kit-001', name: 'community-pulse', emoji: '📦', description: 'Monitor and grow Skool communities. Engagement tracking, member insights, content performance, growth strategy.', status: 'ready' },
  { id: 'k-s7', clientId: 'kit-001', name: 'frontend-design', emoji: '📦', description: 'Create distinctive, production-grade frontend interfaces with high design quality. Avoids generic AI aesthetics.', status: 'ready' },
  { id: 'k-s8', clientId: 'kit-001', name: 'grant-hunter', emoji: '📦', description: 'Find and track grants for nonprofits. Research foundations, draft narratives/LOIs, track deadlines, analyze 990 forms.', status: 'ready' },
  { id: 'k-s9', clientId: 'kit-001', name: 'internal-comms', emoji: '📦', description: 'Draft professional internal communications — emails, memos, announcements, Slack messages, status reports.', status: 'ready' },
  { id: 'k-s10', clientId: 'kit-001', name: 'mcp-builder', emoji: '📦', description: 'Create MCP servers that enable LLMs to interact with external services through well-designed tools.', status: 'ready' },
  { id: 'k-s11', clientId: 'kit-001', name: 'web-artifacts-builder', emoji: '📦', description: 'Build interactive web artifacts, mini-apps, and single-file HTML/React applications.', status: 'ready' },
  { id: 'k-s12', clientId: 'kit-001', name: 'webapp-testing', emoji: '📦', description: 'Test local web applications using Playwright. Verify frontend functionality, debug UI, capture screenshots.', status: 'ready' },
  { id: 'k-s13', clientId: 'kit-001', name: 'coding-agent', emoji: '🧩', description: 'Run Codex CLI, Claude Code, OpenCode, or Pi Coding Agent via background process for programmatic control.', status: 'ready' },
  { id: 'k-s14', clientId: 'kit-001', name: 'healthcheck', emoji: '📦', description: 'Host security hardening and risk-tolerance configuration for OpenClaw deployments.', status: 'ready' },
  { id: 'k-s15', clientId: 'kit-001', name: 'imsg', emoji: '📨', description: 'iMessage/SMS CLI — list chats, view history, watch for new messages, and send messages.', status: 'ready' },
  { id: 'k-s16', clientId: 'kit-001', name: 'skill-creator', emoji: '📦', description: 'Create or update AgentSkills. Design, structure, and package skills with scripts, references, and assets.', status: 'ready' },
  { id: 'k-s17', clientId: 'kit-001', name: 'weather', emoji: '🌤️', description: 'Get current weather and forecasts. No API key required — uses wttr.in.', status: 'ready' },
  // Kit's missing skills (notable ones)
  { id: 'k-s18', clientId: 'kit-001', name: 'apple-notes', emoji: '📝', description: 'Access and manage Apple Notes from the command line.', status: 'missing', missingRequirement: 'bins: memo' },
  { id: 'k-s19', clientId: 'kit-001', name: 'github', emoji: '🐙', description: 'GitHub CLI integration for repos, issues, PRs, and workflows.', status: 'missing', missingRequirement: 'bins: gh' },
  { id: 'k-s20', clientId: 'kit-001', name: 'notion', emoji: '📝', description: 'Notion API integration for pages, databases, and blocks.', status: 'missing', missingRequirement: 'env: NOTION_API_KEY' },
  { id: 'k-s21', clientId: 'kit-001', name: 'openai-image-gen', emoji: '🖼️', description: 'Generate images using OpenAI DALL-E API.', status: 'missing', missingRequirement: 'env: OPENAI_API_KEY' },
  { id: 'k-s22', clientId: 'kit-001', name: 'slack', emoji: '💬', description: 'Slack channel integration for messaging and notifications.', status: 'missing', missingRequirement: 'config: channels.slack' },
  // Jacob's skills (11 ready)
  { id: 'j-s1', clientId: 'jacob-001', name: 'gmail-send', emoji: '📦', description: 'Browser-based Gmail email automation with 3x retry logic. Sends emails via Chrome CDP.', status: 'ready' },
  { id: 'j-s2', clientId: 'jacob-001', name: 'apple-reminders', emoji: '⏰', description: 'Create and manage Apple Reminders from the command line.', status: 'ready' },
  { id: 'j-s3', clientId: 'jacob-001', name: 'healthcheck', emoji: '📦', description: 'Host security hardening and risk-tolerance configuration for OpenClaw deployments.', status: 'ready' },
  { id: 'j-s4', clientId: 'jacob-001', name: 'himalaya', emoji: '📧', description: 'CLI email client — read, send, and manage email from the terminal.', status: 'ready' },
  { id: 'j-s5', clientId: 'jacob-001', name: 'imsg', emoji: '📨', description: 'iMessage/SMS CLI — list chats, view history, watch for new messages, and send messages.', status: 'ready' },
  { id: 'j-s6', clientId: 'jacob-001', name: 'session-logs', emoji: '📜', description: 'Search and analyze past conversation session logs using ripgrep.', status: 'ready' },
  { id: 'j-s7', clientId: 'jacob-001', name: 'skill-creator', emoji: '📦', description: 'Create or update AgentSkills. Design, structure, and package skills with scripts and assets.', status: 'ready' },
  { id: 'j-s8', clientId: 'jacob-001', name: 'summarize', emoji: '🧾', description: 'Summarize documents, articles, and long text into concise overviews.', status: 'ready' },
  { id: 'j-s9', clientId: 'jacob-001', name: 'video-frames', emoji: '🎞️', description: 'Extract frames from video files using ffmpeg for analysis.', status: 'ready' },
  { id: 'j-s10', clientId: 'jacob-001', name: 'weather', emoji: '🌤️', description: 'Get current weather and forecasts. No API key required.', status: 'ready' },
  { id: 'j-s11', clientId: 'jacob-001', name: 'gog', emoji: '🎮', description: 'Google CLI tool for search, OAuth management, and Google API interactions.', status: 'ready' },
];

const mockModels: ModelInfo[] = [
  // Kit's models
  { id: 'k-m1', clientId: 'kit-001', name: 'Claude Sonnet 4', provider: 'Anthropic', authMethod: 'api_key', contextWindow: 200000, maxTokens: 8192, isPrimary: true, cost: { input: 3, output: 15 } },
  { id: 'k-m2', clientId: 'kit-001', name: 'Kimi 2.5', provider: 'NVIDIA', authMethod: 'token', contextWindow: 128000, maxTokens: 8192, isPrimary: false, cost: { input: 0, output: 0 } },
  { id: 'k-m3', clientId: 'kit-001', name: 'GLM-4.7', provider: 'NVIDIA', authMethod: 'token', contextWindow: 128000, maxTokens: 8192, isPrimary: false, cost: { input: 0, output: 0 } },
  { id: 'k-m4', clientId: 'kit-001', name: 'Minimax M2.1', provider: 'NVIDIA', authMethod: 'token', contextWindow: 32000, maxTokens: 8192, isPrimary: false, cost: { input: 0, output: 0 } },
  { id: 'k-m5', clientId: 'kit-001', name: 'Llama 3.2 3B (Local)', provider: 'Ollama', authMethod: 'free', contextWindow: 8192, maxTokens: 4096, isPrimary: false, cost: { input: 0, output: 0 } },
  // Jacob's models
  { id: 'j-m1', clientId: 'jacob-001', name: 'GPT-5.3 Codex', provider: 'OpenAI', authMethod: 'oauth', contextWindow: 200000, maxTokens: 16384, isPrimary: true, cost: { input: 5, output: 15 } },
];

export const useCommandCenterStore = create<CommandCenterState>((set, get) => ({
  clients: mockClients,
  selectedClientId: 'kit-001',
  clientStatuses: mockClientStatuses,
  skills: mockSkills,
  models: mockModels,
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
