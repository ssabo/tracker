import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import LocationManager from './LocationManager';
import { saveData, loadData } from '../utils/storage';
import { AppData } from '../types';

beforeEach(() => {
  localStorage.clear();
  jest.restoreAllMocks();
});

function seedData(data: AppData) {
  saveData(data);
}

describe('LocationManager - suspension UI', () => {
  it('shows Suspend button for active sites', () => {
    seedData({
      sites: [
        { id: 's1', name: 'Arm', side: 'left' },
        { id: 's2', name: 'Arm', side: 'right' },
      ],
      usageHistory: [],
    });

    render(<LocationManager />);

    const suspendButtons = screen.getAllByText('Suspend');
    expect(suspendButtons).toHaveLength(2);
  });

  it('shows Resume button and status for suspended sites', () => {
    seedData({
      sites: [
        { id: 's1', name: 'Arm', side: 'left', suspension: { suspendedAt: Date.now(), resumeAt: null } },
        { id: 's2', name: 'Arm', side: 'right' },
      ],
      usageHistory: [],
    });

    render(<LocationManager />);

    expect(screen.getByText('Resume')).toBeInTheDocument();
    expect(screen.getByText('Suspended indefinitely')).toBeInTheDocument();
    expect(screen.getByText('Suspend')).toBeInTheDocument();
  });

  it('shows timed suspension status with date', () => {
    const resumeAt = Date.now() + 14 * 24 * 60 * 60 * 1000;
    const expectedDate = new Date(resumeAt).toLocaleDateString();

    seedData({
      sites: [
        { id: 's1', name: 'Arm', side: 'left', suspension: { suspendedAt: Date.now(), resumeAt } },
      ],
      usageHistory: [],
    });

    render(<LocationManager />);

    expect(screen.getByText(`Suspended until ${expectedDate}`)).toBeInTheDocument();
    expect(screen.getByText('Resume')).toBeInTheDocument();
  });

  it('clicking Suspend opens duration picker with presets', () => {
    seedData({
      sites: [{ id: 's1', name: 'Arm', side: 'left' }],
      usageHistory: [],
    });

    render(<LocationManager />);

    fireEvent.click(screen.getByText('Suspend'));

    expect(screen.getByText('Suspend for:')).toBeInTheDocument();
    expect(screen.getByText('3 days')).toBeInTheDocument();
    expect(screen.getByText('2 weeks')).toBeInTheDocument();
    expect(screen.getByText('1 month')).toBeInTheDocument();
    expect(screen.getByText('2 months')).toBeInTheDocument();
    expect(screen.getByText('Until I resume')).toBeInTheDocument();
  });

  it('clicking a preset duration suspends the site', () => {
    seedData({
      sites: [{ id: 's1', name: 'Arm', side: 'left' }],
      usageHistory: [],
    });

    render(<LocationManager />);

    fireEvent.click(screen.getByText('Suspend'));
    fireEvent.click(screen.getByText('3 days'));

    expect(screen.getByText('Resume')).toBeInTheDocument();

    const data = loadData();
    expect(data.sites[0].suspension).toBeDefined();
    expect(data.sites[0].suspension!.resumeAt).not.toBeNull();
  });

  it('clicking "Until I resume" suspends indefinitely', () => {
    seedData({
      sites: [{ id: 's1', name: 'Arm', side: 'left' }],
      usageHistory: [],
    });

    render(<LocationManager />);

    fireEvent.click(screen.getByText('Suspend'));
    fireEvent.click(screen.getByText('Until I resume'));

    expect(screen.getByText('Suspended indefinitely')).toBeInTheDocument();

    const data = loadData();
    expect(data.sites[0].suspension!.resumeAt).toBeNull();
  });

  it('clicking Resume unsuspends the site', () => {
    seedData({
      sites: [
        { id: 's1', name: 'Arm', side: 'left', suspension: { suspendedAt: Date.now(), resumeAt: null } },
      ],
      usageHistory: [],
    });

    render(<LocationManager />);

    expect(screen.getByText('Resume')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Resume'));

    expect(screen.getByText('Suspend')).toBeInTheDocument();
    expect(screen.queryByText('Resume')).not.toBeInTheDocument();

    const data = loadData();
    expect(data.sites[0].suspension).toBeUndefined();
  });

  it('toggling Suspend button opens and closes the duration picker', () => {
    seedData({
      sites: [{ id: 's1', name: 'Arm', side: 'left' }],
      usageHistory: [],
    });

    render(<LocationManager />);

    fireEvent.click(screen.getByText('Suspend'));
    expect(screen.getByText('Suspend for:')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Suspend'));
    expect(screen.queryByText('Suspend for:')).not.toBeInTheDocument();
  });

  it('custom duration input suspends the site', () => {
    seedData({
      sites: [{ id: 's1', name: 'Arm', side: 'left' }],
      usageHistory: [],
    });

    render(<LocationManager />);

    fireEvent.click(screen.getByText('Suspend'));

    const numberInput = screen.getByPlaceholderText('#');
    fireEvent.change(numberInput, { target: { value: '5' } });
    fireEvent.click(screen.getByText('Apply'));

    expect(screen.getByText('Resume')).toBeInTheDocument();

    const data = loadData();
    expect(data.sites[0].suspension).toBeDefined();
    expect(data.sites[0].suspension!.resumeAt).not.toBeNull();
  });

  it('Apply button is disabled when custom amount is empty', () => {
    seedData({
      sites: [{ id: 's1', name: 'Arm', side: 'left' }],
      usageHistory: [],
    });

    render(<LocationManager />);

    fireEvent.click(screen.getByText('Suspend'));

    const applyButton = screen.getByText('Apply');
    expect(applyButton).toBeDisabled();
  });

  it('suspending one side does not affect the other side', () => {
    seedData({
      sites: [
        { id: 's1', name: 'Arm', side: 'left' },
        { id: 's2', name: 'Arm', side: 'right' },
      ],
      usageHistory: [],
    });

    render(<LocationManager />);

    const suspendButtons = screen.getAllByText('Suspend');
    fireEvent.click(suspendButtons[0]);
    fireEvent.click(screen.getByText('Until I resume'));

    expect(screen.getByText('Resume')).toBeInTheDocument();
    expect(screen.getByText('Suspend')).toBeInTheDocument();
    expect(screen.getByText('Suspended indefinitely')).toBeInTheDocument();

    const data = loadData();
    const left = data.sites.find(s => s.id === 's1')!;
    const right = data.sites.find(s => s.id === 's2')!;
    expect(left.suspension).toBeDefined();
    expect(right.suspension).toBeUndefined();
  });

  it('Delete button is still available on suspended sites', () => {
    seedData({
      sites: [
        { id: 's1', name: 'Arm', side: 'left', suspension: { suspendedAt: Date.now(), resumeAt: null } },
      ],
      usageHistory: [],
    });

    render(<LocationManager />);

    expect(screen.getByText('Delete')).toBeInTheDocument();
    expect(screen.getByText('Resume')).toBeInTheDocument();
  });
});

describe('LocationManager - adding sites', () => {
  it('adds a new site with both sides', () => {
    seedData({ sites: [], usageHistory: [] });
    render(<LocationManager />);

    const nameInput = screen.getByPlaceholderText('e.g., Abdomen, Arm, Thigh');
    fireEvent.change(nameInput, { target: { value: 'Thigh' } });

    const form = nameInput.closest('form')!;
    fireEvent.submit(form);

    const data = loadData();
    expect(data.sites).toHaveLength(2);
    expect(data.sites[0].name).toBe('Thigh');
    expect(data.sites[1].name).toBe('Thigh');
    const sides = data.sites.map(s => s.side).sort();
    expect(sides).toEqual(['left', 'right']);
  });

  it('adds a single left side', () => {
    seedData({ sites: [], usageHistory: [] });
    render(<LocationManager />);

    const nameInput = screen.getByPlaceholderText('e.g., Abdomen, Arm, Thigh');
    fireEvent.change(nameInput, { target: { value: 'Arm' } });

    const sideSelect = screen.getByDisplayValue('Both');
    fireEvent.change(sideSelect, { target: { value: 'left' } });

    const form = nameInput.closest('form')!;
    fireEvent.submit(form);

    const data = loadData();
    expect(data.sites).toHaveLength(1);
    expect(data.sites[0].side).toBe('left');
  });

  it('clears form after adding', () => {
    seedData({ sites: [], usageHistory: [] });
    render(<LocationManager />);

    const nameInput = screen.getByPlaceholderText('e.g., Abdomen, Arm, Thigh') as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: 'Arm' } });

    const form = nameInput.closest('form')!;
    fireEvent.submit(form);

    expect(nameInput.value).toBe('');
  });

  it('does not add site with empty name', () => {
    seedData({ sites: [], usageHistory: [] });
    render(<LocationManager />);

    const nameInput = screen.getByPlaceholderText('e.g., Abdomen, Arm, Thigh');
    fireEvent.change(nameInput, { target: { value: '   ' } });

    const form = nameInput.closest('form')!;
    fireEvent.submit(form);

    expect(loadData().sites).toHaveLength(0);
  });
});

