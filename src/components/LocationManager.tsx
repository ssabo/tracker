import React, { useState, useEffect, useCallback } from 'react';
import { InfusionSite } from '../types';
import { loadData, addSite, deleteSite, groupSitesByName, suspendSite, unsuspendSite, isSiteSuspended } from '../utils/storage';
import { colors, shadows, transitions } from '../utils/theme';
import Modal from './Modal';

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
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; siteId: string | null }>({
    isOpen: false,
    siteId: null,
  });
  const [addSiteHover, setAddSiteHover] = useState(false);

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
    setDeleteConfirm({ isOpen: true, siteId });
  };

  const confirmDelete = () => {
    if (deleteConfirm.siteId) {
      deleteSite(deleteConfirm.siteId);
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
    <div style={{ padding: '12px 10px', maxWidth: '600px', margin: '0 auto' }}>
      <h2 style={{ fontSize: 'clamp(20px, 4vw, 24px)', margin: '0 0 12px 0' }}>Manage Infusion Sites</h2>

      <form onSubmit={handleAddSite} style={{ marginBottom: '16px', padding: '12px', border: 'none', borderRadius: '8px', boxShadow: shadows.base }}>
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
          onMouseEnter={() => setAddSiteHover(true)}
          onMouseLeave={() => setAddSiteHover(false)}
          style={{
            backgroundColor: colors.primary,
            color: 'white',
            padding: '14px 24px',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            minHeight: '48px',
            boxShadow: addSiteHover ? '0 6px 10px rgba(0,0,0,0.15)' : shadows.sm,
            transform: addSiteHover ? 'translateY(-1px)' : 'none',
            transition: transitions.base,
          }}
        >
          Add Site
        </button>
      </form>

      <div>
        <h3>Current Sites</h3>
        {Object.keys(groupedSites).length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px 24px',
            background: `linear-gradient(135deg, ${colors.gray50} 0%, ${colors.successLight} 100%)`,
            borderRadius: '12px',
            boxShadow: shadows.base,
            animation: 'fadeIn 0.5s ease-in-out',
          }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>📝</div>
            <p style={{ color: colors.gray900, fontSize: '18px', fontWeight: '600', margin: '0 0 8px 0' }}>
              No sites added yet
            </p>
            <p style={{ color: colors.gray600, margin: 0, lineHeight: '1.5' }}>
              Use the form above to add your first infusion site.
            </p>
            <style>
              {`
                @keyframes fadeIn {
                  from {
                    opacity: 0;
                    transform: translateY(10px);
                  }
                  to {
                    opacity: 1;
                    transform: translateY(0);
                  }
                }
              `}
            </style>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '10px' }}>
            {Object.entries(groupedSites).map(([siteName, sides]) => (
              <div key={siteName} style={{ border: 'none', borderRadius: '8px', padding: '10px', boxShadow: shadows.sm }}>
                <h4 style={{ margin: '0 0 6px 0', color: colors.gray900 }}>{siteName}</h4>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {(['left', 'right'] as const).map(side => {
                    const site = sides[side];
                    const suspended = site ? isSiteSuspended(site) : false;

                    return (
                      <div
                        key={side}
                        style={{
                          flex: 1,
                          padding: '8px',
                          border: 'none',
                          borderRadius: '4px',
                          backgroundColor: suspended ? colors.infoLight : site ? colors.gray50 : colors.gray100,
                          boxShadow: shadows.sm,
                        }}
                      >
                        <div style={{ fontWeight: 'bold', marginBottom: '5px', textTransform: 'capitalize' }}>
                          {side}
                        </div>
                        {site ? (
                          <div>
                            {suspended && (
                              <div style={{ fontSize: '12px', color: colors.infoHover, marginBottom: '8px', fontStyle: 'italic' }}>
                                {formatSuspensionStatus(site)}
                              </div>
                            )}

                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                              {suspended ? (
                                <button
                                  onClick={() => handleUnsuspend(site.id)}
                                  style={{
                                    backgroundColor: colors.success,
                                    color: 'white',
                                    border: 'none',
                                    padding: '8px 12px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    minHeight: '36px',
                                    boxShadow: shadows.sm,
                                    transition: transitions.base,
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
                                    backgroundColor: colors.info,
                                    color: 'white',
                                    border: 'none',
                                    padding: '8px 12px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    minHeight: '36px',
                                    boxShadow: shadows.sm,
                                    transition: transitions.base,
                                  }}
                                >
                                  Suspend
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteSite(site.id)}
                                style={{
                                  backgroundColor: colors.danger,
                                  color: 'white',
                                  border: 'none',
                                  padding: '8px 12px',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '14px',
                                  minHeight: '36px',
                                  boxShadow: shadows.sm,
                                  transition: transitions.base,
                                }}
                              >
                                Delete
                              </button>
                            </div>

                            {suspendingId === site.id && (
                              <div style={{
                                marginTop: '8px',
                                padding: '8px',
                                backgroundColor: colors.infoLight,
                                borderRadius: '6px',
                                border: 'none',
                                boxShadow: shadows.sm,
                              }}>
                                <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '8px', color: colors.infoHover }}>
                                  Suspend for:
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(85px, 1fr))', gap: '8px', marginBottom: '8px' }}>
                                  {DURATION_PRESETS.map(preset => (
                                    <button
                                      key={preset.label}
                                      onClick={() => handleSuspendPreset(site.id, preset.ms)}
                                      style={{
                                        backgroundColor: '#fff',
                                        color: colors.infoHover,
                                        border: `1px solid ${colors.info}`,
                                        padding: '8px 10px',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '13px',
                                        minHeight: '40px',
                                        boxShadow: shadows.sm,
                                        transition: transitions.base,
                                      }}
                                    >
                                      {preset.label}
                                    </button>
                                  ))}
                                  <button
                                    onClick={() => handleSuspendIndefinite(site.id)}
                                    style={{
                                      backgroundColor: '#fff',
                                      color: colors.infoHover,
                                      border: `1px solid ${colors.info}`,
                                      padding: '8px 10px',
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                      fontSize: '13px',
                                      minHeight: '40px',
                                      boxShadow: shadows.sm,
                                      gridColumn: '1 / -1',
                                      transition: transitions.base,
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
                                      backgroundColor: customAmount && parseInt(customAmount, 10) > 0 ? colors.info : colors.gray600,
                                      color: 'white',
                                      border: 'none',
                                      padding: '6px 10px',
                                      borderRadius: '4px',
                                      cursor: customAmount && parseInt(customAmount, 10) > 0 ? 'pointer' : 'not-allowed',
                                      fontSize: '13px',
                                      boxShadow: shadows.sm,
                                      transition: transitions.base,
                                    }}
                                  >
                                    Apply
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: colors.gray600, fontSize: '12px' }}>Not configured</span>
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

      <Modal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, siteId: null })}
        title="Delete Site"
        message="Are you sure you want to delete this site? This will also remove all usage history for this site."
        type="confirm"
        confirmText="Delete"
        onConfirm={confirmDelete}
      />
    </div>
  );
};

export default LocationManager;
