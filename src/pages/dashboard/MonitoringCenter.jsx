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
    ClipboardList
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import ConfigureAgendaModal from '../../components/dashboard/ConfigureAgendaModal';

const MonitoringCenter = () => {
    const { profile, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [lastUpdate] = useState("Hace 5 minutos");

    // Subscription Check
    const isSubscribed = profile?.subscription_status === 'active';

    if (authLoading) {
        return <div className="p-10 text-center text-gray-500">Cargando PULSO...</div>;
    }

    if (!isSubscribed) {
        return (
            <div className="flex-grow flex items-center justify-center py-12 px-4">
                <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl border border-blue-100 overflow-hidden p-12 space-y-8 animate-fade-in-up flex flex-col items-center text-center">
                    <div className="bg-blue-50 w-28 h-28 rounded-full flex items-center justify-center shadow-inner mx-auto mb-2">
                        <Lock size={56} className="text-blue-600 animate-pulse" />
                    </div>

                    <div className="space-y-4">
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight">Acceso Restringido a PULSO</h1>
                        <p className="text-gray-600 text-xl leading-relaxed max-w-lg mx-auto">
                            El centro de seguimiento de bienestar en tiempo real es una función exclusiva para usuarios con una suscripción activa a nuestro <span className="text-blue-600 font-bold">Servicio PULSO Premium</span>.
                        </p>
                    </div>

                    <div className="pt-8 flex justify-center w-full">
                        <button
                            onClick={() => navigate('/dashboard/plans')}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-5 rounded-2xl font-black text-lg shadow-xl shadow-blue-200 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3"
                        >
                            Ver Planes de Suscripción
                        </button>
                    </div>

                    <div className="pt-4 border-t border-gray-50">
                        <p className="text-sm text-gray-400">¿Ya estás suscrito? Contacta a soporte si crees que esto es un error.</p>
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

            } else {
                setActiveAppointment(null);
            }
        } catch (error) {
            console.error("Error fetching live data:", error);
        } finally {
            setLoadingData(false);
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
            <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-10">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-lg border border-gray-100 shadow-sm">
                    <div>
                        <h1 className="text-4xl font-black text-gray-800 flex items-center gap-2 tracking-tighter italic">
                            PULSO <span className={`text-sm font-normal not-italic px-3 py-1 rounded-full border flex items-center gap-1.5 ${activeAppointment
                                ? (isUpcoming ? 'text-orange-600 bg-orange-50 border-orange-100' : 'text-blue-500 bg-blue-50 border-blue-100')
                                : 'text-gray-500 bg-gray-50 border-gray-100'
                                }`}>
                                <span className={`w-2 h-2 rounded-full ${activeAppointment
                                    ? (isUpcoming ? 'bg-orange-600' : 'bg-blue-500 animate-pulse')
                                    : 'bg-gray-400'
                                    }`}></span>
                                {activeAppointment ? (isUpcoming ? 'Próximo' : 'En Vivo') : 'Sin Actividad'}
                            </span>
                        </h1>
                        <p className="text-gray-500 mt-1 flex items-center gap-2 font-medium">
                            <Clock size={16} /> Última actualización: {lastUpdate}
                        </p>
                    </div>
                    {/* RENAMED: Emergency -> Alerta Familiar */}
                    <div className="flex flex-col items-end gap-1 w-full md:w-auto">
                        <button className="w-full md:w-auto bg-amber-600 hover:bg-amber-700 text-white px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-200 transition-all hover:scale-105 active:scale-95 group">
                            <AlertCircle className="group-hover:animate-bounce" /> ALERTA FAMILIAR
                        </button>
                        <span className="text-[10px] text-gray-400 font-medium text-center md:text-right w-full">No sustituye servicios de emergencia locales.</span>
                    </div>
                </div>

                {/* Service Explanation Card */}
                <div className="bg-gradient-to-r from-[var(--primary-color)] to-[var(--primary-light)] p-1 rounded-lg shadow-lg animate-fade-in">
                    <div className="bg-white/95 backdrop-blur-sm p-6 rounded-xl flex flex-col md:flex-row items-center gap-6">
                        <div className="bg-green-100 p-4 rounded-2xl text-[var(--primary-color)]">
                            <ShieldCheck size={40} />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-xl font-bold text-gray-800 mb-1">PULSO es tu espacio de seguimiento del cuidado y la tranquilidad familiar.</h2>
                            <p className="text-gray-600 leading-relaxed">
                                Aquí puedes dar seguimiento a las actividades realizadas, las rutinas acordadas y los registros básicos de bienestar que el cuidador comparte contigo.
                            </p>
                        </div>
                        <div className="flex gap-4">
                            <div className="text-center px-4">
                                <p className="text-2xl font-bold text-[var(--primary-color)]">24/7</p>
                                <p className="text-xs text-gray-400 font-bold uppercase">Acompañamiento</p>
                            </div>
                            <div className="w-px h-10 bg-gray-200 self-center"></div>
                            <div className="text-center px-4">
                                <p className="text-2xl font-bold text-green-500">100%</p>
                                <p className="text-xs text-gray-400 font-bold uppercase">Confiable</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Indicators Grid (Formerly Vitals) */}
                    <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {indicators.map((item, idx) => (
                            <div key={idx} className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`${item.bg} ${item.color} p-3 rounded-xl group-hover:scale-110 transition-transform`}>
                                        <item.icon size={24} />
                                    </div>
                                    <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-md ${item.status === 'Normal' || item.status === 'Bueno' || item.status === 'Excelente' || item.status === 'Completo' ? 'text-green-600 bg-green-50' : 'text-gray-600 bg-gray-50'
                                        }`}>{item.status}</span>
                                </div>
                                <div className="flex items-baseline gap-1">
                                    <h3 className="text-2xl font-bold text-gray-800">{item.value}</h3>
                                </div>
                                <div className="flex justify-between items-center mt-1">
                                    <p className="text-sm text-gray-500 font-medium">{item.label}</p>
                                    <span className="text-xs text-gray-400">{item.sub}</span>
                                </div>
                            </div>
                        ))}

                        {/* Care Log (Formerly Clinical Log) */}
                        <div className="md:col-span-2 bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden flex flex-col min-h-[300px]">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                    <History size={20} className="text-blue-600" /> Bitácora de Cuidado
                                </h2>
                                <button className="text-blue-600 text-sm font-bold hover:underline">Ver Historial Completo</button>
                            </div>
                            <div className="p-6 space-y-4 flex-grow max-h-[400px] overflow-y-auto custom-scrollbar">
                                {careLogs.length > 0 ? (
                                    careLogs.map((log, idx) => (
                                        <div key={log.id || idx} className="border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-1">
                                                <h4 className="font-bold text-gray-800 text-sm leading-tight">{log.action}</h4>
                                                <span className="text-sm font-bold text-indigo-500 bg-indigo-50 px-2 py-1 rounded-lg self-start md:self-auto shrink-0">
                                                    {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>

                                            {/* Only show detail if it's custom or different from default */}
                                            {log.detail && log.detail !== 'Completado según agenda' && (
                                                <p className="text-sm text-gray-500 leading-relaxed">{log.detail}</p>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-400 py-10">
                                        <History size={48} className="mb-4 opacity-20" />
                                        <p className="italic">No hay registros en la bitácora hoy.</p>
                                        <p className="text-xs mt-2 text-gray-300">Los registros aparecerán aquí cuando el cuidador los añada.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Sidebar - Care Agenda & Alerts */}
                    <div className="space-y-6">
                        {/* Care Agenda (Formerly Medications) */}
                        <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden shadow-indigo-100/50 border-indigo-50">
                            <div className="p-6 bg-gradient-to-r from-indigo-600 to-blue-600 text-white flex justify-between items-start">
                                <div>
                                    <h2 className="text-xl font-bold flex items-center gap-2">
                                        <Clock size={20} /> Agenda de Cuidado
                                    </h2>
                                    <p className="text-indigo-100 text-sm mt-1">
                                        {careAgenda.length > 0
                                            ? `${careAgenda.filter(i => i.status === 'Completado').length} de ${careAgenda.length} actividades completadas`
                                            : 'Sin actividades configuradas'}
                                    </p>
                                </div>
                                {activeAppointment ? (
                                    <button
                                        onClick={() => {
                                            console.log("Opening Agenda Modal", activeAppointment);
                                            setShowAgendaModal(true);
                                        }}
                                        className="p-2 bg-white/20 hover:bg-white/30 rounded-lg text-white transition-colors pointer-events-auto relative z-10"
                                        title="Configurar Agenda"
                                    >
                                        <Settings size={20} />
                                    </button>
                                ) : (
                                    <div className="opacity-50 pointer-events-none p-2"><Settings size={20} /></div>
                                )}
                            </div>
                            <div className="p-4 space-y-3 max-h-[350px] overflow-y-auto custom-scrollbar">
                                {careAgenda.length > 0 ? (
                                    careAgenda.map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100 hover:border-indigo-100 transition-colors cursor-pointer group">
                                            <div className={`${item.iconColor} bg-white p-2 rounded-lg shadow-sm group-hover:scale-110 transition-transform`}>
                                                <item.icon size={20} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-gray-800 text-sm truncate">{item.name}</h4>
                                            </div>
                                            {item.status === 'Completado' && <Check size={16} className="text-green-500" strokeWidth={3} />}
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-gray-400">
                                        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <ClipboardList size={24} className="opacity-30" />
                                        </div>
                                        <p className="text-sm">No hay agenda configurada.</p>
                                        {activeAppointment && (
                                            <button onClick={() => setShowAgendaModal(true)} className="text-xs text-indigo-600 font-bold hover:underline mt-2">
                                                Configurar ahora
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                            {careAgenda.length > 3 && (
                                <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                                    <button
                                        onClick={() => setShowAgendaModal(true)}
                                        className="w-full py-2 bg-white border border-indigo-200 text-indigo-600 rounded-lg text-sm font-bold hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <ClipboardList size={16} /> Gestionar Agenda Completa
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Quick Contact Card */}
                        <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-6 relative overflow-hidden group">
                            {caregiver ? (
                                <>
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700"></div>
                                    <h3 className="font-bold text-gray-800 mb-4 relative z-10">Contacto Directo</h3>
                                    <div className="flex items-center gap-4 mb-6 relative z-10">
                                        <div className="w-12 h-12 rounded-full border-2 border-blue-500 p-0.5 overflow-hidden">
                                            <img src={caregiver.avatar_url || "https://ui-avatars.com/api/?name=" + caregiver.full_name} alt="Cuidador" className="w-full h-full rounded-full object-cover" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-800 text-sm">{caregiver.full_name}</p>
                                            <p className="text-xs text-green-500 font-medium flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> En servicio
                                            </p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 gap-3 relative z-10">
                                        <button className="bg-gray-100 text-gray-700 py-2 rounded-lg text-xs font-bold hover:bg-gray-200 transition-colors">
                                            Enviar Mensaje
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-4">
                                    <p className="text-gray-400 text-sm">No hay cuidador activo en este momento.</p>
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
