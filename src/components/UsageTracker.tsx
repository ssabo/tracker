import React, { useState, useEffect, useCallback } from 'react';
import { InfusionSite } from '../types';
import { loadData, recordUsage, getUsageHistory, groupSitesByName, isSiteSuspended } from '../utils/storage';
import { colors, shadows, transitions } from '../utils/theme';
import Modal from './Modal';
import LoadingSpinner from './LoadingSpinner';

interface SiteWithDays extends InfusionSite {
  daysSinceLastUse: number | null;
  priority: 'high' | 'medium' | 'low' | 'suspended';
}

const UsageTracker: React.FC = () => {
  const [sites, setSites] = useState<SiteWithDays[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [lastUsed, setLastUsed] = useState<string>('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [buttonHover, setButtonHover] = useState(false);
  const [buttonActive, setButtonActive] = useState(false);

  const loadSites = useCallback(() => {
    const data = loadData();

    // Build a map of siteId -> most recent timestamp (single pass)
    const lastUseMap = new Map<string, number>();
    for (const record of data.usageHistory) {
      const prev = lastUseMap.get(record.siteId);
      if (prev === undefined || record.timestamp > prev) {
        lastUseMap.set(record.siteId, record.timestamp);
      }
    }

    const now = Date.now();
    const sitesWithDays: SiteWithDays[] = data.sites.map(site => {
      const lastUse = lastUseMap.get(site.id);
      return {
        ...site,
        daysSinceLastUse: lastUse !== undefined
          ? Math.floor((now - lastUse) / (1000 * 60 * 60 * 24))
          : null,
        priority: isSiteSuspended(site) ? 'suspended' : 'medium' as SiteWithDays['priority']
      };
    });

    // Only non-suspended sites participate in priority ranking
    const activeSites = sitesWithDays.filter(s => s.priority !== 'suspended');

    // Sort by days since last use (nulls first for never used) for priority calculation
    const prioritySorted = activeSites.sort((a, b) => {
      if (a.daysSinceLastUse === null && b.daysSinceLastUse === null) return 0;
      if (a.daysSinceLastUse === null) return -1;
      if (b.daysSinceLastUse === null) return 1;
      return b.daysSinceLastUse - a.daysSinceLastUse;
    });

    // Assign priorities based on usage order
    prioritySorted.forEach((site, index) => {
      if (site.daysSinceLastUse === null || index < 3) {
        site.priority = 'high'; // Green - best candidates
      } else if (index >= prioritySorted.length - 3) {
        site.priority = 'low'; // Red - worst candidates
      } else {
        site.priority = 'medium'; // Default color
      }
    });

    // Sort alphabetically for display
    const alphabeticalSorted = sitesWithDays.sort((a, b) => a.name.localeCompare(b.name));

    setSites(alphabeticalSorted);
  }, []);

  const loadLastUsed = useCallback(() => {
    const history = getUsageHistory();
    if (history.length > 0) {
      const lastRecord = history[0];
      setLastUsed(`${lastRecord.siteName} (${lastRecord.siteSide}) - ${new Date(lastRecord.timestamp).toLocaleDateString()} at ${new Date(lastRecord.timestamp).toLocaleTimeString()}`);
    }
  }, []);

  useEffect(() => {
    loadSites();
    loadLastUsed();
  }, [loadSites, loadLastUsed]);

  const handleRecordUsage = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSiteId && !isRecording) {
      setIsRecording(true);
      recordUsage(selectedSiteId);
      setSelectedSiteId('');
      // Brief delay for visual feedback
      setTimeout(() => {
        setIsRecording(false);
        setShowSuccessModal(true);
        loadSites(); // Reload to update days and priorities
        loadLastUsed();
      }, 300);
    }
  };

  const getPriorityColor = (priority: SiteWithDays['priority'], isSelected: boolean) => {
    if (isSelected) return colors.primary;

    switch (priority) {
      case 'high': return colors.successLight;
      case 'low': return colors.dangerLight;
      case 'suspended': return colors.infoLight;
      default: return colors.gray100;
    }
  };

  const getPriorityBorderColor = (priority: SiteWithDays['priority'], isSelected: boolean) => {
    if (isSelected) return colors.primary;

    switch (priority) {
      case 'high': return colors.success;
      case 'low': return colors.danger;
      case 'suspended': return colors.info;
      default: return colors.gray300;
    }
  };

  const formatSuspensionLabel = (site: SiteWithDays): string => {
    if (!site.suspension) return '';
    if (site.suspension.resumeAt === null) return 'Suspended indefinitely';
    const resumeDate = new Date(site.suspension.resumeAt);
    return `Suspended until ${resumeDate.toLocaleDateString()}`;
  };

  const groupedSites = groupSitesByName(sites);

  return (
    <div style={{ padding: '12px 10px', maxWidth: '600px', margin: '0 auto' }}>
      <h2 style={{ fontSize: 'clamp(20px, 4vw, 24px)', margin: '0 0 12px 0' }}>Track Infusion Site Usage</h2>

      {lastUsed && (
        <div style={{
          backgroundColor: colors.primaryLight,
          border: 'none',
          borderLeft: `4px solid ${colors.primary}`,
          borderRadius: '8px',
          padding: '12px 12px 12px 16px',
          marginBottom: '12px',
          boxShadow: shadows.sm
        }}>
          <h4 style={{ margin: '0 0 5px 0', color: colors.primary, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📍</span> Last Used Site:
          </h4>
          <p style={{ margin: 0, color: colors.primary, fontSize: '15px' }}>{lastUsed}</p>
        </div>
      )}

      {sites.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '40px 24px',
          background: `linear-gradient(135deg, ${colors.gray50} 0%, ${colors.primaryLight} 100%)`,
          borderRadius: '12px',
          border: 'none',
          boxShadow: shadows.base,
          animation: 'fadeIn 0.5s ease-in-out',
        }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>🏥</div>
          <p style={{ color: colors.gray900, fontSize: '20px', fontWeight: '600', margin: '0 0 8px 0' }}>
            No infusion sites configured yet
          </p>
          <p style={{ color: colors.gray600, margin: 0, lineHeight: '1.5' }}>
            Go to "Manage Sites" to add your infusion site locations.
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
        <form onSubmit={handleRecordUsage}>
          <div style={{ marginBottom: '12px' }}>
            <h3>Select Current Infusion Site:</h3>
            <div style={{ display: 'grid', gap: '6px' }}>
              {Object.entries(groupedSites).map(([siteName, sides]) => (
                <div key={siteName} style={{ border: 'none', borderRadius: '8px', padding: '8px', boxShadow: shadows.sm }}>
                  <h4 style={{ margin: '0 0 6px 0', color: colors.gray900 }}>{siteName}</h4>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {(['left', 'right'] as const).map(side => (
                      <div key={side} style={{ flex: 1 }}>
                        {sides[side] ? (
                          sides[side]!.priority === 'suspended' ? (
                            <div
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                padding: '8px 6px',
                                border: `2px solid ${getPriorityBorderColor('suspended', false)}`,
                                borderRadius: '8px',
                                cursor: 'not-allowed',
                                textAlign: 'center',
                                backgroundColor: getPriorityColor('suspended', false),
                                color: colors.gray600,
                                minHeight: '45px',
                                opacity: 0.7,
                                boxShadow: shadows.sm,
                              }}
                            >
                              <div style={{ fontWeight: 'bold', textTransform: 'capitalize' }}>
                                {side}
                              </div>
                              <div style={{ fontSize: '11px', marginTop: '2px', fontStyle: 'italic', lineHeight: '1.2' }}>
                                {formatSuspensionLabel(sides[side]!)}
                              </div>
                            </div>
                          ) : (
                            <label
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                padding: '8px 6px',
                                border: `2px solid ${getPriorityBorderColor(sides[side]!.priority, selectedSiteId === sides[side]!.id)}`,
                                borderRadius: '8px',
                                cursor: 'pointer',
                                textAlign: 'center',
                                backgroundColor: getPriorityColor(sides[side]!.priority, selectedSiteId === sides[side]!.id),
                                color: selectedSiteId === sides[side]!.id ? 'white' : colors.gray900,
                                transition: 'all 0.2s',
                                minHeight: '45px',
                                boxShadow: shadows.sm,
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
                              <div style={{ fontSize: '11px', marginTop: '2px', lineHeight: '1.2' }}>
                                {sides[side]!.daysSinceLastUse === null
                                  ? 'Never used'
                                  : sides[side]!.daysSinceLastUse === 0
                                    ? 'Today'
                                    : sides[side]!.daysSinceLastUse === 1
                                      ? 'Yesterday'
                                      : `${sides[side]!.daysSinceLastUse} days ago`}
                              </div>
                            </label>
                          )
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
            disabled={!selectedSiteId || isRecording}
            onMouseEnter={() => setButtonHover(true)}
            onMouseLeave={() => { setButtonHover(false); setButtonActive(false); }}
            onMouseDown={() => setButtonActive(true)}
            onMouseUp={() => setButtonActive(false)}
            style={{
              backgroundColor: selectedSiteId && !isRecording ? colors.success : colors.gray600,
              color: 'white',
              padding: '16px 24px',
              border: 'none',
              borderRadius: '8px',
              cursor: selectedSiteId && !isRecording ? 'pointer' : 'not-allowed',
              fontSize: '18px',
              fontWeight: 'bold',
              width: '100%',
              minHeight: '52px',
              boxShadow: buttonHover && selectedSiteId && !isRecording ? '0 6px 10px rgba(0,0,0,0.15)' : shadows.base,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              transform: buttonActive && selectedSiteId && !isRecording ? 'scale(0.97)' : buttonHover && selectedSiteId && !isRecording ? 'translateY(-1px)' : 'none',
              transition: transitions.base,
            }}
          >
            {isRecording ? (
              <>
                <LoadingSpinner size="small" color="white" />
                Recording...
              </>
            ) : (
              'Record Usage Now'
            )}
          </button>
        </form>
      )}

      <Modal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Success"
        message="Usage recorded successfully!"
        type="alert"
      />
    </div>
  );
};

export default UsageTracker;
