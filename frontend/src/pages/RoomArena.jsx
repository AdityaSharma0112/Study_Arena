import React, { useState, useEffect, useCallback, useRef } from 'react';
import Navbar from '../components/Navbar';
import VideoTile from '../components/VideoTile';
import MediaControls from '../components/MediaControls';
import ChatDrawer from '../components/ChatDrawer';
import StatsModal from '../components/StatsModal';
import ArenaModeratorBar from '../components/ArenaModeratorBar';
import EvaluationModal from '../components/EvaluationModal';
import { useSignaling } from '../hooks/useSignaling';
import { useWebRTC } from '../hooks/useWebRTC';
import { useSpeechToText } from '../hooks/useSpeechToText';
import { useTextToSpeech } from '../hooks/useTextToSpeech';

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
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pinnedPeerId, setPinnedPeerId] = useState(null);

  // Arena Game Loop & AI Evaluation State
  const [arenaSession, setArenaSession] = useState(null);
  const [currentEvaluation, setCurrentEvaluation] = useState(null);
  const [liveCaptions, setLiveCaptions] = useState({}); // { [peerId]: text }

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

  // Handle game loop signaling events
  useEffect(() => {
    const unsubExisting = signaling.on('existing-participants', (data) => {
      if (data.activeSession) {
        setArenaSession(data.activeSession);
      }
    });

    const unsubSessionStart = signaling.on('session-started', (data) => {
      console.log('[Arena] Session started:', data.session);
      setArenaSession(data.session);
      setCurrentEvaluation(null);
      setLiveCaptions({});

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
      setArenaSession((prev) => {
        if (!prev) return prev;
        const updated = {
          ...prev,
          turnIndex: data.turnIndex,
          currentSpeakerPeerId: data.currentSpeakerPeerId,
          expiresAt: data.expiresAt,
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

    const unsubEvalResult = signaling.on('evaluation-result', (data) => {
      console.log('[Arena] Evaluation received:', data.evaluation);
      setCurrentEvaluation(data.evaluation);
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
      if (unsubEvalResult) unsubEvalResult();
      if (unsubCaptions) unsubCaptions();
      if (unsubSessionEnd) unsubSessionEnd();
    };
  }, [signaling, myPeerId, username, peers, textToSpeech]);

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
  const handleStartArenaSession = useCallback((topic, timeLimit) => {
    signaling.sendMessage('start-arena-session', {
      topic,
      timeLimit,
    });
  }, [signaling]);

  const handleNextTurn = useCallback(() => {
    signaling.sendMessage('next-turn', {});
  }, [signaling]);

  const handleSubmitAnswer = useCallback(() => {
    const capturedTranscript = speechToText.transcript || 'Spoke on the discussion topic.';
    speechToText.stopListening();

    signaling.sendMessage('submit-transcript', {
      transcript: capturedTranscript,
      peerId: myPeerId,
      username,
    });
  }, [speechToText, signaling, myPeerId, username]);

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
  const totalTiles = 1 + Object.keys(peers).length;
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
        isHost={true} // In peer arena, all peers can trigger rounds or pass turns
        peers={peers}
        username={username}
        onStartSession={handleStartArenaSession}
        onNextTurn={handleNextTurn}
        onSubmitAnswer={handleSubmitAnswer}
        onEndSession={handleEndArenaSession}
        isSpeaking={textToSpeech.isSpeaking}
        isVoiceEnabled={textToSpeech.isVoiceEnabled}
        onToggleVoice={textToSpeech.toggleVoice}
        onRepeatQuestion={() => {
          if (arenaSession?.question?.question) {
            const spkName = arenaSession.currentSpeakerPeerId === myPeerId
              ? username
              : (peers[arenaSession.currentSpeakerPeerId]?.username || 'Candidate');
            textToSpeech.speakQuestion(arenaSession.topic, arenaSession.question.question, spkName);
          }
        }}
      />

      {/* Video Grid Arena Stage */}
      <main style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        position: 'relative',
        paddingBottom: '90px', // Space for bottom controls
      }}>
        <div className={`video-grid-container ${gridClass}`}>
          {/* Local User Video Tile */}
          <VideoTile
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
            captions={liveCaptions[myPeerId] || (isMyTurn ? speechToText.interimTranscript : '')}
          />

          {/* Remote Peer Video Tiles */}
          {Object.values(peers).map((peer) => (
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
              captions={liveCaptions[peer.peerId] || ''}
            />
          ))}
        </div>
      </main>

      {/* Floating Bottom Media Controls */}
      <MediaControls
        isMuted={isMuted}
        isCameraOff={isCameraOff}
        isScreenSharing={isScreenSharing}
        isChatOpen={isChatOpen}
        unreadCount={unreadCount}
        onToggleMic={toggleMic}
        onToggleCamera={toggleCamera}
        onToggleScreenShare={toggleScreenShare}
        onToggleChat={handleToggleChat}
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
