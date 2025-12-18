
import React, { useState, useEffect, useRef } from 'react';
import { Routine, RoutineType, Goal, AppSettings, TimeBlock, DailyEvaluation } from './types';
import { ROUTINES } from './constants';
import RoutineManager from './components/RoutineManager';
import FocusTimer from './components/FocusTimer';
import ChatInterface from './components/ChatInterface';
import LiveAssistant from './components/LiveAssistant';
import Dashboard from './components/Dashboard';
import GoalPlanner from './components/GoalPlanner';
import AgileCoach from './components/AgileCoach';
import Settings from './components/Settings';
import WorkoutTrainer from './components/WorkoutTrainer';
import MeditationCenter from './components/MeditationCenter';
import EvaluationSystem from './components/EvaluationSystem'; 
import SplashScreen from './components/SplashScreen'; 
import SimpleOnboarding from './components/SimpleOnboarding';
import { LayoutDashboard, Calendar, Zap, MessageSquare, Mic, Menu, X, AlertTriangle, Target, RefreshCw, Lock, Volume2, VolumeX, Moon, Sun, Settings as SettingsIcon, LogOut, Dumbbell, Wind, Download, Sparkles, Share2, Import, Clock, FastForward, SkipForward, TrendingUp, Layers, ChevronRight, Share, PlusSquare } from 'lucide-react';

const DEFAULT_ALARM_URL = 'https://actions.google.com/sounds/v1/alarms/beep_short.ogg';
const APP_BG = "https://images.unsplash.com/photo-1534796636912-3b95b3ab5980?q=80&w=2072&auto=format&fit=crop";

