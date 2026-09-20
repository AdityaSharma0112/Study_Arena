import { useState, useEffect, useRef, useCallback } from 'react';

export function useSpeechToText(onInterimResult) {
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState(null);

  const recognitionRef = useRef(null);
  const isExplicitlyStoppedRef = useRef(false);

  const isSupported = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  useEffect(() => {
    if (!isSupported) return;

    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionClass();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let finalStr = '';
      let interimStr = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalStr += text + ' ';
        } else {
          interimStr += text;
        }
      }

      if (finalStr) {
        setTranscript((prev) => (prev + ' ' + finalStr).trim());
      }
      setInterimTranscript(interimStr);

      if (onInterimResult) {
        onInterimResult(interimStr || finalStr, Boolean(finalStr));
      }
    };

    recognition.onerror = (event) => {
      console.warn('[SpeechToText] Recognition error:', event.error);
      if (event.error !== 'no-speech') {
        setError(event.error);
      }
    };

    recognition.onend = () => {
      // Auto-restart if we haven't explicitly stopped it
      if (!isExplicitlyStoppedRef.current && isListening) {
        try {
          recognition.start();
        } catch (e) {}
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        isExplicitlyStoppedRef.current = true;
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, [isSupported, onInterimResult, isListening]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    setTranscript('');
    setInterimTranscript('');
    setError(null);
    isExplicitlyStoppedRef.current = false;
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch (err) {
      console.warn('[SpeechToText] Start error:', err);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    isExplicitlyStoppedRef.current = true;
    setIsListening(false);
    try {
      recognitionRef.current.stop();
    } catch (err) {}
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
  }, []);

  return {
    transcript: (transcript + ' ' + interimTranscript).trim(),
    finalTranscript: transcript.trim(),
    interimTranscript,
    isListening,
    isSupported,
    error,
    startListening,
    stopListening,
    resetTranscript,
  };
}
