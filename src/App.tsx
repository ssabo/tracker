import React, { useState } from 'react';
import LocationManager from './components/LocationManager';
import UsageTracker from './components/UsageTracker';
import UsageHistory from './components/UsageHistory';
import { colors, transitions } from './utils/theme';
import './App.css';

type View = 'track' | 'manage' | 'history';

function App() {
  const [currentView, setCurrentView] = useState<View>('track');
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleViewChange = (view: View) => {
    if (view === currentView) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentView(view);
      setIsTransitioning(false);
    }, 150);
  };

  const renderView = () => {
    switch (currentView) {
      case 'manage':
        return <LocationManager />;
      case 'history':
        return <UsageHistory />;
      default:
        return <UsageTracker />;
    }
  };

  const navButtonStyle = (view: View) => ({
    padding: '15px 20px',
    border: 'none',
    backgroundColor: currentView === view ? colors.primary : colors.gray50,
    color: currentView === view ? 'white' : colors.gray700,
    cursor: 'pointer',
    borderRadius: '12px',
    margin: '5px',
    fontSize: '16px',
    fontWeight: 'bold',
    minHeight: '44px',
    flex: '1',
    maxWidth: '120px',
    boxShadow: currentView === view ? '0 4px 6px rgba(79, 70, 229, 0.3)' : 'none',
    transform: currentView === view ? 'translateY(-1px)' : 'none',
    transition: transitions.base,
  });

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <header style={{ 
        backgroundColor: '#fff', 
        padding: '15px 10px', 
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '0'
      }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', padding: '0 10px' }}>
          <h1 style={{ margin: '0 0 20px 0', color: '#333', fontSize: 'clamp(20px, 5vw, 28px)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
            <img src="/logo.svg" alt="Infusion Site Tracker Logo" style={{ width: '32px', height: '32px' }} />
            Infusion Site Tracker
          </h1>
          <nav style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '5px' }}>
            <button
              style={navButtonStyle('track')}
              onClick={() => handleViewChange('track')}
            >
              Track Usage
            </button>
            <button
              style={navButtonStyle('manage')}
              onClick={() => handleViewChange('manage')}
            >
              Manage Sites
            </button>
            <button
              style={navButtonStyle('history')}
              onClick={() => handleViewChange('history')}
            >
              View History
            </button>
          </nav>
        </div>
      </header>
      
      <main style={{
        paddingTop: 'max(10px, env(safe-area-inset-top))',
        paddingBottom: 'max(10px, env(safe-area-inset-bottom))',
        paddingLeft: 'max(10px, env(safe-area-inset-left))',
        paddingRight: 'max(10px, env(safe-area-inset-right))',
      }}>
        <div style={{
          opacity: isTransitioning ? 0 : 1,
          transform: isTransitioning ? 'translateY(10px)' : 'translateY(0)',
          transition: 'opacity 0.15s ease-in-out, transform 0.15s ease-in-out',
        }}>
          {renderView()}
        </div>
      </main>
    </div>
  );
}

export default App;
