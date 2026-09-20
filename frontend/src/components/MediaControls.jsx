import React, { useEffect } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  PhoneOff,
  MessageSquare,
  Settings,
  Sparkles,
} from 'lucide-react';

export default function MediaControls({
  isMuted,
  isCameraOff,
  isScreenSharing,
  isChatOpen,
  unreadCount = 0,
  onToggleMic,
  onToggleCamera,
  onToggleScreenShare,
  onToggleChat,
  onLeaveCall,
  onOpenSettings,
}) {
  // Global Keyboard shortcuts: M = Mic, V = Video, S = Screen
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger shortcuts if typing inside an input/textarea
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

      if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        onToggleMic();
      } else if (e.key === 'v' || e.key === 'V') {
        e.preventDefault();
        onToggleCamera();
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        onToggleScreenShare();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onToggleMic, onToggleCamera, onToggleScreenShare]);

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 40,
    }}>
      <div className="control-pill">
        {/* Microphone Toggle */}
        <button
          onClick={onToggleMic}
          className={`btn btn-icon-lg ${isMuted ? 'btn-danger' : 'btn-secondary'}`}
          title={isMuted ? 'Unmute microphone (Key: M)' : 'Mute microphone (Key: M)'}
        >
          {isMuted ? <MicOff size={22} color="#fff" /> : <Mic size={22} color="#fff" />}
        </button>

        {/* Camera Toggle */}
        <button
          onClick={onToggleCamera}
          className={`btn btn-icon-lg ${isCameraOff ? 'btn-danger' : 'btn-secondary'}`}
          title={isCameraOff ? 'Turn on camera (Key: V)' : 'Turn off camera (Key: V)'}
        >
          {isCameraOff ? <VideoOff size={22} color="#fff" /> : <Video size={22} color="#fff" />}
        </button>

        {/* Screen Share Toggle */}
        <button
          onClick={onToggleScreenShare}
          className={`btn btn-icon-lg ${isScreenSharing ? 'btn-primary' : 'btn-secondary'}`}
          title={isScreenSharing ? 'Stop sharing screen (Key: S)' : 'Share screen (Key: S)'}
          style={{
            background: isScreenSharing ? 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)' : undefined,
          }}
        >
          <Monitor size={22} color="#fff" />
        </button>

        {/* Separator */}
        <div style={{ width: '1px', height: '30px', background: 'rgba(255, 255, 255, 0.12)', margin: '0 4px' }} />

        {/* In-Call Chat Toggle */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={onToggleChat}
            className={`btn btn-icon-lg ${isChatOpen ? 'btn-primary' : 'btn-secondary'}`}
            title="Toggle room chat"
          >
            <MessageSquare size={22} color="#fff" />
          </button>
          {!isChatOpen && unreadCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              background: 'var(--accent)',
              color: '#fff',
              fontSize: '0.7rem',
              fontWeight: 700,
              borderRadius: 'var(--radius-full)',
              width: '20px',
              height: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid var(--bg-main)',
            }}>
              {unreadCount}
            </span>
          )}
        </div>

        {/* Device Settings */}
        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className="btn btn-icon-lg btn-secondary"
            title="Audio & Video Settings"
          >
            <Settings size={22} color="#94a3b8" />
          </button>
        )}

        {/* End / Leave Call */}
        <button
          onClick={onLeaveCall}
          className="btn btn-danger btn-icon-lg"
          title="Leave Room"
          style={{
            marginLeft: '4px',
            background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
          }}
        >
          <PhoneOff size={22} color="#fff" />
        </button>
      </div>
    </div>
  );
}
