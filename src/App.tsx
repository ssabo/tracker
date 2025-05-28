import React, { useState } from 'react';
import LocationManager from './components/LocationManager';
import UsageTracker from './components/UsageTracker';
import UsageHistory from './components/UsageHistory';
import './App.css';

type View = 'track' | 'manage' | 'history';

function App() {
  const [currentView, setCurrentView] = useState<View>('track');

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
    backgroundColor: currentView === view ? '#007bff' : '#f8f9fa',
    color: currentView === view ? 'white' : '#333',
    cursor: 'pointer',
    borderRadius: '8px',
    margin: '5px',
    fontSize: '16px',
    fontWeight: 'bold',
    minHeight: '44px',
    flex: '1',
    maxWidth: '120px'
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
          <h1 style={{ margin: '0 0 20px 0', color: '#333', fontSize: 'clamp(20px, 5vw, 28px)' }}>
            🩺 Infusion Site Tracker
          </h1>
          <nav style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '5px' }}>
            <button
              style={navButtonStyle('track')}
              onClick={() => setCurrentView('track')}
            >
              Track Usage
            </button>
            <button
              style={navButtonStyle('manage')}
              onClick={() => setCurrentView('manage')}
            >
              Manage Sites
            </button>
            <button
              style={navButtonStyle('history')}
              onClick={() => setCurrentView('history')}
            >
              View History
            </button>
          </nav>
        </div>
      </header>
      
      <main>
        {renderView()}
      </main>
    </div>
  );
}

export default App;
