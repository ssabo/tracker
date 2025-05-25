export interface InfusionSite {
  id: string;
  name: string;
  side: 'left' | 'right';
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