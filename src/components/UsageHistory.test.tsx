import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import UsageHistory from './UsageHistory';
import { saveData, loadData } from '../utils/storage';
import { AppData } from '../types';

beforeEach(() => {
  localStorage.clear();
  jest.restoreAllMocks();
});

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const MIN_MS = 60 * 1000;

function seedData(data: AppData) {
  saveData(data);
}

function makeSiteAndRecord(
  siteId: string,
  name: string,
  side: 'left' | 'right',
  recordId: string,
  timestamp: number
): AppData {
  return {
    sites: [{ id: siteId, name, side }],
    usageHistory: [{ id: recordId, siteId, timestamp }],
  };
}

describe('UsageHistory - empty state', () => {
  it('shows empty message when there is no usage history', () => {
    seedData({ sites: [], usageHistory: [] });
    render(<UsageHistory />);
    expect(screen.getByText('No usage history yet.')).toBeInTheDocument();
    expect(
      screen.getByText('Start tracking your infusion sites to see your history here.')
    ).toBeInTheDocument();
  });

  it('shows export and import buttons even when empty', () => {
    seedData({ sites: [], usageHistory: [] });
    render(<UsageHistory />);
    expect(screen.getByText('Export Data')).toBeInTheDocument();
    expect(screen.getByText('Import Data')).toBeInTheDocument();
  });
});

