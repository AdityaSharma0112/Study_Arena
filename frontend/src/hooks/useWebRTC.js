import { useState, useEffect, useRef, useCallback } from 'react';
import { ICE_SERVERS } from '../services/api';

export function useWebRTC(roomCode, username, signaling) {
  const [localStream, setLocalStream] = useState(null);
  const [screenStream, setScreenStream] = useState(null);
  const [peers, setPeers] = useState({}); // { [peerId]: { peerId, username, stream, isMuted, isCameraOff, isScreenSharing, isSpeaking, connectionState } }
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isLocalSpeaking, setIsLocalSpeaking] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0); // 0 - 100
  const [myPeerId, setMyPeerId] = useState(() => 'peer_' + Math.random().toString(36).substring(2, 9));

  // Refs
  const isMutedRef = useRef(false);
  const peerConnectionsRef = useRef({}); // { [peerId]: RTCPeerConnection }
  const iceCandidatesQueueRef = useRef({}); // { [peerId]: Array<RTCIceCandidateInit> }
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Sync ref
  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  // Audio level monitoring helper (Stable)
  const setupAudioMonitoring = useCallback((stream) => {
    try {
      const audioTrack = stream.getAudioTracks()[0];
      if (!audioTrack) return;

      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;

      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new AudioContextClass();
      }

      const audioCtx = audioContextRef.current;
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const checkVolume = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        const normalized = Math.min(100, Math.round((average / 128) * 100));

        setAudioLevel(normalized);
        setIsLocalSpeaking(normalized > 15 && !isMutedRef.current);

        animationFrameRef.current = requestAnimationFrame(checkVolume);
      };

      checkVolume();
    } catch (e) {
      console.warn('Audio level analyzer notice:', e);
    }
  }, []);

  // Acquire local media stream (Stable)
  const initializeLocalMedia = useCallback(async (videoEnabled = true, audioEnabled = true) => {
    try {
      console.log(`[WebRTC] Requesting getUserMedia (video: ${videoEnabled}, audio: ${audioEnabled})`);

      // If already initialized with active tracks, don't stop
      if (localStreamRef.current && localStreamRef.current.active) {
        console.log('[WebRTC] Local media stream already active');
        return localStreamRef.current;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoEnabled ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        } : false,
        audio: audioEnabled,
      });

      console.log('[WebRTC] Acquired local stream:', stream.id, 'Tracks:', stream.getTracks().map(t => `${t.kind}:${t.enabled}`));
      localStreamRef.current = stream;
      setLocalStream(stream);

      setIsCameraOff(!videoEnabled);
      setIsMuted(!audioEnabled);

      if (audioEnabled) {
        setupAudioMonitoring(stream);
      }

      // If any existing peer connections were created before stream acquisition, attach tracks now
      Object.values(peerConnectionsRef.current).forEach((pc) => {
        const senders = pc.getSenders();
        stream.getTracks().forEach((track) => {
          const hasSender = senders.some((s) => s.track && s.track.kind === track.kind);
          if (!hasSender) {
            pc.addTrack(track, stream);
          }
        });
      });

      return stream;
    } catch (err) {
      console.error('[WebRTC] Error acquiring user media:', err);
      // Fallback: Try audio only
      try {
        const audioOnlyStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        localStreamRef.current = audioOnlyStream;
        setLocalStream(audioOnlyStream);
        setIsCameraOff(true);
        setupAudioMonitoring(audioOnlyStream);
        return audioOnlyStream;
      } catch (audioErr) {
        console.error('[WebRTC] Audio fallback also failed:', audioErr);
        throw err;
      }
    }
  }, [setupAudioMonitoring]);

  // Create an RTCPeerConnection for a target peer
  const createPeerConnection = useCallback((targetPeerId, targetUsername, isInitiator) => {
    console.log(`[WebRTC] Creating RTCPeerConnection for ${targetPeerId} (initiator: ${isInitiator})`);

    // Clean up old connection if exists
    if (peerConnectionsRef.current[targetPeerId]) {
      peerConnectionsRef.current[targetPeerId].close();
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionsRef.current[targetPeerId] = pc;
    iceCandidatesQueueRef.current[targetPeerId] = [];

    // Add local media tracks to peer connection
    const currentStream = screenStreamRef.current || localStreamRef.current;
    let hasVideoSender = false;
    if (currentStream) {
      currentStream.getTracks().forEach((track) => {
        if (track.kind === 'video') hasVideoSender = true;
        pc.addTrack(track, currentStream);
      });
    }

    // Ensure a video transceiver exists in the SDP even if camera started off
    if (!hasVideoSender) {
      try {
        pc.addTransceiver('video', { direction: 'sendrecv' });
      } catch (e) {
        // Fallback for older browsers
      }
    }

    // Handle ICE Candidate generation
    pc.onicecandidate = (event) => {
      if (event.candidate && signaling.isConnected) {
        signaling.sendMessage('ice-candidate', {
          targetPeerId,
          candidate: event.candidate,
        });
      }
    };

    // Handle Remote Track arrival
    pc.ontrack = (event) => {
      console.log(`[WebRTC] Received remote track (${event.track.kind}) from ${targetPeerId}`, event.streams);
      const incomingStream = event.streams && event.streams[0] ? event.streams[0] : null;

      setPeers((prev) => {
        const existingPeer = prev[targetPeerId];
        let streamToUse;

        if (incomingStream) {
          streamToUse = incomingStream;
        } else if (existingPeer?.stream) {
          const hasTrack = existingPeer.stream.getTracks().some((t) => t.id === event.track.id);
          if (!hasTrack) {
            existingPeer.stream.addTrack(event.track);
          }
          streamToUse = new MediaStream(existingPeer.stream.getTracks());
        } else {
          streamToUse = new MediaStream([event.track]);
        }

        return {
          ...prev,
          [targetPeerId]: {
            ...(existingPeer || {}),
            peerId: targetPeerId,
            username: targetUsername || existingPeer?.username || 'Participant',
            stream: streamToUse,
            connectionState: pc.connectionState || 'connected',
          },
        };
      });
    };

    // Handle Connection State changes
    pc.onconnectionstatechange = () => {
      console.log(`[WebRTC] Connection state with ${targetPeerId}:`, pc.connectionState);
      setPeers((prev) => {
        if (!prev[targetPeerId]) return prev;
        return {
          ...prev,
          [targetPeerId]: {
            ...prev[targetPeerId],
            connectionState: pc.connectionState,
          },
        };
      });

      if (pc.connectionState === 'failed') {
        console.warn(`[WebRTC] Connection with ${targetPeerId} failed, restarting ICE`);
        pc.restartIce();
      }
    };

    // If this peer is the initiator, create and send the Offer
    if (isInitiator) {
      pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true })
        .then((offer) => pc.setLocalDescription(offer))
        .then(() => {
          signaling.sendMessage('offer', {
            targetPeerId,
            sdp: pc.localDescription,
          });
        })
        .catch((err) => {
          console.error(`[WebRTC] Error creating offer for ${targetPeerId}:`, err);
        });
    }

    return pc;
  }, [signaling]);

  // Handle incoming Offer from a peer
  const handleReceiveOffer = useCallback(async ({ senderPeerId, sdp, username: senderUsername }) => {
    console.log(`[WebRTC] Received offer from ${senderPeerId}`);
    const pc = createPeerConnection(senderPeerId, senderUsername, false);

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));

      // Flush any queued ICE candidates
      if (iceCandidatesQueueRef.current[senderPeerId]) {
        for (const candidate of iceCandidatesQueueRef.current[senderPeerId]) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
        iceCandidatesQueueRef.current[senderPeerId] = [];
      }

      // Create and send Answer
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      signaling.sendMessage('answer', {
        targetPeerId: senderPeerId,
        sdp: pc.localDescription,
      });
    } catch (err) {
      console.error(`[WebRTC] Error handling offer from ${senderPeerId}:`, err);
    }
  }, [createPeerConnection, signaling]);

  // Handle incoming Answer from a peer
  const handleReceiveAnswer = useCallback(async ({ senderPeerId, sdp }) => {
    console.log(`[WebRTC] Received answer from ${senderPeerId}`);
    const pc = peerConnectionsRef.current[senderPeerId];
    if (!pc) return;

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));

      // Flush queued ICE candidates
      if (iceCandidatesQueueRef.current[senderPeerId]) {
        for (const candidate of iceCandidatesQueueRef.current[senderPeerId]) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
        iceCandidatesQueueRef.current[senderPeerId] = [];
      }
    } catch (err) {
      console.error(`[WebRTC] Error handling answer from ${senderPeerId}:`, err);
    }
  }, []);

  // Handle incoming ICE Candidate
  const handleReceiveIceCandidate = useCallback(async ({ senderPeerId, candidate }) => {
    if (!candidate) return;
    const pc = peerConnectionsRef.current[senderPeerId];

    if (pc && pc.remoteDescription && pc.remoteDescription.type) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error(`[WebRTC] Error adding ICE candidate from ${senderPeerId}:`, err);
      }
    } else {
      // Queue candidate until remote description is set
      if (!iceCandidatesQueueRef.current[senderPeerId]) {
        iceCandidatesQueueRef.current[senderPeerId] = [];
      }
      iceCandidatesQueueRef.current[senderPeerId].push(candidate);
    }
  }, []);

  // Handle Existing Participants list when joining room
  const handleExistingParticipants = useCallback(({ participants, myPeerId: assignedPeerId }) => {
    if (assignedPeerId) setMyPeerId(assignedPeerId);

    console.log('[WebRTC] Existing participants in room:', participants);
    participants.forEach((p) => {
      setPeers((prev) => ({
        ...prev,
        [p.peerId]: {
          peerId: p.peerId,
          username: p.username,
          isMuted: p.isMuted,
          isCameraOff: p.isCameraOff,
          isScreenSharing: p.isScreenSharing,
          stream: null,
          connectionState: 'connecting',
        },
      }));

      // As newcomer, initiate offer to each existing participant
      createPeerConnection(p.peerId, p.username, true);
    });
  }, [createPeerConnection]);

  // Handle new user joined notification
  const handleUserJoined = useCallback(({ peerId, username: peerName, isMuted: peerMuted, isCameraOff: peerCameraOff }) => {
    console.log(`[WebRTC] User joined room: ${peerName} (${peerId})`);
    setPeers((prev) => ({
      ...prev,
      [peerId]: {
        peerId,
        username: peerName,
        isMuted: peerMuted,
        isCameraOff: peerCameraOff,
        isScreenSharing: false,
        stream: null,
        connectionState: 'connecting',
      },
    }));
  }, []);

  // Handle user left
  const handleUserLeft = useCallback(({ peerId, username: peerName }) => {
    console.log(`[WebRTC] User left room: ${peerName} (${peerId})`);

    if (peerConnectionsRef.current[peerId]) {
      peerConnectionsRef.current[peerId].close();
      delete peerConnectionsRef.current[peerId];
    }
    if (iceCandidatesQueueRef.current[peerId]) {
      delete iceCandidatesQueueRef.current[peerId];
    }

    setPeers((prev) => {
      const updated = { ...prev };
      delete updated[peerId];
      return updated;
    });
  }, []);

  // Handle peer media state changes
  const handleMediaStateUpdate = useCallback(({ peerId, isMuted: pMuted, isCameraOff: pCamOff, isScreenSharing: pScreen }) => {
    setPeers((prev) => {
      if (!prev[peerId]) return prev;
      return {
        ...prev,
        [peerId]: {
          ...prev[peerId],
          ...(pMuted !== undefined ? { isMuted: pMuted } : {}),
          ...(pCamOff !== undefined ? { isCameraOff: pCamOff } : {}),
          ...(pScreen !== undefined ? { isScreenSharing: pScreen } : {}),
        },
      };
    });
  }, []);

  // Register all signaling event handlers
  useEffect(() => {
    if (!signaling) return;

    const unsubs = [
      signaling.on('existing-participants', handleExistingParticipants),
      signaling.on('user-joined', handleUserJoined),
      signaling.on('user-left', handleUserLeft),
      signaling.on('offer', handleReceiveOffer),
      signaling.on('answer', handleReceiveAnswer),
      signaling.on('ice-candidate', handleReceiveIceCandidate),
      signaling.on('media-state', handleMediaStateUpdate),
    ];

    return () => {
      unsubs.forEach((unsub) => unsub && unsub());
    };
  }, [
    signaling,
    handleExistingParticipants,
    handleUserJoined,
    handleUserLeft,
    handleReceiveOffer,
    handleReceiveAnswer,
    handleReceiveIceCandidate,
    handleMediaStateUpdate,
  ]);

  // Toggle Microphone
  const toggleMic = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        const newMuted = !audioTrack.enabled;
        setIsMuted(newMuted);

        signaling.sendMessage('media-state', {
          isMuted: newMuted,
        });
      }
    }
  }, [signaling]);

  // Toggle Camera (Shuts off hardware camera sensor and turns off laptop LED)
  const toggleCamera = useCallback(async () => {
    if (!isCameraOff) {
      // 1. Turn camera OFF -> Stop hardware capture tracks so laptop LED turns off completely
      if (localStreamRef.current) {
        const videoTracks = localStreamRef.current.getVideoTracks();
        videoTracks.forEach((track) => {
          track.stop();
          localStreamRef.current.removeTrack(track);
        });
        setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
      }

      // Replace video sender track with null on all active peer connections
      Object.values(peerConnectionsRef.current).forEach((pc) => {
        const senders = pc.getSenders();
        const videoSender = senders.find((s) => s.track?.kind === 'video' || (s.track === null && pc.getTransceivers().some(t => t.sender === s && t.receiver?.track?.kind === 'video')));
        if (videoSender) {
          videoSender.replaceTrack(null);
        }
      });

      setIsCameraOff(true);
      signaling.sendMessage('media-state', {
        isCameraOff: true,
      });
    } else {
      // 2. Turn camera ON -> Re-acquire hardware camera device
      try {
        const camStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user',
          },
          audio: false,
        });

        const newVideoTrack = camStream.getVideoTracks()[0];
        if (newVideoTrack) {
          if (!localStreamRef.current) {
            localStreamRef.current = new MediaStream();
          }
          localStreamRef.current.addTrack(newVideoTrack);
          setLocalStream(new MediaStream(localStreamRef.current.getTracks()));

          // Replace track on all active peer connections
          Object.values(peerConnectionsRef.current).forEach((pc) => {
            const senders = pc.getSenders();
            const videoSender = senders.find((s) => s.track?.kind === 'video' || (s.track === null && pc.getTransceivers().some(t => t.sender === s && t.receiver?.track?.kind === 'video')));
            if (videoSender) {
              videoSender.replaceTrack(newVideoTrack);
            } else {
              try {
                pc.addTrack(newVideoTrack, localStreamRef.current);
              } catch (e) {
                console.warn('[WebRTC] addTrack notice:', e);
              }
            }
          });

          setIsCameraOff(false);
          signaling.sendMessage('media-state', {
            isCameraOff: false,
          });
        }
      } catch (err) {
        console.error('[WebRTC] Failed to re-enable camera:', err);
      }
    }
  }, [isCameraOff, signaling]);

  // Toggle Screen Sharing
  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
        screenStreamRef.current = null;
      }
      setScreenStream(null);
      setIsScreenSharing(false);

      const webcamVideoTrack = localStreamRef.current?.getVideoTracks()[0];
      if (webcamVideoTrack) {
        Object.values(peerConnectionsRef.current).forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
          if (sender) {
            sender.replaceTrack(webcamVideoTrack);
          }
        });
      }

      signaling.sendMessage('media-state', { isScreenSharing: false });
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: { cursor: 'always' },
          audio: false,
        });

        screenStreamRef.current = stream;
        setScreenStream(stream);
        setIsScreenSharing(true);

        const screenVideoTrack = stream.getVideoTracks()[0];

        Object.values(peerConnectionsRef.current).forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
          if (sender) {
            sender.replaceTrack(screenVideoTrack);
          }
        });

        screenVideoTrack.onended = () => {
          toggleScreenShare();
        };

        signaling.sendMessage('media-state', { isScreenSharing: true });
      } catch (err) {
        console.error('[WebRTC] Screen share cancelled or failed:', err);
      }
    }
  }, [isScreenSharing, signaling]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
        screenStreamRef.current = null;
      }
      Object.values(peerConnectionsRef.current).forEach((pc) => {
        pc.close();
      });
      peerConnectionsRef.current = {};
    };
  }, []);

  return {
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
  };
}
