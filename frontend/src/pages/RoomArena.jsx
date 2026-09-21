import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Navbar from '../components/Navbar';
import VideoTile from '../components/VideoTile';
import MediaControls from '../components/MediaControls';
import ChatDrawer from '../components/ChatDrawer';
import StatsModal from '../components/StatsModal';
import ArenaModeratorBar from '../components/ArenaModeratorBar';
import EvaluationModal from '../components/EvaluationModal';
import QuestionPickerModal from '../components/QuestionPickerModal';
import { useSignaling } from '../hooks/useSignaling';
import { useWebRTC } from '../hooks/useWebRTC';
import { useSpeechToText } from '../hooks/useSpeechToText';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import soundEffects from '../services/soundEffects';

export default function RoomArena({
  roomCode,
  roomTitle,
  username,
  initialVideo = true,
  initialAudio = true,
  onLeave,
}) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isQuestionPickerOpen, setIsQuestionPickerOpen] = useState(false);
  const [isSpotlightMode, setIsSpotlightMode] = useState(true);
  const [isSfxEnabled, setIsSfxEnabled] = useState(true);
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pinnedPeerId, setPinnedPeerId] = useState(null);

  // Arena Game Loop & AI Evaluation State
  const [arenaSession, setArenaSession] = useState(null);
  const [currentEvaluation, setCurrentEvaluation] = useState(null);
  const [liveCaptions, setLiveCaptions] = useState({}); // { [peerId]: text }
  const [handRaises, setHandRaises] = useState([]); // [{ peerId, username }]

  // Initialize signaling hook
  const signaling = useSignaling(roomCode);

  // Initialize Text-To-Speech hook for verbal AI moderator
  const textToSpeech = useTextToSpeech();

  // Initialize WebRTC mesh hook
  const {
    localStream,
    screenStream,
    peers,
    isMuted,
    isCameraOff,
    isScreenSharing,
    isLocalSpeaking,
    audioLevel,
    myPeerId,
    initializeLocalMedia,
    toggleMic,
    toggleCamera,
    toggleScreenShare,
  } = useWebRTC(roomCode, username, signaling);

  // Check if current local user has hand raised
  const isHandRaised = useMemo(() => {
    return handRaises.some((hr) => hr.peerId === myPeerId);
  }, [handRaises, myPeerId]);

  // Live captioning callback while speaking
  const handleInterimSpeech = useCallback((text, isFinal) => {
    setLiveCaptions((prev) => ({ ...prev, [myPeerId]: text }));
    signaling.sendMessage('live-caption', {
      text,
      isFinal,
    });
  }, [signaling, myPeerId]);

  // Speech to Text hook
  const speechToText = useSpeechToText(handleInterimSpeech);

  const hasJoinedRef = useRef(false);
  const submittedTurnsMapRef = useRef(new Set());
  const isMyTurn = arenaSession?.status === 'ACTIVE' && arenaSession?.currentSpeakerPeerId === myPeerId;

  // Initialize local media and join room once signaling connects
  useEffect(() => {
    let isCancelled = false;

    async function setupAndJoin() {
      try {
        console.log('[Arena] Initializing local media...');
        await initializeLocalMedia(initialVideo, initialAudio);

        if (signaling.isConnected && !hasJoinedRef.current && !isCancelled) {
          hasJoinedRef.current = true;
          console.log('[Arena] Sending join-room to signaling server...');
          signaling.sendMessage('join-room', {
            peerId: myPeerId,
            username: username,
            isMuted: !initialAudio,
            isCameraOff: !initialVideo,
          });
        }
      } catch (err) {
        console.error('[Arena] Setup media failed:', err);
      }
    }

    if (signaling.isConnected) {
      setupAndJoin();
    }

    return () => {
      isCancelled = true;
    };
  }, [signaling.isConnected]);

  // Auto-start / auto-stop Speech-to-Text when turn changes
  useEffect(() => {
    if (isMyTurn && speechToText.isSupported && !speechToText.isListening) {
      console.log('[Arena] My turn started! Starting Speech Recognition...');
      speechToText.startListening();
    } else if (!isMyTurn && speechToText.isListening) {
      console.log('[Arena] My turn ended. Stopping Speech Recognition.');
      speechToText.stopListening();
    }
  }, [isMyTurn, speechToText]);

  // Toggle SFX mute status
  const handleToggleSfx = useCallback(() => {
    setIsSfxEnabled((prev) => {
      const next = !prev;
      soundEffects.setMuted(!next);
      return next;
    });
  }, []);

  // Handle game loop signaling events & sound triggers
  useEffect(() => {
    const unsubExisting = signaling.on('existing-participants', (data) => {
      if (data.activeSession) {
        setArenaSession(data.activeSession);
      }
      if (data.handRaises) {
        setHandRaises(data.handRaises);
      }
    });

    const unsubSessionStart = signaling.on('session-started', (data) => {
      console.log('[Arena] Session started:', data.session);
      setArenaSession(data.session);
      setCurrentEvaluation(null);
      setLiveCaptions({});

      // Play start sound fanfare
      if (isSfxEnabled) soundEffects.playRoundStart();

      // Verbally ask the question using AI voice
      if (data.session?.question?.question) {
        const spkName = data.session.currentSpeakerPeerId === myPeerId
          ? username
          : (peers[data.session.currentSpeakerPeerId]?.username || 'Speaker');
        textToSpeech.speakQuestion(data.session.topic, data.session.question.question, spkName);
      }
    });

    const unsubTurnChange = signaling.on('turn-changed', (data) => {
      console.log('[Arena] Turn changed:', data);

      // Play turn transition chime
      if (isSfxEnabled) soundEffects.playTurnChime();

      setArenaSession((prev) => {
        if (!prev) return prev;
        const updated = {
          ...prev,
          turnIndex: data.turnIndex,
          currentSpeakerPeerId: data.currentSpeakerPeerId,
          expiresAt: data.expiresAt,
          isPaused: false,
        };
        // Verbally introduce turn for next speaker
        if (updated.question?.question) {
          const spkName = data.currentSpeakerPeerId === myPeerId
            ? username
            : (peers[data.currentSpeakerPeerId]?.username || 'Speaker');
          textToSpeech.speakQuestion(updated.topic, updated.question.question, spkName);
        }
        return updated;
      });
      setLiveCaptions({});
    });

    const unsubSessionCompleted = signaling.on('session-completed', (data) => {
      console.log('[Arena] Session completed:', data);
      if (isSfxEnabled) soundEffects.playCompletionBell();
      setArenaSession((prev) => prev ? { ...prev, status: 'FINISHED' } : null);
    });

    const unsubTimerExtended = signaling.on('timer-extended', (data) => {
      console.log('[Arena] Timer extended by', data.seconds);
      setArenaSession((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          expiresAt: data.expiresAt || prev.expiresAt,
          remainingSeconds: data.remainingSeconds ?? prev.remainingSeconds,
          timeLimit: data.timeLimit || prev.timeLimit,
        };
      });
    });

    const unsubTimerPaused = signaling.on('timer-paused', (data) => {
      console.log('[Arena] Timer paused at', data.remainingSeconds);
      setArenaSession((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          isPaused: true,
          remainingSeconds: data.remainingSeconds,
        };
      });
    });

    const unsubTimerResumed = signaling.on('timer-resumed', (data) => {
      console.log('[Arena] Timer resumed, expires at', data.expiresAt);
      setArenaSession((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          isPaused: false,
          expiresAt: data.expiresAt,
        };
      });
    });

    const unsubHandRaise = signaling.on('hand-raise-updated', (data) => {
      console.log('[Arena] Hand raises updated:', data.handRaises);
      setHandRaises((prev) => {
        const prevCount = prev?.length || 0;
        const nextList = data.handRaises || [];
        if (nextList.length > prevCount && isSfxEnabled) {
          soundEffects.playHandRaise();
        }
        return nextList;
      });
    });

    const unsubEvalResult = signaling.on('evaluation-result', (data) => {
      console.log('[Arena] Evaluation received:', data.evaluation);
      setCurrentEvaluation(data.evaluation);
      if (isSfxEnabled) soundEffects.playCompletionBell();
      if (data.evaluation) {
        textToSpeech.speakEvaluation(data.evaluation);
      }
    });

    const unsubCaptions = signaling.on('live-caption', (data) => {
      setLiveCaptions((prev) => ({
        ...prev,
        [data.peerId]: data.text,
      }));
    });

    const unsubSessionEnd = signaling.on('session-ended', () => {
      textToSpeech.stop();
      setArenaSession(null);
      setCurrentEvaluation(null);
      setLiveCaptions({});
    });

    return () => {
      if (unsubExisting) unsubExisting();
      if (unsubSessionStart) unsubSessionStart();
      if (unsubTurnChange) unsubTurnChange();
      if (unsubSessionCompleted) unsubSessionCompleted();
      if (unsubTimerExtended) unsubTimerExtended();
      if (unsubTimerPaused) unsubTimerPaused();
      if (unsubTimerResumed) unsubTimerResumed();
      if (unsubHandRaise) unsubHandRaise();
      if (unsubEvalResult) unsubEvalResult();
      if (unsubCaptions) unsubCaptions();
      if (unsubSessionEnd) unsubSessionEnd();
    };
  }, [signaling, myPeerId, username, peers, textToSpeech, isSfxEnabled]);

  // Handle chat messages and user arrivals
  useEffect(() => {
    const unsubChat = signaling.on('chat-message', (data) => {
      setMessages((prev) => [...prev, data]);
      if (!isChatOpen) {
        setUnreadCount((prev) => prev + 1);
      }
    });

    const unsubJoin = signaling.on('user-joined', (data) => {
      setMessages((prev) => [
        ...prev,
        {
          senderName: 'System',
          text: `🎉 ${data.username} joined the arena`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isSystem: true,
        },
      ]);
    });

    const unsubLeave = signaling.on('user-left', (data) => {
      setMessages((prev) => [
        ...prev,
        {
          senderName: 'System',
          text: `👋 ${data.username || 'A participant'} left the arena`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isSystem: true,
        },
      ]);
      if (pinnedPeerId === data.peerId) {
        setPinnedPeerId(null);
      }
    });

    return () => {
      if (unsubChat) unsubChat();
      if (unsubJoin) unsubJoin();
      if (unsubLeave) unsubLeave();
    };
  }, [signaling, isChatOpen, pinnedPeerId]);

  // Arena Moderator Game Trigger Callbacks
  const handleStartArenaSession = useCallback((topic, timeLimit, customQuestion = null) => {
    signaling.sendMessage('start-arena-session', {
      topic,
      timeLimit,
      customQuestion,
    });
  }, [signaling]);

  const handleNextTurn = useCallback(() => {
    setCurrentEvaluation(null);
    signaling.sendMessage('next-turn', {});
  }, [signaling]);

  const handleExtendTime = useCallback((seconds = 30) => {
    signaling.sendMessage('extend-time', { seconds });
  }, [signaling]);

  const handlePauseTimer = useCallback(() => {
    signaling.sendMessage('pause-timer', {});
  }, [signaling]);

  const handleResumeTimer = useCallback(() => {
    signaling.sendMessage('resume-timer', {});
  }, [signaling]);

  const handleToggleHandRaise = useCallback(() => {
    if (isHandRaised) {
      signaling.sendMessage('lower-hand', { peerId: myPeerId });
    } else {
      signaling.sendMessage('raise-hand', { peerId: myPeerId });
    }
  }, [signaling, myPeerId, isHandRaised]);

  const handleSelectQuestionFromPicker = useCallback((questionData, timeLimit) => {
    handleStartArenaSession(questionData.topic, timeLimit || questionData.time_limit || 60, questionData);
  }, [handleStartArenaSession]);

  const handleSubmitAnswer = useCallback(() => {
    const currentTurn = arenaSession?.turnIndex ?? 0;
    const turnKey = `${currentTurn}_${myPeerId}`;

    if (submittedTurnsMapRef.current.has(turnKey)) {
      console.log('[Arena] Turn answer already submitted:', turnKey);
      return;
    }
    submittedTurnsMapRef.current.add(turnKey);

    const capturedTranscript = speechToText.transcript ? speechToText.transcript.trim() : '';
    speechToText.stopListening();

    console.log('[Arena] Submitting transcript for evaluation:', turnKey, 'Content length:', capturedTranscript.length);
    signaling.sendMessage('submit-transcript', {
      transcript: capturedTranscript,
      peerId: myPeerId,
      username,
      turnIndex: currentTurn,
    });
  }, [speechToText, signaling, myPeerId, username, arenaSession?.turnIndex]);

  const handleEndArenaSession = useCallback(() => {
    signaling.sendMessage('end-arena-session', {});
  }, [signaling]);

  const handleSendMessage = useCallback((text) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const msg = {
      peerId: myPeerId,
      senderName: username,
      text,
      timestamp,
    };
    signaling.sendMessage('chat-message', msg);
    setMessages((prev) => [...prev, msg]);
  }, [signaling, myPeerId, username]);

  const handleToggleChat = () => {
    setIsChatOpen((prev) => {
      if (!prev) setUnreadCount(0);
      return !prev;
    });
  };

  const handlePinVideo = (peerId) => {
    setPinnedPeerId((prev) => (prev === peerId ? null : peerId));
  };

  // Build participants list for Chat Drawer
  const participantList = [
    { peerId: myPeerId, username, isMuted, isCameraOff, isScreenSharing },
    ...Object.values(peers).map((p) => ({
      peerId: p.peerId,
      username: p.username,
      isMuted: p.isMuted,
      isCameraOff: p.isCameraOff,
      isScreenSharing: p.isScreenSharing,
    })),
  ];

  // Determine grid class based on participant count
  const remotePeersList = Object.values(peers);
  const totalTiles = 1 + remotePeersList.length;
  let gridClass = 'grid-1';
  if (totalTiles === 2) gridClass = 'grid-2';
  else if (totalTiles === 3 || totalTiles === 4) gridClass = 'grid-4';
  else if (totalTiles >= 5) gridClass = 'grid-6';

  const handleLeaveCall = useCallback(() => {
    try {
      signaling.sendMessage('leave-room', { peerId: myPeerId });
    } catch (e) {}
    if (onLeave) onLeave();
  }, [signaling, myPeerId, onLeave]);

  // Determine Spotlight Hero & Gallery members
  const heroPeerId = useMemo(() => {
    if (pinnedPeerId) return pinnedPeerId;
    if (arenaSession?.status === 'ACTIVE' && arenaSession.currentSpeakerPeerId) {
      return arenaSession.currentSpeakerPeerId;
    }
    // If someone is screen sharing, make them hero
    if (isScreenSharing) return 'local';
    const sharingRemote = remotePeersList.find((p) => p.isScreenSharing);
    if (sharingRemote) return sharingRemote.peerId;
    return 'local';
  }, [pinnedPeerId, arenaSession, isScreenSharing, remotePeersList]);

  const isLocalHero = heroPeerId === 'local' || heroPeerId === myPeerId;

  // Helper to render local tile
  const renderLocalTile = (isHero = false) => (
    <VideoTile
      key="local-tile"
      stream={screenStream || localStream}
      username={username}
      isLocal={true}
      isMuted={isMuted}
      isCameraOff={isCameraOff}
      isScreenSharing={isScreenSharing}
      isSpeaking={isLocalSpeaking}
      audioLevel={audioLevel}
      onPin={() => handlePinVideo('local')}
      isPinned={pinnedPeerId === 'local'}
      isPodium={arenaSession?.status === 'ACTIVE' && arenaSession?.currentSpeakerPeerId === myPeerId}
      isHandRaised={isHandRaised}
      captions={liveCaptions[myPeerId] || (isMyTurn ? speechToText.interimTranscript : '')}
    />
  );

  // Helper to render remote tile
  const renderRemoteTile = (peer, isHero = false) => (
    <VideoTile
      key={peer.peerId}
      stream={peer.stream}
      username={peer.username}
      isLocal={false}
      isMuted={peer.isMuted}
      isCameraOff={peer.isCameraOff}
      isScreenSharing={peer.isScreenSharing}
      isSpeaking={peer.isSpeaking}
      connectionState={peer.connectionState}
      onPin={() => handlePinVideo(peer.peerId)}
      isPinned={pinnedPeerId === peer.peerId}
      isPodium={arenaSession?.status === 'ACTIVE' && arenaSession?.currentSpeakerPeerId === peer.peerId}
      isHandRaised={handRaises.some((hr) => hr.peerId === peer.peerId)}
      captions={liveCaptions[peer.peerId] || ''}
    />
  );

  const heroRemotePeer = !isLocalHero ? remotePeersList.find((p) => p.peerId === heroPeerId) : null;
  const galleryRemotePeers = isLocalHero ? remotePeersList : remotePeersList.filter((p) => p.peerId !== heroPeerId);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* Top Navbar */}
      <Navbar
        roomCode={roomCode}
        participantCount={totalTiles}
        isConnected={signaling.isConnected}
        onOpenStats={() => setIsStatsOpen(true)}
      />

      {/* Arena Moderator Stage Banner (Question, Synchronized Timer & Turn Controls) */}
      <ArenaModeratorBar
        session={arenaSession}
        myPeerId={myPeerId}
        isHost={true}
        peers={peers}
        username={username}
        handRaises={handRaises}
        onStartSession={handleStartArenaSession}
        onNextTurn={handleNextTurn}
        onSubmitAnswer={handleSubmitAnswer}
        onEndSession={handleEndArenaSession}
        onExtendTime={handleExtendTime}
        onPauseTimer={handlePauseTimer}
        onResumeTimer={handleResumeTimer}
        onOpenQuestionPicker={() => setIsQuestionPickerOpen(true)}
        isSpeaking={textToSpeech.isSpeaking}
        isVoiceEnabled={textToSpeech.isVoiceEnabled}
        onToggleVoice={textToSpeech.toggleVoice}
        isSfxEnabled={isSfxEnabled}
        onToggleSfx={handleToggleSfx}
        onRepeatQuestion={() => {
          if (arenaSession?.question?.question) {
            const spkName = arenaSession.currentSpeakerPeerId === myPeerId
              ? username
              : (peers[arenaSession.currentSpeakerPeerId]?.username || 'Candidate');
            textToSpeech.speakQuestion(arenaSession.topic, arenaSession.question.question, spkName);
          }
        }}
      />

      {/* Video Arena Stage (Spotlight Stage vs Equal Grid) */}
      <main style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        position: 'relative',
        paddingBottom: '90px', // Space for bottom controls
      }}>
        {isSpotlightMode && totalTiles > 1 ? (
          /* Spotlight Stage Layout (Center Hero Stage + Filmstrip Gallery) */
          <div className="spotlight-stage-layout">
            {/* Main Stage Spotlight Hero */}
            <div className="spotlight-main-stage">
              {isLocalHero ? renderLocalTile(true) : (heroRemotePeer ? renderRemoteTile(heroRemotePeer, true) : renderLocalTile(true))}
            </div>

            {/* Gallery Filmstrip of Other Peers */}
            <div className="spotlight-filmstrip">
              {!isLocalHero && renderLocalTile(false)}
              {galleryRemotePeers.map((peer) => renderRemoteTile(peer, false))}
            </div>
          </div>
        ) : (
          /* Equal Grid View */
          <div className={`video-grid-container ${gridClass}`}>
            {renderLocalTile(false)}
            {remotePeersList.map((peer) => renderRemoteTile(peer, false))}
          </div>
        )}
      </main>

      {/* Floating Bottom Media Controls */}
      <MediaControls
        isMuted={isMuted}
        isCameraOff={isCameraOff}
        isScreenSharing={isScreenSharing}
        isChatOpen={isChatOpen}
        isHandRaised={isHandRaised}
        isSpotlightMode={isSpotlightMode}
        unreadCount={unreadCount}
        onToggleMic={toggleMic}
        onToggleCamera={toggleCamera}
        onToggleScreenShare={toggleScreenShare}
        onToggleChat={handleToggleChat}
        onToggleHandRaise={handleToggleHandRaise}
        onToggleLayout={() => setIsSpotlightMode((prev) => !prev)}
        onLeaveCall={handleLeaveCall}
        onOpenSettings={() => setIsStatsOpen(true)}
      />

      {/* Side Chat & Participants Drawer */}
      <ChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        messages={messages}
        onSendMessage={handleSendMessage}
        participants={participantList}
        myPeerId={myPeerId}
      />

      {/* Stats & Diagnostics Modal */}
      <StatsModal
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        peers={peers}
        isConnected={signaling.isConnected}
        roomCode={roomCode}
      />

      {/* Question Picker & Custom Question Modal */}
      <QuestionPickerModal
        isOpen={isQuestionPickerOpen}
        onClose={() => setIsQuestionPickerOpen(false)}
        onSelectQuestion={handleSelectQuestionFromPicker}
        currentTopic={arenaSession?.topic || 'System Design'}
      />

      {/* AI Round Evaluation Scorecard Modal */}
      <EvaluationModal
        evaluation={currentEvaluation}
        onClose={() => setCurrentEvaluation(null)}
        onNextTurn={handleNextTurn}
        isHost={true}
        onSpeakVerdict={(evaluation) => textToSpeech.speakEvaluation(evaluation)}
      />
    </div>
  );
}
