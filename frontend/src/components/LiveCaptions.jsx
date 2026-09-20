import React from 'react';
import { Volume2 } from 'lucide-react';

export default function LiveCaptions({ speakerName, text, isMe = false }) {
  if (!text || text.trim().length === 0) return null;

  return (
    <div style={{
      position: 'absolute',
      bottom: '48px',
      left: '12px',
      right: '12px',
      zIndex: 15,
      pointerEvents: 'none',
      display: 'flex',
      justifyContent: 'center',
    }}>
      <div style={{
        background: 'rgba(11, 17, 32, 0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: 'var(--radius-md)',
        padding: '8px 16px',
        maxWidth: '90%',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        animation: 'fadeIn 0.2s ease',
      }}>
        <Volume2 size={14} color="#34d399" style={{ flexShrink: 0 }} />
        <span style={{
          fontSize: '0.85rem',
          color: '#f8fafc',
          lineHeight: 1.3,
          fontWeight: 500,
          textShadow: '0 1px 2px rgba(0,0,0,0.8)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}>
          {text}
        </span>
      </div>
    </div>
  );
}
