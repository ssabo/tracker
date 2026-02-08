import { loadData, saveData, addSite, deleteSite, recordUsage, getUsageHistory, deleteUsageRecord, updateUsageRecord, suspendSite, unsuspendSite, isSiteSuspended, groupSitesByName } from './storage';
import { InfusionSite } from '../types';

const STORAGE_KEY = 'infusion-site-tracker';

beforeEach(() => {
  localStorage.clear();
});

describe('suspendSite', () => {
  it('suspends a site with a timed duration', () => {
    addSite('Arm', 'left');
    const data = loadData();
    const site = data.sites[0];

    const before = Date.now();
    suspendSite(site.id, 3 * 24 * 60 * 60 * 1000); // 3 days
    const after = Date.now();

    const updated = loadData().sites[0];
    expect(updated.suspension).toBeDefined();
    expect(updated.suspension!.suspendedAt).toBeGreaterThanOrEqual(before);
    expect(updated.suspension!.suspendedAt).toBeLessThanOrEqual(after);
    expect(updated.suspension!.resumeAt).toBeGreaterThan(after);
  });

  it('suspends a site indefinitely when duration is null', () => {
    addSite('Arm', 'left');
    const site = loadData().sites[0];

    suspendSite(site.id, null);

    const updated = loadData().sites[0];
    expect(updated.suspension).toBeDefined();
    expect(updated.suspension!.resumeAt).toBeNull();
  });

  it('does nothing for a non-existent site id', () => {
    addSite('Arm', 'left');
    suspendSite('non-existent-id', null);

    const updated = loadData().sites[0];
    expect(updated.suspension).toBeUndefined();
  });

  it('overwrites an existing suspension', () => {
    addSite('Arm', 'left');
    const site = loadData().sites[0];

    suspendSite(site.id, null);
    expect(loadData().sites[0].suspension!.resumeAt).toBeNull();

    suspendSite(site.id, 1000);
    expect(loadData().sites[0].suspension!.resumeAt).not.toBeNull();
  });
});

describe('unsuspendSite', () => {
  it('removes suspension from a suspended site', () => {
    addSite('Arm', 'left');
    const site = loadData().sites[0];

    suspendSite(site.id, null);
    expect(loadData().sites[0].suspension).toBeDefined();

    unsuspendSite(site.id);
    expect(loadData().sites[0].suspension).toBeUndefined();
  });

  it('is a no-op on a site that is not suspended', () => {
    addSite('Arm', 'left');
    const site = loadData().sites[0];

    unsuspendSite(site.id);
    expect(loadData().sites[0].suspension).toBeUndefined();
  });

  it('does nothing for a non-existent site id', () => {
    addSite('Arm', 'left');
    unsuspendSite('non-existent-id');
    expect(loadData().sites[0].suspension).toBeUndefined();
  });
});

describe('isSiteSuspended', () => {
  it('returns false for a site with no suspension', () => {
    const site: InfusionSite = { id: 'test', name: 'Arm', side: 'left' };
    expect(isSiteSuspended(site)).toBe(false);
  });

  it('returns true for an indefinitely suspended site', () => {
    addSite('Arm', 'left');
    const site = loadData().sites[0];
    suspendSite(site.id, null);

    const updated = loadData().sites[0];
    expect(isSiteSuspended(updated)).toBe(true);
  });

  it('returns true for a site with future resumeAt', () => {
    addSite('Arm', 'left');
    const site = loadData().sites[0];
    suspendSite(site.id, 60 * 60 * 1000); // 1 hour from now

    const updated = loadData().sites[0];
    expect(isSiteSuspended(updated)).toBe(true);
  });

  it('returns false and auto-clears expired suspension', () => {
    addSite('Arm', 'left');
    const site = loadData().sites[0];

    // Manually set a suspension that already expired
    const data = loadData();
    data.sites[0].suspension = {
      suspendedAt: Date.now() - 2000,
      resumeAt: Date.now() - 1000, // 1 second ago
    };
    saveData(data);

    const updated = loadData().sites[0];
    expect(isSiteSuspended(updated)).toBe(false);

    // Verify the suspension was auto-cleared in storage
    const afterClear = loadData().sites[0];
    expect(afterClear.suspension).toBeUndefined();
  });

  it('only suspends the targeted side, not the other', () => {
    addSite('Arm', 'both');
    const data = loadData();
    const leftSite = data.sites.find(s => s.side === 'left')!;
    const rightSite = data.sites.find(s => s.side === 'right')!;

    suspendSite(leftSite.id, null);

    const updatedData = loadData();
    const updatedLeft = updatedData.sites.find(s => s.id === leftSite.id)!;
    const updatedRight = updatedData.sites.find(s => s.id === rightSite.id)!;

    expect(isSiteSuspended(updatedLeft)).toBe(true);
    expect(isSiteSuspended(updatedRight)).toBe(false);
  });
});

