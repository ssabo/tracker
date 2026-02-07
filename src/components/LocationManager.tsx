import React, { useState, useEffect, useCallback } from 'react';
import { InfusionSite } from '../types';
import { loadData, addSite, deleteSite, groupSitesByName, suspendSite, unsuspendSite, isSiteSuspended } from '../utils/storage';

const DURATION_PRESETS: { label: string; ms: number }[] = [
  { label: '3 days', ms: 3 * 24 * 60 * 60 * 1000 },
  { label: '2 weeks', ms: 14 * 24 * 60 * 60 * 1000 },
  { label: '1 month', ms: 30 * 24 * 60 * 60 * 1000 },
  { label: '2 months', ms: 60 * 24 * 60 * 60 * 1000 },
];

const LocationManager: React.FC = () => {
  const [sites, setSites] = useState<InfusionSite[]>([]);
  const [newSiteName, setNewSiteName] = useState('');
  const [selectedSide, setSelectedSide] = useState<'left' | 'right' | 'both'>('both');
  const [suspendingId, setSuspendingId] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [customUnit, setCustomUnit] = useState<'days' | 'weeks' | 'months'>('days');

  const loadSites = useCallback(() => {
    const data = loadData();
    setSites(data.sites);
  }, []);

  useEffect(() => {
    loadSites();
  }, [loadSites]);

  const handleAddSite = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSiteName.trim()) {
      addSite(newSiteName.trim(), selectedSide);
      setNewSiteName('');
      setSelectedSide('both');
      loadSites();
    }
  };

  const handleDeleteSite = (siteId: string) => {
    if (window.confirm('Are you sure you want to delete this site? This will also remove all usage history for this site.')) {
      deleteSite(siteId);
      loadSites();
    }
  };

  const handleSuspendPreset = (siteId: string, durationMs: number) => {
    suspendSite(siteId, durationMs);
    setSuspendingId(null);
    loadSites();
  };

  const handleSuspendIndefinite = (siteId: string) => {
    suspendSite(siteId, null);
    setSuspendingId(null);
    loadSites();
  };

  const handleSuspendCustom = (siteId: string) => {
    const amount = parseInt(customAmount, 10);
    if (isNaN(amount) || amount <= 0) return;

    let ms: number;
    switch (customUnit) {
      case 'days': ms = amount * 24 * 60 * 60 * 1000; break;
      case 'weeks': ms = amount * 7 * 24 * 60 * 60 * 1000; break;
      case 'months': ms = amount * 30 * 24 * 60 * 60 * 1000; break;
    }

    suspendSite(siteId, ms);
    setSuspendingId(null);
    setCustomAmount('');
    setCustomUnit('days');
    loadSites();
  };

  const handleUnsuspend = (siteId: string) => {
    unsuspendSite(siteId);
    loadSites();
  };

  const formatSuspensionStatus = (site: InfusionSite): string => {
    if (!site.suspension) return '';
    if (site.suspension.resumeAt === null) return 'Suspended indefinitely';
    return `Suspended until ${new Date(site.suspension.resumeAt).toLocaleDateString()}`;
  };

  const groupedSites = groupSitesByName(sites);

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
            onChange={(e) => setSelectedSide(e.target.value as 'left' | 'right' | 'both')}
            style={{ padding: '12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '16px', minWidth: '120px' }}
          >
            <option value="both">Both</option>
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
                  {(['left', 'right'] as const).map(side => {
                    const site = sides[side];
                    const suspended = site ? isSiteSuspended(site) : false;

                    return (
                      <div
                        key={side}
                        style={{
                          flex: 1,
                          padding: '10px',
                          border: `1px solid ${suspended ? '#bee5eb' : '#eee'}`,
                          borderRadius: '4px',
                          backgroundColor: suspended ? '#d1ecf1' : site ? '#f8f9fa' : '#f5f5f5'
                        }}
                      >
                        <div style={{ fontWeight: 'bold', marginBottom: '5px', textTransform: 'capitalize' }}>
                          {side}
                        </div>
                        {site ? (
                          <div>
                            {suspended && (
                              <div style={{ fontSize: '12px', color: '#0c5460', marginBottom: '8px', fontStyle: 'italic' }}>
                                {formatSuspensionStatus(site)}
                              </div>
                            )}

                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                              {suspended ? (
                                <button
                                  onClick={() => handleUnsuspend(site.id)}
                                  style={{
                                    backgroundColor: '#28a745',
                                    color: 'white',
                                    border: 'none',
                                    padding: '8px 12px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    minHeight: '36px'
                                  }}
                                >
                                  Resume
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    setSuspendingId(suspendingId === site.id ? null : site.id);
                                    setCustomAmount('');
                                    setCustomUnit('days');
                                  }}
                                  style={{
                                    backgroundColor: '#17a2b8',
                                    color: 'white',
                                    border: 'none',
                                    padding: '8px 12px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    minHeight: '36px'
                                  }}
                                >
                                  Suspend
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteSite(site.id)}
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
                            </div>

                            {suspendingId === site.id && (
                              <div style={{
                                marginTop: '10px',
                                padding: '10px',
                                backgroundColor: '#e8f4f8',
                                borderRadius: '6px',
                                border: '1px solid #bee5eb'
                              }}>
                                <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '8px', color: '#0c5460' }}>
                                  Suspend for:
                                </div>
                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                                  {DURATION_PRESETS.map(preset => (
                                    <button
                                      key={preset.label}
                                      onClick={() => handleSuspendPreset(site.id, preset.ms)}
                                      style={{
                                        backgroundColor: '#fff',
                                        color: '#0c5460',
                                        border: '1px solid #bee5eb',
                                        padding: '6px 10px',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '13px',
                                      }}
                                    >
                                      {preset.label}
                                    </button>
                                  ))}
                                  <button
                                    onClick={() => handleSuspendIndefinite(site.id)}
                                    style={{
                                      backgroundColor: '#fff',
                                      color: '#0c5460',
                                      border: '1px solid #bee5eb',
                                      padding: '6px 10px',
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                      fontSize: '13px',
                                    }}
                                  >
                                    Until I resume
                                  </button>
                                </div>
                                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                  <input
                                    type="number"
                                    min="1"
                                    value={customAmount}
                                    onChange={(e) => setCustomAmount(e.target.value)}
                                    placeholder="#"
                                    style={{
                                      width: '60px',
                                      padding: '6px',
                                      borderRadius: '4px',
                                      border: '1px solid #bee5eb',
                                      fontSize: '13px',
                                    }}
                                  />
                                  <select
                                    value={customUnit}
                                    onChange={(e) => setCustomUnit(e.target.value as 'days' | 'weeks' | 'months')}
                                    style={{
                                      padding: '6px',
                                      borderRadius: '4px',
                                      border: '1px solid #bee5eb',
                                      fontSize: '13px',
                                    }}
                                  >
                                    <option value="days">days</option>
                                    <option value="weeks">weeks</option>
                                    <option value="months">months</option>
                                  </select>
                                  <button
                                    onClick={() => handleSuspendCustom(site.id)}
                                    disabled={!customAmount || parseInt(customAmount, 10) <= 0}
                                    style={{
                                      backgroundColor: customAmount && parseInt(customAmount, 10) > 0 ? '#17a2b8' : '#6c757d',
                                      color: 'white',
                                      border: 'none',
                                      padding: '6px 10px',
                                      borderRadius: '4px',
                                      cursor: customAmount && parseInt(customAmount, 10) > 0 ? 'pointer' : 'not-allowed',
                                      fontSize: '13px',
                                    }}
                                  >
                                    Apply
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: '#999', fontSize: '12px' }}>Not configured</span>
                        )}
                      </div>
                    );
                  })}
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
