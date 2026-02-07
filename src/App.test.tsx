import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders app header', () => {
  render(<App />);
  const heading = screen.getByText(/Infusion Site Tracker/i);
  expect(heading).toBeInTheDocument();
});
