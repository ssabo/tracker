import { AppData, InfusionSite, UsageRecord } from '../types';

const STORAGE_KEY = 'infusion-site-tracker';

const getDefaultData = (): AppData => ({
  sites: [],
  usageHistory: []
});

export const loadData = (): AppData => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : getDefaultData();
  } catch (error) {
    console.error('Error loading data from localStorage:', error);
    return getDefaultData();
  }
};

export const saveData = (data: AppData): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving data to localStorage:', error);
  }
};

export const addSite = (name: string, side: 'left' | 'right' | 'both'): void => {
  const data = loadData();
  const sides: ('left' | 'right')[] = side === 'both' ? ['left', 'right'] : [side];
  for (const s of sides) {
    data.sites.push({
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      name,
      side: s
    });
  }
  saveData(data);
};

export const deleteSite = (siteId: string): void => {
  const data = loadData();
  data.sites = data.sites.filter(site => site.id !== siteId);
  data.usageHistory = data.usageHistory.filter(record => record.siteId !== siteId);
  saveData(data);
};

export const recordUsage = (siteId: string): void => {
  const data = loadData();
  const newRecord: UsageRecord = {
    id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    siteId,
    timestamp: Date.now()
  };
  data.usageHistory.push(newRecord);
  saveData(data);
};

export const getUsageHistory = (): (UsageRecord & { siteName: string; siteSide: string })[] => {
  const data = loadData();
  return data.usageHistory
    .map(record => {
      const site = data.sites.find(s => s.id === record.siteId);
      return {
        ...record,
        siteName: site?.name || 'Unknown',
        siteSide: site?.side || 'Unknown'
      };
    })
    .sort((a, b) => b.timestamp - a.timestamp);
};

export const deleteUsageRecord = (recordId: string): void => {
  const data = loadData();
  data.usageHistory = data.usageHistory.filter(record => record.id !== recordId);
  saveData(data);
};

export const updateUsageRecord = (recordId: string, newSiteId: string, newTimestamp: number): void => {
  const data = loadData();
  const recordIndex = data.usageHistory.findIndex(record => record.id === recordId);
  if (recordIndex !== -1) {
    data.usageHistory[recordIndex] = {
      ...data.usageHistory[recordIndex],
      siteId: newSiteId,
      timestamp: newTimestamp
    };
    saveData(data);
  }
};

export const isSiteSuspended = (site: InfusionSite): boolean => {
  if (!site.suspension) return false;
  if (site.suspension.resumeAt === null) return true;
  if (site.suspension.resumeAt > Date.now()) return true;
  // Suspension has expired — auto-clear it
  const data = loadData();
  const stored = data.sites.find(s => s.id === site.id);
  if (stored) {
    delete stored.suspension;
    saveData(data);
  }
  return false;
};

export const suspendSite = (siteId: string, durationMs: number | null): void => {
  const data = loadData();
  const site = data.sites.find(s => s.id === siteId);
  if (site) {
    const now = Date.now();
    site.suspension = {
      suspendedAt: now,
      resumeAt: durationMs !== null ? now + durationMs : null,
    };
    saveData(data);
  }
};

export const unsuspendSite = (siteId: string): void => {
  const data = loadData();
  const site = data.sites.find(s => s.id === siteId);
  if (site) {
    delete site.suspension;
    saveData(data);
  }
};

export const groupSitesByName = <T extends InfusionSite>(
  sites: T[]
): Record<string, { left: T | null; right: T | null }> => {
  return sites.reduce((acc, site) => {
    if (!acc[site.name]) {
      acc[site.name] = { left: null, right: null };
    }
    acc[site.name][site.side] = site;
    return acc;
  }, {} as Record<string, { left: T | null; right: T | null }>);
};