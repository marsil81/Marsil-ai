import { useState, useEffect, useRef } from 'react';

export function useVoiceSystem(onTranscript) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'ar-EG'; // default Arabic, supports switching

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

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech Recognition not supported in this browser.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      // Ensure context or language aligns with UI
      recognitionRef.current.lang = document.body.dir === 'rtl' ? 'ar-EG' : 'en-US';
      recognitionRef.current.start();
    }
  };

  const speak = (text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel(); // stop current reading

    // 1. Clean markdown and COMPLETELY strip out code blocks and inline code
    let cleanText = text;
    cleanText = cleanText.replace(/```[\s\S]*?```/g, ''); // Remove block code
    cleanText = cleanText.replace(/`.*?`/g, '');          // Remove inline code
    cleanText = cleanText.replace(/[*#`_\-]/g, '');        // Remove markdown symbols
    cleanText = cleanText.replace(/https?:\/\/\S+/g, '');  // Remove URLs
    cleanText = cleanText.trim();

    if (!cleanText) return; // Nothing left to speak (e.g. only code was sent)

    // Limit to the first 2-3 clean sentences to keep the assistant brief and futuristic
    const sentences = cleanText.split(/[.।!?।]+/);
    const briefText = sentences.slice(0, 2).join('. ') + '.';

    const utterance = new SpeechSynthesisUtterance(briefText);
    const isArabic = document.body.dir === 'rtl';
    utterance.lang = isArabic ? 'ar-SA' : 'en-US';

    // 2. Select a premium assistant voice if available
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      // Find premium sounding voices (e.g. Google, Microsoft Natural, Hoda, David)
      const premiumVoice = voices.find(v => {
        const name = v.name.toLowerCase();
        const lang = v.lang.toLowerCase();
        if (isArabic) {
          return lang.startsWith('ar') && (name.includes('google') || name.includes('hoda') || name.includes('natural'));
        } else {
          return lang.startsWith('en') && (name.includes('google') || name.includes('natural') || name.includes('zira') || name.includes('david'));
        }
      });
      if (premiumVoice) utterance.voice = premiumVoice;
    }

    utterance.volume = 0.85;
    utterance.rate = isArabic ? 1.0 : 1.08; // slightly faster sci-fi rate for English
    utterance.pitch = isArabic ? 1.0 : 0.95; // slightly deep cybernetic tone

    window.speechSynthesis.speak(utterance);
  };

  return { isListening, toggleListening, speak };
}
