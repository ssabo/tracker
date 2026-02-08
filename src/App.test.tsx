import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';
import { colors } from './utils/theme';

beforeEach(() => {
  localStorage.clear();
});

test('renders app header', () => {
  render(<App />);
  const heading = screen.getByText(/Infusion Site Tracker/i);
  expect(heading).toBeInTheDocument();
});

test('renders all three navigation buttons', () => {
  render(<App />);
  expect(screen.getByText('Track Usage')).toBeInTheDocument();
  expect(screen.getByText('Manage Sites')).toBeInTheDocument();
  expect(screen.getByText('View History')).toBeInTheDocument();
});

test('defaults to Track Usage view', () => {
  render(<App />);
  expect(screen.getByText('Track Infusion Site Usage')).toBeInTheDocument();
});

test('navigates to Manage Sites view', async () => {
  render(<App />);
  fireEvent.click(screen.getByText('Manage Sites'));
  await waitFor(() => {
    expect(screen.getByText('Manage Infusion Sites')).toBeInTheDocument();
  });
});

test('navigates to View History view', async () => {
  render(<App />);
  fireEvent.click(screen.getByText('View History'));
  await waitFor(() => {
    expect(screen.getByText('Usage History')).toBeInTheDocument();
  });
});

test('navigates back to Track Usage from another view', async () => {
  render(<App />);
  fireEvent.click(screen.getByText('Manage Sites'));
  await waitFor(() => {
    expect(screen.getByText('Manage Infusion Sites')).toBeInTheDocument();
  });

  fireEvent.click(screen.getByText('Track Usage'));
  await waitFor(() => {
    expect(screen.getByText('Track Infusion Site Usage')).toBeInTheDocument();
  });
});

test('active tab button has distinct styling', () => {
  render(<App />);
  const trackButton = screen.getByText('Track Usage');
  const manageButton = screen.getByText('Manage Sites');

  // Track Usage is the default active tab - should have primary bg
  expect(trackButton).toHaveStyle({ backgroundColor: colors.primary, color: 'white' });
  // Manage Sites is inactive - should have gray bg
  expect(manageButton).toHaveStyle({ backgroundColor: colors.gray50, color: colors.gray700 });
});

test('switching tabs updates active button styling', async () => {
  render(<App />);
  fireEvent.click(screen.getByText('Manage Sites'));

  await waitFor(() => {
    const trackButton = screen.getByText('Track Usage');
    const manageButton = screen.getByText('Manage Sites');

    expect(manageButton).toHaveStyle({ backgroundColor: colors.primary, color: 'white' });
    expect(trackButton).toHaveStyle({ backgroundColor: colors.gray50, color: colors.gray700 });
  });
});
