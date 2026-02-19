
import React, { useState, useEffect } from 'react';
import { User, Section } from './types';
import PreLogin from './components/PreLogin';
import Auth from './components/Auth';
import Hub from './components/Hub';
import GameBoard from './components/GameBoard';
import Profile from './components/Profile';
import Info from './components/Info';
import PrintableCards from './components/PrintableCards';
import { MAGIC_PATH } from './services/mockData';
import { supabase, isSupabaseReady } from './services/supabaseClient';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [section, setSection] = useState<Section>('pre-login');
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
  const [initializing, setInitializing] = useState(true);

  // Calcula diferencia de días naturales
  const getDaysDiff = (date1: Date, date2: Date) => {
    const d1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate());
    const d2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate());
    return Math.floor((d2.getTime() - d1.getTime()) / 86400000);
  };

  const mapProfileToUser = (profile: any): User => {
    const lastDate = new Date(profile.last_login || profile.lastLogin || new Date());
    const today = new Date();
    const diff = getDaysDiff(lastDate, today);

    // Si pasó más de un día, la racha vuelve a 0
    let currentStreak = profile.streak || 0;
    if (diff > 1) currentStreak = 0;

    return {
      id: profile.id,
      username: profile.username || 'Gumi',
      email: profile.email || '',
      nickname: profile.nickname || profile.username || 'Invitado',
      avatar: profile.avatar || '🌈',
      score: profile.score || 0,
      streak: currentStreak,
      progressIndex: profile.progress_index || profile.progressIndex || 0,
      lastLogin: profile.last_login || profile.lastLogin || new Date().toISOString()
    };
  };

  useEffect(() => {
    const initApp = async () => {
      try {
        // 1. Intentar cargar desde localStorage primero (Cache/Modo Invitado)
        const localData = localStorage.getItem('magic_user');
        if (localData) {
          const parsed = JSON.parse(localData);
          setUser(mapProfileToUser(parsed));
          setSection('hub');
        }

        // 2. Si Supabase está listo, intentar sincronizar sesión real
        if (isSupabaseReady()) {
          const { data: { session } } = await supabase!.auth.getSession();
          if (session?.user) {
            const { data: profile } = await supabase!
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();
            if (profile) {
              const updatedUser = mapProfileToUser(profile);
              setUser(updatedUser);
              localStorage.setItem('magic_user', JSON.stringify(updatedUser));
            }
          }
        }
      } catch (err) {
        console.warn("Error en sincronización, continuando en modo local:", err);
      } finally {
        setInitializing(false);
      }
    };

    initApp();
  }, []);

  const handleGameComplete = async (scoreGain: number) => {
    if (!user || selectedCardIndex === null) return;

    const today = new Date();
    const lastDate = new Date(user.lastLogin);
    const diff = getDaysDiff(lastDate, today);

    let newStreak = user.streak;
    if (diff === 1) {
      newStreak += 1; // ¡Racha continúa!
    } else if (diff > 1 || user.streak === 0) {
      newStreak = 1; // ¡Nueva racha hoy!
    }

    const updatedUser: User = {
      ...user,
      score: user.score + scoreGain,
      progressIndex: Math.max(user.progressIndex, selectedCardIndex + 1),
      streak: newStreak,
      lastLogin: today.toISOString()
    };

    setUser(updatedUser);
    localStorage.setItem('magic_user', JSON.stringify(updatedUser));

    // Guardar en la nube si es posible (silenciosamente)
    if (isSupabaseReady() && user.id !== 'guest') {
      try {
        await supabase!.from('profiles').update({
          score: updatedUser.score,
          progress_index: updatedUser.progressIndex,
          streak: updatedUser.streak,
          last_login: updatedUser.lastLogin
        }).eq('id', user.id);
      } catch (e) {
        console.error("Error al sincronizar progreso:", e);
      }
    }

    setSelectedCardIndex(null);
    setSection('hub');
  };

  if (initializing) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-cyan-50">
       <div className="text-8xl animate-bounce mb-4">✨</div>
       <p className="font-magic text-cyan-600 animate-pulse text-xl">Iniciando Magia...</p>
    </div>
  );

  const renderSection = () => {
    if (selectedCardIndex !== null && user) {
        return <GameBoard user={user} card={MAGIC_PATH[selectedCardIndex]} onComplete={handleGameComplete} onBack={() => setSelectedCardIndex(null)} />;
    }
    switch (section) {
      case 'pre-login': return <PreLogin onStart={() => setSection('login')} />;
      case 'login': return <Auth mode="login" onAuthSuccess={(u) => { setUser(u); localStorage.setItem('magic_user', JSON.stringify(u)); setSection('hub'); }} toggleMode={() => setSection('register')} />;
      case 'register': return <Auth mode="register" onAuthSuccess={(u) => { setUser(u); localStorage.setItem('magic_user', JSON.stringify(u)); setSection('hub'); }} toggleMode={() => setSection('login')} />;
      case 'hub': return user ? <Hub user={user} setSection={setSection} onSelectCard={setSelectedCardIndex} /> : null;
      case 'profile': return user ? <Profile user={user} onBack={() => setSection('hub')} onLogout={() => { if(isSupabaseReady()) supabase!.auth.signOut(); setUser(null); localStorage.removeItem('magic_user'); setSection('pre-login'); }} onUpdate={(upd) => setUser({...user, ...upd})} /> : null;
      case 'info': return <Info onBack={() => setSection('hub')} />;
      case 'printable': return <PrintableCards onBack={() => setSection('hub')} />;
      default: return <PreLogin onStart={() => setSection('login')} />;
    }
  };

  return <div className="min-h-screen">{renderSection()}</div>;
};

export default App;
