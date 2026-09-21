import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Search,
  Sparkles,
  BookOpen,
  Clock,
  Dices,
  Play,
  Layers,
  Filter,
  CheckCircle,
  Cpu,
  Globe,
  Terminal,
  Users,
  Compass,
} from 'lucide-react';
import { apiService } from '../services/api';

const TOPIC_ICONS = {
  'System Design': <Cpu size={14} />,
  'Algorithms': <Compass size={14} />,
  'Web & Distributed': <Globe size={14} />,
  'DevOps & Cloud': <Terminal size={14} />,
  'Behavioral': <Users size={14} />,
  'Custom': <Sparkles size={14} />,
};

export default function QuestionPickerModal({
  isOpen,
  onClose,
  onSelectQuestion,
  currentTopic = 'System Design',
}) {
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [questions, setQuestions] = useState([]);
  const [topics, setTopics] = useState(['All', 'System Design', 'Algorithms', 'Web & Distributed', 'DevOps & Cloud', 'Behavioral']);
  const [loading, setLoading] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [customTime, setCustomTime] = useState(60);

  // Custom question form state
  const [customTopic, setCustomTopic] = useState('System Design');
  const [customDifficulty, setCustomDifficulty] = useState('Medium');
  const [customQuestionText, setCustomQuestionText] = useState('');
  const [customKeywords, setCustomKeywords] = useState('');

  // Fetch questions from backend API
  useEffect(() => {
    if (!isOpen) return;

    let isSubscribed = true;
    async function loadData() {
      setLoading(true);
      try {
        const res = await apiService.getQuestions(activeTab === 'Custom' ? 'All' : activeTab, searchQuery);
        if (isSubscribed) {
          if (res.topics && res.topics.length > 0) {
            setTopics(res.topics);
          }
          setQuestions(res.questions || []);
        }
      } catch (err) {
        console.error('Failed to load questions:', err);
      } finally {
        if (isSubscribed) setLoading(false);
      }
    }

    loadData();
    return () => {
      isSubscribed = false;
    };
  }, [isOpen, activeTab, searchQuery]);

  if (!isOpen) return null;

  const handlePickQuestion = (q, time = customTime) => {
    onSelectQuestion({
      topic: q.topic,
      difficulty: q.difficulty || 'Medium',
      time_limit: time || q.time_limit || 60,
      question: q.question,
      keywords: q.keywords || [],
    }, time || q.time_limit || 60);
    onClose();
  };

  const handlePickRandom = () => {
    if (!questions.length) return;
    const randomQ = questions[Math.floor(Math.random() * questions.length)];
    handlePickQuestion(randomQ, randomQ.time_limit || 60);
  };

  const handleLaunchCustom = (e) => {
    e.preventDefault();
    if (!customQuestionText.trim()) return;

    const keywordsArray = customKeywords
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);

    const customQ = {
      topic: customTopic,
      difficulty: customDifficulty,
      time_limit: customTime,
      question: customQuestionText.trim(),
      keywords: keywordsArray.length > 0 ? keywordsArray : ['technical discussion', 'explanation'],
    };

    onSelectQuestion(customQ, customTime);
    onClose();
  };

  const getDifficultyClass = (diff) => {
    const d = (diff || '').toLowerCase();
    if (d === 'easy') return 'badge-success';
    if (d === 'hard') return 'badge-danger';
    return 'badge-warning';
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(5, 8, 18, 0.75)',
        backdropFilter: 'blur(10px)',
        animation: 'fadeIn 0.2s ease-out',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel-elevated modal-content"
        style={{
          width: '100%',
          maxWidth: '820px',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(20, 30, 60, 0.95) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.35)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 40px rgba(99, 102, 241, 0.2)',
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(255, 255, 255, 0.02)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
              <BookOpen size={20} color="#fff" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                Question Bank & Arena Prompts
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                Select a curated technical challenge or author a custom discussion question
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handlePickRandom}
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.8rem', gap: '6px' }}
              title="Pick a random question"
            >
              <Dices size={15} color="#818cf8" /> Random
            </button>
            <button
              onClick={onClose}
              className="btn btn-secondary btn-icon"
              style={{ width: '34px', height: '34px' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Search & Topic Tabs */}
        <div style={{ padding: '16px 24px 8px 24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Search Bar */}
          <div style={{ position: 'relative' }}>
            <Search
              size={17}
              color="var(--text-dim)"
              style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              className="input-glass"
              placeholder="Search by keyword, topic, or question text (e.g. 'redis', 'dijkstra', 'kafka')..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                paddingLeft: '42px',
                paddingRight: '14px',
                fontSize: '0.88rem',
                height: '42px',
                borderRadius: 'var(--radius-md)',
              }}
            />
          </div>

          {/* Topic Pills */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            overflowX: 'auto',
            paddingBottom: '4px',
          }}>
            {['All', 'System Design', 'Algorithms', 'Web & Distributed', 'DevOps & Cloud', 'Behavioral', 'Custom'].map((topic) => {
              const isActive = activeTab === topic;
              return (
                <button
                  key={topic}
                  onClick={() => setActiveTab(topic)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all var(--transition-fast)',
                    border: isActive
                      ? '1px solid var(--primary-light)'
                      : '1px solid rgba(255, 255, 255, 0.08)',
                    background: isActive
                      ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.3) 0%, rgba(139, 92, 246, 0.3) 100%)'
                      : 'rgba(255, 255, 255, 0.04)',
                    color: isActive ? '#fff' : 'var(--text-muted)',
                    boxShadow: isActive ? '0 0 12px var(--primary-glow)' : 'none',
                  }}
                >
                  {TOPIC_ICONS[topic] || <Layers size={13} />}
                  <span>{topic}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Body */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px 24px 20px 24px',
        }}>
          {activeTab === 'Custom' ? (
            /* Custom Question Builder Form */
            <form onSubmit={handleLaunchCustom} style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '8px' }}>
              <div style={{
                padding: '16px',
                borderRadius: 'var(--radius-lg)',
                background: 'rgba(99, 102, 241, 0.08)',
                border: '1px solid rgba(99, 102, 241, 0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}>
                <Sparkles size={22} color="#818cf8" />
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Author a bespoke question for your arena. The AI moderator will verbally present your question and evaluate participants based on technical depth.
                </p>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Question Prompt *
                </label>
                <textarea
                  className="input-glass"
                  rows={4}
                  required
                  placeholder="e.g. Explain how you would design an idempotency key mechanism in distributed payment systems..."
                  value={customQuestionText}
                  onChange={(e) => setCustomQuestionText(e.target.value)}
                  style={{ width: '100%', fontSize: '0.9rem', lineHeight: 1.4 }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                    Domain / Topic
                  </label>
                  <select
                    className="input-glass"
                    value={customTopic}
                    onChange={(e) => setCustomTopic(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px' }}
                  >
                    <option value="System Design">System Design</option>
                    <option value="Algorithms">Algorithms & DSA</option>
                    <option value="Web & Distributed">Web & Distributed</option>
                    <option value="DevOps & Cloud">DevOps & Cloud</option>
                    <option value="Behavioral">Behavioral & Leadership</option>
                    <option value="General Engineering">General Engineering</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                    Difficulty Level
                  </label>
                  <select
                    className="input-glass"
                    value={customDifficulty}
                    onChange={(e) => setCustomDifficulty(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px' }}
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                    Speaking Time Limit
                  </label>
                  <select
                    className="input-glass"
                    value={customTime}
                    onChange={(e) => setCustomTime(Number(e.target.value))}
                    style={{ width: '100%', padding: '8px 12px' }}
                  >
                    <option value={30}>30 Seconds</option>
                    <option value={45}>45 Seconds</option>
                    <option value={60}>60 Seconds</option>
                    <option value={90}>90 Seconds</option>
                    <option value={120}>120 Seconds (2 min)</option>
                    <option value={180}>180 Seconds (3 min)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Target Keywords (comma-separated for AI score evaluation)
                </label>
                <input
                  type="text"
                  className="input-glass"
                  placeholder="e.g. idempotency, redis, unique token, distributed lock, atomic"
                  value={customKeywords}
                  onChange={(e) => setCustomKeywords(e.target.value)}
                  style={{ width: '100%', fontSize: '0.88rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                <button type="button" onClick={onClose} className="btn btn-secondary">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!customQuestionText.trim()}
                  className="btn btn-primary"
                  style={{ padding: '10px 24px', gap: '8px', fontSize: '0.9rem' }}
                >
                  <Play size={16} fill="#fff" /> Start Round with Custom Question
                </button>
              </div>
            </form>
          ) : (
            /* Curated Question Bank Cards */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  <div className="spinner" style={{ margin: '0 auto 12px auto' }} />
                  <p>Searching question bank...</p>
                </div>
              ) : questions.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px dashed var(--border-subtle)',
                }}>
                  <BookOpen size={36} color="var(--text-dim)" style={{ margin: '0 auto 12px auto' }} />
                  <h4 style={{ color: '#fff', margin: '0 0 6px 0' }}>No matching questions found</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                    Try adjusting your search query or author a custom question in the "Custom" tab.
                  </p>
                </div>
              ) : (
                questions.map((q) => (
                  <div
                    key={q.id}
                    style={{
                      padding: '16px',
                      borderRadius: 'var(--radius-lg)',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.07)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                      transition: 'all var(--transition-fast)',
                    }}
                    className="hover-glow"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>
                          {q.topic}
                        </span>
                        <span className={`badge ${getDifficultyClass(q.difficulty)}`} style={{ fontSize: '0.7rem' }}>
                          {q.difficulty || 'Medium'}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                          <Clock size={12} />
                          <span>{q.time_limit || 60}s limit</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handlePickQuestion(q)}
                        className="btn btn-primary"
                        style={{
                          padding: '6px 14px',
                          fontSize: '0.78rem',
                          gap: '6px',
                          borderRadius: '8px',
                          flexShrink: 0,
                        }}
                      >
                        <Play size={13} fill="#fff" /> Start Round
                      </button>
                    </div>

                    <p style={{
                      margin: 0,
                      fontSize: '0.92rem',
                      fontWeight: 500,
                      color: '#f8fafc',
                      lineHeight: 1.45,
                    }}>
                      {q.question}
                    </p>

                    {q.keywords && q.keywords.length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '2px' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 600 }}>Keywords:</span>
                        {q.keywords.slice(0, 6).map((kw, i) => (
                          <span
                            key={i}
                            style={{
                              fontSize: '0.68rem',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              background: 'rgba(99, 102, 241, 0.1)',
                              border: '1px solid rgba(99, 102, 241, 0.2)',
                              color: '#a5b4fc',
                            }}
                          >
                            {kw}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
