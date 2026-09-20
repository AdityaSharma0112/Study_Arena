import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Play,
  SkipForward,
  Clock,
  Award,
  Flame,
  Volume2,
  VolumeX,
  RotateCcw,
  StopCircle,
  HelpCircle,
  ChevronDown,
  Bot,
} from 'lucide-react';

export default function ArenaModeratorBar({
  session,
  myPeerId,
  isHost,
  peers = {},
  username,
  onStartSession,
  onNextTurn,
  onSubmitAnswer,
  onEndSession,
  isSpeaking = false,
  isVoiceEnabled = true,
  onToggleVoice,
  onRepeatQuestion,
}) {
  const [selectedTopic, setSelectedTopic] = useState('System Design');
  const [selectedTime, setSelectedTime] = useState(60);
  const [timeLeft, setTimeLeft] = useState(0);

  // Synchronized Timer Countdown calculation from server expiresAt
  useEffect(() => {
    if (!session || session.status !== 'ACTIVE' || !session.expiresAt) {
      setTimeLeft(0);
      return;
    }

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const expiry = new Date(session.expiresAt).getTime();
      const diffSecs = Math.max(0, Math.ceil((expiry - now) / 1000));
      setTimeLeft(diffSecs);

      // If active speaker and timer hits 0, auto-trigger answer submission
      if (diffSecs === 0 && session.currentSpeakerPeerId === myPeerId) {
        onSubmitAnswer();
      }
    };

    calculateTimeLeft();
    const timerInterval = setInterval(calculateTimeLeft, 250);

    return () => clearInterval(timerInterval);
  }, [session, myPeerId, onSubmitAnswer]);

  const isMyTurn = session?.status === 'ACTIVE' && session?.currentSpeakerPeerId === myPeerId;
  const currentSpeakerName = session?.currentSpeakerPeerId === myPeerId
    ? `${username} (You)`
    : (peers[session?.currentSpeakerPeerId]?.username || 'Speaker');

  const progressPct = session?.timeLimit ? (timeLeft / session.timeLimit) * 100 : 0;
  const isUrgent = timeLeft > 0 && timeLeft <= 10;

  return (
    <div style={{
      margin: '8px 16px 0 16px',
      position: 'relative',
      zIndex: 20,
    }}>
      {!session || session.status === 'IDLE' || session.status === 'FINISHED' ? (
        /* Idle / Pre-Game Host Launcher Banner */
        <div className="glass-panel-elevated" style={{
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, rgba(14,22,40,0.85) 0%, rgba(30,41,75,0.8) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px var(--primary-glow)',
            }}>
              <Sparkles size={18} color="#fff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff' }}>
                  AI Discussion & Verbal Moderator Arena
                </span>
                <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>
                  VOICE ENABLED
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Start a timed discussion round where the AI asks questions verbally and evaluates your speech.
              </p>
            </div>
          </div>

          {/* Controls to launch round */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* AI Voice Mute/Unmute Toggle */}
            <button
              onClick={onToggleVoice}
              className="btn btn-secondary"
              style={{
                padding: '6px 12px',
                fontSize: '0.75rem',
                gap: '6px',
                borderColor: isVoiceEnabled ? 'rgba(99, 102, 241, 0.4)' : 'rgba(255, 255, 255, 0.1)',
                background: isVoiceEnabled ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
              }}
              title={isVoiceEnabled ? 'AI Voice Enabled (Click to Mute)' : 'AI Voice Muted (Click to Enable)'}
            >
              {isVoiceEnabled ? <Volume2 size={14} color="#818cf8" /> : <VolumeX size={14} color="#94a3b8" />}
              <span>{isVoiceEnabled ? 'AI Voice: ON' : 'AI Voice: OFF'}</span>
            </button>

            <select
              className="input-glass"
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              style={{ width: '160px', padding: '6px 12px', fontSize: '0.8rem' }}
            >
              <option value="System Design">System Design</option>
              <option value="Algorithms">Algorithms & DSA</option>
              <option value="Web & Distributed">Web & Distributed</option>
              <option value="Behavioral">Behavioral / Leadership</option>
            </select>

            <select
              className="input-glass"
              value={selectedTime}
              onChange={(e) => setSelectedTime(Number(e.target.value))}
              style={{ width: '110px', padding: '6px 12px', fontSize: '0.8rem' }}
            >
              <option value={45}>45 Secs</option>
              <option value={60}>60 Secs</option>
              <option value={90}>90 Secs</option>
            </select>

            <button
              onClick={() => onStartSession(selectedTopic, selectedTime)}
              className="btn btn-primary"
              style={{ padding: '8px 18px', fontSize: '0.85rem', gap: '6px' }}
            >
              <Play size={15} fill="#fff" /> Start Round
            </button>
          </div>
        </div>
      ) : (
        /* Active Game Arena Stage Banner */
        <div className="glass-panel-elevated" style={{
          padding: '14px 20px',
          background: isMyTurn
            ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(14, 22, 40, 0.9) 100%)'
            : 'rgba(14, 22, 40, 0.85)',
          border: isMyTurn ? '1.5px solid var(--primary)' : '1px solid var(--border-subtle)',
          boxShadow: isMyTurn ? '0 0 25px var(--primary-glow)' : undefined,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
            {/* Left: Question & Topic */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>
                  {session.topic || 'System Design'}
                </span>
                <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>
                  {session.question?.difficulty || 'Medium'}
                </span>

                {/* AI Speaking Indicator Badge */}
                {isSpeaking && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '2px 10px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.3) 0%, rgba(236, 72, 153, 0.3) 100%)',
                    border: '1px solid rgba(236, 72, 153, 0.4)',
                    animation: 'pulse 1.5s infinite',
                  }}>
                    <Bot size={13} color="#f472b6" />
                    <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#f472b6' }}>
                      🤖 AI Asking Question...
                    </span>
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '4px' }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: isMyTurn ? '#10b981' : '#f59e0b',
                    boxShadow: `0 0 8px ${isMyTurn ? '#10b981' : '#f59e0b'}`,
                  }} />
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: isMyTurn ? '#34d399' : '#fcd34d' }}>
                    {isMyTurn ? '🎙️ YOUR TURN TO SPEAK' : `🎙️ ${currentSpeakerName} is speaking`}
                  </span>
                </div>
              </div>

              {/* Question Text & Repeat button */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <h3 style={{
                  fontSize: '1rem',
                  color: '#fff',
                  margin: 0,
                  lineHeight: 1.35,
                  fontWeight: 600,
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  flex: 1,
                }}>
                  {session.question?.question}
                </h3>

                {/* Repeat Voice Button */}
                <button
                  onClick={onRepeatQuestion}
                  className="btn btn-secondary"
                  style={{
                    padding: '4px 8px',
                    fontSize: '0.72rem',
                    gap: '4px',
                    flexShrink: 0,
                  }}
                  title="Repeat question aloud"
                >
                  <Volume2 size={13} color="#818cf8" /> Repeat AI Voice
                </button>
              </div>
            </div>

            {/* Center: Synchronized Countdown Timer */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '8px 16px',
              borderRadius: 'var(--radius-md)',
              background: isUrgent ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${isUrgent ? 'rgba(239, 68, 68, 0.4)' : 'rgba(255, 255, 255, 0.1)'}`,
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: '1.4rem',
                  fontWeight: 800,
                  fontFamily: 'var(--font-mono)',
                  color: isUrgent ? '#f87171' : (isMyTurn ? '#34d399' : '#c7d2fe'),
                  lineHeight: 1,
                }} className={isUrgent ? 'animate-pulse' : ''}>
                  00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
                </div>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                  Round Timer
                </span>
              </div>
            </div>

            {/* Right Action Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Voice Mute Toggle */}
              <button
                onClick={onToggleVoice}
                className="btn btn-secondary btn-icon"
                style={{
                  width: '36px',
                  height: '36px',
                  borderColor: isVoiceEnabled ? 'rgba(99, 102, 241, 0.4)' : 'rgba(255, 255, 255, 0.1)',
                  background: isVoiceEnabled ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                }}
                title={isVoiceEnabled ? 'AI Voice Enabled (Click to Mute)' : 'AI Voice Muted (Click to Enable)'}
              >
                {isVoiceEnabled ? <Volume2 size={16} color="#818cf8" /> : <VolumeX size={16} color="#94a3b8" />}
              </button>

              {isMyTurn ? (
                <button
                  onClick={onSubmitAnswer}
                  className="btn btn-primary"
                  style={{
                    padding: '8px 14px',
                    fontSize: '0.85rem',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    boxShadow: '0 0 15px var(--success-glow)',
                  }}
                >
                  <StopCircle size={15} /> Submit Answer Early
                </button>
              ) : (
                isHost && (
                  <button
                    onClick={onNextTurn}
                    className="btn btn-secondary"
                    style={{ padding: '8px 14px', fontSize: '0.85rem', gap: '6px' }}
                    title="Advance to next speaker"
                  >
                    <SkipForward size={14} /> Next Speaker
                  </button>
                )
              )}

              {isHost && (
                <button
                  onClick={onEndSession}
                  className="btn btn-secondary"
                  style={{ padding: '8px 12px', fontSize: '0.8rem', color: '#f87171' }}
                  title="End Round"
                >
                  End Round
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

