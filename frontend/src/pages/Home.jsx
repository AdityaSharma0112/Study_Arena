import React, { useState, useEffect } from 'react';
import {
  Video,
  Users,
  Radio,
  Sparkles,
  ArrowRight,
  Shield,
  Zap,
  Plus,
  LogIn,
  RefreshCw,
  Trash2,
  Lock,
  History,
  FolderLock,
  Crown,
} from 'lucide-react';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Home({ onEnterLobby, onOpenCreateModal }) {
  const { user, isAuthenticated, openLoginModal } = useAuth();

  const [joinCode, setJoinCode] = useState('');
  const [createdRooms, setCreatedRooms] = useState([]);
  const [joinedRooms, setJoinedRooms] = useState([]);
  const [joinError, setJoinError] = useState('');
  const [loadingJoin, setLoadingJoin] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingCode, setDeletingCode] = useState(null);

  const fetchRooms = async () => {
    setRefreshing(true);
    try {
      const response = await apiService.getActiveRooms();
      if (response && Array.isArray(response.created_rooms)) {
        setCreatedRooms(response.created_rooms);
        setJoinedRooms(response.joined_rooms || []);
      } else if (Array.isArray(response)) {
        // Fallback for legacy format
        setCreatedRooms(response);
        setJoinedRooms([]);
      } else {
        setCreatedRooms([]);
        setJoinedRooms([]);
      }
    } catch (e) {
      console.warn('Could not fetch personalized rooms:', e);
      setCreatedRooms([]);
      setJoinedRooms([]);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, [isAuthenticated, user]);

  const handleOpenCreate = () => {
    if (!isAuthenticated) {
      openLoginModal();
      return;
    }
    onOpenCreateModal();
  };

  const handleJoinByCode = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      openLoginModal();
      return;
    }
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
      setJoinError(err.message || 'Could not verify room. Please check backend connection.');
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
      setCreatedRooms((prev) => prev.filter((r) => r.code !== code));
    } catch (err) {
      alert('Failed to delete room: ' + err.message);
    } finally {
      setDeletingCode(null);
    }
  };

  const totalMyRooms = createdRooms.length + joinedRooms.length;

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
          Direct peer-to-peer WebRTC video conferencing with synchronized debate timers and AI-assisted answer scoring.
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
                Launch a new discussion arena. Get a unique room code to invite your peers.
              </p>
            </div>
            <button
              onClick={handleOpenCreate}
              className="btn btn-primary"
              style={{ width: '100%', padding: '14px', fontSize: '1rem', gap: '8px' }}
            >
              {isAuthenticated ? (
                <>
                  <Video size={18} /> Launch New Arena
                </>
              ) : (
                <>
                  <Lock size={18} /> Sign In to Launch Arena
                </>
              )}
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
                {loadingJoin ? 'Verifying Room...' : (isAuthenticated ? 'Enter Room' : 'Sign In & Enter Room')} <ArrowRight size={16} />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Personalized Rooms Section */}
      <div style={{ marginTop: '50px' }}>
        {isAuthenticated ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>
            {/* Header with Refresh */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ fontSize: '1.4rem', color: '#fff', margin: 0, fontWeight: 700 }}>
                  Your Personalized Arenas
                </h2>
                <span className="badge badge-primary">{totalMyRooms}</span>
              </div>
              <button
                onClick={fetchRooms}
                className="btn btn-secondary"
                style={{ padding: '6px 14px', fontSize: '0.85rem' }}
              >
                <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> Refresh
              </button>
            </div>

            {/* Category 1: My Created Arenas */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Crown size={18} color="#eab308" />
                <h3 style={{ fontSize: '1.15rem', color: '#f1f5f9', margin: 0 }}>
                  My Created Arenas ({createdRooms.length})
                </h3>
              </div>

              {createdRooms.length === 0 ? (
                <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-dim)' }}>
                  <p style={{ margin: 0, fontSize: '0.9rem' }}>You haven't created any arenas yet.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                  {createdRooms.map((room) => (
                    <div
                      key={room.id}
                      className="glass-panel"
                      style={{
                        padding: '18px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '12px',
                        border: '1px solid rgba(234, 179, 8, 0.25)',
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
                        <p style={{ color: '#eab308', fontSize: '0.8rem', fontWeight: 600 }}>
                          👑 Host: {room.host_name} (You)
                        </p>
                      </div>

                      <button
                        onClick={() => onEnterLobby(room.code, room.title)}
                        className="btn btn-primary"
                        style={{ width: '100%', fontSize: '0.85rem' }}
                      >
                        Re-enter Arena <ArrowRight size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Category 2: Previously Joined Arenas */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <History size={18} color="#06b6d4" />
                <h3 style={{ fontSize: '1.15rem', color: '#f1f5f9', margin: 0 }}>
                  Previously Joined Arenas ({joinedRooms.length})
                </h3>
              </div>

              {joinedRooms.length === 0 ? (
                <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-dim)' }}>
                  <p style={{ margin: 0, fontSize: '0.9rem' }}>
                    No previously joined arenas. Join any room using its code or invite link to save it here.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                  {joinedRooms.map((room) => (
                    <div
                      key={room.id}
                      className="glass-panel"
                      style={{
                        padding: '18px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '12px',
                        border: '1px solid rgba(6, 182, 212, 0.25)',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span className="badge badge-primary" style={{ fontFamily: 'var(--font-mono)' }}>
                            {room.code}
                          </span>
                          <span className="badge badge-success">
                            {room.active_count} / {room.max_participants} Peers
                          </span>
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
                        Re-join Arena <ArrowRight size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Privacy Banner for Unauthenticated Visitors */
          <div className="glass-panel-elevated" style={{
            padding: '36px',
            textAlign: 'center',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(30, 27, 75, 0.5) 100%)',
          }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              background: 'rgba(99, 102, 241, 0.15)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
            }}>
              <FolderLock size={26} color="#a5b4fc" />
            </div>
            <h3 style={{ fontSize: '1.35rem', color: '#fff', marginBottom: '8px' }}>
              Private Arena Workspace
            </h3>
            <p style={{
              color: 'var(--text-muted)',
              fontSize: '0.95rem',
              maxWidth: '560px',
              margin: '0 auto 24px',
              lineHeight: 1.6,
            }}>
              Database rooms are protected and strictly personalized. Sign in to view your created arenas and previous session history, or enter a specific room code above to join directly.
            </p>
            <button
              onClick={openLoginModal}
              className="btn btn-primary"
              style={{ padding: '12px 28px', fontSize: '0.95rem', gap: '8px', display: 'inline-flex' }}
            >
              <Lock size={16} /> Sign In to Access Your Dashboard
            </button>
          </div>
        )}
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
              <h4 style={{ color: '#fff', margin: 0 }}>Access Privacy & Control</h4>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Database records are private to creators and invited peers. Manage users securely via Django Admin.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