describe('UsageHistory - displaying records', () => {
  it('displays a record with site name, side, and time', () => {
    const now = Date.now();
    seedData({
      sites: [{ id: 's1', name: 'Arm', side: 'left' }],
      usageHistory: [{ id: 'r1', siteId: 's1', timestamp: now }],
    });
    render(<UsageHistory />);
    expect(screen.getByText('Arm (left)')).toBeInTheDocument();
  });

  it('shows total uses count', () => {
    const now = Date.now();
    seedData({
      sites: [{ id: 's1', name: 'Arm', side: 'left' }],
      usageHistory: [
        { id: 'r1', siteId: 's1', timestamp: now },
        { id: 'r2', siteId: 's1', timestamp: now - HOUR_MS },
      ],
    });
    render(<UsageHistory />);
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('shows "Unknown" for records with deleted sites', () => {
    const now = Date.now();
    seedData({
      sites: [],
      usageHistory: [{ id: 'r1', siteId: 'deleted-site', timestamp: now }],
    });
    render(<UsageHistory />);
    expect(screen.getByText('Unknown (Unknown)')).toBeInTheDocument();
  });

  it('groups records by date', () => {
    const now = Date.now();
    const yesterday = now - DAY_MS;
    seedData({
      sites: [{ id: 's1', name: 'Arm', side: 'left' }],
      usageHistory: [
        { id: 'r1', siteId: 's1', timestamp: now },
        { id: 'r2', siteId: 's1', timestamp: yesterday },
      ],
    });
    render(<UsageHistory />);
    // Should show two date group headers
    const dateHeaders = document.querySelectorAll('[style*="font-weight: bold"][style*="background-color"]');
    expect(dateHeaders.length).toBeGreaterThanOrEqual(2);
  });
});

describe('UsageHistory - relative time formatting', () => {
  it('shows "Just now" for very recent records', () => {
    const now = Date.now();
    seedData(makeSiteAndRecord('s1', 'Arm', 'left', 'r1', now));
    render(<UsageHistory />);
    expect(screen.getByText('Just now')).toBeInTheDocument();
  });

  it('shows minutes ago for records within the hour', () => {
    const now = Date.now();
    seedData(makeSiteAndRecord('s1', 'Arm', 'left', 'r1', now - 30 * MIN_MS));
    render(<UsageHistory />);
    expect(screen.getByText('30 minutes ago')).toBeInTheDocument();
  });

  it('shows hours ago for records within the day', () => {
    const now = Date.now();
    seedData(makeSiteAndRecord('s1', 'Arm', 'left', 'r1', now - 5 * HOUR_MS));
    render(<UsageHistory />);
    expect(screen.getByText('5 hours ago')).toBeInTheDocument();
  });

  it('shows "1 hour ago" singular', () => {
    const now = Date.now();
    seedData(makeSiteAndRecord('s1', 'Arm', 'left', 'r1', now - 1 * HOUR_MS));
    render(<UsageHistory />);
    expect(screen.getByText('1 hour ago')).toBeInTheDocument();
  });

  it('shows "Yesterday" for records from yesterday', () => {
    const now = Date.now();
    seedData(makeSiteAndRecord('s1', 'Arm', 'left', 'r1', now - 1 * DAY_MS));
    render(<UsageHistory />);
    expect(screen.getByText('Yesterday')).toBeInTheDocument();
  });

  it('shows "X days ago" for records within the week', () => {
    const now = Date.now();
    seedData(makeSiteAndRecord('s1', 'Arm', 'left', 'r1', now - 4 * DAY_MS));
    render(<UsageHistory />);
    expect(screen.getByText('4 days ago')).toBeInTheDocument();
  });

  it('shows date string for records older than a week', () => {
    const now = Date.now();
    const oldTimestamp = now - 10 * DAY_MS;
    const expectedDate = new Date(oldTimestamp).toLocaleDateString();
    seedData(makeSiteAndRecord('s1', 'Arm', 'left', 'r1', oldTimestamp));
    render(<UsageHistory />);
    // The date appears both as a group header and as the relative time
    const dateElements = screen.getAllByText(expectedDate);
    expect(dateElements.length).toBeGreaterThanOrEqual(1);
  });
});

describe('UsageHistory - delete record', () => {
  it('deletes a record when user confirms', () => {
    jest.spyOn(window, 'confirm').mockReturnValue(true);
    const now = Date.now();
    seedData(makeSiteAndRecord('s1', 'Arm', 'left', 'r1', now));
    render(<UsageHistory />);

    fireEvent.click(screen.getByText('Delete'));

    expect(window.confirm).toHaveBeenCalledWith(
      'Are you sure you want to delete this usage record?'
    );
    // After deletion, should show empty state
    expect(screen.getByText('No usage history yet.')).toBeInTheDocument();
    // Verify storage was updated
    expect(loadData().usageHistory).toHaveLength(0);
  });

  it('does not delete a record when user cancels', () => {
    jest.spyOn(window, 'confirm').mockReturnValue(false);
    const now = Date.now();
    seedData(makeSiteAndRecord('s1', 'Arm', 'left', 'r1', now));
    render(<UsageHistory />);

    fireEvent.click(screen.getByText('Delete'));

    expect(window.confirm).toHaveBeenCalled();
    // Record should still be visible
    expect(screen.getByText('Arm (left)')).toBeInTheDocument();
    expect(loadData().usageHistory).toHaveLength(1);
  });
});

describe('UsageHistory - inline editing', () => {
  it('opens edit form when clicking Edit', () => {
    const now = Date.now();
    seedData({
      sites: [
        { id: 's1', name: 'Arm', side: 'left' },
        { id: 's2', name: 'Arm', side: 'right' },
      ],
      usageHistory: [{ id: 'r1', siteId: 's1', timestamp: now }],
    });
    render(<UsageHistory />);

    fireEvent.click(screen.getByText('Edit'));

    expect(screen.getByText('Site:')).toBeInTheDocument();
    expect(screen.getByText('Date:')).toBeInTheDocument();
    expect(screen.getByText('Time:')).toBeInTheDocument();
    expect(screen.getByText('Save')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('populates edit form with record values', () => {
    const now = Date.now();
    seedData({
      sites: [{ id: 's1', name: 'Arm', side: 'left' }],
      usageHistory: [{ id: 'r1', siteId: 's1', timestamp: now }],
    });
    render(<UsageHistory />);

    fireEvent.click(screen.getByText('Edit'));

    const siteSelect = screen.getByRole('combobox') as HTMLSelectElement;
    expect(siteSelect.value).toBe('s1');

    const dateInput = screen.getByDisplayValue(
      `${new Date(now).getFullYear()}-${String(new Date(now).getMonth() + 1).padStart(2, '0')}-${String(new Date(now).getDate()).padStart(2, '0')}`
    );
    expect(dateInput).toBeInTheDocument();
  });

  it('cancels editing and restores display', () => {
    const now = Date.now();
    seedData(makeSiteAndRecord('s1', 'Arm', 'left', 'r1', now));
    render(<UsageHistory />);

    fireEvent.click(screen.getByText('Edit'));
    expect(screen.getByText('Cancel')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Cancel'));
    // Should be back to display mode
    expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
    expect(screen.getByText('Edit')).toBeInTheDocument();
  });

  it('saves edit and updates the record', () => {
    const now = Date.now();
    seedData({
      sites: [
        { id: 's1', name: 'Arm', side: 'left' },
        { id: 's2', name: 'Leg', side: 'right' },
      ],
      usageHistory: [{ id: 'r1', siteId: 's1', timestamp: now }],
    });
    render(<UsageHistory />);

    fireEvent.click(screen.getByText('Edit'));

    // Change site
    const siteSelect = screen.getByRole('combobox');
    fireEvent.change(siteSelect, { target: { value: 's2' } });

    // Change date
    const dateInput = screen.getByDisplayValue(
      `${new Date(now).getFullYear()}-${String(new Date(now).getMonth() + 1).padStart(2, '0')}-${String(new Date(now).getDate()).padStart(2, '0')}`
    );
    fireEvent.change(dateInput, { target: { value: '2025-06-15' } });

    // Change time
    const timeInput = document.querySelector('input[type="time"]') as HTMLInputElement;
    fireEvent.change(timeInput, { target: { value: '14:30' } });

    fireEvent.click(screen.getByText('Save'));

    // Should go back to display mode
    expect(screen.queryByText('Save')).not.toBeInTheDocument();
    // Verify storage was updated
    const data = loadData();
    expect(data.usageHistory[0].siteId).toBe('s2');
  });

  it('shows all available sites in the edit dropdown', () => {
    const now = Date.now();
    seedData({
      sites: [
        { id: 's1', name: 'Arm', side: 'left' },
        { id: 's2', name: 'Leg', side: 'right' },
        { id: 's3', name: 'Abdomen', side: 'left' },
      ],
      usageHistory: [{ id: 'r1', siteId: 's1', timestamp: now }],
    });
    render(<UsageHistory />);

    fireEvent.click(screen.getByText('Edit'));

    const options = screen.getAllByRole('option');
    // "Select a site" placeholder + 3 sites = 4
    expect(options).toHaveLength(4);
    expect(screen.getByText('Arm (left)')).toBeInTheDocument();
    expect(screen.getByText('Leg (right)')).toBeInTheDocument();
    expect(screen.getByText('Abdomen (left)')).toBeInTheDocument();
  });
});

describe('UsageHistory - export', () => {
  it('triggers download when Export Data is clicked', () => {
    const now = Date.now();
    seedData(makeSiteAndRecord('s1', 'Arm', 'left', 'r1', now));

    const createObjectURLMock = jest.fn(() => 'blob:test');
    const revokeObjectURLMock = jest.fn();
    global.URL.createObjectURL = createObjectURLMock;
    global.URL.revokeObjectURL = revokeObjectURLMock;

    render(<UsageHistory />);

    // Mock createElement AFTER render so React rendering isn't disrupted
    const clickMock = jest.fn();
    const origCreateElement = document.createElement.bind(document);
    jest.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'a') {
        const el = { click: clickMock, href: '', download: '' } as unknown as HTMLElement;
        return el as HTMLAnchorElement;
      }
      return origCreateElement(tag);
    });
    jest.spyOn(document.body, 'appendChild').mockImplementation((node) => node);
    jest.spyOn(document.body, 'removeChild').mockImplementation((node) => node);

    fireEvent.click(screen.getByText('Export Data'));

    expect(createObjectURLMock).toHaveBeenCalled();
    expect(clickMock).toHaveBeenCalled();
    expect(revokeObjectURLMock).toHaveBeenCalled();
  });
});

describe('UsageHistory - import', () => {
  function createFileWithContent(content: string): File {
    return new File([content], 'backup.json', { type: 'application/json' });
  }

  it('imports valid data and replaces current data', () => {
    seedData({ sites: [], usageHistory: [] });
    jest.spyOn(window, 'confirm').mockReturnValue(true);
    jest.spyOn(window, 'alert').mockImplementation(() => {});

    const importData: AppData = {
      sites: [{ id: 'imported-1', name: 'Imported Site', side: 'left' }],
      usageHistory: [{ id: 'ir1', siteId: 'imported-1', timestamp: Date.now() }],
    };

    render(<UsageHistory />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = createFileWithContent(JSON.stringify(importData));

    fireEvent.change(fileInput, { target: { files: [file] } });

    // FileReader is async, but jsdom fires it synchronously in tests
    // Verify import happened
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const data = loadData();
        expect(data.sites).toHaveLength(1);
        expect(data.sites[0].name).toBe('Imported Site');
        expect(window.alert).toHaveBeenCalledWith('Data imported successfully!');
        resolve();
      }, 100);
    });
  });

  it('shows error alert for invalid JSON', () => {
    seedData({ sites: [], usageHistory: [] });
    jest.spyOn(window, 'alert').mockImplementation(() => {});

    render(<UsageHistory />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = createFileWithContent('not valid json {{{');

    fireEvent.change(fileInput, { target: { files: [file] } });

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        expect(window.alert).toHaveBeenCalledWith(
          'Error importing data. Please check that the file is a valid JSON backup.'
        );
        resolve();
      }, 100);
    });
  });

  it('shows error alert for valid JSON with wrong schema', () => {
    seedData({ sites: [], usageHistory: [] });
    jest.spyOn(window, 'alert').mockImplementation(() => {});

    render(<UsageHistory />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    // Valid JSON but missing required fields
    const file = createFileWithContent(JSON.stringify({ foo: 'bar' }));

    fireEvent.change(fileInput, { target: { files: [file] } });

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        expect(window.alert).toHaveBeenCalledWith(
          'Invalid backup file. The file does not match the expected data format.'
        );
        resolve();
      }, 100);
    });
  });

  it('does not import when user cancels confirmation', () => {
    const now = Date.now();
    seedData(makeSiteAndRecord('s1', 'Arm', 'left', 'r1', now));
    jest.spyOn(window, 'confirm').mockReturnValue(false);
    jest.spyOn(window, 'alert').mockImplementation(() => {});

    const importData: AppData = {
      sites: [{ id: 'new-1', name: 'New Site', side: 'right' }],
      usageHistory: [],
    };

    render(<UsageHistory />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = createFileWithContent(JSON.stringify(importData));

    fireEvent.change(fileInput, { target: { files: [file] } });

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        // Original data should still be there
        const data = loadData();
        expect(data.sites[0].name).toBe('Arm');
        resolve();
      }, 100);
    });
  });

  it('rejects data with invalid site structure', () => {
    seedData({ sites: [], usageHistory: [] });
    jest.spyOn(window, 'alert').mockImplementation(() => {});

    render(<UsageHistory />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    // sites array with objects missing required fields
    const badData = {
      sites: [{ id: 'x', name: 'Test' }], // missing 'side'
      usageHistory: [],
    };
    const file = createFileWithContent(JSON.stringify(badData));

    fireEvent.change(fileInput, { target: { files: [file] } });

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        expect(window.alert).toHaveBeenCalledWith(
          'Invalid backup file. The file does not match the expected data format.'
        );
        resolve();
      }, 100);
    });
  });

  it('rejects data with invalid usage record structure', () => {
    seedData({ sites: [], usageHistory: [] });
    jest.spyOn(window, 'alert').mockImplementation(() => {});

    render(<UsageHistory />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const badData = {
      sites: [{ id: 'x', name: 'Test', side: 'left' }],
      usageHistory: [{ id: 'r1', siteId: 'x' }], // missing 'timestamp'
    };
    const file = createFileWithContent(JSON.stringify(badData));

    fireEvent.change(fileInput, { target: { files: [file] } });

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        expect(window.alert).toHaveBeenCalledWith(
          'Invalid backup file. The file does not match the expected data format.'
        );
        resolve();
      }, 100);
    });
  });
});