const App: React.FC = () => {
  // --- AUTHENTICATION & VIEW STATE ---
  const [auth, setAuth] = useState<{ isAuthenticated: boolean; userName: string }>({
      isAuthenticated: false,
      userName: ''
  });
  
  // View Control: 'splash' -> 'onboarding' (optional) -> 'app'
  const [currentView, setCurrentView] = useState<'splash' | 'onboarding' | 'app'>('splash');

  useEffect(() => {
      // Check for existing user
      const saved = localStorage.getItem('equilibrio_user');
      if (saved) {
          try {
              const parsed = JSON.parse(saved);
              setAuth({ isAuthenticated: true, userName: parsed.name });
              
              // Check if they fully completed onboarding
              const hasOnboarded = localStorage.getItem('equilibrio_has_onboarded');
              if (hasOnboarded) {
                  setCurrentView('app');
              } else {
                  // If they have a user but didn't finish onboarding (edge case), send to onboarding
                  setCurrentView('onboarding');
              }
          } catch(e) {
              setCurrentView('splash');
          }
      } else {
          setCurrentView('splash');
      }
  }, []);

  const [activeTab, setActiveTab] = useState<'dashboard' | 'routine' | 'focus' | 'chat' | 'live' | 'goals' | 'agile' | 'settings' | 'workout' | 'meditation' | 'evaluation'>('dashboard');
  const [currentRoutineId, setCurrentRoutineId] = useState<string>(RoutineType.MORNING_PRODUCTIVE);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // PWA Install State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  
  // Shared Routine Import State
  const [pendingImportRoutine, setPendingImportRoutine] = useState<Routine | null>(null);

  // Custom Data States - Loaded from LocalStorage
  const [customRoutines, setCustomRoutines] = useState<Record<string, Routine>>(() => {
    let initial = { ...ROUTINES };
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('equilibrio_routines');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                initial = { ...initial, ...parsed };
                // Ensure defaults exist
                if (!parsed[RoutineType.PDF_IMPORTED]) initial[RoutineType.PDF_IMPORTED] = ROUTINES[RoutineType.PDF_IMPORTED];
                if (!parsed[RoutineType.EL_CAMBIO]) initial[RoutineType.EL_CAMBIO] = ROUTINES[RoutineType.EL_CAMBIO];
            } catch (e) {
                console.error("Failed to parse saved routines", e);
            }
        }
    }
    return initial;
  });

  const [goals, setGoals] = useState<Goal[]>(() => {
     // Default goals if nothing saved
     const defaultGoals: Goal[] = [];
     if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('equilibrio_goals');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch(e) {}
        }
     }
     return defaultGoals;
  });
  
  const [appSettings, setAppSettings] = useState<AppSettings>(() => {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('equilibrio_settings');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error("Failed to parse saved settings", e);
            }
        }
    }
    return {
      vitaminDTime: '10:00',
      vitaminDEnabled: true,
      theme: 'dark',
      accentColor: 'teal',
      appVolume: 0.5,
      lastInteractionTimestamp: Date.now()
    };
  });

  const [dailyEvaluations, setDailyEvaluations] = useState<DailyEvaluation[]>(() => {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('equilibrio_evaluations');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {}
        }
    }
    return [];
  });
  
  const [toast, setToast] = useState<{message: string, type: 'info' | 'warning' | 'success'} | null>(null);
  const [notifiedBlocks, setNotifiedBlocks] = useState<Set<string>>(new Set());
  const [isMuted, setIsMuted] = useState(false);
  const alarmAudioRef = useRef<HTMLAudioElement | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [currentSacredActivity, setCurrentSacredActivity] = useState('');
  
  // Theme Color Logic
  const accentColor = appSettings.accentColor || 'teal';
  const getAccentClass = (type: 'text' | 'bg' | 'border' | 'ring' | 'from' | 'to') => {
      const colors: any = {
          teal: { text: 'text-teal-400', bg: 'bg-teal-500', border: 'border-teal-500', ring: 'ring-teal-500', from: 'from-teal-500', to: 'to-teal-600' },
          indigo: { text: 'text-indigo-400', bg: 'bg-indigo-500', border: 'border-indigo-500', ring: 'ring-indigo-500', from: 'from-indigo-500', to: 'to-indigo-600' },
          rose: { text: 'text-rose-400', bg: 'bg-rose-500', border: 'border-rose-500', ring: 'ring-rose-500', from: 'from-rose-500', to: 'to-rose-600' },
          amber: { text: 'text-amber-400', bg: 'bg-amber-500', border: 'border-amber-500', ring: 'ring-amber-500', from: 'from-amber-500', to: 'to-amber-600' },
      };
      return colors[accentColor][type];
  };

  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
    const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIosDevice);

    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    setIsStandalone(isStandaloneMode);
    
    // Only show install guide if we are ON MOBILE, NOT INSTALLED, and USER IS AUTHENTICATED
    // (We don't want to bug them during onboarding)
    if (auth.isAuthenticated && !isStandaloneMode && /Mobi|Android/i.test(navigator.userAgent)) {
         setTimeout(() => setShowInstallGuide(true), 5000);
    }

    const params = new URLSearchParams(window.location.search);
    const shareData = params.get('share');
    if (shareData) {
       try {
           const decoded = JSON.parse(decodeURIComponent(atob(shareData)));
           if (decoded && decoded.blocks && Array.isArray(decoded.blocks)) {
               decoded.id = `shared-${Date.now()}`;
               decoded.name = `${decoded.name} (Compartida)`;
               setPendingImportRoutine(decoded);
               window.history.replaceState({}, '', window.location.pathname);
           }
       } catch(e) {
           console.error("Error decoding shared routine", e);
           setToast({ message: "Error al importar la rutina compartida.", type: 'warning' });
       }
    }
  }, [auth.isAuthenticated]); 

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      console.log("Install prompt captured");
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // --- HANDLERS ---

  const handleSplashAuth = (name: string, isNewUser: boolean) => {
      // Temporarily store name in state
      setAuth({ isAuthenticated: false, userName: name }); 
      
      if (isNewUser) {
          // If new, go to Onboarding Form to get details
          setCurrentView('onboarding');
      } else {
          // If returning, go straight to App
          setAuth({ isAuthenticated: true, userName: name });
          setCurrentView('app');
      }
  };

  const handleOnboardingComplete = (data: { name: string, mainGoal: string, routinePreference: string, avatar?: string }) => {
      // 1. Save User
      const userSettings = { name: data.name, password: 'demo' };
      localStorage.setItem('equilibrio_user', JSON.stringify(userSettings)); 
      localStorage.setItem('equilibrio_has_onboarded', 'true');
      
      // 2. Save Avatar
      setAppSettings(prev => ({ ...prev, userAvatar: data.avatar }));
      
      // 3. Save Goal
      const newGoal: Goal = {
          id: Date.now().toString(),
          text: data.mainGoal,
          period: 'diario',
          completed: false
      };
      const updatedGoals = [newGoal, ...goals];
      setGoals(updatedGoals);
      localStorage.setItem('equilibrio_goals', JSON.stringify(updatedGoals));

      // 4. Set Routine
      setCurrentRoutineId(data.routinePreference);
      
      // 5. Authenticate and enter App
      setAuth({ isAuthenticated: true, userName: data.name });
      setCurrentView('app');
  };

  const handleInstallClick = async () => {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setDeferredPrompt(null);
            setShowInstallGuide(false);
        }
    } else {
        if (isIOS) {
            setToast({ 
                message: "En iPhone: Toca el botón 'Compartir' y luego 'Agregar a Inicio'.", 
                type: 'info' 
            });
            setShowInstallGuide(true); 
        } else {
            setToast({ 
                message: "Abre el menú de tu navegador y busca 'Instalar aplicación'.", 
                type: 'info' 
            });
        }
    }
  };

  const handleShare = async () => {
    const routineToShare = customRoutines[currentRoutineId];
    if (!routineToShare) return;

    try {
        const json = JSON.stringify(routineToShare);
        const encoded = btoa(encodeURIComponent(json));
        const url = `${window.location.origin}?share=${encoded}`;

        const shareData = {
            title: `Equilibrio: ${routineToShare.name}`,
            text: `Te comparto mi rutina "${routineToShare.name}" para que la importes a tu universo.`,
            url: url
        };

        if (navigator.share) {
            await navigator.share(shareData);
            setToast({ message: "¡Enlace de rutina compartido!", type: 'success' });
        } else {
            navigator.clipboard.writeText(url);
            setToast({ message: "Enlace copiado. ¡Envíalo a quien quieras!", type: 'success' });
        }
    } catch (err) {
        console.error("Error sharing", err);
        setToast({ message: "No se pudo compartir.", type: 'warning' });
    }
  };

  const confirmImport = () => {
      if (pendingImportRoutine) {
          setCustomRoutines(prev => ({
              ...prev,
              [pendingImportRoutine.id]: pendingImportRoutine
          }));
          setCurrentRoutineId(pendingImportRoutine.id);
          setActiveTab('routine');
          setToast({ message: "Rutina importada con éxito.", type: 'success' });
          setPendingImportRoutine(null);
      }
  };

  const shiftSchedule = (minutes: number) => {
      const routine = customRoutines[currentRoutineId];
      if (!routine) return;

      const newBlocks = routine.blocks.map(block => {
          const [h, m] = block.time.split(':').map(Number);
          const date = new Date();
          date.setHours(h);
          date.setMinutes(m + minutes);
          const newH = date.getHours().toString().padStart(2, '0');
          const newM = date.getMinutes().toString().padStart(2, '0');
          return { ...block, time: `${newH}:${newM}` };
      });
      newBlocks.sort((a, b) => a.time.localeCompare(b.time));

      updateRoutine({ ...routine, blocks: newBlocks });
      setToast({ 
          message: minutes > 0 ? `Agenda retrasada ${minutes} min. ¡Respira!` : `Agenda adelantada ${Math.abs(minutes)} min.`, 
          type: 'success' 
      });
  };

  const handleLateUnlock = () => {
      shiftSchedule(15);
      setIsLocked(false);
      setToast({ message: "Horario ajustado. La vida pasa, seguimos adelante.", type: 'info' });
  };

  const handleSkipBlock = () => {
      setIsLocked(false);
      setToast({ message: "Bloque saltado. Enfócate en lo siguiente.", type: 'info' });
  };

  // Helper to update interaction timestamp when user uses chat/voice
  const recordInteraction = () => {
      setAppSettings(prev => ({
          ...prev,
          lastInteractionTimestamp: Date.now()
      }));
  };

  const handleSaveEvaluation = (evaluation: DailyEvaluation) => {
      setDailyEvaluations(prev => [evaluation, ...prev.filter(e => e.date !== evaluation.date)]);
      setToast({ message: "Evaluación guardada. ¡Buen trabajo hoy!", type: 'success' });
  };

  useEffect(() => {
    const audioSrc = appSettings.customAlarmUrl || DEFAULT_ALARM_URL;
    if (!alarmAudioRef.current) {
        alarmAudioRef.current = new Audio(audioSrc);
    }
    // Update volume and source
    if (alarmAudioRef.current) {
        alarmAudioRef.current.volume = appSettings.appVolume ?? 0.5;
        if (alarmAudioRef.current.src !== audioSrc) {
            alarmAudioRef.current.src = audioSrc;
            alarmAudioRef.current.load();
        }
    }
  }, [appSettings.customAlarmUrl, appSettings.appVolume]);

  useEffect(() => {
      localStorage.setItem('equilibrio_routines', JSON.stringify(customRoutines));
  }, [customRoutines]);

  useEffect(() => {
      localStorage.setItem('equilibrio_goals', JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
      localStorage.setItem('equilibrio_settings', JSON.stringify(appSettings));
  }, [appSettings]);

  useEffect(() => {
      localStorage.setItem('equilibrio_evaluations', JSON.stringify(dailyEvaluations));
  }, [dailyEvaluations]);

  useEffect(() => {
      document.documentElement.classList.add('dark');
  }, []);

  useEffect(() => {
    const checkTime = () => {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const dayKey = now.toDateString(); 

      const routine = customRoutines[currentRoutineId];
      if (!routine) return;
      
      routine.blocks.forEach((block, index) => {
         const [h, m] = block.time.split(':').map(Number);
         const blockStartMinutes = h * 60 + m;
         const diff = blockStartMinutes - currentMinutes;
         const nextBlock = routine.blocks[index + 1];
         let nextBlockStart = nextBlock ? parseInt(nextBlock.time.split(':')[0]) * 60 + parseInt(nextBlock.time.split(':')[1]) : blockStartMinutes + 60;
         
         if (currentMinutes >= blockStartMinutes && currentMinutes < nextBlockStart) {
             if (block.type === 'sacred' && block.enforceLock) {
                 setCurrentSacredActivity(block.activity);
                 if (!isLocked) {
                     const lockKey = `${dayKey}-${block.id}-LOCK`;
                     if (!notifiedBlocks.has(lockKey)) {
                        setIsLocked(true);
                        setNotifiedBlocks(prev => new Set(prev).add(lockKey));
                        if (!isMuted) alarmAudioRef.current?.play().catch(() => {});
                     }
                 }
             }
         }

         const alarmKey = `${dayKey}-${block.time}-ALARM`;
         if (blockStartMinutes === currentMinutes && (block.alarmEnabled !== false) && !notifiedBlocks.has(alarmKey)) {
             if (!isMuted) alarmAudioRef.current?.play().catch(() => {});
             setToast({ message: `Alarma: ${block.activity}`, type: 'info' });
             setNotifiedBlocks(prev => new Set(prev).add(alarmKey));
         }

         if (block.type === 'sacred') {
           const prevBlock = index > 0 ? routine.blocks[index-1] : null;
           const isTransitionFromWork = prevBlock?.type === 'work';

           if (diff === 15 && isTransitionFromWork) {
             const notificationKey = `${dayKey}-${block.time}-${routine.id}`;
             if (!notifiedBlocks.has(notificationKey)) {
               const message = `Aviso: Cierre de Sesión IA en 15 minutos. Tu bloque "${block.activity}" comienza pronto. Guarda tu trabajo.`;
               if (Notification.permission === 'granted') new Notification('Equilibrio IA', { body: message });
               setToast({ message, type: 'warning' });
               setNotifiedBlocks(prev => new Set(prev).add(notificationKey));
               if (!isMuted) alarmAudioRef.current?.play().catch(() => {});
             }
           }
        }
      });
      
      if (appSettings.vitaminDEnabled) {
          const [vH, vM] = appSettings.vitaminDTime.split(':').map(Number);
          const vMinutes = vH * 60 + vM;
          if (currentMinutes === vMinutes) {
              const vKey = `${dayKey}-VITAMIND`;
              if (!notifiedBlocks.has(vKey)) {
                   const message = "☀️ Hora de la Vitamina D: Sal a la calle por 15 minutos.";
                   if (Notification.permission === 'granted') new Notification('Equilibrio IA', { body: message });
                   setToast({ message, type: 'success' });
                   setNotifiedBlocks(prev => new Set(prev).add(vKey));
                   if (!isMuted) alarmAudioRef.current?.play().catch(() => {});
              }
          }
      }
    };

    const intervalId = setInterval(checkTime, 10000);
    checkTime();

    return () => clearInterval(intervalId);
  }, [currentRoutineId, customRoutines, notifiedBlocks, isLocked, isMuted, appSettings]);

  const addGoal = (goal: Goal) => setGoals([...goals, goal]);
  const toggleGoal = (id: string) => setGoals(goals.map(g => g.id === id ? { ...g, completed: !g.completed } : g));
  const deleteGoal = (id: string) => setGoals(goals.filter(g => g.id !== id));

  const updateRoutine = (updatedRoutine: Routine) => {
      setCustomRoutines({ ...customRoutines, [updatedRoutine.id]: updatedRoutine });
  };

  const deleteRoutine = (routineId: string) => {
    const newRoutines = { ...customRoutines };
    delete newRoutines[routineId];
    setCustomRoutines(newRoutines);
    
    if (currentRoutineId === routineId) {
        const remainingKeys = Object.keys(newRoutines);
        if (remainingKeys.length > 0) {
            setCurrentRoutineId(remainingKeys[0]);
        } else {
            setCustomRoutines(ROUTINES);
            setCurrentRoutineId(RoutineType.MORNING_PRODUCTIVE);
        }
    }
  };

  const toggleMute = () => setIsMuted(!isMuted);

  const NavButton = ({ tab, icon: Icon, label, description }: { tab: typeof activeTab, icon: any, label: string, description?: string }) => {
    const isActive = activeTab === tab;
    return (
        <button
        onClick={() => { setActiveTab(tab); setMobileMenuOpen(false); }}
        className={`group w-full text-left relative overflow-hidden transition-all duration-300 rounded-xl mb-2
            ${isActive 
                ? `${getAccentClass('bg')} text-white shadow-lg transform scale-[1.02]` 
                : 'bg-transparent text-slate-400 hover:bg-white/5 hover:text-white'
            }
        `}
        >
            <div className="relative z-10 flex items-center gap-3 px-4 py-3">
                <div className={`p-2 rounded-lg transition-colors ${isActive ? 'bg-white/20' : 'bg-slate-800'}`}>
                    <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                </div>
                <div>
                    <span className={`block text-sm font-bold ${isActive ? 'text-white' : ''}`}>{label}</span>
                    {description && isActive && (
                        <span className="block text-[10px] opacity-80 font-medium leading-tight">{description}</span>
                    )}
                </div>
                {isActive && <ChevronRight className="w-4 h-4 ml-auto opacity-70" />}
            </div>
            
            {/* Glow effect for active state */}
            {isActive && (
                <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-white/20 to-transparent pointer-events-none"></div>
            )}
        </button>
    );
  };

  // --- RENDER FLOW ---
  
  // 1. Splash Screen (Authentication)
  if (currentView === 'splash') {
      return <SplashScreen onAuthenticated={handleSplashAuth} />;
  }

  // 2. Onboarding (Setup for New Users)
  if (currentView === 'onboarding') {
      return <SimpleOnboarding initialName={auth.userName} onComplete={handleOnboardingComplete} />;
  }

  // 3. Main App (Dashboard)
  return (
    <div 
        className="h-[100dvh] text-slate-100 flex flex-col md:flex-row relative overflow-hidden bg-cover bg-fixed bg-center"
        style={{ backgroundImage: `url(${APP_BG})` }}
    >
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] z-0"></div>

      {/* INSTALL GUIDE MODAL */}
      {showInstallGuide && (
          <div className="fixed inset-0 z-[200] bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-end md:justify-center p-4 animate-in slide-in-from-bottom-10">
              <div className="bg-slate-900 border border-teal-500/50 rounded-2xl shadow-2xl p-6 max-w-sm w-full relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500 to-indigo-500"></div>
                  <button onClick={() => setShowInstallGuide(false)} className="absolute top-3 right-3 text-slate-500 hover:text-white"><X className="w-5 h-5"/></button>
                  
                  <div className="flex flex-col items-center text-center mb-6">
                      <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mb-4 shadow-lg border border-white/10">
                          <Download className="w-8 h-8 text-teal-400 animate-bounce" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">Instala la App</h3>
                      <p className="text-sm text-slate-400">
                          Para eliminar las barras del navegador y tener más espacio, agrega Equilibrio a tu pantalla de inicio.
                      </p>
                  </div>

                  {isIOS ? (
                      <div className="space-y-4 text-sm text-slate-300">
                          <div className="flex items-center gap-3 bg-white/5 p-3 rounded-lg">
                              <Share className="w-5 h-5 text-blue-400" />
                              <span>1. Toca el botón <b>Compartir</b> en la barra de abajo.</span>
                          </div>
                          <div className="flex items-center gap-3 bg-white/5 p-3 rounded-lg">
                              <PlusSquare className="w-5 h-5 text-white" />
                              <span>2. Selecciona <b>"Agregar a Inicio"</b>.</span>
                          </div>
                      </div>
                  ) : (
                      <button 
                        onClick={handleInstallClick}
                        className="w-full py-3 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
                      >
                          <Download className="w-5 h-5" /> Instalar Ahora
                      </button>
                  )}
                  
                  <button onClick={() => setShowInstallGuide(false)} className="w-full mt-4 text-xs text-slate-500 hover:text-white">
                      Continuar en navegador (con menos espacio)
                  </button>
              </div>
          </div>
      )}

      {isLocked && (
          <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center text-white text-center p-8 animate-in zoom-in-95">
              <Lock className="w-20 h-20 mb-4 text-rose-500 animate-pulse" />
              <h1 className="text-4xl md:text-5xl font-bold mb-2 tracking-tight">Bloque Sagrado</h1>
              <p className="text-2xl text-teal-400 mb-8 font-light">{currentSacredActivity}</p>
              
              <div className="flex flex-col gap-3 w-full max-w-sm">
                  <button onClick={handleLateUnlock} className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95">
                      <Clock className="w-5 h-5" /> Llego tarde (+15 min)
                  </button>
                  <button onClick={handleSkipBlock} className="w-full py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl font-medium text-slate-300 flex items-center justify-center gap-2 transition-all active:scale-95">
                      <SkipForward className="w-5 h-5" /> Saltar este bloque
                  </button>
                  <button onClick={() => setIsLocked(false)} className="w-full py-2 text-sm text-slate-600 hover:text-rose-400 mt-2 transition-colors">
                      Desbloqueo de Emergencia
                  </button>
              </div>
          </div>
      )}

      {/* MOBILE HEADER */}
      <div className="md:hidden glass-panel border-b border-white/10 p-4 flex justify-between items-center sticky top-0 z-30 relative shadow-md h-16">
        <h1 className={`text-xl font-bold tracking-tight flex items-center gap-2 ${getAccentClass('text')}`}>
            <Sparkles className="w-5 h-5" /> Equilibrio
        </h1>
        <div className="flex items-center gap-4">
            <button onClick={toggleMute} className="text-slate-300 p-1">
                {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
            </button>
            <button onClick={() => setMobileMenuOpen(true)} className="p-2 text-slate-300">
                <Menu className="w-6 h-6" />
            </button>
        </div>
      </div>

      {mobileMenuOpen && (
          <div 
            className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm md:hidden transition-opacity duration-300"
            onClick={() => setMobileMenuOpen(false)}
          />
      )}

      {/* SIDEBAR NAVIGATION */}
      <aside className={`
        fixed inset-0 z-50 w-72 p-4 transition-transform duration-300 ease-in-out flex flex-col
        glass-panel border-r border-white/10 shadow-2xl overflow-hidden
        md:relative md:translate-x-0 md:z-10
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* User Profile Header */}
        <div className="mb-6 pb-6 border-b border-white/10 flex flex-col items-center text-center">
             <div className="relative mb-3 group cursor-pointer" onClick={() => setActiveTab('settings')}>
                <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${getAccentClass('from')} ${getAccentClass('to')} p-1 shadow-lg`}>
                    <div className="w-full h-full rounded-full overflow-hidden bg-slate-800">
                        {appSettings.userAvatar ? <img src={appSettings.userAvatar} className="w-full h-full object-cover"/> : <span className="flex items-center justify-center h-full text-2xl font-bold">{auth.userName.charAt(0)}</span>}
                    </div>
                </div>
                <div className="absolute bottom-0 right-0 bg-slate-800 rounded-full p-1 border border-white/20">
                    <SettingsIcon className="w-3 h-3 text-white" />
                </div>
             </div>
             <h2 className="text-lg font-bold text-white truncate w-full">{auth.userName}</h2>
             <p className="text-xs text-slate-400">Modo: {currentRoutineId.replace(/-/g, ' ')}</p>
        </div>

        <nav className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6">
          
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-4 mb-2">Principal</p>
            <NavButton tab="dashboard" icon={LayoutDashboard} label="Centro de Mando" description="Resumen de hoy" />
            <NavButton tab="evaluation" icon={TrendingUp} label="Evaluación Diaria" description="Registra tu progreso" />
            <NavButton tab="routine" icon={Calendar} label="Mi Agenda" description="Edita tus bloques" />
          </div>

          <div>
             <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-4 mb-2">Crecimiento</p>
             <NavButton tab="goals" icon={Target} label="Mis Metas" />
             <NavButton tab="workout" icon={Dumbbell} label="Entrenamiento" />
             <NavButton tab="meditation" icon={Wind} label="Meditación" />
             <NavButton tab="agile" icon={RefreshCw} label="Modo Mejora" />
          </div>

          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-4 mb-2">Inteligencia</p>
            <NavButton tab="focus" icon={Zap} label="Foco Profundo" />
            <NavButton tab="chat" icon={MessageSquare} label="Chat Gemini" />
            <NavButton tab="live" icon={Mic} label="Voz en Vivo" />
          </div>

        </nav>

        <div className="pt-4 border-t border-white/10 mt-auto">
             <button 
                onClick={() => { setActiveTab('settings'); setMobileMenuOpen(false); }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl w-full text-slate-400 hover:text-white hover:bg-white/5 transition-colors mb-1"
            >
                <SettingsIcon className="w-5 h-5" />
                <span className="text-sm font-bold">Configuración</span>
            </button>
            <button 
                 onClick={() => {
                     setAuth({isAuthenticated: false, userName: ''});
                     localStorage.removeItem('equilibrio_user');
                     localStorage.removeItem('equilibrio_has_onboarded');
                     window.location.reload();
                 }} 
                 className="flex items-center gap-3 px-4 py-3 rounded-xl w-full text-rose-400/70 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
                <LogOut className="w-5 h-5" />
                <span className="text-sm font-bold">Cerrar Sesión</span>
            </button>
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-[calc(100dvh-64px)] md:h-screen relative z-10 pb-20 md:pb-8">
        <header className="mb-6 flex justify-between items-end">
           <div>
               <h2 className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg tracking-tight">
                 {activeTab === 'dashboard' && `Tu Espejo, ${auth.userName}`}
                 {activeTab === 'evaluation' && 'Evaluación Real'}
                 {activeTab === 'workout' && 'Entrenador Personal IA'}
                 {activeTab === 'meditation' && 'Centro de Calma'}
                 {activeTab === 'goals' && 'Mapa de Metas'}
                 {activeTab === 'routine' && 'Ritmo Diario'}
                 {activeTab === 'agile' && 'Evolución Diaria'}
                 {activeTab === 'focus' && 'Modo Foco Extremo'}
                 {activeTab === 'chat' && 'Inteligencia Gemini'}
                 {activeTab === 'live' && 'Voz en Vivo'}
                 {activeTab === 'settings' && 'Ajustes del Sistema'}
               </h2>
           </div>
        </header>

        <div className="max-w-6xl mx-auto">
          {activeTab === 'dashboard' && (
              <Dashboard 
                stats={[]} 
                currentRoutine={customRoutines[currentRoutineId]} 
                userAvatar={appSettings.userAvatar}
                mentorAvatar={appSettings.mentorAvatar}
                evaluations={dailyEvaluations}
                goals={goals} // Pass goals to dashboard
                onOpenChat={() => setActiveTab('chat')}
              />
          )}

          {activeTab === 'evaluation' && (
              <EvaluationSystem 
                evaluations={dailyEvaluations}
                onSaveEvaluation={handleSaveEvaluation}
                lastInteractionTimestamp={appSettings.lastInteractionTimestamp}
              />
          )}
          
          {activeTab === 'workout' && <WorkoutTrainer />}
          {activeTab === 'meditation' && <MeditationCenter />}

          {activeTab === 'goals' && (
              <GoalPlanner 
                goals={goals} 
                onAddGoal={addGoal} 
                onToggleGoal={toggleGoal} 
                onDeleteGoal={deleteGoal} 
              />
          )}

          {activeTab === 'routine' && (
            <RoutineManager 
              routines={customRoutines}
              currentRoutineId={currentRoutineId} 
              onRoutineChange={setCurrentRoutineId} 
              onUpdateRoutine={updateRoutine}
              onDeleteRoutine={deleteRoutine}
            />
          )}

          {activeTab === 'agile' && <AgileCoach />}

          {activeTab === 'settings' && (
              <Settings settings={appSettings} onUpdateSettings={setAppSettings} />
          )}

          {activeTab === 'focus' && <FocusTimer />}
          {activeTab === 'chat' && (
            <ChatInterface onInteraction={recordInteraction} />
          )}
          {activeTab === 'live' && (
            <LiveAssistant onInteraction={recordInteraction} />
          )}
        </div>

        {toast && (
          <div className="fixed bottom-6 right-6 z-50 animate-bounce md:animate-none">
            <div className={`p-4 rounded-xl shadow-2xl border-l-4 flex items-start gap-3 max-w-sm backdrop-blur-md transition-all duration-300 ${
              toast.type === 'warning' 
                ? 'bg-amber-900/80 border-amber-500 text-amber-100' 
                : toast.type === 'success'
                ? 'bg-emerald-900/80 border-emerald-500 text-emerald-100'
                : 'bg-indigo-900/80 border-indigo-500 text-indigo-100'
            }`}>
              <div className="p-2 rounded-full bg-white/10">
                {toast.type === 'warning' && <AlertTriangle className="w-5 h-5" />}
                {toast.type === 'success' && <Sparkles className="w-5 h-5" />}
                {toast.type === 'info' && <AlertTriangle className="w-5 h-5" />}
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-sm">Notificación</h4>
                <p className="text-sm mt-1 leading-relaxed opacity-90">{toast.message}</p>
              </div>
              <button 
                onClick={() => setToast(null)} 
                className="text-white/50 hover:text-white p-1 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
