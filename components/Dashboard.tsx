
import React, { useState, useEffect, useMemo } from 'react';
import { DailyStats, Routine, TimeBlock, DailyEvaluation, Goal } from '../types';
import { MOTIVATIONAL_QUOTES } from '../constants';
import { Briefcase, Heart, Coffee, Sun, Play, CheckCircle2, MapPin, Clock, MessageCircle, Sparkles, TrendingUp, TrendingDown, Minus, ArrowRight, BellRing, CalendarDays, AlertCircle, Radio } from 'lucide-react';

interface DashboardProps {
    stats: DailyStats[]; 
    currentRoutine?: Routine;
    userAvatar?: string;
    mentorAvatar?: string;
    evaluations?: DailyEvaluation[];
    goals?: Goal[]; // Added goals to show in alerts
    onOpenChat: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ stats, currentRoutine, userAvatar, mentorAvatar, evaluations = [], goals = [], onOpenChat }) => {
    // Timeline State
    const [currentTime, setCurrentTime] = useState(new Date());

    // Motivation Engine
    const [quoteIndex, setQuoteIndex] = useState(0);

    useEffect(() => {
        setQuoteIndex(Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length));
        const quoteTimer = setInterval(() => {
            setQuoteIndex(prev => (prev + 1) % MOTIVATIONAL_QUOTES.length);
        }, 60000 * 5); // Change every 5 mins
        return () => clearInterval(quoteTimer);
    }, []);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000); 
        return () => clearInterval(timer);
    }, []);

    // --- LIFE SCORE ALGORITHM (The "Media") ---
    const lifeScoreData = useMemo(() => {
        if (!evaluations || evaluations.length === 0) return { score: 50, trend: 'neutral' };

        const recentEvals = [...evaluations].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 14);
        
        let totalPoints = 0;
        let maxPoints = 0;

        recentEvals.forEach(ev => {
            const ratingPoints = (ev.rating / 5) * 50;
            let completionPoints = 0;
            if (ev.planCompletion === 'yes') completionPoints = 50;
            else if (ev.planCompletion === 'partial') completionPoints = 25;
            
            totalPoints += (ratingPoints + completionPoints);
            maxPoints += 100;
        });

        const score = Math.round((totalPoints / maxPoints) * 100);

        let trend: 'up' | 'down' | 'neutral' = 'neutral';
        if (recentEvals.length >= 2) {
            const latest = recentEvals[0];
            const previous = recentEvals[1];
            if (latest.rating > previous.rating) trend = 'up';
            else if (latest.rating < previous.rating) trend = 'down';
        }

        return { score, trend };
    }, [evaluations]);

    // --- PROGRESS LOGIC (Daily Routine) ---
    const progressStats = useMemo(() => {
        if (!currentRoutine || !currentRoutine.blocks.length) return { completed: 0, percent: 0 };
        
        const nowMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
        let completedCount = 0;
        
        currentRoutine.blocks.forEach((block, index) => {
             const [h, m] = block.time.split(':').map(Number);
             const start = h * 60 + m;
             let end = start + 60;
             if (index < currentRoutine.blocks.length - 1) {
                 const [nh, nm] = currentRoutine.blocks[index + 1].time.split(':').map(Number);
                 end = nh * 60 + nm;
             }
             if (nowMinutes > end) completedCount++;
        });

        return {
            completed: completedCount,
            percent: Math.round((completedCount / currentRoutine.blocks.length) * 100)
        };
    }, [currentRoutine, currentTime]);

    // Calculate "Health" of Current Avatar based on Life Score
    const avatarFilter = useMemo(() => {
        const p = lifeScoreData.score;
        const grayscale = Math.max(0, 100 - p); 
        return `grayscale(${grayscale}%)`;
    }, [lifeScoreData.score]);

    // --- TIMELINE HELPERS ---
    const getBlockStatus = (block: TimeBlock, index: number, blocks: TimeBlock[]) => {
        const nowMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
        const [bh, bm] = block.time.split(':').map(Number);
        const blockStart = bh * 60 + bm;
        
        let blockEnd = blockStart + 60; // Default 1 hour
        if (index < blocks.length - 1) {
            const [nh, nm] = blocks[index + 1].time.split(':').map(Number);
            blockEnd = nh * 60 + nm;
        } else {
            blockEnd = 24 * 60; 
        }

        if (nowMinutes >= blockStart && nowMinutes < blockEnd) return 'active';
        if (nowMinutes > blockEnd) return 'completed';
        return 'upcoming';
    };

    // IDENTIFY CURRENT ACTIVITY
    const currentActivityBlock = useMemo(() => {
        if (!currentRoutine) return null;
        const nowMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
        return currentRoutine.blocks.find((block, index) => {
            const [bh, bm] = block.time.split(':').map(Number);
            const start = bh * 60 + bm;
            let end = start + 60;
            if (index < currentRoutine.blocks.length - 1) {
                const [nh, nm] = currentRoutine.blocks[index + 1].time.split(':').map(Number);
                end = nh * 60 + nm;
            } else {
                end = 24 * 60;
            }
            return nowMinutes >= start && nowMinutes < end;
        });
    }, [currentRoutine, currentTime]);

    const firstUpcomingIndex = useMemo(() => {
        if (!currentRoutine) return -1;
        const nowMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
        return currentRoutine.blocks.findIndex(block => {
            const [bh, bm] = block.time.split(':').map(Number);
            const start = bh * 60 + bm;
            return start > nowMinutes;
        });
    }, [currentRoutine, currentTime]);


    const getIcon = (type: string) => {
         switch (type) {
            case 'work': return <Briefcase className="w-5 h-5" />;
            case 'sacred': return <Heart className="w-5 h-5" />;
            case 'break': return <Coffee className="w-5 h-5" />;
            default: return <Sun className="w-5 h-5" />;
        }
    };

    const getProgress = (block: TimeBlock, index: number, blocks: TimeBlock[]) => {
        const nowMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
        const [bh, bm] = block.time.split(':').map(Number);
        const blockStart = bh * 60 + bm;
        let blockEnd = blockStart + 60;
        if (index < blocks.length - 1) {
            const [nh, nm] = blocks[index + 1].time.split(':').map(Number);
            blockEnd = nh * 60 + nm;
        }
        
        const totalDuration = blockEnd - blockStart;
        const elapsed = nowMinutes - blockStart;
        return Math.min(Math.max((elapsed / totalDuration) * 100, 0), 100);
    };

    // Filter urgent goals (not completed) to show in Radar
    const urgentGoals = goals.filter(g => !g.completed).slice(0, 3);

    if (!currentRoutine) {
        return <div className="p-8 text-center text-slate-300">No hay rutina seleccionada. Ve a "Editar Rutina" para configurar una.</div>;
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-500 pb-20 md:pb-0 relative">
            
            {/* 1. PERSISTENT HEADER (THE MIRROR & SCORE) */}
            <div className="lg:col-span-3">
                <div className="bg-slate-900 p-6 rounded-3xl border border-white/10 relative overflow-hidden shadow-2xl min-h-[250px] flex flex-col items-center justify-center">
                    
                    {/* Background Ambience */}
                    <div className={`absolute inset-0 bg-gradient-to-r transition-colors duration-1000 ${
                        lifeScoreData.score > 80 ? 'from-slate-900 via-teal-900/20 to-slate-900' :
                        lifeScoreData.score < 40 ? 'from-slate-900 via-rose-900/20 to-slate-900' :
                        'from-slate-900 via-indigo-900/20 to-slate-900'
                    }`}></div>

                    <div className="relative z-10 w-full max-w-5xl flex items-center justify-between px-2 md:px-10">
                        {/* LEFT: CURRENT SELF */}
                        <div className="flex flex-col items-center gap-2 w-1/3">
                            <div className={`relative transition-transform duration-500 ${lifeScoreData.trend === 'down' ? 'scale-95 opacity-80' : 'scale-100'}`}>
                                <div className="w-16 h-16 md:w-24 md:h-24 rounded-full border-4 border-slate-700 bg-slate-800 overflow-hidden shadow-2xl" style={{ filter: avatarFilter }}>
                                    {userAvatar ? <img src={userAvatar} className="w-full h-full object-cover"/> : <CheckCircle2 className="p-4 w-full h-full text-slate-600"/>}
                                </div>
                            </div>
                            <span className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Yo Actual</span>
                        </div>

                        {/* CENTER: SCORE & TITLE */}
                        <div className="flex flex-col items-center justify-center w-1/3 text-center">
                            <h1 className="text-xl md:text-2xl font-black text-white tracking-tighter uppercase mb-2">
                                Obsérvate
                            </h1>
                             <div className={`text-5xl md:text-7xl font-black tracking-tighter drop-shadow-[0_0_25px_rgba(255,255,255,0.1)] ${
                                lifeScoreData.score > 80 ? 'text-teal-400' :
                                lifeScoreData.score < 40 ? 'text-rose-400' :
                                'text-white'
                            }`}>
                                {lifeScoreData.score}%
                            </div>
                            <p className="text-teal-400/80 font-bold text-[10px] tracking-widest uppercase mt-2">
                                Nivel de Evolución
                            </p>
                        </div>

                        {/* RIGHT: FUTURE SELF */}
                        <div className="flex flex-col items-center gap-2 w-1/3 cursor-pointer group" onClick={onOpenChat}>
                            <div className={`relative transition-transform duration-500 ${lifeScoreData.score > 80 ? 'scale-110' : ''}`}>
                                <div className={`absolute -inset-4 rounded-full blur-2xl opacity-30 animate-pulse-slow ${
                                    lifeScoreData.score > 80 ? 'bg-teal-400' : 'bg-indigo-500'
                                }`}></div>
                                <div className="w-16 h-16 md:w-24 md:h-24 rounded-full border-4 border-teal-500/30 bg-slate-800 overflow-hidden relative shadow-2xl z-10 group-hover:scale-105 transition-transform">
                                    {mentorAvatar ? <img src={mentorAvatar} className="w-full h-full object-cover"/> : <Sparkles className="p-5 w-full h-full text-teal-200"/>}
                                </div>
                            </div>
                            <span className="text-[10px] md:text-xs font-bold text-teal-400 uppercase tracking-widest mt-1 drop-shadow-md">Yo Futuro</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. "DO THIS NOW" CARD (Action Mode) */}
            <div className="lg:col-span-3">
                <div className="bg-gradient-to-r from-teal-900/50 to-emerald-900/50 p-6 rounded-2xl border border-teal-500/30 shadow-lg relative overflow-hidden group">
                     <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-teal-500/10 to-transparent pointer-events-none"></div>
                     <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
                         <div className="flex items-center gap-4">
                             <div className="bg-teal-500 p-3 rounded-full shadow-lg shadow-teal-500/30 animate-pulse">
                                 <Radio className="w-6 h-6 text-white" />
                             </div>
                             <div>
                                 <h3 className="text-xs font-bold text-teal-300 uppercase tracking-widest mb-1">Tu Misión Ahora</h3>
                                 <h2 className="text-2xl md:text-3xl font-black text-white leading-none">
                                     {currentActivityBlock ? currentActivityBlock.activity : "Tiempo Libre / Descanso"}
                                 </h2>
                                 <p className="text-slate-300 text-sm mt-1">
                                     {currentActivityBlock 
                                        ? `Hasta las ${(() => {
                                            const [h, m] = currentActivityBlock.time.split(':').map(Number);
                                            // Simple logic to guess end time (next block or +1h)
                                            // For simplicity in display, just showing activity name is key
                                            return "siguiente bloque";
                                        })()}` 
                                        : "Recarga energías para lo siguiente."}
                                 </p>
                             </div>
                         </div>
                         <button className="bg-white text-teal-900 px-6 py-3 rounded-xl font-bold hover:bg-teal-50 transition-colors shadow-lg active:scale-95 whitespace-nowrap">
                             ¡Estoy en ello!
                         </button>
                     </div>
                </div>
            </div>

            {/* 3. SMART ALERTS RADAR */}
            <div className="lg:col-span-1 space-y-4">
                <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50 h-full">
                    <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <BellRing className="w-5 h-5 text-amber-400" />
                        Radar de Alertas
                    </h2>
                    
                    <div className="space-y-3">
                        {urgentGoals.length > 0 ? (
                            urgentGoals.map(goal => (
                                <div key={goal.id} className="bg-slate-900/80 p-3 rounded-xl border-l-4 border-amber-500 flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-200">{goal.text}</h4>
                                        <p className="text-xs text-slate-500 mt-1 uppercase font-bold tracking-wide">
                                            {goal.period === 'diario' ? 'Para Hoy' : 'Pendiente'}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-4 text-slate-500 text-sm">
                                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                Todo al día.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 4. TIMELINE (What follows) */}
            <div className="lg:col-span-2">
                <div className="glass-card rounded-3xl flex flex-col h-full overflow-hidden border border-white/10">
                    <div className="p-5 border-b border-white/10 flex justify-between items-center bg-slate-900/30 backdrop-blur-sm sticky top-0 z-10">
                         <div>
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Clock className="w-6 h-6 text-teal-400" />
                                Siguientes Pasos
                            </h2>
                         </div>
                         <div className="text-2xl font-mono font-bold text-white/80">
                            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                         </div>
                    </div>

                    <div className="p-4 overflow-y-auto max-h-[500px] relative scroll-smooth custom-scrollbar">
                        <div className="absolute left-[29px] top-6 bottom-6 w-0.5 bg-slate-700/50"></div>

                        <div className="space-y-4">
                            {currentRoutine.blocks.map((block, index) => {
                                let status = getBlockStatus(block, index, currentRoutine.blocks);
                                const isNext = index === firstUpcomingIndex;
                                const progress = getProgress(block, index, currentRoutine.blocks);
                                
                                return (
                                    <div key={block.id} className={`relative flex gap-4 group transition-all duration-500 ${status === 'completed' ? 'opacity-40 grayscale' : ''}`}>
                                        
                                        <div className={`
                                            relative z-10 w-8 h-8 rounded-full flex items-center justify-center border-4 border-slate-900 shadow-sm transition-all duration-300 mt-1 shrink-0
                                            ${status === 'active' ? 'bg-teal-500 scale-110 ring-4 ring-teal-500/20' : 
                                              status === 'completed' ? 'bg-slate-600' : 
                                              isNext ? 'bg-white border-teal-500' : 'bg-slate-800'}
                                        `}>
                                            {status === 'completed' ? <CheckCircle2 className="w-4 h-4 text-white" /> : 
                                             status === 'active' ? <Play className="w-3 h-3 text-white fill-current" /> :
                                             isNext ? <ArrowRight className="w-4 h-4 text-teal-600" /> :
                                             <div className="w-2 h-2 bg-slate-400 rounded-full" />}
                                        </div>

                                        <div className={`flex-1 rounded-2xl p-4 border transition-all duration-300 ${
                                            status === 'active' 
                                            ? 'bg-slate-800 border-teal-500/50 shadow-[0_0_20px_rgba(20,184,166,0.1)]' 
                                            : isNext 
                                            ? 'bg-gradient-to-r from-teal-900/10 to-slate-900 border-teal-500/30'
                                            : 'bg-slate-800/30 border-white/5'
                                        }`}>
                                            <div className="flex justify-between items-start mb-1">
                                                <div className="flex items-center gap-3">
                                                    <span className={`font-mono font-bold ${status === 'active' ? 'text-teal-300' : 'text-slate-400'}`}>
                                                        {block.time}
                                                    </span>
                                                    {status === 'active' && <span className="text-[10px] bg-teal-500 text-white px-2 py-0.5 rounded-full font-bold animate-pulse">EN CURSO</span>}
                                                </div>
                                                <div className="opacity-50">{getIcon(block.type)}</div>
                                            </div>

                                            <h3 className={`font-bold text-lg mb-1 ${status === 'active' ? 'text-white' : 'text-slate-300'}`}>
                                                {block.activity}
                                            </h3>

                                            {status === 'active' && (
                                                <div className="mt-3 bg-slate-900 h-1.5 rounded-full overflow-hidden">
                                                    <div className="bg-teal-500 h-full transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
