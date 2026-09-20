import React, { useState } from 'react';
import { Copy, Check, Users, Radio, Shield, Sparkles, Activity } from 'lucide-react';

export default function Navbar({ roomCode, participantCount = 1, isConnected = false, onOpenStats }) {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="glass-panel" style={{
      margin: '12px 16px 0 16px',
      padding: '10px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderRadius: 'var(--radius-lg)',
      zIndex: 10,
    }}>
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 18px rgba(99, 102, 241, 0.4)',
        }}>
          <Radio size={20} color="#fff" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 800,
              fontSize: '1.2rem',
              letterSpacing: '-0.02em',
              background: 'linear-gradient(to right, #ffffff, #cbd5e1)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              STUDY ARENA
            </span>
            <span className="badge badge-primary" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
              ₹0 ARCH
            </span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1 }}>
            P2P WebRTC Discussion Stage
          </p>
        </div>
      </div>

      {/* Center Room Code Pill (if in room) */}
      {roomCode && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={handleCopyCode}
            className="btn btn-secondary"
            title="Click to copy Room Code"
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(99, 102, 241, 0.12)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              color: '#c7d2fe',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.85rem',
            }}
          >
            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 500 }}>ROOM:</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.05em' }}>
              {roomCode}
            </span>
            {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} color="#a5b4fc" />}
          </button>
        </div>
      )}

      {/* Right Status Badges */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {roomCode && (
          <div className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Users size={14} />
            <span>{participantCount} {participantCount === 1 ? 'Peer' : 'Peers'}</span>
          </div>
        )}

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          borderRadius: 'var(--radius-full)',
          background: isConnected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          border: `1px solid ${isConnected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
          fontSize: '0.8rem',
          color: isConnected ? '#34d399' : '#f87171',
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: isConnected ? '#10b981' : '#ef4444',
            boxShadow: `0 0 8px ${isConnected ? '#10b981' : '#ef4444'}`,
          }} />
          <span>{isConnected ? 'Signaling Active' : 'Disconnected'}</span>
        </div>

        {onOpenStats && (
          <button
            onClick={onOpenStats}
            className="btn btn-secondary btn-icon"
            title="WebRTC Network Diagnostics"
            style={{ width: '36px', height: '36px' }}
          >
            <Activity size={16} />
          </button>
        )}
      </div>
    </header>
  );
}
