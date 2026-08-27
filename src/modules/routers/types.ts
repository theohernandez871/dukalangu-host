export type RouterStatus = 'unknown' | 'online' | 'offline' | 'error';

export interface Router {
  id: string;
  name: string;
  host: string;
  apiPort: number;
  apiSslPort: number | null;
  username: string;
  location: string | null;
  status: RouterStatus;
  createdAt: string;
}

export interface RouterHealth {
  routerId: string;
  rosVersion: string | null;
  uptime: string | null;
  cpuLoad: number | null;
  freeMemory: number | null;
  totalMemory: number | null;
  activeUsers: number | null;
  apiOk: boolean | null;
  lastSync: string | null;
  lastError: string | null;
}

export interface RouterInput {
  name: string;
  host: string;
  apiPort: number;
  apiSslPort?: number | null;
  username: string;
  password: string;
  location?: string;
}
