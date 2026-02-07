export interface Suspension {
  suspendedAt: number;
  resumeAt: number | null; // null = indefinite (manual resume only)
}

export interface InfusionSite {
  id: string;
  name: string;
  side: 'left' | 'right';
  suspension?: Suspension;
}

export interface UsageRecord {
  id: string;
  siteId: string;
  timestamp: number;
}

export interface AppData {
  sites: InfusionSite[];
  usageHistory: UsageRecord[];
}