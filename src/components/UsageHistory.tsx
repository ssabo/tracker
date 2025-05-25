import React, { useState, useEffect } from 'react';
import { getUsageHistory, deleteUsageRecord, updateUsageRecord, loadData } from '../utils/storage';
import { InfusionSite } from '../types';

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

  const groupByDate = (records: HistoryRecord[]) => {
    const groups: { [key: string]: HistoryRecord[] } = {};
    
    records.forEach(record => {
      const dateKey = formatDate(record.timestamp);
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(record);
    });

    return groups;
  };

  const handleDeleteRecord = (recordId: string) => {
    if (window.confirm('Are you sure you want to delete this usage record?')) {
      deleteUsageRecord(recordId);
      loadHistory();
    }
  };

  const startEditRecord = (record: HistoryRecord) => {
    setEditingRecord(record.id);
    setEditSiteId(record.siteId);
    const date = new Date(record.timestamp);
    setEditDate(date.toISOString().split('T')[0]);
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

  const groupedHistory = groupByDate(history);
  const dateKeys = Object.keys(groupedHistory).sort((a, b) => {
    const dateA = new Date(a).getTime();
    const dateB = new Date(b).getTime();
    return dateB - dateA;
  });

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>Usage History</h2>
      
      {history.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '8px',
          border: '1px solid #dee2e6'
        }}>
          <p style={{ color: '#666', fontSize: '18px', margin: 0 }}>
            No usage history yet.
          </p>
          <p style={{ color: '#666', margin: '10px 0 0 0' }}>
            Start tracking your infusion sites to see your history here.
          </p>
        </div>
      ) : (
        <div>
          <div style={{ 
            backgroundColor: '#e7f3ff', 
            border: '1px solid #b3d9ff', 
            borderRadius: '8px', 
            padding: '15px', 
            marginBottom: '20px' 
          }}>
            <p style={{ margin: 0, color: '#0066cc' }}>
              <strong>Total uses:</strong> {history.length}
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
                  {dateKey}
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
                                backgroundColor: '#6c757d',
                                color: 'white',
                                border: 'none',
                                padding: '6px 12px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px'
                              }}
                            >
                              Cancel
                            </button>
                            <button
                              onClick={saveEdit}
                              style={{
                                backgroundColor: '#28a745',
                                color: 'white',
                                border: 'none',
                                padding: '6px 12px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px'
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
                                  backgroundColor: '#007bff',
                                  color: 'white',
                                  border: 'none',
                                  padding: '4px 8px',
                                  borderRadius: '3px',
                                  cursor: 'pointer',
                                  fontSize: '11px'
                                }}
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteRecord(record.id)}
                                style={{
                                  backgroundColor: '#dc3545',
                                  color: 'white',
                                  border: 'none',
                                  padding: '4px 8px',
                                  borderRadius: '3px',
                                  cursor: 'pointer',
                                  fontSize: '11px'
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
    </div>
  );
};

export default UsageHistory;