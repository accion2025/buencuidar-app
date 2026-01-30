import React, { useState, useEffect } from 'react';
import {
    Activity,
    Heart,
    Thermometer,
    Wind,
    Pill,
    Clock,
    AlertCircle,
    ChevronRight,
    CircleCheck,
    CircleDashed,
    History,
    ShieldCheck,
    Lock,
    Settings,
    Check,
    ClipboardList,
    Star
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import ConfigureAgendaModal from '../../components/dashboard/ConfigureAgendaModal';
import { formatTimeAgo } from '../../utils/time';

const MonitoringCenter = () => {
    const { profile, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [lastUpdate, setLastUpdate] = useState("Sincronizando...");

    // Subscription Check
    const isSubscribed = profile?.subscription_status === 'active';

    if (authLoading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Activity size={48} className="animate-pulse text-[var(--secondary-color)]" />
                    <p className="text-[var(--text-light)] font-black uppercase tracking-widest text-xs">Iniciando PULSO...</p>
                </div>
            </div>
        );
    }

    if (!isSubscribed) {
        return (
            <div className="flex-grow flex items-center justify-center py-20 px-4">
                <div className="max-w-3xl w-full card !p-0 overflow-hidden shadow-2xl border-none animate-fade-in-up">
                    <div className="bg-[var(--primary-color)] p-12 text-center relative flex flex-col items-center justify-center">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--secondary-color)] rounded-full -translate-y-1/2 translate-x-1/2 blur-[100px] opacity-20"></div>
                        <div className="bg-white/10 w-24 h-24 rounded-[16px] flex items-center justify-center backdrop-blur-md border border-white/20 mb-8 shadow-2xl">
                            <Lock size={48} className="text-[var(--accent-color)]" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-brand font-bold !text-[#FAFAF7] tracking-tight mb-4 drop-shadow-sm">Acceso Restringido a PULSO</h1>
                        <p className="text-[var(--accent-color)] text-lg leading-relaxed max-w-xl mx-auto opacity-90 font-secondary text-center">
                            El centro de seguimiento de bienestar en tiempo real es una función exclusiva para usuarios con una suscripción activa a nuestro <span
                                onClick={() => navigate('/ecosistema-salud')}
                                className="!text-[#FAFAF7] font-black cursor-pointer hover:underline decoration-2 underline-offset-4 transition-all"
                            >Servicio PULSO Premium</span>.
                        </p>
                    </div>

                    <div className="p-12 bg-white flex flex-col items-center text-center">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 w-full">
                            {[
                                { icon: Activity, text: "Seguimiento en Vivo" },
                                { icon: Heart, text: "Bienestar Real" },
                                { icon: ShieldCheck, text: "Agenda Asegurada" }
                            ].map((item, i) => (
                                <div key={i} className="flex flex-col items-center gap-2">
                                    <div className="w-10 h-10 rounded-[16px] bg-[var(--base-bg)] text-[var(--secondary-color)] flex items-center justify-center">
                                        <item.icon size={20} />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-[var(--primary-color)]">{item.text}</span>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={() => navigate('/dashboard/plans')}
                            className="btn btn-primary px-12 py-6 text-xl shadow-2xl shadow-green-100 uppercase tracking-widest"
                        >
                            ACTIVAR PULSO AHORA
                        </button>

                        <p className="text-xs text-[var(--text-light)] mt-8 font-secondary">
                            ¿Ya estás suscrito? Contacta a soporte si crees que esto es un error.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // State for live data
    const [activeAppointment, setActiveAppointment] = useState(null);
    const [isUpcoming, setIsUpcoming] = useState(false);
    const [caregiver, setCaregiver] = useState(null);
    const [careLogs, setCareLogs] = useState([]);
    const [loadingData, setLoadingData] = useState(true);
    const [showAgendaModal, setShowAgendaModal] = useState(false);
    const [wellnessData, setWellnessData] = useState({
        general: { value: 'Pendiente', status: 'En espera' },
        energy: { value: 'Pendiente', status: 'En espera' },
        mood: { value: 'Pendiente', status: 'En espera' }
    });
    const [hoursStats, setHoursStats] = useState({ confirmed: 0, pending: 0 });
    const [averageRating, setAverageRating] = useState(null);

    useEffect(() => {
        if (isSubscribed) {
            fetchLiveData();
        }
    }, [isSubscribed]);

    const fetchLiveData = async () => {
        try {
            setLoadingData(true);
            const today = new Date().toISOString().split('T')[0];

            // Strategy: 
            // 1. Prioritize 'in_progress' appointments (Active NOW)
            // 2. Fallback to 'confirmed' appointments for today or future (Upcoming)

            let appointment = null;
            let upcoming = false;

            // 1. Check In Progress
            const { data: inProgress, error: ipError } = await supabase
                .from('appointments')
                .select('id, date, time, status, caregiver_id, details, care_agenda')
                .eq('client_id', profile.id)
                .eq('status', 'in_progress')
                .limit(1);

            if (ipError) throw ipError;

            if (inProgress && inProgress.length > 0) {
                appointment = inProgress[0];
            } else {
                // 2. Check Upcoming (Today/Future Confirmed)
                const { data: nextUp, error: nextError } = await supabase
                    .from('appointments')
                    .select('id, date, time, status, caregiver_id, details, care_agenda')
                    .eq('client_id', profile.id)
                    .in('status', ['confirmed'])
                    .gte('date', today)
                    .order('date', { ascending: true })
                    .order('time', { ascending: true })
                    .limit(1);

                if (nextError) throw nextError;

                if (nextUp && nextUp.length > 0) {
                    appointment = nextUp[0];
                    upcoming = true;
                }
            }

            if (appointment) {
                setActiveAppointment(appointment);
                setIsUpcoming(upcoming);

                // 2. Fetch caregiver details
                if (appointment.caregiver_id) {
                    const { data: caregiverProfile, error: cgError } = await supabase
                        .from('profiles')
                        .select('full_name, avatar_url, phone')
                        .eq('id', appointment.caregiver_id)
                        .single();

                    if (cgError) throw cgError;
                    setCaregiver(caregiverProfile);
                }

                // 3. Fetch Care Logs
                const { data: logs, error: logsError } = await supabase
                    .from('care_logs')
                    .select('*')
                    .eq('appointment_id', appointment.id)
                    .order('created_at', { ascending: false });

                if (logsError) throw logsError;

                // Update Last Update Time
                if (logs && logs.length > 0) {
                    setLastUpdate(formatTimeAgo(logs[0].created_at));
                } else if (!upcoming) {
                    setLastUpdate("Iniciada (sin reportes)");
                } else {
                    setLastUpdate("Esperando inicio...");
                }

                // Process Logs: Separate Wellness from Operations
                const opLogs = logs.filter(l => l.category !== 'Wellness');
                const wellnessLogs = logs.filter(l => l.category === 'Wellness');

                setCareLogs(opLogs);

                // Process Wellness Indicators (Latest wins)
                const newWellness = {
                    general: { value: 'Pendiente', status: 'En espera' },
                    energy: { value: 'Pendiente', status: 'En espera' },
                    mood: { value: 'Pendiente', status: 'En espera' }
                };

                // Helper to map value to status/color logic if needed, currently direct mapping
                wellnessLogs.forEach(log => {
                    // Assuming log.detail holds the selected value
                    if (log.action === 'Estado General' && newWellness.general.value === 'Pendiente') {
                        newWellness.general = { value: log.detail, status: log.detail === 'Estable' ? 'Normal' : 'Atención' };
                    }
                    if (log.action === 'Nivel de Energía' && newWellness.energy.value === 'Pendiente') {
                        newWellness.energy = { value: log.detail, status: log.detail === 'Alto' || log.detail === 'Adecuado' ? 'Bueno' : 'Bajo' };
                    }
                    if (log.action === 'Bienestar Hoy' && newWellness.mood.value === 'Pendiente') {
                        newWellness.mood = { value: log.detail, status: log.detail === 'Feliz' || log.detail === 'Tranquilo' ? 'Excelente' : 'Regular' };
                    }
                });

                setWellnessData(newWellness);

                // 4. Fetch additional premium stats (Hours & Ratings)
                fetchPremiumStats();

            } else {
                setActiveAppointment(null);
                setLastUpdate("Sin actividad reciente");
                // Even without active appointment, premium users might want to see overall stats
                fetchPremiumStats();
            }
        } catch (error) {
            console.error("Error fetching live data:", error);
        } finally {
            setLoadingData(false);
        }
    };

    const fetchPremiumStats = async () => {
        try {
            // Calculate Hours (Current Year Only)
            const { data: appsData, error: appsError } = await supabase
                .from('appointments')
                .select('date, time, end_time, status')
                .eq('client_id', profile.id);

            if (appsError) throw appsError;

            let stats = { confirmed: 0, pending: 0 };
            const currentYear = new Date().getFullYear();

            appsData.forEach(app => {
                const appYear = new Date(app.date).getFullYear();
                if (appYear === currentYear && app.time && app.end_time) {
                    const start = parseInt(app.time.split(':')[0]);
                    const end = parseInt(app.end_time.split(':')[0]);
                    if (!isNaN(start) && !isNaN(end) && end > start) {
                        const duration = end - start;
                        if (app.status === 'confirmed' || app.status === 'completed' || app.status === 'paid' || app.status === 'in_progress') {
                            stats.confirmed += duration;
                        } else if (app.status === 'pending') {
                            stats.pending += duration;
                        }
                    }
                }
            });
            setHoursStats(stats);

            // Fetch Average Rating
            const { data: reviewsData, error: reviewsError } = await supabase
                .from('reviews')
                .select('rating')
                .eq('reviewer_id', profile.id);

            if (reviewsError) throw reviewsError;

            if (reviewsData && reviewsData.length > 0) {
                const total = reviewsData.reduce((acc, curr) => acc + curr.rating, 0);
                setAverageRating((total / reviewsData.length).toFixed(1));
            }
        } catch (error) {
            console.error("Error fetching premium stats:", error);
        }
    };


    // Determine the agenda source
    let agendaItems = [];
    if (activeAppointment?.care_agenda && Array.isArray(activeAppointment.care_agenda) && activeAppointment.care_agenda.length > 0) {
        agendaItems = activeAppointment.care_agenda;
    } else if (activeAppointment?.details) {
        // Fallback to parsing details if care_agenda is empty
        agendaItems = activeAppointment.details.includes('[PLAN DE CUIDADO]')
            ? activeAppointment.details.split('[PLAN DE CUIDADO]')[1].split('---SERVICES---')[0].split('•').map(s => s.trim()).filter(s => s && s.length > 2)
            : activeAppointment.details.split(/[\n•]/).map(s => s.trim()).filter(s => s.length > 2);
    }

    const completedSet = new Set(careLogs.map(log => log.action));

    const careAgenda = agendaItems.map((item, idx) => {
        const isDone = completedSet.has(item);
        return {
            name: item,
            time: 'Actividad del día',
            frequency: 'Según plan',
            status: isDone ? 'Completado' : 'Pendiente',
            icon: isDone ? CircleCheck : CircleDashed,
            iconColor: isDone ? 'text-green-500' : 'text-gray-400'
        };
    });

    const handleUpdateAgenda = (newAgenda) => {
        // Optimistic update
        if (activeAppointment) {
            setActiveAppointment({ ...activeAppointment, care_agenda: newAgenda });
        }
    };

    const completedAgendaCount = careAgenda.filter(i => i.status === 'Completado').length;

    // REPLACED: Clinical metrics with Wellbeing Indicators
    const indicators = [
        { label: 'Estado de Bienestar', value: wellnessData.general.value, sub: 'Basado en reporte', icon: Heart, color: 'text-green-600', bg: 'bg-green-50', status: wellnessData.general.status },
        { label: 'Nivel de Energía', value: wellnessData.energy.value, sub: 'Activo', icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50', status: wellnessData.energy.status },
        { label: 'Bienestar Hoy', value: wellnessData.mood.value, sub: 'Tranquilo', icon: Wind, color: 'text-indigo-600', bg: 'bg-indigo-50', status: wellnessData.mood.status },
        { label: 'Rutina Cumplida', value: agendaItems.length > 0 ? `${Math.round((completedAgendaCount / agendaItems.length) * 100)}%` : '0%', sub: `${completedAgendaCount}/${agendaItems.length} tareas`, icon: CircleCheck, color: 'text-orange-600', bg: 'bg-orange-50', status: completedAgendaCount === agendaItems.length && agendaItems.length > 0 ? 'Completo' : 'En curso' },
        { label: 'Horas de Cuidado', value: `${hoursStats.confirmed}h`, sub: `Este año (${new Date().getFullYear()})`, icon: Clock, color: 'text-purple-600', bg: 'bg-purple-50', status: `${hoursStats.pending}h pendientes` },
        { label: 'Calificación Promedio', value: averageRating || '-', sub: 'Otorgada a cuidadores', icon: Star, color: 'text-amber-600', bg: 'bg-amber-50', status: 'Nivel de confianza' },
    ];



    return (
        <>
            {activeAppointment && (
                <ConfigureAgendaModal
                    isOpen={showAgendaModal}
                    onClose={() => setShowAgendaModal(false)}
                    appointmentId={activeAppointment.id}
                    currentAgenda={activeAppointment.care_agenda || []}
                    onSave={handleUpdateAgenda}
                />
            )}
            <div className="space-y-10 animate-fade-in max-w-[1600px] mx-auto pb-16 pt-4 px-4">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-[var(--primary-color)] p-8 rounded-[16px] shadow-2xl relative overflow-hidden !text-[#FAFAF7]">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--secondary-color)] rounded-full -translate-y-1/2 translate-x-1/2 blur-[100px] opacity-10"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3">
                            <h1 className="text-5xl font-brand font-bold !text-[#FAFAF7] tracking-tighter italic drop-shadow-sm">B<span className="text-[#2FAE8F]">C</span> <span className="text-[#2FAE8F]">PULSO</span></h1>
                            <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full border backdrop-blur-md flex items-center gap-2 ${activeAppointment
                                ? (isUpcoming ? 'text-[var(--warning-color)] bg-[var(--warning-color)]/10 border-[var(--warning-color)]/20' : 'text-[var(--secondary-color)] bg-[var(--secondary-color)]/10 border-[var(--secondary-color)]/20')
                                : 'text-[var(--accent-color)] bg-white/5 border-white/10'
                                }`}>
                                <span className={`w-2 h-2 rounded-full ${activeAppointment
                                    ? (isUpcoming ? 'bg-[var(--warning-color)]' : 'bg-[var(--secondary-color)] animate-pulse shadow-[0_0_10px_var(--secondary-color)]')
                                    : 'bg-white/20'
                                    }`}></span>
                                {activeAppointment ? (isUpcoming ? 'Próximo' : 'En Vivo') : 'Sin Actividad'}
                            </span>
                        </div>
                        <p className="text-[var(--accent-color)] mt-3 flex items-center gap-2 font-secondary opacity-80 text-sm">
                            <Clock size={16} /> Última actualización: {lastUpdate}
                        </p>
                    </div>
                    {/* Alerta Familiar Button */}
                    <div className="flex flex-col items-end gap-2 w-full md:w-auto relative z-10">
                        <button className="w-full md:w-auto bg-[var(--error-color)] hover:bg-red-700 !text-[#FAFAF7] px-10 py-4 rounded-[16px] font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-2xl shadow-red-900/40 transition-all hover:scale-105 active:scale-95 group border-none">
                            <AlertCircle size={24} className="group-hover:animate-bounce" /> ALERTA FAMILIAR
                        </button>
                        <p className="text-[10px] !text-[#FAFAF7]/40 font-bold uppercase tracking-widest text-center md:text-right w-full">Seguridad Prioritaria</p>
                    </div>
                </div>

                {/* Service Explanation Card */}
                <div className="card !p-8 animate-fade-in hover:border-[var(--secondary-color)]/10 transition-all">
                    <div className="flex flex-col md:flex-row items-center gap-8">
                        <div className="bg-[var(--secondary-color)]/10 p-5 rounded-[24px] text-[var(--secondary-color)] shadow-inner">
                            <ShieldCheck size={48} strokeWidth={1.5} />
                        </div>
                        <div className="flex-1 text-center md:text-left">
                            <h2 className="text-2xl font-brand font-bold mb-2 !text-[#0F3C4C] drop-shadow-sm">PULSO es tu espacio de seguimiento del cuidado y la tranquilidad familiar.</h2>
                            <p className="text-[var(--text-light)] font-secondary leading-relaxed">
                                Aquí puedes dar seguimiento a las actividades realizadas, las rutinas acordadas y los registros básicos de bienestar que el cuidador comparte contigo.
                            </p>
                        </div>
                        <div className="flex gap-8">
                            <div className="text-center">
                                <p className="text-3xl font-brand font-black text-[var(--primary-color)]">24/7</p>
                                <p className="text-[10px] text-[var(--text-light)] font-black uppercase tracking-widest mt-1">Acompañamiento</p>
                            </div>
                            <div className="w-px h-12 bg-gray-100 self-center"></div>
                            <div className="text-center">
                                <p className="text-3xl font-brand font-black text-[var(--secondary-color)]">100%</p>
                                <p className="text-[10px] text-[var(--text-light)] font-black uppercase tracking-widest mt-1">Confiable</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Indicators Grid */}
                    <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                        {indicators.map((item, idx) => (
                            <div key={idx} className="card !p-6 group hover:border-[var(--secondary-color)]/20 transition-all">
                                <div className="flex justify-between items-start mb-6">
                                    <div className={`p-4 rounded-[16px] ${item.bg.includes('green') || item.bg.includes('blue') || item.icon === Heart ? 'bg-[var(--secondary-color)] !text-[#FAFAF7]' : 'bg-[var(--primary-color)] !text-[#FAFAF7]'} group-hover:scale-110 transition-transform shadow-lg`}>
                                        <item.icon size={28} strokeWidth={2.5} />
                                    </div>
                                    <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${item.status === 'Normal' || item.status === 'Bueno' || item.status === 'Excelente' || item.status === 'Completo' ? 'text-[var(--secondary-color)] bg-[var(--secondary-color)]/10' : 'text-[var(--text-light)] bg-[var(--base-bg)]'
                                        }`}>{item.status}</span>
                                </div>
                                <div>
                                    <h3 className="text-4xl font-brand font-bold text-[var(--primary-color)] tracking-tight">{item.value}</h3>
                                    <div className="flex justify-between items-end mt-3">
                                        <div>
                                            <p className="text-sm font-brand font-bold text-[var(--primary-color)]">{item.label}</p>
                                            <p className="text-[10px] text-[var(--text-light)] font-black uppercase tracking-widest mt-0.5">{item.sub}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Care Log */}
                        <div className="md:col-span-2 card !p-0 overflow-hidden flex flex-col min-h-[400px]">
                            <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-[var(--base-bg)]/50 backdrop-blur-sm">
                                <h2 className="text-2xl font-brand font-bold text-[var(--primary-color)] flex items-center gap-3">
                                    <History size={24} className="text-[var(--secondary-color)]" /> Bitácora de Cuidado
                                </h2>
                                <button className="text-xs font-black text-[var(--secondary-color)] uppercase tracking-widest hover:underline">Ver Historial Completo</button>
                            </div>
                            <div className="p-8 space-y-6 flex-grow max-h-[500px] overflow-y-auto custom-scrollbar">
                                {careLogs.length > 0 ? (
                                    careLogs.map((log, idx) => (
                                        <div key={log.id || idx} className="border-b border-gray-50 pb-5 last:border-0 last:pb-0 group">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-2">
                                                <h4 className="font-brand font-bold text-[var(--primary-color)] text-lg leading-tight group-hover:text-[var(--secondary-color)] transition-colors">{log.action}</h4>
                                                <span className="text-[10px] font-black !text-[#FAFAF7] bg-[var(--primary-color)] px-3 py-1 rounded-full self-start md:self-auto shrink-0 uppercase tracking-widest">
                                                    {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>

                                            {log.detail && log.detail !== 'Completado según agenda' && (
                                                <p className="text-sm text-[var(--text-light)] font-secondary leading-relaxed bg-[var(--base-bg)] p-4 rounded-[16px] border border-gray-100">
                                                    {log.detail}
                                                </p>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-[var(--text-light)] py-16">
                                        <div className="w-20 h-20 bg-[var(--base-bg)] rounded-full flex items-center justify-center mb-6">
                                            <History size={40} className="opacity-20" />
                                        </div>
                                        <p className="italic font-secondary">No hay registros en la bitácora hoy.</p>
                                        <p className="text-[10px] mt-2 font-black uppercase tracking-widest opacity-40">Los registros aparecerán aquí automáticamente.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Sidebar - Care Agenda & Alerts */}
                    <div className="space-y-8">
                        {/* Care Agenda */}
                        <div className="card !p-0 overflow-hidden border-none shadow-2xl">
                            <div className="p-8 bg-gradient-to-br from-[var(--primary-color)] to-[#1a5a70] !text-[#FAFAF7] relative">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--secondary-color)] rounded-full -translate-y-1/2 translate-x-1/2 blur-[60px] opacity-20"></div>
                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-3 bg-white/10 rounded-[16px] backdrop-blur-md border border-white/20">
                                            <Clock size={24} />
                                        </div>
                                        {activeAppointment && (
                                            <button
                                                onClick={() => setShowAgendaModal(true)}
                                                className="p-2.5 bg-white/10 hover:bg-white/20 rounded-[16px] !text-[#FAFAF7] transition-all backdrop-blur-sm border border-white/10"
                                                title="Configurar Agenda"
                                            >
                                                <Settings size={20} />
                                            </button>
                                        )}
                                    </div>
                                    <h2 className="text-2xl font-brand font-bold !text-[#FAFAF7]">Agenda</h2>
                                    <p className="text-[var(--accent-color)] text-[10px] font-black uppercase tracking-widest mt-1 opacity-80">
                                        {careAgenda.length > 0
                                            ? `${careAgenda.filter(i => i.status === 'Completado').length} de ${careAgenda.length} actividades`
                                            : 'Sin actividades'}
                                    </p>
                                </div>
                            </div>
                            <div className="p-6 space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar bg-white">
                                {careAgenda.length > 0 ? (
                                    careAgenda.map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-4 p-4 rounded-[16px] bg-[var(--base-bg)] border border-gray-100 hover:border-[var(--secondary-color)]/20 transition-all cursor-pointer group">
                                            <div className="bg-[var(--primary-color)] p-2.5 rounded-[16px] shadow-lg !text-[#FAFAF7] group-hover:scale-110 transition-transform">
                                                <item.icon size={20} strokeWidth={2.5} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-brand font-bold text-[var(--primary-color)] text-sm truncate">{item.name}</h4>
                                                <p className="text-[10px] text-[var(--text-light)] font-black uppercase tracking-widest">{item.frequency}</p>
                                            </div>
                                            {item.status === 'Completado' && (
                                                <div className="bg-[var(--secondary-color)] !text-[#FAFAF7] p-1 rounded-full">
                                                    <Check size={14} strokeWidth={4} />
                                                </div>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-12 text-[var(--text-light)]">
                                        <div className="w-16 h-16 bg-[var(--base-bg)] rounded-[16px] flex items-center justify-center mx-auto mb-4">
                                            <ClipboardList size={32} className="opacity-20" />
                                        </div>
                                        <p className="text-sm font-secondary italic">No hay agenda configurada.</p>
                                        {activeAppointment && (
                                            <button onClick={() => setShowAgendaModal(true)} className="text-[10px] font-black uppercase tracking-widest text-[var(--secondary-color)] hover:underline mt-4">
                                                Configurar ahora
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                            {careAgenda.length > 3 && (
                                <div className="p-6 border-t border-gray-50 bg-white">
                                    <button
                                        onClick={() => setShowAgendaModal(true)}
                                        className="btn btn-outline w-full py-4 text-[10px] font-black uppercase tracking-widest"
                                    >
                                        <ClipboardList size={16} /> Gestionar Agenda Completa
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Quick Contact Card */}
                        <div className="card !p-8 relative overflow-hidden group border-none shadow-2xl">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--secondary-color)]/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
                            {caregiver ? (
                                <>
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-[var(--text-light)] mb-6">Contacto Directo</h3>
                                    <div className="flex items-center gap-5 mb-8">
                                        <div className="w-16 h-16 rounded-[16px] border-2 border-[var(--secondary-color)]/20 p-1 overflow-hidden shadow-lg">
                                            <img src={caregiver.avatar_url || "https://ui-avatars.com/api/?name=" + caregiver.full_name} alt="Cuidador" className="w-full h-full rounded-[16px] object-cover" />
                                        </div>
                                        <div>
                                            <p className="font-brand font-bold text-[var(--primary-color)] text-lg">{caregiver.full_name}</p>
                                            <p className="text-[10px] text-[var(--secondary-color)] font-black uppercase tracking-[0.1em] flex items-center gap-1.5 mt-1">
                                                <span className="w-2 h-2 bg-[var(--secondary-color)] rounded-full animate-pulse"></span> En servicio
                                            </p>
                                        </div>
                                    </div>
                                    <button className="btn btn-primary w-full py-4 text-[10px] font-black uppercase tracking-widest shadow-xl shadow-green-100">
                                        Enviar Mensaje
                                    </button>
                                </>
                            ) : (
                                <div className="text-center py-6">
                                    <div className="w-16 h-16 bg-[var(--base-bg)] rounded-[16px] flex items-center justify-center mx-auto mb-4">
                                        <ShieldCheck size={32} className="opacity-10 text-[var(--primary-color)]" />
                                    </div>
                                    <p className="text-[var(--text-light)] text-sm font-secondary italic">No hay cuidador activo en este momento.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default MonitoringCenter;