describe('loadData', () => {
  it('returns default data when localStorage is empty', () => {
    const data = loadData();
    expect(data.sites).toEqual([]);
    expect(data.usageHistory).toEqual([]);
  });

  it('returns default data when localStorage contains invalid JSON', () => {
    localStorage.setItem(STORAGE_KEY, 'not valid json {{{');
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const data = loadData();
    expect(data.sites).toEqual([]);
    expect(data.usageHistory).toEqual([]);
    consoleSpy.mockRestore();
  });

  it('returns stored data when valid', () => {
    const stored = {
      sites: [{ id: 's1', name: 'Arm', side: 'left' }],
      usageHistory: [{ id: 'r1', siteId: 's1', timestamp: 123 }],
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    const data = loadData();
    expect(data.sites).toHaveLength(1);
    expect(data.usageHistory).toHaveLength(1);
  });
});

describe('saveData', () => {
  it('persists data to localStorage', () => {
    const data = {
      sites: [{ id: 's1', name: 'Arm', side: 'left' as const }],
      usageHistory: [],
    };
    saveData(data);
    const raw = localStorage.getItem(STORAGE_KEY);
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw!)).toEqual(data);
  });

  it('handles localStorage errors gracefully', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const setItemSpy = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    saveData({ sites: [], usageHistory: [] });
    expect(consoleSpy).toHaveBeenCalled();
    setItemSpy.mockRestore();
    consoleSpy.mockRestore();
  });
});

describe('addSite', () => {
  it('adds a single left site', () => {
    addSite('Arm', 'left');
    const data = loadData();
    expect(data.sites).toHaveLength(1);
    expect(data.sites[0].name).toBe('Arm');
    expect(data.sites[0].side).toBe('left');
    expect(data.sites[0].id).toBeTruthy();
  });

  it('adds both left and right when side is "both"', () => {
    addSite('Leg', 'both');
    const data = loadData();
    expect(data.sites).toHaveLength(2);
    const sides = data.sites.map(s => s.side).sort();
    expect(sides).toEqual(['left', 'right']);
    expect(data.sites[0].name).toBe('Leg');
    expect(data.sites[1].name).toBe('Leg');
  });

  it('generates unique IDs for each site', () => {
    addSite('Arm', 'both');
    const data = loadData();
    expect(data.sites[0].id).not.toBe(data.sites[1].id);
  });
});

describe('deleteSite', () => {
  it('removes the site from the sites array', () => {
    addSite('Arm', 'left');
    const site = loadData().sites[0];
    deleteSite(site.id);
    expect(loadData().sites).toHaveLength(0);
  });

  it('also removes all usage records for that site', () => {
    addSite('Arm', 'left');
    const site = loadData().sites[0];
    recordUsage(site.id);
    recordUsage(site.id);
    expect(loadData().usageHistory).toHaveLength(2);

    deleteSite(site.id);
    expect(loadData().usageHistory).toHaveLength(0);
  });

  it('does not affect other sites or their records', () => {
    addSite('Arm', 'left');
    addSite('Leg', 'right');
    const data = loadData();
    const arm = data.sites.find(s => s.name === 'Arm')!;
    const leg = data.sites.find(s => s.name === 'Leg')!;
    recordUsage(arm.id);
    recordUsage(leg.id);

    deleteSite(arm.id);
    const after = loadData();
    expect(after.sites).toHaveLength(1);
    expect(after.sites[0].name).toBe('Leg');
    expect(after.usageHistory).toHaveLength(1);
    expect(after.usageHistory[0].siteId).toBe(leg.id);
  });
});

describe('recordUsage', () => {
  it('creates a usage record for the given site', () => {
    addSite('Arm', 'left');
    const site = loadData().sites[0];

    const before = Date.now();
    recordUsage(site.id);
    const after = Date.now();

    const data = loadData();
    expect(data.usageHistory).toHaveLength(1);
    expect(data.usageHistory[0].siteId).toBe(site.id);
    expect(data.usageHistory[0].timestamp).toBeGreaterThanOrEqual(before);
    expect(data.usageHistory[0].timestamp).toBeLessThanOrEqual(after);
    expect(data.usageHistory[0].id).toBeTruthy();
  });

  it('appends to existing history', () => {
    addSite('Arm', 'left');
    const site = loadData().sites[0];
    recordUsage(site.id);
    recordUsage(site.id);
    recordUsage(site.id);
    expect(loadData().usageHistory).toHaveLength(3);
  });
});

