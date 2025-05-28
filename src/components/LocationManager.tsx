import React, { useState, useEffect } from 'react';
import { InfusionSite } from '../types';
import { loadData, addSite, deleteSite } from '../utils/storage';

const LocationManager: React.FC = () => {
  const [sites, setSites] = useState<InfusionSite[]>([]);
  const [newSiteName, setNewSiteName] = useState('');
  const [selectedSide, setSelectedSide] = useState<'left' | 'right'>('left');

  const loadSites = () => {
    const data = loadData();
    setSites(data.sites);
  };

  useEffect(() => {
    loadSites();
  }, []);

  const handleAddSite = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSiteName.trim()) {
      addSite(newSiteName.trim(), selectedSide);
      setNewSiteName('');
      loadSites();
    }
  };

  const handleDeleteSite = (siteId: string) => {
    if (window.confirm('Are you sure you want to delete this site? This will also remove all usage history for this site.')) {
      deleteSite(siteId);
      loadSites();
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
    <div style={{ padding: '15px 10px', maxWidth: '600px', margin: '0 auto' }}>
      <h2 style={{ fontSize: 'clamp(20px, 4vw, 24px)', margin: '0 0 20px 0' }}>Manage Infusion Sites</h2>
      
      <form onSubmit={handleAddSite} style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h3>Add New Site</h3>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Site Name:</label>
          <input
            type="text"
            value={newSiteName}
            onChange={(e) => setNewSiteName(e.target.value)}
            placeholder="e.g., Abdomen, Arm, Thigh"
            style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '16px', boxSizing: 'border-box' }}
            required
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Side:</label>
          <select
            value={selectedSide}
            onChange={(e) => setSelectedSide(e.target.value as 'left' | 'right')}
            style={{ padding: '12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '16px', minWidth: '120px' }}
          >
            <option value="left">Left</option>
            <option value="right">Right</option>
          </select>
        </div>
        <button
          type="submit"
          style={{
            backgroundColor: '#007bff',
            color: 'white',
            padding: '14px 24px',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            minHeight: '48px'
          }}
        >
          Add Site
        </button>
      </form>

      <div>
        <h3>Current Sites</h3>
        {Object.keys(groupedSites).length === 0 ? (
          <p style={{ color: '#666', fontStyle: 'italic' }}>No sites added yet.</p>
        ) : (
          <div style={{ display: 'grid', gap: '15px' }}>
            {Object.entries(groupedSites).map(([siteName, sides]) => (
              <div key={siteName} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '15px' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>{siteName}</h4>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {(['left', 'right'] as const).map(side => (
                    <div
                      key={side}
                      style={{
                        flex: 1,
                        padding: '10px',
                        border: '1px solid #eee',
                        borderRadius: '4px',
                        backgroundColor: sides[side] ? '#f8f9fa' : '#f5f5f5'
                      }}
                    >
                      <div style={{ fontWeight: 'bold', marginBottom: '5px', textTransform: 'capitalize' }}>
                        {side}
                      </div>
                      {sides[side] ? (
                        <button
                          onClick={() => handleDeleteSite(sides[side]!.id)}
                          style={{
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            padding: '8px 12px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            minHeight: '36px'
                          }}
                        >
                          Delete
                        </button>
                      ) : (
                        <span style={{ color: '#999', fontSize: '12px' }}>Not configured</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationManager;