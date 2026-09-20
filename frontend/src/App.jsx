import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import RoomLobby from './components/RoomLobby';
import RoomArena from './pages/RoomArena';
import CreateRoomModal from './components/CreateRoomModal';

export default function App() {
  const [currentView, setCurrentView] = useState('home'); // 'home' | 'lobby' | 'arena'
  const [roomCode, setRoomCode] = useState('');
  const [roomTitle, setRoomTitle] = useState('');
  const [username, setUsername] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [mediaPreferences, setMediaPreferences] = useState({ video: true, audio: true });

  // Handle URL query parameters for direct room joining (e.g. ?room=ABCD1234)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room');
    if (roomParam) {
      setRoomCode(roomParam.toUpperCase());
      setCurrentView('lobby');
    }
  }, []);

  const handleEnterLobby = (code, title = '') => {
    setRoomCode(code);
    setRoomTitle(title);
    setCurrentView('lobby');
    // Update browser URL query without reload
    const newUrl = `${window.location.origin}${window.location.pathname}?room=${code}`;
    window.history.pushState({ path: newUrl }, '', newUrl);
  };

  const handleRoomCreated = (room, host) => {
    setIsCreateModalOpen(false);
    setUsername(host);
    handleEnterLobby(room.code, room.title);
  };

  const handleJoinArena = ({ username: user, videoEnabled, audioEnabled }) => {
    setUsername(user);
    setMediaPreferences({ video: videoEnabled, audio: audioEnabled });
    setCurrentView('arena');
  };

  const handleLeaveArena = () => {
    setCurrentView('home');
    setRoomCode('');
    // Clear URL query
    window.history.pushState({}, '', window.location.pathname);
  };

  return (
    <div className="app-layout">
      {/* Ambient background neon glow */}
      <div className="ambient-glow" />

      {/* View routing */}
      {currentView === 'home' && (
        <>
          <Navbar />
          <Home
            onEnterLobby={handleEnterLobby}
            onOpenCreateModal={() => setIsCreateModalOpen(true)}
          />
        </>
      )}

      {currentView === 'lobby' && (
        <>
          <Navbar roomCode={roomCode} />
          <RoomLobby
            roomCode={roomCode}
            roomTitle={roomTitle}
            initialUsername={username}
            onJoin={handleJoinArena}
            onBack={handleLeaveArena}
          />
        </>
      )}

      {currentView === 'arena' && (
        <RoomArena
          roomCode={roomCode}
          roomTitle={roomTitle}
          username={username}
          initialVideo={mediaPreferences.video}
          initialAudio={mediaPreferences.audio}
          onLeave={handleLeaveArena}
        />
      )}

      {/* Create Room Modal */}
      <CreateRoomModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onRoomCreated={handleRoomCreated}
      />
    </div>
  );
}
