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
  Hand,
  LayoutGrid,
  Film,
} from 'lucide-react';

export default function MediaControls({
  isMuted,
  isCameraOff,
  isScreenSharing,
  isChatOpen,
  isHandRaised = false,
  isSpotlightMode = true,
  unreadCount = 0,
  onToggleMic,
  onToggleCamera,
  onToggleScreenShare,
  onToggleChat,
  onToggleHandRaise,
  onToggleLayout,
  onLeaveCall,
  onOpenSettings,
}) {
  // Global Keyboard shortcuts: M = Mic, V = Video, S = Screen, H = Hand, L = Layout
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
      } else if (e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        if (onToggleHandRaise) onToggleHandRaise();
      } else if (e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        if (onToggleLayout) onToggleLayout();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onToggleMic, onToggleCamera, onToggleScreenShare, onToggleHandRaise, onToggleLayout]);

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

        {/* Raise Hand Toggle */}
        {onToggleHandRaise && (
          <button
            onClick={onToggleHandRaise}
            className="btn btn-icon-lg btn-secondary"
            title={isHandRaised ? 'Lower Hand (Key: H)' : 'Raise Hand (Key: H)'}
            style={{
              background: isHandRaised ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : undefined,
              boxShadow: isHandRaised ? '0 0 16px rgba(245, 158, 11, 0.5)' : undefined,
              borderColor: isHandRaised ? '#fbbf24' : undefined,
            }}
          >
            <Hand size={22} color="#fff" />
          </button>
        )}

        {/* Layout Switcher Toggle (Spotlight Podium vs Equal Grid) */}
        {onToggleLayout && (
          <button
            onClick={onToggleLayout}
            className="btn btn-icon-lg btn-secondary"
            title={isSpotlightMode ? 'Switch to Equal Grid View (Key: L)' : 'Switch to Stage Podium Spotlight (Key: L)'}
            style={{
              color: isSpotlightMode ? '#818cf8' : '#94a3b8',
            }}
          >
            {isSpotlightMode ? <Film size={22} /> : <LayoutGrid size={22} />}
          </button>
        )}

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
