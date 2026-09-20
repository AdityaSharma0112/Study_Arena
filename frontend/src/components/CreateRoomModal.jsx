import React, { useState } from 'react';
import { X, Video, Users, Sparkles, Loader2 } from 'lucide-react';
import { apiService } from '../services/api';

export default function CreateRoomModal({ isOpen, onClose, onRoomCreated }) {
  const [title, setTitle] = useState('');
  const [hostName, setHostName] = useState('');
  const [maxParticipants, setMaxParticipants] = useState(4);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const room = await apiService.createRoom(
        title.trim() || 'Arena Discussion Room',
        hostName.trim() || 'Host',
        Number(maxParticipants) || 4
      );
      onRoomCreated(room, hostName.trim() || 'Host');
    } catch (err) {
      console.error('Room creation error:', err);
      setError(err.message || 'Failed to create room on server. Is Django backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50,
      padding: '20px',
    }}>
      <div className="glass-panel-elevated" style={{
        width: '100%',
        maxWidth: '480px',
        padding: '32px',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Video size={18} color="#fff" />
            </div>
            <h3 style={{ fontSize: '1.25rem', color: '#fff', margin: 0 }}>Create Discussion Room</h3>
          </div>
          <button onClick={onClose} className="btn btn-secondary btn-icon" style={{ width: '32px', height: '32px' }}>
            <X size={16} />
          </button>
        </div>

        {error && (
          <div style={{
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#fca5a5',
            fontSize: '0.85rem',
            marginBottom: '16px',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
              Room Title / Topic
            </label>
            <input
              type="text"
              className="input-glass"
              placeholder="e.g. System Design Mock Interview"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={80}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
              Your Host Name
            </label>
            <input
              type="text"
              required
              className="input-glass"
              placeholder="e.g. Alex"
              value={hostName}
              onChange={(e) => setHostName(e.target.value)}
              maxLength={30}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
              Max Participants (₹0 Full Mesh P2P: 2-6 peers)
            </label>
            <select
              className="input-glass"
              value={maxParticipants}
              onChange={(e) => setMaxParticipants(Number(e.target.value))}
              style={{ cursor: 'pointer' }}
            >
              <option value={2} style={{ background: '#0f172a', color: '#fff' }}>2 Peers (1-on-1 Ultra Low Latency)</option>
              <option value={4} style={{ background: '#0f172a', color: '#fff' }}>4 Peers (Recommended for Group Discussion)</option>
              <option value={6} style={{ background: '#0f172a', color: '#fff' }}>6 Peers (Arena Max)</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              style={{ flex: 1 }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ flex: 1.5 }}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Creating...
                </>
              ) : (
                'Create Room'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
