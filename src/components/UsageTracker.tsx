import React, { useState, useEffect } from 'react';
import { InfusionSite } from '../types';
import { loadData, recordUsage, getUsageHistory } from '../utils/storage';

const UsageTracker: React.FC = () => {
  const [sites, setSites] = useState<InfusionSite[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [lastUsed, setLastUsed] = useState<string>('');

  const loadSites = () => {
    const data = loadData();
    setSites(data.sites);
  };

  const loadLastUsed = () => {
    const history = getUsageHistory();
    if (history.length > 0) {
      const lastRecord = history[0];
      const site = sites.find(s => s.id === lastRecord.siteId);
      if (site) {
        setLastUsed(`${site.name} (${site.side}) - ${new Date(lastRecord.timestamp).toLocaleDateString()} at ${new Date(lastRecord.timestamp).toLocaleTimeString()}`);
      }
    }
  };

  useEffect(() => {
    loadSites();
  }, []);

  useEffect(() => {
    if (sites.length > 0) {
      loadLastUsed();
    }
  }, [sites]);

  const handleRecordUsage = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSiteId) {
      recordUsage(selectedSiteId);
      setSelectedSiteId('');
      loadLastUsed();
      alert('Usage recorded successfully!');
    }
  };

  const groupedSites = sites.reduce((acc, site) => {
    if (!acc[site.name]) {
      acc[site.name] = { left: null, right: null };
    }
    acc[site.name][site.side] = site;
    return acc;
  }, {} as Record<string, { left: InfusionSite | null; right: InfusionSite | null }>);

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>Track Infusion Site Usage</h2>
      
      {lastUsed && (
        <div style={{ 
          backgroundColor: '#e7f3ff', 
          border: '1px solid #b3d9ff', 
          borderRadius: '8px', 
          padding: '15px', 
          marginBottom: '20px' 
        }}>
          <h4 style={{ margin: '0 0 5px 0', color: '#0066cc' }}>Last Used Site:</h4>
          <p style={{ margin: 0, color: '#0066cc' }}>{lastUsed}</p>
        </div>
      )}

      {sites.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '8px',
          border: '1px solid #dee2e6'
        }}>
          <p style={{ color: '#666', fontSize: '18px', margin: 0 }}>
            No infusion sites configured yet.
          </p>
          <p style={{ color: '#666', margin: '10px 0 0 0' }}>
            Go to "Manage Sites" to add your infusion site locations.
          </p>
        </div>
      ) : (
        <form onSubmit={handleRecordUsage}>
          <div style={{ marginBottom: '20px' }}>
            <h3>Select Current Infusion Site:</h3>
            <div style={{ display: 'grid', gap: '15px' }}>
              {Object.entries(groupedSites).map(([siteName, sides]) => (
                <div key={siteName} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '15px' }}>
                  <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>{siteName}</h4>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {(['left', 'right'] as const).map(side => (
                      <div key={side} style={{ flex: 1 }}>
                        {sides[side] ? (
                          <label
                            style={{
                              display: 'block',
                              padding: '12px',
                              border: '2px solid #ddd',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              textAlign: 'center',
                              backgroundColor: selectedSiteId === sides[side]!.id ? '#007bff' : '#f8f9fa',
                              color: selectedSiteId === sides[side]!.id ? 'white' : '#333',
                              transition: 'all 0.2s'
                            }}
                          >
                            <input
                              type="radio"
                              name="siteId"
                              value={sides[side]!.id}
                              checked={selectedSiteId === sides[side]!.id}
                              onChange={(e) => setSelectedSiteId(e.target.value)}
                              style={{ display: 'none' }}
                            />
                            <div style={{ fontWeight: 'bold', textTransform: 'capitalize' }}>
                              {side}
                            </div>
                          </label>
                        ) : (
                          <div
                            style={{
                              padding: '12px',
                              border: '2px dashed #ccc',
                              borderRadius: '6px',
                              textAlign: 'center',
                              color: '#999',
                              backgroundColor: '#f5f5f5'
                            }}
                          >
                            <div style={{ textTransform: 'capitalize' }}>{side}</div>
                            <div style={{ fontSize: '12px' }}>Not configured</div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={!selectedSiteId}
            style={{
              backgroundColor: selectedSiteId ? '#28a745' : '#6c757d',
              color: 'white',
              padding: '12px 24px',
              border: 'none',
              borderRadius: '6px',
              cursor: selectedSiteId ? 'pointer' : 'not-allowed',
              fontSize: '16px',
              fontWeight: 'bold',
              width: '100%'
            }}
          >
            Record Usage Now
          </button>
        </form>
      )}
    </div>
  );
};

export default UsageTracker;