import Constants from 'expo-constants';
import type { GameMode } from '../quiz/gameModes';

export interface AttemptPayload {
  clientId: string;
  deckName: string;
  score: number;
  totalQuestions: number;
  durationMinutes: number;
  timeTakenSeconds: number;
  points: number;
  completedAt: string;
  gameMode: GameMode;
}

export interface PullResponse {
  activeDays: string[];
  attempts: AttemptPayload[];
}

export interface PairStartResponse {
  accountId: string;
  syncSecret: string;
  pairingCode: string;
  expiresAt: string;
}

export interface PairJoinResponse {
  accountId: string;
  syncSecret: string;
}

function getApiBaseUrl(): string {
  const url = Constants.expoConfig?.extra?.syncApiUrl;
  if (typeof url !== 'string' || !url) {
    throw new Error('syncApiUrl não configurado em app.json (extra.syncApiUrl)');
  }
  return url;
}

async function request<T>(
  path: string,
  options: { method?: string; secret?: string; body?: unknown } = {}
): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.secret ? { Authorization: `Bearer ${options.secret}` } : {}),
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(errorBody?.error ?? `Erro de sincronização (${response.status})`);
  }

  return response.json() as Promise<T>;
}

export function pairStart(): Promise<PairStartResponse> {
  return request('/pair/start', { method: 'POST' });
}

export function pairJoin(code: string): Promise<PairJoinResponse> {
  return request('/pair/join', { method: 'POST', body: { code } });
}

export function syncPush(
  secret: string,
  payload: { activeDays: string[]; attempts: AttemptPayload[] }
): Promise<{ ok: true }> {
  return request('/sync/push', { method: 'POST', secret, body: payload });
}

export function syncPull(secret: string): Promise<PullResponse> {
  return request('/sync/pull', { secret });
}
