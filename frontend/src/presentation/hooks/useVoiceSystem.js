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
      rec.lang = 'ar-SA'; // Standard Arabic for highest precision recognition

      rec.onstart = () => setIsListening(true);
      rec.onend = () => setIsListening(false);
      rec.onerror = () => setIsListening(false);
      rec.onresult = (e) => {
        const text = e.results[0][0].transcript;
        if (onTranscript) onTranscript(text);
      };
      recognitionRef.current = rec;
    }
  }, [onTranscript]);

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
    } catch {}
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
    window.speechSynthesis.cancel(); // stop current reading

    // 1. Clean markdown and COMPLETELY strip out code blocks and inline code
    let cleanText = text;
    cleanText = cleanText.replace(/```[\s\S]*?```/g, ''); // Remove block code
    cleanText = cleanText.replace(/`.*?`/g, '');          // Remove inline code
    cleanText = cleanText.replace(/[*#`_\-]/g, '');        // Remove markdown symbols
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
    const isArabic = document.body.dir === 'rtl';
    utterance.lang = isArabic ? 'ar-SA' : 'en-US';

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    const handleSpeechEnd = () => {
      setIsSpeaking(false);
      if (onEnd) onEnd();
    };

    utterance.onend = handleSpeechEnd;
    utterance.onerror = handleSpeechEnd;

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
