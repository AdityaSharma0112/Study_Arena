import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Video, VideoOff, Play, Shield, ArrowLeft, Volume2 } from 'lucide-react';

export default function RoomLobby({
  roomCode,
  roomTitle,
  initialUsername = '',
  onJoin,
  onBack,
}) {
  const [username, setUsername] = useState(initialUsername || `Guest_${Math.floor(1000 + Math.random() * 9000)}`);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [audioMeter, setAudioMeter] = useState(0);
  const [permissionError, setPermissionError] = useState(null);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const animFrameRef = useRef(null);
  const audioCtxRef = useRef(null);

  // Setup preview stream
  useEffect(() => {
    let isCancelled = false;

    async function startPreview() {
      try {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: videoEnabled ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
          audio: audioEnabled,
        });

        if (isCancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current && videoEnabled) {
          videoRef.current.srcObject = stream;
        }

        // Setup audio meter
        if (audioEnabled) {
          const AudioContextClass = window.AudioContext || window.webkitAudioContext;
          if (AudioContextClass) {
            const audioCtx = new AudioContextClass();
            audioCtxRef.current = audioCtx;
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 256;
            const source = audioCtx.createMediaStreamSource(stream);
            source.connect(analyser);
            const dataArray = new Uint8Array(analyser.frequencyBinCount);

            const updateMeter = () => {
              if (isCancelled) return;
              analyser.getByteFrequencyData(dataArray);
              let sum = 0;
              for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
              const avg = sum / dataArray.length;
              setAudioMeter(Math.min(100, Math.round((avg / 128) * 100)));
              animFrameRef.current = requestAnimationFrame(updateMeter);
            };
            updateMeter();
          }
        }
      } catch (err) {
        console.warn('Lobby camera/mic access warning:', err);
        setPermissionError('Could not access camera/microphone. You can still join as audio or viewer.');
      }
    }

    startPreview();

    return () => {
      isCancelled = true;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioCtxRef.current) audioCtxRef.current.close().catch(() => {});
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [videoEnabled, audioEnabled]);

  const handleToggleVideo = () => {
    setVideoEnabled((prev) => !prev);
  };

  const handleToggleAudio = () => {
    setAudioEnabled((prev) => !prev);
  };

  const handleJoinSubmit = (e) => {
    e.preventDefault();
    if (!username.trim()) return;

    // Clean up lobby stream so useWebRTC acquires clean stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }

    onJoin({
      username: username.trim(),
      videoEnabled,
      audioEnabled,
    });
  };

  return (
    <div style={{
      maxWidth: '900px',
      margin: '40px auto',
      padding: '0 20px',
      width: '100%',
    }}>
      {/* Header */}
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={onBack} className="btn btn-secondary" style={{ padding: '8px 16px' }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shield size={16} color="#10b981" />
          <span style={{ fontSize: '0.85rem', color: '#34d399', fontWeight: 600 }}>
            End-to-End P2P STUN Encrypted
          </span>
        </div>
      </div>

      <div className="glass-panel-elevated" style={{ padding: '32px', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '32px' }}>
        {/* Left Column: Camera Preview */}
        <div>
          <div style={{
            position: 'relative',
            aspectRatio: '16 / 9',
            backgroundColor: '#0b1120',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            border: '2px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
          }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: 'scaleX(-1)',
                display: videoEnabled ? 'block' : 'none',
              }}
            />

            {!videoEnabled && (
              <div style={{ textAlign: 'center' }}>
                <div className="camera-off-avatar" style={{ margin: '0 auto 12px' }}>
                  {username ? username.substring(0, 2).toUpperCase() : 'U'}
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Camera is Off</p>
              </div>
            )}

            {/* Float Controls inside Preview */}
            <div style={{
              position: 'absolute',
              bottom: '16px',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: '12px',
              zIndex: 10,
            }}>
              <button
                type="button"
                onClick={handleToggleAudio}
                className={`btn btn-icon ${audioEnabled ? 'btn-secondary' : 'btn-danger'}`}
                title={audioEnabled ? 'Mute Mic' : 'Unmute Mic'}
              >
                {audioEnabled ? <Mic size={20} /> : <MicOff size={20} />}
              </button>
              <button
                type="button"
                onClick={handleToggleVideo}
                className={`btn btn-icon ${videoEnabled ? 'btn-secondary' : 'btn-danger'}`}
                title={videoEnabled ? 'Turn Off Camera' : 'Turn On Camera'}
              >
                {videoEnabled ? <Video size={20} /> : <VideoOff size={20} />}
              </button>
            </div>
          </div>

          {/* Mic Volume Activity Bar */}
          <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Volume2 size={16} color={audioEnabled ? '#10b981' : '#64748b'} />
            <div style={{
              flex: 1,
              height: '6px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '4px',
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${audioEnabled ? audioMeter : 0}%`,
                backgroundColor: audioMeter > 70 ? 'var(--danger)' : 'var(--success)',
                transition: 'width 0.08s ease',
              }} />
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', width: '32px' }}>
              {audioEnabled ? `${audioMeter}%` : 'Off'}
            </span>
          </div>

          {permissionError && (
            <p style={{ color: '#f87171', fontSize: '0.8rem', marginTop: '10px' }}>
              {permissionError}
            </p>
          )}
        </div>

        {/* Right Column: Lobby Info & Join Form */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ marginBottom: '24px' }}>
            <span className="badge badge-primary" style={{ marginBottom: '8px' }}>
              PRE-CALL LOBBY
            </span>
            <h2 style={{ fontSize: '1.75rem', margin: '4px 0 8px', color: '#fff' }}>
              {roomTitle || 'Arena Video Discussion'}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Room Code: <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--secondary)', fontWeight: 700 }}>{roomCode}</span>
            </p>
          </div>

          <form onSubmit={handleJoinSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
                Your Display Name
              </label>
              <input
                type="text"
                required
                className="input-glass"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your name..."
                maxLength={30}
              />
            </div>

            <div style={{
              background: 'rgba(99, 102, 241, 0.08)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px',
              fontSize: '0.85rem',
              color: '#c7d2fe',
            }}>
              ✨ <strong>₹0 Server Overhead:</strong> Your video and audio connect directly peer-to-peer using WebRTC mesh and Google STUN.
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{
                padding: '14px 24px',
                fontSize: '1.05rem',
                marginTop: '8px',
                gap: '10px',
              }}
            >
              <Play size={20} fill="#fff" /> Join Arena Stage
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
