import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useTextToSpeech
 * Zero-latency, zero-bandwidth client-side Text-To-Speech using Web Speech API (window.speechSynthesis).
 * Gives the AI Moderator a clear voice to speak questions and announcements.
 */
export function useTextToSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const utteranceRef = useRef(null);

  // Load and pick high quality voice
  useEffect(() => {
    if (!isSupported) return;

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (!voices || voices.length === 0) return;

      // Prefer natural/enhanced English voices
      const preferred =
        voices.find((v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Premium'))) ||
        voices.find((v) => v.lang.startsWith('en') && (v.name.includes('Samantha') || v.name.includes('Daniel') || v.name.includes('Zira') || v.name.includes('David'))) ||
        voices.find((v) => v.lang.startsWith('en')) ||
        voices[0];

      setSelectedVoice(preferred);
    };

    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isSupported]);

  const stop = useCallback(() => {
    if (!isSupported) return;
    try {
      window.speechSynthesis.cancel();
    } catch (e) {
      console.warn('[TTS] Stop failed:', e);
    }
    setIsSpeaking(false);
  }, [isSupported]);

  const speak = useCallback((text, onComplete) => {
    if (!isSupported || !isVoiceEnabled || !text) return;

    try {
      window.speechSynthesis.cancel();

      const cleanText = text.replace(/[*_#`]/g, '').trim();
      const utterance = new SpeechSynthesisUtterance(cleanText);
      
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      utterance.onstart = () => {
        setIsSpeaking(true);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        if (onComplete) onComplete();
      };

      utterance.onerror = (err) => {
        console.warn('[TTS] Speech error:', err);
        setIsSpeaking(false);
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('[TTS] Speak error:', err);
      setIsSpeaking(false);
    }
  }, [isSupported, isVoiceEnabled, selectedVoice]);

  /**
   * Verbally announce question prompt for the active participant
   */
  const speakQuestion = useCallback((topic, questionText, speakerName) => {
    if (!isVoiceEnabled || !questionText) return;

    const intro = speakerName ? `${speakerName}, here is your question on ${topic || 'the topic'}.` : `Question on ${topic || 'the topic'}.`;
    const fullSpeech = `${intro} ${questionText}. You may begin your answer now.`;
    
    speak(fullSpeech);
  }, [isVoiceEnabled, speak]);

  /**
   * Verbally speak a short summary of the AI scorecard
   */
  const speakEvaluation = useCallback((evaluation) => {
    if (!isVoiceEnabled || !evaluation) return;

    const name = evaluation.speakerName || 'Candidate';
    const score = evaluation.totalScore || 80;
    const summary = evaluation.summary || 'Good round.';
    
    const speech = `Scorecard for ${name}: Overall score ${score} out of 100. ${summary}`;
    speak(speech);
  }, [isVoiceEnabled, speak]);

  const toggleVoice = useCallback(() => {
    setIsVoiceEnabled((prev) => {
      const next = !prev;
      if (!next) {
        stop();
      }
      return next;
    });
  }, [stop]);

  return {
    isSupported,
    isSpeaking,
    isVoiceEnabled,
    speak,
    stop,
    speakQuestion,
    speakEvaluation,
    toggleVoice,
  };
}
