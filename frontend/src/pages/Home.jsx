import React, { useState, useEffect } from 'react';
import {
  Video,
  Users,
  Radio,
  Sparkles,
  ArrowRight,
  Shield,
  Zap,
  Globe,
  Plus,
  LogIn,
  Layers,
  Cpu,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { apiService } from '../services/api';

export default function Home({ onEnterLobby, onOpenCreateModal }) {
  const [joinCode, setJoinCode] = useState('');
  const [activeRooms, setActiveRooms] = useState([]);
  const [joinError, setJoinError] = useState('');
  const [loadingJoin, setLoadingJoin] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingCode, setDeletingCode] = useState(null);

  const fetchActiveRooms = async () => {
    setRefreshing(true);
    try {
      const rooms = await apiService.getActiveRooms();
      setActiveRooms(rooms);
    } catch (e) {
      console.warn('Could not fetch active rooms:', e);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchActiveRooms();
  }, []);

  const handleJoinByCode = async (e) => {
    e.preventDefault();
    const cleanCode = joinCode.trim().toUpperCase();
    if (!cleanCode) return;

    setLoadingJoin(true);
    setJoinError('');

    try {
      const result = await apiService.verifyRoom(cleanCode);
      if (result.valid) {
        onEnterLobby(result.room.code, result.room.title);
      } else {
        setJoinError(result.error || 'Room not found or full.');
      }
    } catch (err) {
      setJoinError('Could not verify room. Please check backend connection.');
    } finally {
      setLoadingJoin(false);
    }
  };

  const handleDeleteRoom = async (code, e) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete Room ${code}?`)) return;

    setDeletingCode(code);
    try {
      await apiService.deleteRoom(code);
      setActiveRooms((prev) => prev.filter((r) => r.code !== code));
    } catch (err) {
      alert('Failed to delete room: ' + err.message);
    } finally {
      setDeletingCode(null);
    }
  };

  const handleClearAllRooms = async () => {
    if (!window.confirm('Are you sure you want to delete ALL active rooms?')) return;

    setRefreshing(true);
    try {
      await apiService.clearAllRooms();
      setActiveRooms([]);
    } catch (err) {
      alert('Failed to clear rooms: ' + err.message);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px', width: '100%' }}>
      {/* Hero Section */}
      <div style={{ textAlign: 'center', margin: '30px 0 50px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 16px',
          borderRadius: 'var(--radius-full)',
          background: 'rgba(99, 102, 241, 0.12)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          marginBottom: '20px',
        }}>
          <Sparkles size={16} color="var(--primary-light)" />
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#c7d2fe' }}>
            Production-Grade ₹0 Architecture WebRTC Mesh
          </span>
        </div>

        <h1 style={{
          fontSize: 'clamp(2.5rem, 5vw, 4rem)',
          lineHeight: 1.1,
          marginBottom: '18px',
          background: 'linear-gradient(135deg, #ffffff 30%, #a5b4fc 70%, #06b6d4 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          Study Arena Video Call Stage
        </h1>

        <p style={{
          fontSize: '1.15rem',
          color: 'var(--text-muted)',
          maxWidth: '700px',
          margin: '0 auto 36px',
          lineHeight: 1.6,
        }}>
          Direct peer-to-peer WebRTC video conferencing orchestrated with Django Channels WebSockets.
          Zero media server overhead, ultra-low latency, and ready for AI-assisted evaluations.
        </p>

        {/* Action Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '24px',
          maxWidth: '820px',
          margin: '0 auto',
        }}>
          {/* Create Room Card */}
          <div className="glass-panel-elevated" style={{ padding: '32px', textAlign: 'left', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, var(--primary) 0%, #4f46e5 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px',
                boxShadow: '0 0 20px var(--primary-glow)',
              }}>
                <Plus size={24} color="#fff" />
              </div>
              <h3 style={{ fontSize: '1.4rem', color: '#fff', marginBottom: '8px' }}>Create Instant Room</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>
                Launch a new discussion arena. Get a unique room code to invite up to 6 peers.
              </p>
            </div>
            <button
              onClick={onOpenCreateModal}
              className="btn btn-primary"
              style={{ width: '100%', padding: '14px', fontSize: '1rem', gap: '8px' }}
            >
              <Video size={18} /> Launch New Arena
            </button>
          </div>

          {/* Join with Code Card */}
          <div className="glass-panel-elevated" style={{ padding: '32px', textAlign: 'left', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, var(--secondary) 0%, #0284c7 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px',
                boxShadow: '0 0 20px var(--secondary-glow)',
              }}>
                <LogIn size={24} color="#fff" />
              </div>
              <h3 style={{ fontSize: '1.4rem', color: '#fff', marginBottom: '8px' }}>Join Existing Room</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>
                Have an invitation code? Enter the 8-character code to step onto the stage.
              </p>
            </div>

            <form onSubmit={handleJoinByCode} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input
                type="text"
                className="input-glass"
                placeholder="e.g. 7F3A9C12"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                maxLength={16}
                style={{ textTransform: 'uppercase', fontFamily: 'var(--font-mono)', fontWeight: 600, letterSpacing: '0.05em' }}
              />
              {joinError && (
                <span style={{ color: '#f87171', fontSize: '0.8rem' }}>{joinError}</span>
              )}
              <button
                type="submit"
                disabled={loadingJoin || !joinCode.trim()}
                className="btn btn-secondary"
                style={{ width: '100%', padding: '12px', borderColor: 'var(--secondary)' }}
              >
                {loadingJoin ? 'Verifying Room...' : 'Enter Room'} <ArrowRight size={16} />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Architecture Highlights */}
      <div style={{ margin: '60px 0 30px' }}>
        <h3 style={{ fontSize: '1.3rem', color: '#fff', marginBottom: '20px', textAlign: 'center' }}>
          Why the ₹0 Architecture Works
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <Zap size={20} color="var(--primary-light)" />
              <h4 style={{ color: '#fff', margin: 0 }}>Direct P2P WebRTC</h4>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Media streams directly between peer browsers using public STUN. Zero server video bandwidth costs.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <Radio size={20} color="var(--secondary)" />
              <h4 style={{ color: '#fff', margin: 0 }}>Django Channels Signaling</h4>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Lightweight ASGI WebSockets coordinate room discovery, SDP handshakes, ICE candidates, and real-time state.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <Shield size={20} color="#34d399" />
              <h4 style={{ color: '#fff', margin: 0 }}>Horizontally Scalable</h4>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Backed by Redis channel layers for scaling signaling nodes and Celery workers for background AI scoring.
            </p>
          </div>
        </div>
      </div>

      {/* Active Public Rooms Section */}
      <div style={{ marginTop: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h3 style={{ fontSize: '1.2rem', color: '#fff', margin: 0 }}>Active Public Rooms</h3>
            <span className="badge badge-primary">{activeRooms.length}</span>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {activeRooms.length > 0 && (
              <button
                onClick={handleClearAllRooms}
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.8rem', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                title="Delete all active rooms"
              >
                <Trash2 size={14} /> Clear All
              </button>
            )}
            <button
              onClick={fetchActiveRooms}
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>
        </div>

        {activeRooms.length === 0 ? (
          <div className="glass-panel" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-dim)' }}>
            <p style={{ fontSize: '0.95rem', margin: 0 }}>No active rooms right now.</p>
            <p style={{ fontSize: '0.8rem', marginTop: '4px' }}>Click "Launch New Arena" above to create one!</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {activeRooms.map((room) => (
              <div
                key={room.id}
                className="glass-panel"
                style={{
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '12px',
                  position: 'relative',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="badge badge-primary" style={{ fontFamily: 'var(--font-mono)' }}>
                      {room.code}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="badge badge-success">
                        {room.active_count} / {room.max_participants} Peers
                      </span>
                      <button
                        onClick={(e) => handleDeleteRoom(room.code, e)}
                        className="btn btn-secondary btn-icon"
                        style={{ width: '26px', height: '26px', color: '#f87171', border: 'none', background: 'rgba(239,68,68,0.1)' }}
                        title="Delete Room"
                        disabled={deletingCode === room.code}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                  <h4 style={{ color: '#fff', margin: '10px 0 4px', fontSize: '1.05rem' }}>
                    {room.title}
                  </h4>
                  <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                    Host: {room.host_name}
                  </p>
                </div>

                <button
                  onClick={() => onEnterLobby(room.code, room.title)}
                  className="btn btn-secondary"
                  style={{ width: '100%', fontSize: '0.85rem' }}
                >
                  Join Room <ArrowRight size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
