export interface OpenClawClient {
  id: string;
  name: string;
  botName: string;
  host: string;
  port: number;
  ownerName: string;
  ownerPhone: string;
  status: 'online' | 'offline' | 'degraded';
  lastSeen: string;
}

export interface AgentActivity {
  id: string;
  clientId: string;
  type: 'message_sent' | 'message_received' | 'email_sent' | 'skill_executed' | 'memory_indexed' | 'error' | 'gateway_restart';
  description: string;
  timestamp: string;
  channel?: string;
  status: 'success' | 'failed' | 'pending';
}

export interface CronJob {
  id: string;
  clientId: string;
  name: string;
  schedule: string;
  lastRun: string | null;
  nextRun: string | null;
  status: 'active' | 'paused' | 'failed';
  type: 'heartbeat' | 'memory_watchdog' | 'scheduled_task' | 'custom';
}

export interface Alert {
  id: string;
  clientId: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  timestamp: string;
  resolved: boolean;
  category: 'memory' | 'skill' | 'channel' | 'system' | 'task';
}

export interface TaskRecord {
  id: string;
  clientId: string;
  type: 'email' | 'message' | 'meeting_notes' | 'document_summary' | 'reminder' | 'skill_exec' | 'other';
  title: string;
  description: string;
  timestamp: string;
  status: 'completed' | 'failed' | 'in_progress';
  duration?: number;
}

export interface ClientStatus {
  version: string;
  hostname: string;
  uptime: string;
  skillsReady: number;
  skillsTotal: number;
  memoryStatus: 'healthy' | 'degraded' | 'offline';
  memoryChunks: number;
  channelsOnline: string[];
  activeModel: string;
}

export interface SkillInfo {
  id: string;
  clientId: string;
  name: string;
  emoji: string;
  description: string;
  status: 'ready' | 'missing' | 'disabled';
  missingRequirement?: string;
}

export interface ModelInfo {
  id: string;
  clientId: string;
  name: string;
  provider: string;
  authMethod: 'api_key' | 'oauth' | 'token' | 'free';
  contextWindow: number;
  maxTokens: number;
  isPrimary: boolean;
  cost: { input: number; output: number };
}

export interface BridgeResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}