describe('getUsageHistory', () => {
  it('returns enriched records with site name and side', () => {
    addSite('Arm', 'left');
    const site = loadData().sites[0];
    recordUsage(site.id);

    const history = getUsageHistory();
    expect(history).toHaveLength(1);
    expect(history[0].siteName).toBe('Arm');
    expect(history[0].siteSide).toBe('left');
  });

  it('returns "Unknown" for orphaned records', () => {
    const data = loadData();
    data.usageHistory.push({ id: 'r1', siteId: 'deleted-site', timestamp: Date.now() });
    saveData(data);

    const history = getUsageHistory();
    expect(history[0].siteName).toBe('Unknown');
    expect(history[0].siteSide).toBe('Unknown');
  });

  it('returns records sorted by timestamp descending (newest first)', () => {
    addSite('Arm', 'left');
    const site = loadData().sites[0];
    const data = loadData();
    data.usageHistory = [
      { id: 'r1', siteId: site.id, timestamp: 100 },
      { id: 'r2', siteId: site.id, timestamp: 300 },
      { id: 'r3', siteId: site.id, timestamp: 200 },
    ];
    saveData(data);

    const history = getUsageHistory();
    expect(history[0].id).toBe('r2');
    expect(history[1].id).toBe('r3');
    expect(history[2].id).toBe('r1');
  });

  it('returns empty array when no history exists', () => {
    expect(getUsageHistory()).toEqual([]);
  });
});

describe('deleteUsageRecord', () => {
  it('removes the specified record', () => {
    addSite('Arm', 'left');
    const site = loadData().sites[0];
    recordUsage(site.id);
    const recordId = loadData().usageHistory[0].id;

    deleteUsageRecord(recordId);
    expect(loadData().usageHistory).toHaveLength(0);
  });

  it('does not affect other records', () => {
    addSite('Arm', 'left');
    const site = loadData().sites[0];
    recordUsage(site.id);
    recordUsage(site.id);
    const records = loadData().usageHistory;

    deleteUsageRecord(records[0].id);
    const after = loadData();
    expect(after.usageHistory).toHaveLength(1);
    expect(after.usageHistory[0].id).toBe(records[1].id);
  });
});

describe('updateUsageRecord', () => {
  it('updates siteId and timestamp of a record', () => {
    addSite('Arm', 'both');
    const data = loadData();
    const leftSite = data.sites.find(s => s.side === 'left')!;
    const rightSite = data.sites.find(s => s.side === 'right')!;
    recordUsage(leftSite.id);
    const recordId = loadData().usageHistory[0].id;

    updateUsageRecord(recordId, rightSite.id, 999999);

    const updated = loadData().usageHistory[0];
    expect(updated.siteId).toBe(rightSite.id);
    expect(updated.timestamp).toBe(999999);
  });

  it('does nothing for a non-existent record id', () => {
    addSite('Arm', 'left');
    const site = loadData().sites[0];
    recordUsage(site.id);
    const before = loadData();

    updateUsageRecord('non-existent', 'other-site', 0);

    const after = loadData();
    expect(after.usageHistory).toEqual(before.usageHistory);
  });
});

describe('groupSitesByName', () => {
  it('groups sites by name with left and right slots', () => {
    const sites: InfusionSite[] = [
      { id: 's1', name: 'Arm', side: 'left' },
      { id: 's2', name: 'Arm', side: 'right' },
    ];
    const grouped = groupSitesByName(sites);
    expect(grouped['Arm'].left?.id).toBe('s1');
    expect(grouped['Arm'].right?.id).toBe('s2');
  });

  it('handles sites with only one side', () => {
    const sites: InfusionSite[] = [
      { id: 's1', name: 'Arm', side: 'left' },
    ];
    const grouped = groupSitesByName(sites);
    expect(grouped['Arm'].left?.id).toBe('s1');
    expect(grouped['Arm'].right).toBeNull();
  });

  it('groups multiple site names independently', () => {
    const sites: InfusionSite[] = [
      { id: 's1', name: 'Arm', side: 'left' },
      { id: 's2', name: 'Leg', side: 'right' },
    ];
    const grouped = groupSitesByName(sites);
    expect(Object.keys(grouped)).toHaveLength(2);
    expect(grouped['Arm'].left?.id).toBe('s1');
    expect(grouped['Arm'].right).toBeNull();
    expect(grouped['Leg'].left).toBeNull();
    expect(grouped['Leg'].right?.id).toBe('s2');
  });

  it('returns empty object for empty array', () => {
    expect(groupSitesByName([])).toEqual({});
  });
});

describe('backward compatibility', () => {
  it('loads data without suspension fields correctly', () => {
    const legacyData = {
      sites: [{ id: 'old-1', name: 'Abdomen', side: 'left' }],
      usageHistory: [],
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(legacyData));

    const data = loadData();
    expect(data.sites[0].suspension).toBeUndefined();
    expect(isSiteSuspended(data.sites[0])).toBe(false);
  });
});
