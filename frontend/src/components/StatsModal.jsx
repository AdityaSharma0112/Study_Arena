import React from 'react';
import { X, Activity, Server, Cpu, Globe, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function StatsModal({ isOpen, onClose, peers = {}, isConnected = false, roomCode }) {
  if (!isOpen) return null;

  const peerList = Object.values(peers);

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
        maxWidth: '650px',
        padding: '28px',
        maxHeight: '90vh',
        overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Activity size={22} color="var(--primary-light)" />
            <h3 style={{ fontSize: '1.25rem', color: '#fff', margin: 0 }}>
              WebRTC & ₹0 Architecture Diagnostics
            </h3>
          </div>
          <button onClick={onClose} className="btn btn-secondary btn-icon" style={{ width: '32px', height: '32px' }}>
            <X size={16} />
          </button>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', marginBottom: '24px' }}>
          <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '4px' }}>MEDIA TOPOLOGY</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--secondary)' }}>Full Mesh P2P (Direct)</div>
            <div style={{ fontSize: '0.75rem', color: '#34d399', marginTop: '4px' }}>✓ Zero Media Server Bandwidth</div>
          </div>

          <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '4px' }}>SIGNALING SERVER</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: isConnected ? '#34d399' : '#f87171' }}>
              {isConnected ? 'Django Channels (WS)' : 'Offline'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Room: {roomCode}</div>
          </div>

          <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '4px' }}>STUN ENDPOINT</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#c7d2fe', fontFamily: 'var(--font-mono)' }}>
              stun.l.google.com:19302
            </div>
            <div style={{ fontSize: '0.75rem', color: '#34d399', marginTop: '4px' }}>✓ Public Zero-Cost NAT Discovery</div>
          </div>

          <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '4px' }}>ESTABLISHED PEER LINKS</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>
              {peerList.length} Active {peerList.length === 1 ? 'Link' : 'Links'}
            </div>
          </div>
        </div>

        {/* Peer Connections Detail */}
        <h4 style={{ fontSize: '0.95rem', color: '#fff', marginBottom: '10px' }}>Active Peer Connections</h4>
        {peerList.length === 0 ? (
          <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>No remote peers connected yet. Invite a friend by sharing the Room Code.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {peerList.map((p, idx) => (
              <div key={idx} style={{
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>{p.username}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>{p.peerId}</div>
                </div>
                <div className="badge badge-success" style={{ textTransform: 'uppercase' }}>
                  {p.connectionState || 'Connected'}
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: '24px', textAlign: 'right' }}>
          <button onClick={onClose} className="btn btn-secondary">
            Close Diagnostics
          </button>
        </div>
      </div>
    </div>
  );
}
