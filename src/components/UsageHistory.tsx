import React, { useState, useEffect, useRef } from 'react';
import { getUsageHistory, deleteUsageRecord, updateUsageRecord, loadData, saveData } from '../utils/storage';
import { InfusionSite, AppData } from '../types';
import { colors, shadows, transitions } from '../utils/theme';
import Modal from './Modal';

interface HistoryRecord {
  id: string;
  siteId: string;
  timestamp: number;
  siteName: string;
  siteSide: string;
}

const UsageHistory: React.FC = () => {
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [sites, setSites] = useState<InfusionSite[]>([]);
  const [editingRecord, setEditingRecord] = useState<string | null>(null);
  const [editSiteId, setEditSiteId] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal states
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; recordId: string | null }>({
    isOpen: false,
    recordId: null,
  });
  const [importConfirm, setImportConfirm] = useState<{ isOpen: boolean; data: AppData | null }>({
    isOpen: false,
    data: null,
  });
  const [alertModal, setAlertModal] = useState<{ isOpen: boolean; title: string; message: string }>({
    isOpen: false,
    title: '',
    message: '',
  });

  // Button hover states
  const [exportHover, setExportHover] = useState(false);
  const [importHover, setImportHover] = useState(false);

  const loadHistory = () => {
    const historyData = getUsageHistory();
    setHistory(historyData);
  };

  const loadSites = () => {
    const data = loadData();
    setSites(data.sites);
  };

  useEffect(() => {
    loadHistory();
    loadSites();
  }, []);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatRelativeTime = (timestamp: number) => {
    const now = Date.now();
    const diffMs = now - timestamp;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 60) {
      return diffMinutes <= 1 ? 'Just now' : `${diffMinutes} minutes ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return formatDate(timestamp);
    }
  };

  const toDateKey = (timestamp: number): string => {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const groupByDate = (records: HistoryRecord[]) => {
    const groups: { [key: string]: HistoryRecord[] } = {};

    records.forEach(record => {
      const dateKey = toDateKey(record.timestamp);
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(record);
    });

    return groups;
  };

  const handleDeleteRecord = (recordId: string) => {
    setDeleteConfirm({ isOpen: true, recordId });
  };

  const confirmDelete = () => {
    if (deleteConfirm.recordId) {
      deleteUsageRecord(deleteConfirm.recordId);
      loadHistory();
    }
  };

  const confirmImport = () => {
    if (importConfirm.data) {
      saveData(importConfirm.data);
      loadHistory();
      loadSites();
      setAlertModal({
        isOpen: true,
        title: 'Success',
        message: 'Data imported successfully!',
      });
    }
  };

  const startEditRecord = (record: HistoryRecord) => {
    setEditingRecord(record.id);
    setEditSiteId(record.siteId);
    const date = new Date(record.timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    setEditDate(`${year}-${month}-${day}`);
    setEditTime(date.toTimeString().slice(0, 5));
  };

  const cancelEdit = () => {
    setEditingRecord(null);
    setEditSiteId('');
    setEditDate('');
    setEditTime('');
  };

  const saveEdit = () => {
    if (editingRecord && editSiteId && editDate && editTime) {
      const dateTime = new Date(`${editDate}T${editTime}`);
      updateUsageRecord(editingRecord, editSiteId, dateTime.getTime());
      loadHistory();
      cancelEdit();
    }
  };

  const handleExport = () => {
    const data = loadData();
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `infusion-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const isValidAppData = (data: unknown): data is AppData => {
    if (typeof data !== 'object' || data === null) return false;
    const obj = data as Record<string, unknown>;
    if (!Array.isArray(obj.sites) || !Array.isArray(obj.usageHistory)) return false;
    return obj.sites.every(s =>
      typeof s === 'object' && s !== null &&
      typeof (s as Record<string, unknown>).id === 'string' &&
      typeof (s as Record<string, unknown>).name === 'string' &&
      ((s as Record<string, unknown>).side === 'left' || (s as Record<string, unknown>).side === 'right')
    ) && obj.usageHistory.every(r =>
      typeof r === 'object' && r !== null &&
      typeof (r as Record<string, unknown>).id === 'string' &&
      typeof (r as Record<string, unknown>).siteId === 'string' &&
      typeof (r as Record<string, unknown>).timestamp === 'number'
    );
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const jsonData = JSON.parse(e.target?.result as string);
          if (!isValidAppData(jsonData)) {
            setAlertModal({
              isOpen: true,
              title: 'Invalid File',
              message: 'Invalid backup file. The file does not match the expected data format.',
            });
            return;
          }
          setImportConfirm({ isOpen: true, data: jsonData });
        } catch (error) {
          setAlertModal({
            isOpen: true,
            title: 'Import Error',
            message: 'Error importing data. Please check that the file is a valid JSON backup.',
          });
        }
      };
      reader.readAsText(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const groupedHistory = groupByDate(history);
  const dateKeys = Object.keys(groupedHistory).sort((a, b) => b.localeCompare(a));

  return (
    <div style={{ padding: '15px 10px', maxWidth: '600px', margin: '0 auto' }}>
      <h2 style={{ fontSize: 'clamp(20px, 4vw, 24px)', margin: '0 0 20px 0' }}>Usage History</h2>
      
      <div style={{ 
        display: 'flex', 
        gap: '10px', 
        marginBottom: '20px',
        justifyContent: 'center',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={handleExport}
          onMouseEnter={() => setExportHover(true)}
          onMouseLeave={() => setExportHover(false)}
          style={{
            backgroundColor: colors.success,
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
            boxShadow: exportHover ? '0 6px 10px rgba(0,0,0,0.15)' : shadows.base,
            transform: exportHover ? 'translateY(-1px)' : 'none',
            transition: transitions.base,
          }}
        >
          Export Data
        </button>
        <button
          onClick={handleImportClick}
          onMouseEnter={() => setImportHover(true)}
          onMouseLeave={() => setImportHover(false)}
          style={{
            backgroundColor: colors.primary,
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
            boxShadow: importHover ? '0 6px 10px rgba(0,0,0,0.15)' : shadows.base,
            transform: importHover ? 'translateY(-1px)' : 'none',
            transition: transitions.base,
          }}
        >
          Import Data
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImport}
          style={{ display: 'none' }}
        />
      </div>
      
      {history.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '40px 24px',
          background: `linear-gradient(135deg, ${colors.gray50} 0%, ${colors.infoLight} 100%)`,
          borderRadius: '12px',
          border: 'none',
          boxShadow: shadows.base,
          animation: 'fadeIn 0.5s ease-in-out',
        }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>📊</div>
          <p style={{ color: colors.gray900, fontSize: '20px', fontWeight: '600', margin: '0 0 8px 0' }}>
            No usage history yet
          </p>
          <p style={{ color: colors.gray600, margin: 0, lineHeight: '1.5' }}>
            Start tracking your infusion sites to see your history here.
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
        <div>
          <div style={{
            backgroundColor: colors.infoLight,
            border: 'none',
            borderLeft: `4px solid ${colors.info}`,
            borderRadius: '8px',
            padding: '12px 12px 12px 16px',
            marginBottom: '20px',
            boxShadow: shadows.sm,
          }}>
            <p style={{ margin: 0, color: colors.infoHover, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📈</span> <strong>Total uses:</strong> {history.length}
            </p>
          </div>

          <div style={{ display: 'grid', gap: '20px' }}>
            {dateKeys.map(dateKey => (
              <div key={dateKey} style={{ border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ 
                  backgroundColor: '#f8f9fa', 
                  padding: '12px 15px', 
                  borderBottom: '1px solid #ddd',
                  fontWeight: 'bold',
                  color: '#495057'
                }}>
                  {formatDate(groupedHistory[dateKey][0].timestamp)}
                </div>
                <div style={{ padding: '0' }}>
                  {groupedHistory[dateKey].map((record, index) => (
                    <div 
                      key={record.id}
                      style={{ 
                        padding: '15px',
                        borderBottom: index < groupedHistory[dateKey].length - 1 ? '1px solid #eee' : 'none'
                      }}
                    >
                      {editingRecord === record.id ? (
                        <div style={{ display: 'grid', gap: '10px' }}>
                          <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Site:</label>
                            <select
                              value={editSiteId}
                              onChange={(e) => setEditSiteId(e.target.value)}
                              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                            >
                              <option value="">Select a site</option>
                              {sites.map(site => (
                                <option key={site.id} value={site.id}>
                                  {site.name} ({site.side})
                                </option>
                              ))}
                            </select>
                          </div>
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <div style={{ flex: 1 }}>
                              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Date:</label>
                              <input
                                type="date"
                                value={editDate}
                                onChange={(e) => setEditDate(e.target.value)}
                                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                              />
                            </div>
                            <div style={{ flex: 1 }}>
                              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Time:</label>
                              <input
                                type="time"
                                value={editTime}
                                onChange={(e) => setEditTime(e.target.value)}
                                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                              />
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button
                              onClick={cancelEdit}
                              style={{
                                backgroundColor: colors.gray600,
                                color: 'white',
                                border: 'none',
                                padding: '6px 12px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                boxShadow: shadows.sm,
                                transition: transitions.base,
                              }}
                            >
                              Cancel
                            </button>
                            <button
                              onClick={saveEdit}
                              style={{
                                backgroundColor: colors.success,
                                color: 'white',
                                border: 'none',
                                padding: '6px 12px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                boxShadow: shadows.sm,
                                transition: transitions.base,
                              }}
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontWeight: 'bold', color: '#333', marginBottom: '2px' }}>
                              {record.siteName} ({record.siteSide})
                            </div>
                            <div style={{ color: '#666', fontSize: '14px' }}>
                              {formatRelativeTime(record.timestamp)}
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ color: '#666', fontSize: '14px', textAlign: 'right' }}>
                              {formatTime(record.timestamp)}
                            </div>
                            <div style={{ display: 'flex', gap: '5px' }}>
                              <button
                                onClick={() => startEditRecord(record)}
                                style={{
                                  backgroundColor: colors.primary,
                                  color: 'white',
                                  border: 'none',
                                  padding: '10px 14px',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontSize: '14px',
                                  fontWeight: '600',
                                  minHeight: '44px',
                                  boxShadow: shadows.sm,
                                  transition: transitions.base,
                                }}
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteRecord(record.id)}
                                style={{
                                  backgroundColor: colors.danger,
                                  color: 'white',
                                  border: 'none',
                                  padding: '10px 14px',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontSize: '14px',
                                  fontWeight: '600',
                                  minHeight: '44px',
                                  boxShadow: shadows.sm,
                                  transition: transitions.base,
                                }}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, recordId: null })}
        title="Delete Record"
        message="Are you sure you want to delete this usage record?"
        type="confirm"
        confirmText="Delete"
        onConfirm={confirmDelete}
      />

      <Modal
        isOpen={importConfirm.isOpen}
        onClose={() => setImportConfirm({ isOpen: false, data: null })}
        title="Import Data"
        message="This will replace all current data. Are you sure you want to continue?"
        type="confirm"
        confirmText="Import"
        onConfirm={confirmImport}
      />

      <Modal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ isOpen: false, title: '', message: '' })}
        title={alertModal.title}
        message={alertModal.message}
        type="alert"
      />
    </div>
  );
};

export default UsageHistory;