describe('LocationManager - deleting sites', () => {
  it('deletes a site when user confirms', () => {
    seedData({
      sites: [{ id: 's1', name: 'Arm', side: 'left' }],
      usageHistory: [],
    });
    render(<LocationManager />);

    fireEvent.click(screen.getByText('Delete'));

    // Should show confirm modal
    expect(screen.getByText('Delete Site')).toBeInTheDocument();
    expect(screen.getByText(/This will also remove all usage history/)).toBeInTheDocument();

    // Confirm deletion - find all Delete buttons and click the one in the modal (the second one)
    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[1]);

    expect(loadData().sites).toHaveLength(0);
  });

  it('does not delete when user cancels', () => {
    seedData({
      sites: [{ id: 's1', name: 'Arm', side: 'left' }],
      usageHistory: [],
    });
    render(<LocationManager />);

    fireEvent.click(screen.getByText('Delete'));

    // Should show confirm modal
    expect(screen.getByText('Delete Site')).toBeInTheDocument();

    // Cancel deletion
    fireEvent.click(screen.getByText('Cancel'));

    expect(loadData().sites).toHaveLength(1);
  });
});

describe('LocationManager - empty state', () => {
  it('shows "No sites added yet" when empty', () => {
    seedData({ sites: [], usageHistory: [] });
    render(<LocationManager />);
    expect(screen.getByText('No sites added yet')).toBeInTheDocument();
  });
});

