
import React, { useState } from 'react';
import { User } from '../types';
import { supabase, isSupabaseReady } from '../services/supabaseClient';

interface Props {
  mode: 'login' | 'register';
  onAuthSuccess: (u: User) => void;
  toggleMode: () => void;
}

const Auth: React.FC<Props> = ({ mode, onAuthSuccess, toggleMode }) => {
  const [formData, setFormData] = useState({ name: '', email: '', pass: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGuestEntry = () => {
    onAuthSuccess({
      id: 'guest',
      username: 'Invitado',
      email: '',
      nickname: 'Amigo Mágico',
      avatar: '🦄',
      score: 0,
      streak: 1,
      lastLogin: new Date().toISOString(),
      progressIndex: 0
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseReady()) {
        setError("El servidor de la nube no está configurado. ¡Usa el Modo Invitado para jugar!");
        return;
    }
    
    setError('');
    setLoading(true);

    try {
      if (mode === 'register') {
        if (formData.pass !== formData.confirm) throw new Error('Las contraseñas no coinciden.');
        const { data: authData, error: authError } = await supabase!.auth.signUp({
          email: formData.email,
          password: formData.pass,
        });
        if (authError) throw authError;

        if (authData.user) {
          const profile = {
            id: authData.user.id,
            username: formData.name || formData.email.split('@')[0],
            email: formData.email,
            nickname: formData.name || 'Gumi Amigo',
            avatar: '🌈',
            score: 0,
            streak: 1,
            progress_index: 0,
            last_login: new Date().toISOString()
          };
          await supabase!.from('profiles').upsert(profile);
          onAuthSuccess(profile as any);
        }
      } else {
        const { data: authData, error: authError } = await supabase!.auth.signInWithPassword({
          email: formData.email,
          password: formData.pass,
        });
        if (authError) throw authError;
        if (authData.user) {
          const { data: profile } = await supabase!.from('profiles').select('*').eq('id', authData.user.id).single();
          onAuthSuccess(profile as any);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error al conectar con la magia.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full p-4 rounded-3xl border-2 border-indigo-300 text-black font-bold focus:ring-4 focus:ring-indigo-200 outline-none placeholder-indigo-300 bg-indigo-50 transition-all shadow-sm";

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="bg-white/70 backdrop-blur-xl p-8 rounded-[3rem] shadow-2xl w-full max-w-md border-[6px] border-white flex flex-col items-center">
        <h2 className="text-3xl font-magic text-indigo-700 mb-6 uppercase">
          {mode === 'login' ? '¡Hola de nuevo!' : '¡Hola nuevo amigo!'}
        </h2>
        
        <form onSubmit={handleSubmit} className="w-full space-y-4">
          {mode === 'register' && (
            <input className={inputClass} placeholder="¿Cómo te llamas?" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          )}
          <input className={inputClass} placeholder="Correo electrónico" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
          <input className={inputClass} placeholder="Tu contraseña" type="password" value={formData.pass} onChange={e => setFormData({...formData, pass: e.target.value})} />
          {mode === 'register' && (
            <input className={inputClass} placeholder="Repite tu contraseña" type="password" value={formData.confirm} onChange={e => setFormData({...formData, confirm: e.target.value})} />
          )}
          
          {error && <p className="text-red-500 text-xs font-bold text-center bg-red-50 p-2 rounded-xl">{error}</p>}
          
          <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white py-4 rounded-3xl font-magic text-xl shadow-lg active:scale-95 disabled:grayscale">
            {loading ? 'CARGANDO...' : 'ENTRAR'}
          </button>
        </form>

        <div className="mt-6 flex flex-col gap-3 w-full">
            <button onClick={toggleMode} className="text-indigo-500 text-sm font-bold hover:underline">
                {mode === 'login' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Entra aquí'}
            </button>
            <div className="h-px bg-gray-200 w-full my-2"></div>
            <button 
                onClick={handleGuestEntry}
                className="w-full bg-pink-500 text-white py-4 rounded-3xl font-magic text-xl shadow-lg hover:bg-pink-600 transition-all active:scale-95"
            >
                MODO INVITADO
            </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
