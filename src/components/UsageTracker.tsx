import React, { useState, useEffect } from 'react';
import { InfusionSite } from '../types';
import { loadData, recordUsage, getUsageHistory } from '../utils/storage';

interface SiteWithDays extends InfusionSite {
  daysSinceLastUse: number | null;
  priority: 'high' | 'medium' | 'low';
}

const UsageTracker: React.FC = () => {
  const [sites, setSites] = useState<SiteWithDays[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [lastUsed, setLastUsed] = useState<string>('');

  const calculateDaysSinceLastUse = (siteId: string): number | null => {
    const history = getUsageHistory();
    const siteUsage = history.filter(record => record.siteId === siteId);
    if (siteUsage.length === 0) return null;
    
    const lastUseTimestamp = Math.max(...siteUsage.map(record => record.timestamp));
    const daysDiff = Math.floor((Date.now() - lastUseTimestamp) / (1000 * 60 * 60 * 24));
    return daysDiff;
  };

  const loadSites = () => {
    const data = loadData();
    const sitesWithDays = data.sites.map(site => ({
      ...site,
      daysSinceLastUse: calculateDaysSinceLastUse(site.id),
      priority: 'medium' as 'high' | 'medium' | 'low'
    }));

    // Sort by days since last use (nulls first for never used)
    const sorted = sitesWithDays.sort((a, b) => {
      if (a.daysSinceLastUse === null && b.daysSinceLastUse === null) return 0;
      if (a.daysSinceLastUse === null) return -1;
      if (b.daysSinceLastUse === null) return 1;
      return b.daysSinceLastUse - a.daysSinceLastUse;
    });

    // Assign priorities
    sorted.forEach((site, index) => {
      if (site.daysSinceLastUse === null || index < 3) {
        site.priority = 'high'; // Green - best candidates
      } else if (index >= sorted.length - 3) {
        site.priority = 'low'; // Red - worst candidates
      } else {
        site.priority = 'medium'; // Default color
      }
    });

    setSites(sorted);
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
      loadSites(); // Reload to update days and priorities
      loadLastUsed();
      alert('Usage recorded successfully!');
    }
  };

  const getPriorityColor = (priority: 'high' | 'medium' | 'low', isSelected: boolean) => {
    if (isSelected) return '#007bff';
    
    switch (priority) {
      case 'high': return '#d4edda'; // Light green
      case 'low': return '#f8d7da'; // Light red
      default: return '#f8f9fa'; // Default gray
    }
  };

  const getPriorityBorderColor = (priority: 'high' | 'medium' | 'low', isSelected: boolean) => {
    if (isSelected) return '#007bff';
    
    switch (priority) {
      case 'high': return '#28a745'; // Green
      case 'low': return '#dc3545'; // Red
      default: return '#ddd'; // Default gray
    }
  };

  const groupedSites = sites.reduce((acc, site) => {
    if (!acc[site.name]) {
      acc[site.name] = { left: null, right: null };
    }
    acc[site.name][site.side] = site;
    return acc;
  }, {} as Record<string, { left: SiteWithDays | null; right: SiteWithDays | null }>);

  return (
    <div style={{ padding: '15px 10px', maxWidth: '600px', margin: '0 auto' }}>
      <h2 style={{ fontSize: 'clamp(20px, 4vw, 24px)', margin: '0 0 20px 0' }}>Track Infusion Site Usage</h2>
      
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
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'center',
                              padding: '16px 12px',
                              border: `2px solid ${getPriorityBorderColor(sides[side]!.priority, selectedSiteId === sides[side]!.id)}`,
                              borderRadius: '8px',
                              cursor: 'pointer',
                              textAlign: 'center',
                              backgroundColor: getPriorityColor(sides[side]!.priority, selectedSiteId === sides[side]!.id),
                              color: selectedSiteId === sides[side]!.id ? 'white' : '#333',
                              transition: 'all 0.2s',
                              minHeight: '60px'
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
                            <div style={{ fontSize: '12px', marginTop: '4px' }}>
                              {sides[side]!.daysSinceLastUse === null 
                                ? 'Never used' 
                                : `${sides[side]!.daysSinceLastUse} days ago`}
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
              padding: '16px 24px',
              border: 'none',
              borderRadius: '8px',
              cursor: selectedSiteId ? 'pointer' : 'not-allowed',
              fontSize: '18px',
              fontWeight: 'bold',
              width: '100%',
              minHeight: '52px'
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