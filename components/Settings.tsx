
import React, { useRef, useState, useEffect } from 'react';
import { AppSettings } from '../types';
import { generateAvatarImage } from '../services/geminiService';
import { Sun, Bell, BellOff, Settings as SettingsIcon, Heart, Upload, Music, Play, RotateCcw, User, Sparkles, UserCircle2, Wand2, Loader2, Camera, Palette, Lock, Volume2 } from 'lucide-react';

interface SettingsProps {
    settings: AppSettings;
    onUpdateSettings: (settings: AppSettings) => void;
}

const Settings: React.FC<SettingsProps> = ({ settings, onUpdateSettings }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const userAvatarInputRef = useRef<HTMLInputElement>(null);
    const audioPreviewRef = useRef<HTMLAudioElement | null>(null);

    // AI Generation State
    const [isGenerating, setIsGenerating] = useState(false);
    const [avatarPrompt, setAvatarPrompt] = useState('');

    // Password State
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordMessage, setPasswordMessage] = useState('');

    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onUpdateSettings({ ...settings, vitaminDTime: e.target.value });
    };

    const toggleVitaminD = () => {
        onUpdateSettings({ ...settings, vitaminDEnabled: !settings.vitaminDEnabled });
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'customAlarmUrl' | 'userAvatar' | 'mentorAvatar') => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Size check: Limit to 5MB for images to ensure quality, 2MB for audio
        const limit = field === 'customAlarmUrl' ? 2 * 1024 * 1024 : 5 * 1024 * 1024;
        
        if (file.size > limit) {
            alert("El archivo es demasiado grande.");
            return;
        }

        const reader = new FileReader();
        reader.onload = (ev) => {
            const base64 = ev.target?.result as string;
            onUpdateSettings({ ...settings, [field]: base64 });
        };
        reader.readAsDataURL(file);
    };

    const handleReset = (field: 'customAlarmUrl' | 'userAvatar' | 'mentorAvatar') => {
        onUpdateSettings({ ...settings, [field]: undefined });
    };

    const handleGenerateAvatar = async () => {
        setIsGenerating(true);
        try {
            // If user has a photo, we use it as base. If not, we use the text prompt.
            const baseImage = settings.userAvatar;
            const promptToUse = baseImage ? "Transform this person" : (avatarPrompt || "A successful person");

            const imageBase64 = await generateAvatarImage(promptToUse, baseImage);
            
            if (imageBase64) {
                onUpdateSettings({ ...settings, mentorAvatar: imageBase64 });
                setAvatarPrompt(''); 
            } else {
                alert("No se pudo generar la imagen. Intenta de nuevo.");
            }
        } catch (e) {
            console.error(e);
            alert("Error conectando con el servicio de IA.");
        } finally {
            setIsGenerating(false);
        }
    };

    const playPreview = () => {
        const src = settings.customAlarmUrl || 'https://actions.google.com/sounds/v1/alarms/beep_short.ogg';
        if (audioPreviewRef.current) {
            audioPreviewRef.current.src = src;
            audioPreviewRef.current.volume = settings.appVolume ?? 0.5;
            audioPreviewRef.current.play();
        } else {
            const audio = new Audio(src);
            audio.volume = settings.appVolume ?? 0.5;
            audioPreviewRef.current = audio;
            audio.play();
        }
    };

    const handleChangePassword = () => {
        if (!newPassword || newPassword.length < 4) {
            setPasswordMessage("La contraseña es muy corta.");
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordMessage("Las contraseñas no coinciden.");
            return;
        }

        try {
            const savedUser = localStorage.getItem('equilibrio_user');
            if (savedUser) {
                const parsed = JSON.parse(savedUser);
                parsed.password = newPassword;
                localStorage.setItem('equilibrio_user', JSON.stringify(parsed));
                setPasswordMessage("¡Contraseña actualizada con éxito!");
                setNewPassword('');
                setConfirmPassword('');
                setTimeout(() => setPasswordMessage(''), 3000);
            }
        } catch (e) {
            setPasswordMessage("Error al guardar.");
        }
    };

    const colors = [
        { id: 'teal', name: 'Original', class: 'bg-teal-500' },
        { id: 'indigo', name: 'Profundo', class: 'bg-indigo-500' },
        { id: 'rose', name: 'Pasión', class: 'bg-rose-500' },
        { id: 'amber', name: 'Energía', class: 'bg-amber-500' },
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20 max-w-4xl mx-auto">
            
            {/* 1. VISUAL CUSTOMIZATION */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                    <Palette className="w-6 h-6 text-teal-500" />
                    Personalización Visual
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300 mb-3">Color de Energía (Tema)</h4>
                        <div className="flex gap-3">
                            {colors.map((color) => (
                                <button
                                    key={color.id}
                                    onClick={() => onUpdateSettings({ ...settings, accentColor: color.id as any })}
                                    className={`w-12 h-12 rounded-full border-4 transition-transform hover:scale-110 flex items-center justify-center ${color.class} ${
                                        settings.accentColor === color.id || (!settings.accentColor && color.id === 'teal') 
                                        ? 'border-white dark:border-slate-600 shadow-lg scale-110 ring-2 ring-slate-400' 
                                        : 'border-transparent opacity-60 hover:opacity-100'
                                    }`}
                                    title={color.name}
                                />
                            ))}
                        </div>
                        <p className="text-xs text-slate-400 mt-2">Define el color de los botones y menús.</p>
                    </div>

                    <div>
                         <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                            <Volume2 className="w-4 h-4" /> Volumen de la App
                         </h4>
                         <input 
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={settings.appVolume ?? 0.5}
                            onChange={(e) => {
                                const vol = parseFloat(e.target.value);
                                onUpdateSettings({ ...settings, appVolume: vol });
                                // Simple beep to test volume
                                if (audioPreviewRef.current) audioPreviewRef.current.volume = vol;
                            }}
                            className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-500"
                        />
                        <div className="flex justify-between text-xs text-slate-400 mt-1">
                            <span>Silencio</span>
                            <span>Máximo</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. DUAL IDENTITY AVATARS */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                    <UserCircle2 className="w-5 h-5 text-indigo-500" /> El Espejo (Identidad Dual)
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg">
                    Sube tu foto actual. La IA generará tu versión "Futuro" para motivarte cada día.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Current Self (Capture/Upload) */}
                    <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-700 flex flex-col items-center text-center">
                            <div className="mb-4 relative group">
                                <div className="w-28 h-28 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-800 border-4 border-slate-300 dark:border-slate-600 grayscale group-hover:grayscale-0 transition-all duration-500 shadow-inner">
                                    {settings.userAvatar ? (
                                        <img src={settings.userAvatar} alt="Yo Actual" className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-full h-full p-8 text-slate-400" />
                                    )}
                                </div>
                            </div>
                            <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-2">Yo Actual</h4>
                            
                            <input 
                            type="file" 
                            accept="image/*" 
                            capture="user"
                            ref={userAvatarInputRef} 
                            className="hidden" 
                            onChange={(e) => handleFileUpload(e, 'userAvatar')}
                        />
                        <div className="flex gap-2 w-full">
                            <button 
                                onClick={() => userAvatarInputRef.current?.click()}
                                className="flex-1 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
                            >
                                <Camera className="w-3 h-3" /> Subir Foto
                            </button>
                            {settings.userAvatar && (
                                <button onClick={() => handleReset('userAvatar')} className="px-3 py-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg border border-transparent hover:border-rose-500/30 transition-all">
                                    <RotateCcw className="w-4 h-4"/>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Future Self (AI Auto-Generator) */}
                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-indigo-200 dark:border-indigo-800 flex flex-col items-center text-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-400/20 blur-3xl rounded-full pointer-events-none"></div>
                            
                            <div className="mb-4 relative">
                                <div className="w-28 h-28 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-800 border-4 border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.4)]">
                                    {settings.mentorAvatar ? (
                                        <img src={settings.mentorAvatar} alt="Yo Futuro" className="w-full h-full object-cover" />
                                    ) : (
                                        <Sparkles className="w-full h-full p-8 text-indigo-400 animate-pulse" />
                                    )}
                                </div>
                            </div>
                            
                            <h4 className="font-bold text-indigo-700 dark:text-indigo-300 mb-2">Yo Futuro</h4>
                            
                            {!settings.mentorAvatar ? (
                                <div className="w-full space-y-3">
                                    {settings.userAvatar ? (
                                        <button 
                                        onClick={handleGenerateAvatar}
                                        disabled={isGenerating}
                                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg hover:shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                                        >
                                            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin"/> : <Wand2 className="w-4 h-4"/>}
                                            Generar con IA
                                        </button>
                                    ) : (
                                        <div className="p-3 border border-dashed border-indigo-300 dark:border-indigo-700 rounded-lg bg-white/50 dark:bg-black/20 text-xs text-indigo-400">
                                            Sube tu foto actual primero.
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <button 
                                onClick={() => handleReset('mentorAvatar')}
                                className="text-xs text-indigo-500 hover:text-indigo-400 underline flex items-center justify-center gap-1 mt-2"
                                >
                                    <RotateCcw className="w-3 h-3"/> Regenerar
                                </button>
                            )}
                    </div>
                </div>
            </div>

            {/* 3. SECURITY SECTION */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                    <Lock className="w-5 h-5 text-rose-500" /> Seguridad
                </h3>
                
                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Cambiar Contraseña de Acceso</h4>
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-1 w-full">
                            <input 
                                type="password" 
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Nueva contraseña"
                                className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 outline-none mb-2"
                            />
                            <input 
                                type="password" 
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirmar nueva contraseña"
                                className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 outline-none"
                            />
                        </div>
                        <button 
                            onClick={handleChangePassword}
                            disabled={!newPassword || !confirmPassword}
                            className="w-full md:w-auto px-6 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold rounded-lg text-sm transition-colors"
                        >
                            Actualizar
                        </button>
                    </div>
                    {passwordMessage && (
                        <p className={`text-xs font-bold mt-2 ${passwordMessage.includes('éxito') ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {passwordMessage}
                        </p>
                    )}
                </div>
            </div>

            {/* 4. ALARMS & WELLNESS */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                    <Music className="w-5 h-5 text-amber-500" /> Alertas y Sonidos
                </h3>
                
                <div className="space-y-4">
                     {/* Custom Alarm */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                        <div className="flex-1">
                            <h4 className="font-bold text-slate-900 dark:text-white text-sm">Sonido de Alarma</h4>
                            <p className="text-xs text-slate-500">Sube tu propio audio motivacional.</p>
                        </div>
                        <div className="flex items-center gap-2">
                             <input 
                                type="file" 
                                accept="audio/*" 
                                ref={fileInputRef} 
                                className="hidden" 
                                onChange={(e) => handleFileUpload(e, 'customAlarmUrl')}
                            />
                            <button onClick={playPreview} className="p-2 text-slate-500 hover:text-teal-500 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors">
                                <Play className="w-5 h-5" />
                            </button>
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors"
                            >
                                <Upload className="w-3 h-3 inline mr-1" /> {settings.customAlarmUrl ? 'Cambiar' : 'Subir'}
                            </button>
                        </div>
                    </div>

                    {/* Vitamin D */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                         <div className="flex items-center gap-3 flex-1">
                            <div className={`p-2 rounded-lg ${settings.vitaminDEnabled ? 'bg-orange-100 text-orange-600' : 'bg-slate-200 text-slate-400'}`}>
                                <Sun className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900 dark:text-white text-sm">Alerta Solar (Vitamina D)</h4>
                                <div className="flex items-center gap-2 mt-1">
                                    <input 
                                        type="time" 
                                        value={settings.vitaminDTime}
                                        onChange={handleTimeChange}
                                        disabled={!settings.vitaminDEnabled}
                                        className="bg-transparent text-xs font-mono font-bold text-slate-600 dark:text-slate-300 outline-none"
                                    />
                                </div>
                            </div>
                         </div>
                         <button
                            onClick={toggleVitaminD}
                            className={`p-2 rounded-lg transition-colors ${
                                settings.vitaminDEnabled 
                                ? 'bg-teal-100 text-teal-700 hover:bg-teal-200' 
                                : 'bg-slate-200 text-slate-500 hover:bg-slate-300'
                            }`}
                        >
                            {settings.vitaminDEnabled ? <Bell className="w-5 h-5"/> : <BellOff className="w-5 h-5"/>}
                        </button>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default Settings;
