import React, { useState, useEffect, useRef } from 'react';
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
  PlusCircle,
  Pause,
  Layers,
  Hand,
  Users,
  Bell,
  BellOff,
  BookOpen,
} from 'lucide-react';
import soundEffects from '../services/soundEffects';

export default function ArenaModeratorBar({
  session,
  myPeerId,
  isHost,
  peers = {},
  username,
  handRaises = [],
  onStartSession,
  onNextTurn,
  onSubmitAnswer,
  onEndSession,
  onExtendTime,
  onPauseTimer,
  onResumeTimer,
  onOpenQuestionPicker,
  isSpeaking = false,
  isVoiceEnabled = true,
  onToggleVoice,
  onRepeatQuestion,
  isSfxEnabled = true,
  onToggleSfx,
}) {
  const [selectedTopic, setSelectedTopic] = useState('System Design');
  const [selectedTime, setSelectedTime] = useState(60);
  const [timeLeft, setTimeLeft] = useState(0);
  const lastTickSecondRef = useRef(null);
  const hasAutoSubmittedTurnRef = useRef(null);
  const hasSeenNonZeroTimeRef = useRef(false);

  const isPaused = session?.isPaused || false;

  // Reset auto-submit tracking when turn or session changes
  useEffect(() => {
    hasAutoSubmittedTurnRef.current = null;
    hasSeenNonZeroTimeRef.current = false;
    lastTickSecondRef.current = null;
  }, [session?.turnIndex, session?.status, session?.question?.question]);

  // Synchronized Timer Countdown calculation from server expiresAt
  useEffect(() => {
    if (!session || session.status !== 'ACTIVE') {
      setTimeLeft(0);
      lastTickSecondRef.current = null;
      return;
    }

    if (session.isPaused) {
      setTimeLeft(session.remainingSeconds || 0);
      return;
    }

    if (!session.expiresAt) {
      setTimeLeft(0);
      return;
    }

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const expiry = new Date(session.expiresAt).getTime();
      const diffSecs = Math.max(0, Math.ceil((expiry - now) / 1000));
      setTimeLeft(diffSecs);

      if (diffSecs > 0) {
        hasSeenNonZeroTimeRef.current = true;
      }

      // Play urgency audio ticks during final 10 seconds
      if (diffSecs <= 10 && diffSecs > 0 && isSfxEnabled) {
        if (lastTickSecondRef.current !== diffSecs) {
          lastTickSecondRef.current = diffSecs;
          soundEffects.playCountdownTick(true);
        }
      }

      // If active speaker, round was actively counting down, and timer hits 0, auto-trigger answer submission EXACTLY ONCE
      if (
        diffSecs === 0 &&
        hasSeenNonZeroTimeRef.current &&
        session.currentSpeakerPeerId === myPeerId &&
        hasAutoSubmittedTurnRef.current !== session.turnIndex
      ) {
        hasAutoSubmittedTurnRef.current = session.turnIndex;
        console.log('[ArenaModeratorBar] Timer reached 0. Submitting answer for turn:', session.turnIndex);
        onSubmitAnswer();
      }
    };

    calculateTimeLeft();
    const timerInterval = setInterval(calculateTimeLeft, 250);

    return () => clearInterval(timerInterval);
  }, [session, myPeerId, onSubmitAnswer, isSfxEnabled]);

  const isMyTurn = session?.status === 'ACTIVE' && session?.currentSpeakerPeerId === myPeerId;

  const getPeerName = (pid) => {
    if (pid === myPeerId) return `${username} (You)`;
    return peers[pid]?.username || 'Participant';
  };

  const currentSpeakerName = session?.currentSpeakerPeerId ? getPeerName(session.currentSpeakerPeerId) : 'Speaker';

  const totalDuration = session?.timeLimit || 60;
  const progressPct = totalDuration > 0 ? Math.min(100, Math.max(0, (timeLeft / totalDuration) * 100)) : 0;
  const isUrgent = timeLeft > 0 && timeLeft <= 10;
  const isWarning = timeLeft > 10 && timeLeft <= 20;

  // Circular SVG ring math: Radius = 20, Circumference = 2 * PI * 20 ≈ 125.66
  const RADIUS = 20;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const strokeDashoffset = CIRCUMFERENCE * (1 - progressPct / 100);

  // Speaker Queue resolution
  const speakerOrder = session?.speakerOrder || [];
  const turnIndex = session?.turnIndex || 0;
  const nextSpeakerId = turnIndex + 1 < speakerOrder.length ? speakerOrder[turnIndex + 1] : null;
  const onDeckSpeakerId = turnIndex + 2 < speakerOrder.length ? speakerOrder[turnIndex + 2] : null;

  let strokeColor = '#10b981'; // Emerald
  if (isUrgent) strokeColor = '#ef4444'; // Red
  else if (isWarning) strokeColor = '#f59e0b'; // Amber

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
          flexWrap: 'wrap',
          gap: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px var(--primary-glow)',
              flexShrink: 0,
            }}>
              <Sparkles size={19} color="#fff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff' }}>
                  AI Discussion & Verbal Moderator Arena
                </span>
                <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>
                  VOICE + SFX ENABLED
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Start a synchronized round. AI verbally asks questions, runs podium spotlight, and evaluates speech.
              </p>
            </div>
          </div>

          {/* Controls to launch round */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* AI Voice Toggle */}
            <button
              onClick={onToggleVoice}
              className="btn btn-secondary"
              style={{
                padding: '6px 10px',
                fontSize: '0.75rem',
                gap: '5px',
                borderColor: isVoiceEnabled ? 'rgba(99, 102, 241, 0.4)' : 'rgba(255, 255, 255, 0.1)',
                background: isVoiceEnabled ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
              }}
              title={isVoiceEnabled ? 'AI Voice Enabled' : 'AI Voice Muted'}
            >
              {isVoiceEnabled ? <Volume2 size={13} color="#818cf8" /> : <VolumeX size={13} color="#94a3b8" />}
              <span>{isVoiceEnabled ? 'AI Voice' : 'Muted'}</span>
            </button>

            {/* SFX Audio Synthesizer Toggle */}
            <button
              onClick={onToggleSfx}
              className="btn btn-secondary"
              style={{
                padding: '6px 10px',
                fontSize: '0.75rem',
                gap: '5px',
                borderColor: isSfxEnabled ? 'rgba(236, 72, 153, 0.4)' : 'rgba(255, 255, 255, 0.1)',
                background: isSfxEnabled ? 'rgba(236, 72, 153, 0.15)' : 'transparent',
              }}
              title={isSfxEnabled ? 'Web Audio SFX Enabled' : 'SFX Disabled'}
            >
              {isSfxEnabled ? <Bell size={13} color="#f472b6" /> : <BellOff size={13} color="#94a3b8" />}
              <span>{isSfxEnabled ? 'SFX: ON' : 'SFX: OFF'}</span>
            </button>

            {/* Quick Topic Dropdown */}
            <select
              className="input-glass"
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              style={{ width: '150px', padding: '6px 10px', fontSize: '0.8rem' }}
            >
              <option value="System Design">System Design</option>
              <option value="Algorithms">Algorithms & DSA</option>
              <option value="Web & Distributed">Web & Distributed</option>
              <option value="DevOps & Cloud">DevOps & Cloud</option>
              <option value="Behavioral">Behavioral / Leadership</option>
            </select>

            {/* Quick Time Dropdown */}
            <select
              className="input-glass"
              value={selectedTime}
              onChange={(e) => setSelectedTime(Number(e.target.value))}
              style={{ width: '95px', padding: '6px 10px', fontSize: '0.8rem' }}
            >
              <option value={45}>45s</option>
              <option value={60}>60s</option>
              <option value={90}>90s</option>
              <option value={120}>120s</option>
            </select>

            {/* Browse / Pick Question Modal Button */}
            <button
              onClick={onOpenQuestionPicker}
              className="btn btn-secondary"
              style={{
                padding: '7px 12px',
                fontSize: '0.8rem',
                gap: '6px',
                borderColor: 'rgba(99, 102, 241, 0.4)',
              }}
              title="Open multi-domain question bank or author custom prompt"
            >
              <BookOpen size={14} color="#818cf8" /> Pick Question
            </button>

            {/* Quick Start Button */}
            <button
              onClick={() => onStartSession(selectedTopic, selectedTime)}
              className="btn btn-primary"
              style={{ padding: '7px 16px', fontSize: '0.85rem', gap: '6px' }}
            >
              <Play size={14} fill="#fff" /> Start Round
            </button>
          </div>
        </div>
      ) : (
        /* Active Game Arena Stage Banner */
        <div className="glass-panel-elevated" style={{
          padding: '12px 18px',
          background: isMyTurn
            ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.18) 0%, rgba(14, 22, 40, 0.95) 100%)'
            : 'linear-gradient(135deg, rgba(14, 22, 40, 0.92) 0%, rgba(20, 28, 50, 0.9) 100%)',
          border: isMyTurn ? '1.5px solid var(--primary)' : '1px solid rgba(99, 102, 241, 0.25)',
          boxShadow: isMyTurn ? '0 0 30px var(--primary-glow)' : '0 10px 30px rgba(0,0,0,0.5)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', flexWrap: 'wrap' }}>
            {/* Left: Question Header & Details */}
            <div style={{ flex: '1 1 340px', minWidth: '280px' }}>
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
                    gap: '5px',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.3) 0%, rgba(236, 72, 153, 0.3) 100%)',
                    border: '1px solid rgba(236, 72, 153, 0.4)',
                    animation: 'pulse 1.5s infinite',
                  }}>
                    <Bot size={12} color="#f472b6" />
                    <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#f472b6' }}>
                      AI Asking Question...
                    </span>
                  </div>
                )}

                {/* Speaker indicator badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '4px' }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: isMyTurn ? '#10b981' : '#f59e0b',
                    boxShadow: `0 0 8px ${isMyTurn ? '#10b981' : '#f59e0b'}`,
                  }} />
                  <span style={{ fontSize: '0.78rem', fontWeight: 600, color: isMyTurn ? '#34d399' : '#fcd34d' }}>
                    {isMyTurn ? '🎙️ YOUR TURN' : `🎙️ ${currentSpeakerName}`}
                  </span>
                </div>
              </div>

              {/* Question Text */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <h3 style={{
                  fontSize: '0.95rem',
                  color: '#fff',
                  margin: 0,
                  lineHeight: 1.35,
                  fontWeight: 600,
                  flex: 1,
                }}>
                  {session.question?.question}
                </h3>

                <button
                  onClick={onRepeatQuestion}
                  className="btn btn-secondary"
                  style={{
                    padding: '3px 7px',
                    fontSize: '0.7rem',
                    gap: '4px',
                    flexShrink: 0,
                  }}
                  title="Repeat question aloud via AI Voice"
                >
                  <Volume2 size={12} color="#818cf8" /> Repeat
                </button>
              </div>

              {/* Speaker Lineup Queue Strip */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginTop: '8px',
                flexWrap: 'wrap',
                fontSize: '0.72rem',
              }}>
                <span style={{ color: 'var(--text-dim)', fontWeight: 600 }}>Queue:</span>

                {/* Now Speaking Chip */}
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  color: '#34d399',
                  fontWeight: 600,
                }}>
                  🎙️ {currentSpeakerName}
                </span>

                {/* Next Up Chip */}
                {nextSpeakerId && (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    background: 'rgba(245, 158, 11, 0.12)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    color: '#fcd34d',
                  }}>
                    ⏳ Next: {getPeerName(nextSpeakerId)}
                  </span>
                )}

                {/* On Deck Chip */}
                {onDeckSpeakerId && (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: 'var(--text-muted)',
                  }}>
                    👥 On Deck: {getPeerName(onDeckSpeakerId)}
                  </span>
                )}

                {/* Raised Hands Queue Chips */}
                {handRaises && handRaises.length > 0 && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginLeft: '4px' }}>
                    {handRaises.map((hr) => (
                      <span
                        key={hr.peerId}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          background: 'rgba(245, 158, 11, 0.2)',
                          border: '1px solid rgba(245, 158, 11, 0.5)',
                          color: '#fbbf24',
                          fontWeight: 600,
                          animation: 'pulse 2s infinite',
                        }}
                        title={`${hr.username} raised their hand`}
                      >
                        ✋ {hr.username}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Center: Circular SVG Countdown Ring & HUD */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '6px 14px',
              borderRadius: 'var(--radius-lg)',
              background: isUrgent
                ? 'rgba(239, 68, 68, 0.15)'
                : 'rgba(255, 255, 255, 0.04)',
              border: `1px solid ${isUrgent ? 'rgba(239, 68, 68, 0.4)' : 'rgba(255, 255, 255, 0.1)'}`,
            }}>
              {/* Circular Ring */}
              <div style={{ position: 'relative', width: '48px', height: '48px' }}>
                <svg width="48" height="48" viewBox="0 0 48 48">
                  {/* Background Track */}
                  <circle
                    cx="24"
                    cy="24"
                    r={RADIUS}
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.08)"
                    strokeWidth="3.5"
                  />
                  {/* Progress Indicator */}
                  <circle
                    cx="24"
                    cy="24"
                    r={RADIUS}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth="3.5"
                    strokeDasharray={CIRCUMFERENCE}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    transform="rotate(-90 24 24)"
                    style={{
                      transition: isPaused ? 'none' : 'stroke-dashoffset 0.3s ease, stroke 0.3s ease',
                    }}
                  />
                </svg>
                {/* Center text inside ring */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  fontFamily: 'var(--font-mono)',
                  color: isUrgent ? '#f87171' : (isMyTurn ? '#34d399' : '#fff'),
                }}>
                  {isPaused ? '⏸️' : timeLeft}
                </div>
              </div>

              {/* Text Label */}
              <div>
                <div style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: isPaused ? '#fbbf24' : (isUrgent ? '#f87171' : 'var(--text-muted)'),
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>
                  {isPaused ? 'PAUSED' : (isUrgent ? 'FINAL 10s' : 'TIME LEFT')}
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>
                  {timeLeft}s / {totalDuration}s
                </div>
              </div>
            </div>

            {/* Right: Host / Turn Action Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              {/* Quick +30s Extension */}
              {isHost && (
                <button
                  onClick={() => onExtendTime(30)}
                  className="btn btn-secondary"
                  style={{
                    padding: '6px 10px',
                    fontSize: '0.75rem',
                    gap: '4px',
                    borderColor: 'rgba(99, 102, 241, 0.3)',
                  }}
                  title="Extend current turn by +30 seconds"
                >
                  <PlusCircle size={13} color="#818cf8" /> +30s
                </button>
              )}

              {/* Pause / Resume Timer Toggle */}
              {isHost && (
                <button
                  onClick={isPaused ? onResumeTimer : onPauseTimer}
                  className="btn btn-secondary"
                  style={{
                    padding: '6px 10px',
                    fontSize: '0.75rem',
                    gap: '4px',
                    borderColor: isPaused ? 'rgba(245, 158, 11, 0.5)' : 'rgba(255, 255, 255, 0.15)',
                    background: isPaused ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
                  }}
                  title={isPaused ? 'Resume countdown' : 'Pause countdown'}
                >
                  {isPaused ? <Play size={13} color="#fbbf24" /> : <Pause size={13} color="#94a3b8" />}
                  <span>{isPaused ? 'Resume' : 'Pause'}</span>
                </button>
              )}

              {/* Submit Answer Early (for current active speaker) */}
              {isMyTurn ? (
                <button
                  onClick={onSubmitAnswer}
                  className="btn btn-primary"
                  style={{
                    padding: '7px 14px',
                    fontSize: '0.82rem',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    boxShadow: '0 0 15px var(--success-glow)',
                    gap: '6px',
                  }}
                >
                  <StopCircle size={14} /> Submit Answer Early
                </button>
              ) : (
                isHost && (
                  <button
                    onClick={onNextTurn}
                    className="btn btn-secondary"
                    style={{ padding: '7px 12px', fontSize: '0.8rem', gap: '5px' }}
                    title="Advance to next speaker in queue"
                  >
                    <SkipForward size={13} /> Next Speaker
                  </button>
                )
              )}

              {/* End Round */}
              {isHost && (
                <button
                  onClick={onEndSession}
                  className="btn btn-secondary"
                  style={{ padding: '7px 10px', fontSize: '0.75rem', color: '#f87171' }}
                  title="End Round & Finalize"
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
