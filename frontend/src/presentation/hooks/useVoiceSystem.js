import { useState, useEffect, useRef } from 'react';

export function useVoiceSystem(onTranscript) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'ar-SA'; // Standard Arabic BCP-47 language tag for guaranteed browser compatibility

      rec.onstart = () => setIsListening(true);
      rec.onend = () => setIsListening(false);
      rec.onerror = (e) => {
        console.warn("Speech recognition error:", e);
        setIsListening(false);
      };
      rec.onresult = (e) => {
        let compiledTranscript = '';

        for (let i = e.resultIndex; i < e.results.length; ++i) {
          const alternative = e.results[i][0];
          if (alternative) {
            compiledTranscript += alternative.transcript + ' ';
          }
        }

        const finalTranscript = compiledTranscript.trim();

        // Discard only empty or single character junk triggers
        if (finalTranscript.length < 1) {
          return;
        }

        if (onTranscript) {
          onTranscript(finalTranscript);
        }
      };
      recognitionRef.current = rec;
    }
  }, [onTranscript]);

  const utteranceRef = useRef(null);
  const safetyTimeoutRef = useRef(null);

  const startListening = () => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.lang = document.body.dir === 'rtl' ? 'ar-SA' : 'en-US';
      recognitionRef.current.start();
    } catch (e) {
      console.log("Speech recognition start error (might already be running):", e);
    }
  };

  const stopListening = () => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
    } catch { /* recognition already stopped */ }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech Recognition not supported in this browser.");
      return;
    }
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const speak = (text, onEnd) => {
    if (!window.speechSynthesis) {
      if (onEnd) onEnd();
      return;
    }

    // Clear any previous safety timeouts
    if (safetyTimeoutRef.current) {
      clearTimeout(safetyTimeoutRef.current);
      safetyTimeoutRef.current = null;
    }

    window.speechSynthesis.cancel(); // stop current reading

    // 1. Clean markdown and COMPLETELY strip out code blocks and inline code
    let cleanText = text;
    cleanText = cleanText.replace(/```[\s\S]*?```/g, ''); // Remove block code
    cleanText = cleanText.replace(/`.*?`/g, '');          // Remove inline code
    cleanText = cleanText.replace(/[*#`_-]/g, '');        // Remove markdown symbols
    cleanText = cleanText.replace(/https?:\/\/\S+/g, '');  // Remove URLs
    cleanText = cleanText.trim();

    if (!cleanText) {
      if (onEnd) onEnd();
      return; // Nothing left to speak (e.g. only code was sent)
    }

    // Limit to the first 2-3 clean sentences to keep the assistant brief and futuristic
    const sentences = cleanText.split(/[.।!?।]+/);
    const briefText = sentences.slice(0, 2).join('. ') + '.';

    const utterance = new SpeechSynthesisUtterance(briefText);
    utteranceRef.current = utterance; // CRITICAL: Save reference to prevent Chrome Garbage Collection bug!

    const isArabic = document.body.dir === 'rtl';
    utterance.lang = isArabic ? 'ar-SA' : 'en-US';

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    const handleSpeechEnd = () => {
      if (safetyTimeoutRef.current) {
        clearTimeout(safetyTimeoutRef.current);
        safetyTimeoutRef.current = null;
      }
      setIsSpeaking(false);
      if (onEnd) onEnd();
    };

    utterance.onend = handleSpeechEnd;
    utterance.onerror = handleSpeechEnd;

    // Safety Timeout fallback (130ms per char + 2.5s padding) to prevent hanging
    const estimateMs = (briefText.length * 130) + 2500;
    safetyTimeoutRef.current = setTimeout(() => {
      console.warn("SpeechSynthesis onend safety fallback triggered to prevent hang.");
      handleSpeechEnd();
    }, estimateMs);

    // 2. Select a premium assistant voice if available
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      // Find premium sounding voices (e.g. Google, Microsoft Natural, Hoda, David)
      const premiumVoice = voices.find(v => {
        const name = v.name.toLowerCase();
        const lang = v.lang.toLowerCase();
        if (isArabic) {
          return lang.startsWith('ar') && (name.includes('google') || name.includes('hoda') || name.includes('natural') || name.includes('naayf') || name.includes('shakir'));
        } else {
          return lang.startsWith('en') && (name.includes('google') || name.includes('natural') || name.includes('zira') || name.includes('david'));
        }
      });
      if (premiumVoice) {
        utterance.voice = premiumVoice;
      } else {
        // Fallback to any voice matches lang
        const fallbackVoice = voices.find(v => v.lang.toLowerCase().startsWith(isArabic ? 'ar' : 'en'));
        if (fallbackVoice) utterance.voice = fallbackVoice;
      }
    }

    utterance.volume = 0.95; // slightly louder for clear audibility
    utterance.rate = isArabic ? 0.98 : 1.05; // natural rate for Arabic, slightly faster for English
    utterance.pitch = isArabic ? 1.0 : 0.95; // natural Arabic pitch, cybernetic English pitch

    window.speechSynthesis.speak(utterance);
  };

  return { isListening, isSpeaking, toggleListening, startListening, stopListening, speak };
}
