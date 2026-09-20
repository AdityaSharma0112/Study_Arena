import React, { useEffect, useRef, useState } from 'react';
import { MicOff, VideoOff, Monitor, Maximize2, Minimize2, Pin, Wifi, Sparkles, Mic } from 'lucide-react';
import LiveCaptions from './LiveCaptions';

export default function VideoTile({
  stream,
  username = 'Participant',
  isLocal = false,
  isMuted = false,
  isCameraOff = false,
  isScreenSharing = false,
  isSpeaking = false,
  audioLevel = 0,
  connectionState = 'connected',
  onPin,
  isPinned = false,
  isPodium = false,
  captions = '',
}) {
  const videoRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);

  // Attach stream and trigger playback
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl || !stream) return;

    videoEl.srcObject = stream;

    const playPromise = videoEl.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.warn(`[VideoTile ${username}] Autoplay notice:`, err.message);
      });
    }
  }, [stream, username]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div
      ref={containerRef}
      className={`video-tile ${isSpeaking ? 'speaking' : ''} ${isLocal && !isScreenSharing ? 'mirrored' : ''}`}
      style={{
        border: isPodium
          ? '2.5px solid var(--primary-light)'
          : (isPinned ? '2px solid var(--secondary)' : undefined),
        boxShadow: isPodium
          ? '0 0 35px var(--primary-glow), inset 0 0 15px rgba(99, 102, 241, 0.2)'
          : (isPinned ? '0 0 25px var(--secondary-glow)' : undefined),
      }}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal} // Always mute local video to prevent echo feedback loop
        onLoadedMetadata={(e) => {
          e.target.play().catch(() => {});
        }}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: isCameraOff && !isScreenSharing ? 'none' : 'block',
        }}
      />

      {/* Camera Off Avatar Fallback */}
      {isCameraOff && !isScreenSharing && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          height: '100%',
          width: '100%',
        }}>
          <div className="camera-off-avatar animate-pulse-slow">
            {getInitials(username)}
          </div>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            Camera is off
          </span>
        </div>
      )}

      {/* Live Speech Captions Overlay */}
      {captions && (
        <LiveCaptions
          speakerName={username}
          text={captions}
          isMe={isLocal}
        />
      )}

      {/* Top Action Buttons (Hover overlay) */}
      <div className="tile-top-actions">
        {onPin && (
          <button
            onClick={() => onPin()}
            className="btn btn-secondary btn-icon"
            style={{ width: '32px', height: '32px', background: isPinned ? 'var(--secondary)' : 'rgba(0,0,0,0.5)' }}
            title={isPinned ? 'Unpin video' : 'Pin video'}
          >
            <Pin size={14} color="#fff" />
          </button>
        )}
        <button
          onClick={toggleFullscreen}
          className="btn btn-secondary btn-icon"
          style={{ width: '32px', height: '32px', background: 'rgba(0,0,0,0.5)' }}
          title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
        >
          {isFullscreen ? <Minimize2 size={14} color="#fff" /> : <Maximize2 size={14} color="#fff" />}
        </button>
      </div>

      {/* Top Left Badges (Screen Share / Podium / Connection State) */}
      <div style={{
        position: 'absolute',
        top: '12px',
        left: '12px',
        display: 'flex',
        gap: '6px',
        zIndex: 5,
      }}>
        {isPodium && (
          <div className="badge badge-primary" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: 'linear-gradient(135deg, var(--primary) 0%, #4f46e5 100%)',
            color: '#fff',
            boxShadow: '0 0 12px var(--primary-glow)',
          }}>
            <Mic size={12} />
            <span>Speaker Turn</span>
          </div>
        )}

        {isScreenSharing && (
          <div className="badge badge-primary" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Monitor size={12} />
            <span>Screen</span>
          </div>
        )}

        {!isLocal && connectionState !== 'connected' && (
          <div className="badge badge-warning" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Wifi size={12} />
            <span style={{ textTransform: 'capitalize' }}>{connectionState}</span>
          </div>
        )}
      </div>

      {/* Bottom Information Bar */}
      <div className="tile-bottom-bar">
        {/* Peer Name Tag */}
        <div className="tile-name-badge">
          {/* Live Audio Activity Bars if speaking & not muted */}
          {!isMuted && (
            <div className="audio-meter" title="Audio Activity">
              <div className="audio-bar" style={{ height: `${Math.max(4, Math.min(14, (audioLevel / 100) * 14))}px` }} />
              <div className="audio-bar" style={{ height: `${Math.max(4, Math.min(14, ((audioLevel * 1.3) / 100) * 14))}px` }} />
              <div className="audio-bar" style={{ height: `${Math.max(4, Math.min(14, ((audioLevel * 0.8) / 100) * 14))}px` }} />
            </div>
          )}

          <span>{username} {isLocal ? '(You)' : ''}</span>
        </div>

        {/* Status Indicators (Mute & Camera Off) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', pointerEvents: 'auto' }}>
          {isMuted && (
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(239, 68, 68, 0.85)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
              }}
              title="Microphone is muted"
            >
              <MicOff size={14} color="#fff" />
            </div>
          )}

          {isCameraOff && !isScreenSharing && (
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(30, 41, 59, 0.85)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
              }}
              title="Camera is turned off"
            >
              <VideoOff size={14} color="#94a3b8" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
