
import React, { useState, useRef, useEffect } from 'react';
import { textToSpeech } from '../services/gemini';
import { decode, decodeAudioData, getSharedAudioContext } from './AudioUtils';

interface Props {
  text: string;
  className?: string;
}

const VoiceButton: React.FC<Props> = ({ text, className }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (sourceRef.current) {
        sourceRef.current.stop();
        sourceRef.current = null;
      }
    };
  }, []);

  const handlePlay = async () => {
    if (isPlaying) {
      if (sourceRef.current) {
        sourceRef.current.stop();
        sourceRef.current = null;
      }
      setIsPlaying(false);
      return;
    }

    const audioCtx = getSharedAudioContext();
    if (audioCtx.state === 'suspended') {
      await audioCtx.resume();
    }

    setIsPlaying(true);
    try {
      const audioData = await textToSpeech(text);
      
      // Si el componente se desmontó mientras cargaba la API, no reproducir
      if (!isMounted.current) return;

      if (audioData) {
        const buffer = await decodeAudioData(decode(audioData), audioCtx, 24000, 1);
        
        if (!isMounted.current) return;

        const source = audioCtx.createBufferSource();
        source.buffer = buffer;
        source.connect(audioCtx.destination);
        sourceRef.current = source;
        
        source.onended = () => {
          if (isMounted.current) setIsPlaying(false);
          sourceRef.current = null;
        };
        
        source.start();
      } else {
        setIsPlaying(false);
      }
    } catch (err) {
      console.error("Error de voz:", err);
      if (isMounted.current) setIsPlaying(false);
    }
  };

  return (
    <button 
      onClick={handlePlay} 
      className={`p-2 rounded-full bg-blue-400 text-white shadow hover:scale-110 transition-transform flex items-center justify-center min-w-[3rem] ${className}`}
    >
      {isPlaying ? (
        <span className="flex gap-1 items-center px-2">
            <span className="w-1.5 h-4 bg-white animate-pulse rounded-full"></span>
            <span className="w-1.5 h-6 bg-white animate-pulse rounded-full delay-75"></span>
            <span className="w-1.5 h-4 bg-white animate-pulse rounded-full delay-150"></span>
        </span>
      ) : (
        <span className="text-2xl">📢</span>
      )}
    </button>
  );
};

export default VoiceButton;
