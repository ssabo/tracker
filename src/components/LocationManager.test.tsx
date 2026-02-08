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
