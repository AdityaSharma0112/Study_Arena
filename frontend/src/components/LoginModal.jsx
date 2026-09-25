import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, User, Eye, EyeOff, ShieldCheck, AlertCircle, Loader2, X } from 'lucide-react';

export default function LoginModal() {
  const { isLoginModalOpen, closeLoginModal, login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isLoginModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Please provide both username and password.');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await login(username.trim(), password);
      setUsername('');
      setPassword('');
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50,
      padding: '20px',
    }}>
      <div className="glass-panel-elevated" style={{
        width: '100%',
        maxWidth: '440px',
        padding: '32px',
        position: 'relative',
      }}>
        {/* Close Button */}
        <button
          onClick={closeLoginModal}
          className="btn btn-secondary btn-icon"
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            width: '32px',
            height: '32px',
          }}
          title="Close modal"
        >
          <X size={16} />
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px var(--primary-glow)',
            marginBottom: '14px',
          }}>
            <Lock size={22} color="#fff" />
          </div>
          <h2 style={{ fontSize: '1.4rem', color: '#fff', margin: 0, fontWeight: 700 }}>
            Sign In to Study Arena
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '6px' }}>
            Access your private arenas, custom sessions & peer discussions
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <div style={{
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#fca5a5',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            marginBottom: '16px',
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px', color: '#f87171' }} />
            <span style={{ lineHeight: 1.4 }}>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.8rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--text-muted)',
              marginBottom: '6px',
            }}>
              Username
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <div style={{
                position: 'absolute',
                left: '12px',
                pointerEvents: 'none',
                color: 'var(--text-dim)',
                display: 'flex',
                alignItems: 'center',
              }}>
                <User size={16} />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. aditya or alice"
                autoComplete="username"
                disabled={isSubmitting}
                className="input-glass"
                style={{ width: '100%', paddingLeft: '38px' }}
              />
            </div>
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '0.8rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--text-muted)',
              marginBottom: '6px',
            }}>
              Password
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <div style={{
                position: 'absolute',
                left: '12px',
                pointerEvents: 'none',
                color: 'var(--text-dim)',
                display: 'flex',
                alignItems: 'center',
              }}>
                <Lock size={16} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                disabled={isSubmitting}
                className="input-glass"
                style={{ width: '100%', paddingLeft: '38px', paddingRight: '38px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-dim)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '0.95rem',
              marginTop: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Signing In...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        {/* Admin Provisioning Note */}
        <div style={{
          marginTop: '20px',
          paddingTop: '16px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '8px',
          fontSize: '0.75rem',
          color: 'var(--text-dim)',
          lineHeight: 1.4,
        }}>
          <ShieldCheck size={16} color="#34d399" style={{ flexShrink: 0, marginTop: '1px' }} />
          <span>
            Accounts are provisioned by your system administrator via Django Admin. Contact your administrator if you need credentials.
          </span>
        </div>
      </div>
    </div>
  );
}
