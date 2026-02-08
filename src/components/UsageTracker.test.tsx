import React from 'react';
import { render, screen } from '@testing-library/react';
import UsageTracker from './UsageTracker';
import { saveData } from '../utils/storage';
import { AppData } from '../types';

beforeEach(() => {
  localStorage.clear();
});

const DAY_MS = 24 * 60 * 60 * 1000;

function seedData(data: AppData) {
  saveData(data);
}

function getHiddenRadios(): HTMLInputElement[] {
  const container = document.querySelector('form');
  if (!container) return [];
  return Array.from(container.querySelectorAll('input[type="radio"]'));
}

describe('UsageTracker - suspension rendering', () => {
  it('shows suspended site with suspension label and not as a selectable radio', () => {
    seedData({
      sites: [
        { id: 's1', name: 'Arm', side: 'left', suspension: { suspendedAt: Date.now(), resumeAt: null } },
        { id: 's2', name: 'Arm', side: 'right' },
      ],
      usageHistory: [],
    });

    render(<UsageTracker />);

    expect(screen.getByText('Suspended indefinitely')).toBeInTheDocument();
    // The suspended site should NOT have a radio input — only the active one
    const radios = getHiddenRadios();
    expect(radios).toHaveLength(1);
    expect(radios[0].value).toBe('s2');
  });

  it('shows timed suspension label with date', () => {
    const resumeAt = Date.now() + 3 * DAY_MS;
    const expectedDate = new Date(resumeAt).toLocaleDateString();

    seedData({
      sites: [
        { id: 's1', name: 'Arm', side: 'left', suspension: { suspendedAt: Date.now(), resumeAt } },
      ],
      usageHistory: [],
    });

    render(<UsageTracker />);

    expect(screen.getByText(`Suspended until ${expectedDate}`)).toBeInTheDocument();
  });

  it('excludes suspended sites from green priority ranking', () => {
    const now = Date.now();
    seedData({
      sites: [
        { id: 's1', name: 'A-Site', side: 'left', suspension: { suspendedAt: now, resumeAt: null } },
        { id: 's2', name: 'B-Site', side: 'left' },
        { id: 's3', name: 'C-Site', side: 'left' },
        { id: 's4', name: 'D-Site', side: 'left' },
        { id: 's5', name: 'E-Site', side: 'left' },
        { id: 's6', name: 'F-Site', side: 'left' },
        { id: 's7', name: 'G-Site', side: 'left' },
      ],
      usageHistory: [
        { id: 'u1', siteId: 's1', timestamp: now - 100 * DAY_MS },
        { id: 'u2', siteId: 's2', timestamp: now - 90 * DAY_MS },
        { id: 'u3', siteId: 's3', timestamp: now - 80 * DAY_MS },
        { id: 'u4', siteId: 's4', timestamp: now - 70 * DAY_MS },
        { id: 'u5', siteId: 's5', timestamp: now - 5 * DAY_MS },
        { id: 'u6', siteId: 's6', timestamp: now - 2 * DAY_MS },
        { id: 'u7', siteId: 's7', timestamp: now - 1 * DAY_MS },
      ],
    });

    render(<UsageTracker />);

    // s1 is suspended — should show suspension text, not days
    expect(screen.getByText('Suspended indefinitely')).toBeInTheDocument();

    // s2, s3, s4 should be the top 3 active (green) — they show "X days ago"
    expect(screen.getByText('90 days ago')).toBeInTheDocument();
    expect(screen.getByText('80 days ago')).toBeInTheDocument();
    expect(screen.getByText('70 days ago')).toBeInTheDocument();

    // All active sites should have radio buttons (6 total, s1 excluded)
    const radios = getHiddenRadios();
    expect(radios).toHaveLength(6);
  });

  it('renders active sites as selectable even when some are suspended', () => {
    seedData({
      sites: [
        { id: 's1', name: 'Arm', side: 'left', suspension: { suspendedAt: Date.now(), resumeAt: null } },
        { id: 's2', name: 'Arm', side: 'right' },
      ],
      usageHistory: [],
    });

    render(<UsageTracker />);

    const radios = getHiddenRadios();
    expect(radios).toHaveLength(1);
    expect(radios[0].disabled).toBe(false);
  });

  it('does not show suspension label for active sites', () => {
    seedData({
      sites: [
        { id: 's1', name: 'Arm', side: 'left' },
        { id: 's2', name: 'Arm', side: 'right' },
      ],
      usageHistory: [],
    });

    render(<UsageTracker />);

    expect(screen.queryByText(/Suspended/)).not.toBeInTheDocument();
  });
});
