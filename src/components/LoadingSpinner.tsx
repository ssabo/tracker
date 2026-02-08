import React from 'react';
import { colors } from '../utils/theme';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium';
  color?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  color = colors.primary
}) => {
  const dimensions = size === 'small' ? 20 : 40;

  return (
    <>
      <div
        style={{
          width: dimensions,
          height: dimensions,
          border: `3px solid ${colors.gray200}`,
          borderTop: `3px solid ${color}`,
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <style>
        {`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </>
  );
};

export default LoadingSpinner;
