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
    padding: '10px 20px',
    border: 'none',
    backgroundColor: currentView === view ? '#007bff' : '#f8f9fa',
    color: currentView === view ? 'white' : '#333',
    cursor: 'pointer',
    borderRadius: '5px',
    margin: '0 5px',
    fontSize: '14px',
    fontWeight: 'bold'
  });

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <header style={{ 
        backgroundColor: '#fff', 
        padding: '20px 0', 
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '0'
      }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
          <h1 style={{ margin: '0 0 20px 0', color: '#333', fontSize: '28px' }}>
            🩺 Infusion Site Tracker
          </h1>
          <nav>
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