describe('LocationManager - not configured side', () => {
  it('shows "Not configured" for missing side', () => {
    seedData({
      sites: [{ id: 's1', name: 'Arm', side: 'left' }],
      usageHistory: [],
    });
    render(<LocationManager />);
    expect(screen.getByText('Not configured')).toBeInTheDocument();
  });
});

describe('LocationManager - custom duration units', () => {
  it('suspends with weeks unit', () => {
    seedData({
      sites: [{ id: 's1', name: 'Arm', side: 'left' }],
      usageHistory: [],
    });
    render(<LocationManager />);

    fireEvent.click(screen.getByText('Suspend'));

    const numberInput = screen.getByPlaceholderText('#');
    fireEvent.change(numberInput, { target: { value: '2' } });

    const unitSelect = screen.getByDisplayValue('days');
    fireEvent.change(unitSelect, { target: { value: 'weeks' } });

    fireEvent.click(screen.getByText('Apply'));

    const data = loadData();
    expect(data.sites[0].suspension).toBeDefined();
    // 2 weeks = 14 days in ms
    const expectedMs = 2 * 7 * 24 * 60 * 60 * 1000;
    const actualDuration = data.sites[0].suspension!.resumeAt! - data.sites[0].suspension!.suspendedAt;
    expect(Math.abs(actualDuration - expectedMs)).toBeLessThan(1000);
  });

  it('suspends with months unit', () => {
    seedData({
      sites: [{ id: 's1', name: 'Arm', side: 'left' }],
      usageHistory: [],
    });
    render(<LocationManager />);

    fireEvent.click(screen.getByText('Suspend'));

    const numberInput = screen.getByPlaceholderText('#');
    fireEvent.change(numberInput, { target: { value: '1' } });

    const unitSelect = screen.getByDisplayValue('days');
    fireEvent.change(unitSelect, { target: { value: 'months' } });

    fireEvent.click(screen.getByText('Apply'));

    const data = loadData();
    expect(data.sites[0].suspension).toBeDefined();
    // 1 month = 30 days in ms
    const expectedMs = 30 * 24 * 60 * 60 * 1000;
    const actualDuration = data.sites[0].suspension!.resumeAt! - data.sites[0].suspension!.suspendedAt;
    expect(Math.abs(actualDuration - expectedMs)).toBeLessThan(1000);
  });
});
