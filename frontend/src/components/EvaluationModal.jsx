import React, { useEffect } from 'react';
import {
  Award,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  X,
  ArrowRight,
  Bot,
  Zap,
  Star,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function EvaluationModal({
  evaluation,
  onClose,
  onNextTurn,
  isHost,
  onSpeakVerdict,
}) {
  if (!evaluation) return null;

  // Trigger confetti burst on high score
  useEffect(() => {
    if (evaluation.totalScore >= 70) {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [evaluation]);

  const {
    speakerName,
    technicalScore = 7.5,
    clarityScore = 8.0,
    relevanceScore = 7.0,
    totalScore = 75,
    strengths = [],
    improvements = [],
    summary = 'Good articulation and technical grasp.',
    matchedKeywords = [],
    isAiGenerated = false,
    transcript = '',
  } = evaluation;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 60,
      padding: '20px',
    }}>
      <div className="glass-panel-elevated" style={{
        width: '100%',
        maxWidth: '560px',
        padding: '32px',
        maxHeight: '90vh',
        overflowY: 'auto',
        position: 'relative',
        background: 'linear-gradient(135deg, rgba(14,22,40,0.95) 0%, rgba(20,32,60,0.9) 100%)',
        border: '1.5px solid rgba(99, 102, 241, 0.4)',
        boxShadow: '0 25px 60px rgba(0,0,0,0.7), 0 0 35px var(--primary-glow)',
      }}>
        {/* Top Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px var(--primary-glow)',
            }}>
              <Award size={22} color="#fff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '1.3rem', color: '#fff', margin: 0 }}>
                  Round Scorecard
                </h3>
                <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>
                  {isAiGenerated ? 'Gemini AI' : 'Smart Evaluation'}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Speaker: <strong style={{ color: '#fff' }}>{speakerName}</strong>
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {onSpeakVerdict && (
              <button
                onClick={() => onSpeakVerdict(evaluation)}
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.75rem', gap: '4px' }}
                title="Speak scorecard aloud"
              >
                🔊 Listen
              </button>
            )}
            <button onClick={onClose} className="btn btn-secondary btn-icon" style={{ width: '32px', height: '32px' }}>
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Overall Score Banner */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderRadius: 'var(--radius-lg)',
          background: 'rgba(99, 102, 241, 0.12)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          marginBottom: '20px',
        }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#a5b4fc', textTransform: 'uppercase', fontWeight: 600 }}>
              OVERALL ASSESSMENT
            </span>
            <div style={{ fontSize: '0.9rem', color: '#fff', marginTop: '2px', fontWeight: 500 }}>
              {summary}
            </div>
          </div>

          <div style={{ textAlign: 'center', minWidth: '80px' }}>
            <div style={{
              fontSize: '2.2rem',
              fontWeight: 800,
              fontFamily: 'var(--font-heading)',
              color: totalScore >= 70 ? '#34d399' : '#fcd34d',
              lineHeight: 1,
            }}>
              {totalScore}
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>out of 100</span>
          </div>
        </div>

        {/* Spoken Speech Transcript Preview (if available) */}
        {transcript && (
          <div style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            marginBottom: '18px',
          }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
              Candidate Speech Analyzed:
            </span>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#e2e8f0', fontStyle: 'italic', lineHeight: 1.4 }}>
              "{transcript}"
            </p>
          </div>
        )}

        {/* Metrics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '22px' }}>
          <div style={{
            padding: '12px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border-subtle)',
            textAlign: 'center',
          }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Technical Depth</span>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary-light)', marginTop: '4px' }}>
              {technicalScore}/10
            </div>
          </div>

          <div style={{
            padding: '12px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border-subtle)',
            textAlign: 'center',
          }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Clarity & Pace</span>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--secondary)', marginTop: '4px' }}>
              {clarityScore}/10
            </div>
          </div>

          <div style={{
            padding: '12px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border-subtle)',
            textAlign: 'center',
          }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Relevance</span>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#34d399', marginTop: '4px' }}>
              {relevanceScore}/10
            </div>
          </div>
        </div>

        {/* Matched Keywords (if any) */}
        {matchedKeywords && matchedKeywords.length > 0 && (
          <div style={{ marginBottom: '18px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
              Concepts Identified:
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {matchedKeywords.map((kw, idx) => (
                <span key={idx} className="badge badge-success" style={{ fontSize: '0.7rem' }}>
                  ✓ {kw}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Strengths & Improvements */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
          {/* Strengths */}
          {strengths.length > 0 && (
            <div style={{
              padding: '14px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: '#34d399', fontSize: '0.85rem', fontWeight: 600 }}>
                <CheckCircle2 size={16} /> Key Strengths
              </div>
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#e2e8f0', fontSize: '0.85rem', lineHeight: 1.5 }}>
                {strengths.map((str, idx) => (
                  <li key={idx}>{str}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Improvements */}
          {improvements.length > 0 && (
            <div style={{
              padding: '14px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: '#fcd34d', fontSize: '0.85rem', fontWeight: 600 }}>
                <TrendingUp size={16} /> Suggestions to Elevate Next Time
              </div>
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#e2e8f0', fontSize: '0.85rem', lineHeight: 1.5 }}>
                {improvements.map((imp, idx) => (
                  <li key={idx}>{imp}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn btn-secondary" style={{ padding: '10px 18px' }}>
            Close Scorecard
          </button>
          {onNextTurn && isHost && (
            <button
              onClick={() => {
                onClose();
                onNextTurn();
              }}
              className="btn btn-primary"
              style={{ padding: '10px 20px', gap: '8px' }}
            >
              Advance to Next Speaker <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
