import { loadData, saveData, addSite, suspendSite, unsuspendSite, isSiteSuspended } from './storage';
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
