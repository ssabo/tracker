import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

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

test('navigates to Manage Sites view', () => {
  render(<App />);
  fireEvent.click(screen.getByText('Manage Sites'));
  expect(screen.getByText('Manage Infusion Sites')).toBeInTheDocument();
});

test('navigates to View History view', () => {
  render(<App />);
  fireEvent.click(screen.getByText('View History'));
  expect(screen.getByText('Usage History')).toBeInTheDocument();
});

test('navigates back to Track Usage from another view', () => {
  render(<App />);
  fireEvent.click(screen.getByText('Manage Sites'));
  expect(screen.getByText('Manage Infusion Sites')).toBeInTheDocument();

  fireEvent.click(screen.getByText('Track Usage'));
  expect(screen.getByText('Track Infusion Site Usage')).toBeInTheDocument();
});

test('active tab button has distinct styling', () => {
  render(<App />);
  const trackButton = screen.getByText('Track Usage');
  const manageButton = screen.getByText('Manage Sites');

  // Track Usage is the default active tab - should have blue bg
  expect(trackButton).toHaveStyle({ backgroundColor: '#007bff', color: 'white' });
  // Manage Sites is inactive - should have gray bg
  expect(manageButton).toHaveStyle({ backgroundColor: '#f8f9fa', color: '#333' });
});

test('switching tabs updates active button styling', () => {
  render(<App />);
  fireEvent.click(screen.getByText('Manage Sites'));

  const trackButton = screen.getByText('Track Usage');
  const manageButton = screen.getByText('Manage Sites');

  expect(manageButton).toHaveStyle({ backgroundColor: '#007bff', color: 'white' });
  expect(trackButton).toHaveStyle({ backgroundColor: '#f8f9fa', color: '#333' });
});
