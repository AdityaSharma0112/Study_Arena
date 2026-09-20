import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Users, MessageSquare, Shield, Smile } from 'lucide-react';

export default function ChatDrawer({
  isOpen,
  onClose,
  messages = [],
  onSendMessage,
  participants = [],
  myPeerId,
}) {
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'peers'
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef(null);

  // Auto-scroll chat to latest message
  useEffect(() => {
    if (isOpen && activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, activeTab]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
    onSendMessage(inputMessage.trim());
    setInputMessage('');
  };

  if (!isOpen) return null;

  return (
    <aside style={{
      position: 'fixed',
      top: '76px',
      right: '16px',
      bottom: '100px',
      width: '360px',
      maxWidth: 'calc(100vw - 32px)',
      zIndex: 35,
      display: 'flex',
      flexDirection: 'column',
    }} className="glass-panel">
      {/* Header & Tabs */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setActiveTab('chat')}
            className={`btn ${activeTab === 'chat' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
          >
            <MessageSquare size={14} /> Chat
          </button>
          <button
            onClick={() => setActiveTab('peers')}
            className={`btn ${activeTab === 'peers' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
          >
            <Users size={14} /> Peers ({participants.length})
          </button>
        </div>

        <button
          onClick={onClose}
          className="btn btn-secondary btn-icon"
          style={{ width: '30px', height: '30px' }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Body */}
      {activeTab === 'chat' ? (
        <>
          {/* Messages list */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}>
            {messages.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-dim)', marginTop: '40px' }}>
                <MessageSquare size={32} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                <p style={{ fontSize: '0.85rem' }}>No messages yet.</p>
                <p style={{ fontSize: '0.75rem' }}>Say hello to everyone in the arena!</p>
              </div>
            ) : (
              messages.map((msg, idx) => {
                const isMe = msg.peerId === myPeerId;
                return (
                  <div
                    key={idx}
                    style={{
                      alignSelf: isMe ? 'flex-end' : 'flex-start',
                      maxWidth: '85%',
                    }}
                  >
                    {!isMe && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginLeft: '4px' }}>
                        {msg.senderName}
                      </span>
                    )}
                    <div
                      style={{
                        padding: '8px 14px',
                        borderRadius: 'var(--radius-md)',
                        background: isMe
                          ? 'linear-gradient(135deg, var(--primary) 0%, #4f46e5 100%)'
                          : 'rgba(255, 255, 255, 0.08)',
                        color: '#fff',
                        fontSize: '0.875rem',
                        marginTop: '2px',
                        border: isMe ? 'none' : '1px solid rgba(255,255,255,0.06)',
                        wordBreak: 'break-word',
                      }}
                    >
                      {msg.text}
                    </div>
                    <span style={{
                      fontSize: '0.65rem',
                      color: 'var(--text-dim)',
                      display: 'block',
                      textAlign: isMe ? 'right' : 'left',
                      marginTop: '2px',
                      padding: '0 4px',
                    }}>
                      {msg.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSend} style={{
            padding: '12px 16px',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            gap: '8px',
          }}>
            <input
              type="text"
              className="input-glass"
              placeholder="Send message..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              style={{ fontSize: '0.85rem', padding: '8px 12px' }}
            />
            <button
              type="submit"
              className="btn btn-primary btn-icon"
              style={{ width: '40px', height: '40px', flexShrink: 0 }}
            >
              <Send size={16} />
            </button>
          </form>
        </>
      ) : (
        /* Participants List */
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {participants.map((p, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  color: '#fff',
                }}>
                  {p.username ? p.username.substring(0, 2).toUpperCase() : 'P'}
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#fff' }}>
                    {p.username} {p.peerId === myPeerId ? '(You)' : ''}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                    {p.peerId}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '4px' }}>
                {p.isMuted && <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>Muted</span>}
                {p.isCameraOff && <span className="badge badge-secondary" style={{ fontSize: '0.65rem' }}>No Cam</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}
