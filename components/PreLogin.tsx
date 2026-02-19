
import React from 'react';
import { getSharedAudioContext } from './AudioUtils';

interface Props { onStart: () => void; }

const PreLogin: React.FC<Props> = ({ onStart }) => {
  const cardColors = ['border-pink-400', 'border-yellow-400', 'border-green-400'];
  const textColors = ['text-pink-500', 'text-yellow-500', 'text-green-500'];

  const handleStart = () => {
    // Activamos el contexto de audio en la primera interacción real
    const ctx = getSharedAudioContext();
    if (ctx.state === 'suspended') ctx.resume();
    onStart();
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center py-8 px-6 overflow-hidden">
      
      {/* TÍTULO */}
      <div className="text-center z-10 mb-12">
        <h1 className="text-[70px] sm:text-[100px] md:text-[120px] leading-none magic-title whitespace-nowrap">
          MAGICTRIS
        </h1>
        <div className="mt-4">
            <span className="text-xl sm:text-2xl text-blue-900 font-magic px-8 py-2 bg-blue-100/60 backdrop-blur-md rounded-full inline-block shadow-sm">
                ¡La magia de aprender!
            </span>
        </div>
      </div>

      {/* CARTAS CENTRADAS */}
      <div className="flex gap-4 sm:gap-8 items-center justify-center mb-16 z-10">
        {[
            {icon: '🧠', label: 'A'},
            {icon: '🟡', label: 'E'},
            {icon: '☘️', label: 'I'}
        ].map((item, idx) => (
            <div 
                key={idx} 
                className={`card-magic w-28 h-44 sm:w-52 sm:h-72 flex flex-col items-center justify-between bg-white border-[8px] sm:border-[12px] ${cardColors[idx]} transform hover:scale-110 transition-transform shadow-2xl relative overflow-hidden py-4`}
                style={{ animation: `float-gumi ${3 + idx * 0.4}s ease-in-out infinite` }}
            >
                <div className="flex-1 flex items-center justify-center">
                    <span className="text-4xl sm:text-6xl leading-none drop-shadow-lg">{item.icon}</span>
                </div>
                <span className={`text-5xl sm:text-[90px] font-magic ${textColors[idx]} leading-none`}>{item.label}</span>
            </div>
        ))}
      </div>

      {/* BOTÓN COMENZAR */}
      <div className="flex flex-col items-center w-full max-w-sm z-20">
        <button 
          onClick={handleStart}
          className="btn-magic-pop bg-orange-500 hover:bg-orange-600 text-white text-3xl sm:text-4xl px-16 py-6 rounded-full font-magic uppercase tracking-widest border-4 border-white shadow-[0_12px_0_#c2410c] active:shadow-none active:translate-y-2 flex items-center justify-center"
        >
          COMENZAR
        </button>
      </div>
    </div>
  );
};

export default PreLogin;
