import React, { useState, useEffect } from 'react';
import { Search, MapPin, DollarSign, Clock, Filter, Briefcase, MessageSquare, User, X, Calendar, Activity, ShieldCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { translateAppointmentType } from '../../utils/translations';
import { CARE_AGENDA_CATEGORIES } from '../../constants/careAgenda';

const ACTIVITY_TRANSLATIONS = {
    'light_tasks': 'Tareas domésticas',
    'routine_org': 'Organización de rutina',
    'food_prep': 'Preparación de alimentos',
    'hygiene': 'Higiene y aseo personal',
    'medication': 'Control de medicación',
    'mobility': 'Movilidad y transferencias',
    'companionship': 'Acompañamiento',
    'exercise': 'Ejercicios físicos',
    'transport': 'Acompañamiento en transporte',
    'shopping': 'Compras y recados',
    'cognitive': 'Estimulación cognitiva',
    'night_care': 'Cuidado nocturno'
};

const JobBoard = () => {
    const { user, profile } = useAuth();
    const navigate = useNavigate();
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [applying, setApplying] = useState(null);
    const [startingChat, setStartingChat] = useState(null);
    const [appliedJobs, setAppliedJobs] = useState({}); // Map: appointment_id -> status ('pending', 'rejected', 'accepted')
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const JOBS_PER_PAGE = 10;

    useEffect(() => {
        let mounted = true;

        const cleanupExpiredJobs = async () => {
            // Disabled cleanup to rely on view filters and avoid accidental deletion (Safety First)
            return;
            try {
                const now = new Date();
                const todayStr = now.toLocaleDateString('en-CA');
                // Add 5 minutes grace period
                const graceTime = new Date(now.getTime() - 5 * 60 * 1000);
                const currentGraceTimeStr = `${String(graceTime.getHours()).padStart(2, '0')}:${String(graceTime.getMinutes()).padStart(2, '0')}:00`;

                // 1. Fetch strictly pending and unassigned jobs from TODAY onwards (to avoid fetching ancient history)
                // We rely on client-side filtering for precise time expiration.
                const { data: rawJobs, error: fetchError } = await supabase
                    .from('appointments')
                    .select('id, title, date, time, end_time, client_id')
                    .eq('status', 'pending')
                    .is('caregiver_id', null)
                    .neq('type', 'Cuidado+')
                    .gte('date', todayStr); // Allow fetching today's jobs to check time locally

                if (fetchError) throw fetchError;

                // 2. Strict 5-Minute Expiration Logic
                // Rule: Visible if NOW <= (End Time + 5 minutes)
                const validJobs = (rawJobs || []).filter(job => {
                    // Future dates are always visible
                    if (job.date > todayStr) return true;

                    // For today's jobs, calculate expiration time
                    // Default end_time or fall back to start_time (though end_time should exist)
                    const timeReference = job.end_time || job.time;

                    // Construct expiration Date object (Today at EndTime:00)
                    const [endHour, endMinute] = timeReference.split(':').map(Number);
                    const expirationDate = new Date();
                    expirationDate.setHours(endHour, endMinute + 5, 0, 0); // Add 5 minutes grace

                    const now = new Date();
                    return now <= expirationDate;
                });

                if (validJobs && validJobs.length > 0) {
                    for (const job of validJobs) {
                        // 1. Get ALL applicants for this job
                        const { data: applicants, error: appError } = await supabase
                            .from('job_applications')
                            .select('caregiver_id')
                            .eq('appointment_id', job.id);

                        if (appError) continue;

                        if (applicants && applicants.length > 0) {
                            for (const applicant of applicants) {
                                try {
                                    // Mandatory Alert in Notifications Center (ONLY)
                                    await supabase.from('notifications').insert({
                                        user_id: applicant.caregiver_id,
                                        title: 'Oferta Expirada',
                                        message: `La vacante "${job.title}" para el ${job.date} ha expirado.`,
                                        type: 'system',
                                        is_read: false
                                    });
                                } catch (notifErr) {
                                    console.error(`Error notifying applicant ${applicant.caregiver_id}:`, notifErr);
                                }
                            }

                            // 2. Mark applications as CANCELLED (Do NOT delete)
                            await supabase
                                .from('job_applications')
                                .update({ status: 'cancelled' })
                                .eq('appointment_id', job.id);
                        }

                        // 3. Mark job as cancelled
                        await supabase
                            .from('appointments')
                            .update({ status: 'cancelled' })
                            .eq('id', job.id);
                    }
                    // Refresh if any expired
                    fetchJobs(0);
                }
            } catch (err) {
                console.error("Error cleaning up expired jobs:", err);
            }
        };

        const loadJobs = async () => {
            if (!mounted) return;
            await cleanupExpiredJobs();
            await fetchJobs(0);
        };

        loadJobs();

        // Real-time subscription to see edits immediately
        const subscription = supabase
            .channel('job_board_updates')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'appointments' },
                () => {
                    console.log('Appointments changed, refreshing job board...');
                    fetchJobs(0);
                }
            )
            .subscribe();

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const fetchJobs = async (pageNumber = 0) => {
        try {
            if (pageNumber === 0) setLoading(true);

            const now = new Date();
            const todayStr = now.toLocaleDateString('en-CA');

            const from = pageNumber * JOBS_PER_PAGE;
            const to = from + JOBS_PER_PAGE - 1;

            // Add 5 minutes grace period
            const graceTime = new Date(now.getTime() - 5 * 60 * 1000);
            const currentGraceTimeStr = `${String(graceTime.getHours()).padStart(2, '0')}:${String(graceTime.getMinutes()).padStart(2, '0')}:00`;

            // 1. Fetch appointments that are pending and have NO caregiver assigned (Open Jobs)
            // Bring all from today onwards to filter more reliably in JavaScript
            const { data: jobsData, error: jobsError } = await supabase
                .from('appointments')
                .select(`
                    *,
                    client:client_id (
                        id,
                        full_name,
                        address,
                        avatar_url,
                        subscription_status
                    ),
                    patient:patient_id (*)
                `)
                .eq('status', 'pending')
                .is('caregiver_id', null)
                .neq('type', 'Cuidado+')
                .gte('date', todayStr) // Fetch today and future, filter time later
                .order('date', { ascending: true })
                .order('time', { ascending: true })
                .range(from, to);

            if (jobsError) throw jobsError;

            // 2. Fetch applications already made by this user to mark them
            const appliedMap = {};
            if (user) {
                const { data: appsData, error: appsError } = await supabase
                    .from('job_applications')
                    .select('appointment_id, status')
                    .eq('caregiver_id', user.id);

                if (appsError) throw appsError;

                if (appsData) {
                    appsData.forEach(app => {
                        appliedMap[app.appointment_id] = app.status;
                    });
                }
            }

            setAppliedJobs(appliedMap);

            // 2. Client-side filter: Strict 5-Minute Expiration Rule
            // Visible if NOW <= (EndTime + 5 minutes)
            const filteredJobs = (jobsData || []).filter(job => {
                // Future dates are always visible
                if (job.date > todayStr) return true;

                // For today's jobs:
                const timeReference = job.end_time || job.time;
                const [endHour, endMinute] = timeReference.split(':').map(Number);

                const expirationDate = new Date();
                expirationDate.setHours(endHour, endMinute + 5, 0, 0); // Grace period: 5 minutes

                const now = new Date();
                return now <= expirationDate;
            });

            if (pageNumber === 0) {
                setJobs(filteredJobs);
            } else {
                setJobs(prev => [...prev, ...filteredJobs]);
            }

            if (jobsData && jobsData.length < JOBS_PER_PAGE) {
                setHasMore(false);
            } else {
                setHasMore(true);
            }

            setPage(pageNumber);

        } catch (error) {
            console.error("Error fetching jobs:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleLoadMore = () => {
        fetchJobs(page + 1);
    };

    const handleApply = async (job) => {
        if (!user) return;
        const checkId = job.isGroup ? job.appointments[0].id : job.id;
        const isCurrentlyApplied = appliedJobs[checkId];

        if (isCurrentlyApplied) {
            // Cancel flow
            setApplying(job.id);
            try {
                const idsToCancel = job.isGroup ? job.appointments.map(a => a.id) : [job.id];
                const { error } = await supabase
                    .from('job_applications')
                    .delete()
                    .in('appointment_id', idsToCancel)
                    .eq('caregiver_id', user.id);

                if (error) throw error;

                setAppliedJobs(prev => {
                    const next = { ...prev };
                    idsToCancel.forEach(id => delete next[id]);
                    return next;
                });
            } catch (error) {
                console.error("Error cancelling:", error);
                alert("Error al cancelar la solicitud.");
            } finally {
                setApplying(null);
            }
            return;
        }

        setApplying(job.id);
        try {
            const appointments = job.isGroup ? job.appointments : [job];
            const payloads = appointments.map(a => ({
                appointment_id: a.id,
                caregiver_id: user.id,
                status: 'pending'
            }));

            const { error } = await supabase
                .from('job_applications')
                .insert(payloads);

            if (error) throw error;

            const newAppliedState = { ...appliedJobs };
            appointments.forEach(a => {
                newAppliedState[a.id] = 'pending';
            });
            setAppliedJobs(newAppliedState);

        } catch (error) {
            console.error("Error applying:", error);
            if (error.code === '23505') {
                alert("Ya te has postulado a esta oferta.");
            } else {
                alert(`Error al postularse: ${error.message}`);
            }
        } finally {
            setApplying(null);
        }
    };

    // Start chat conversation
    const handleStartChat = async (job) => {
        if (!user) return;
        try {
            setStartingChat(job.id);
            const clientId = job.client?.id || job.client_id;
            const { data: existing, error: fetchError } = await supabase
                .from('conversations')
                .select('id')
                .or(`participant1_id.eq.${user.id},participant2_id.eq.${user.id}`)
                .or(`participant1_id.eq.${clientId},participant2_id.eq.${clientId}`);

            let conversationId;
            if (existing && existing.length > 0) {
                conversationId = existing[0].id;
            } else {
                const { data: newConv, error: createError } = await supabase
                    .from('conversations')
                    .insert([{
                        participant1_id: user.id,
                        participant2_id: clientId,
                        last_message: 'Hola, tengo interés en esta vacante.',
                        last_message_at: new Date()
                    }])
                    .select()
                    .single();

                if (createError) throw createError;
                conversationId = newConv.id;

                await supabase
                    .from('messages')
                    .insert([{
                        conversation_id: conversationId,
                        sender_id: user.id,
                        content: 'Hola, tengo interés en esta vacante.'
                    }]);
            }

            if (conversationId) {
                navigate('/caregiver/messages', { state: { conversationId: conversationId } });
            }
        } catch (error) {
            console.error('Error starting chat:', error);
            alert('No se pudo iniciar el chat');
        } finally {
            setStartingChat(null);
        }
    };

    const groupJobs = (allJobs) => {
        const groups = {};
        const individualJobs = [];

        allJobs.forEach(job => {
            if (job.service_group_id) {
                if (!groups[job.service_group_id]) {
                    groups[job.service_group_id] = {
                        ...job,
                        isGroup: true,
                        appointments: [job],
                        dates: [job.date],
                        allPrograms: job.details?.includes('Cuidado Especializado:') ? job.details.split('\n')[0].replace('Cuidado Especializado: ', '').split(' + ') : [],
                        care_agenda: job.care_agenda || (job.details?.includes('---SERVICES---') ? JSON.parse(job.details.split('---SERVICES---')[1]) : [])
                    };
                } else {
                    groups[job.service_group_id].appointments.push(job);
                    groups[job.service_group_id].dates.push(job.date);
                }
            } else {
                individualJobs.push({
                    ...job,
                    isGroup: false,
                    care_agenda: job.care_agenda || (job.details?.includes('---SERVICES---') ? JSON.parse(job.details.split('---SERVICES---')[1]) : [])
                });
            }
        });

        const refinedGroups = Object.values(groups).map(g => {
            g.dates.sort();
            g.startDate = g.dates[0];
            g.endDate = g.dates[g.dates.length - 1];
            return g;
        });

        return [...refinedGroups, ...individualJobs].sort((a, b) => {
            const dateA = a.isGroup ? a.startDate : a.date;
            const dateB = b.isGroup ? b.startDate : b.date;
            return dateA.localeCompare(dateB);
        });
    };

    const displayJobs = groupJobs(jobs);

    // DEBUG: Verify component re-render
    // console.log("JobBoard Rendered. User:", user);

    return (
        <div className="space-y-6 animate-fade-in" translate="no">
            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-brand font-bold !text-[#0F3C4C]">Bolsa de Trabajo</h1>
                    <p className="text-gray-500 font-secondary mt-1">Encuentra oportunidades que se ajusten a tu horario.</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2">
                        <button className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-[16px] text-sm font-medium hover:bg-gray-50">
                            <Filter size={16} /> Filtros
                        </button>
                        <button onClick={() => fetchJobs(0)} className="text-blue-600 text-sm font-medium hover:underline">
                            Actualizar
                        </button>
                    </div>

                    {!loading && hasMore && (
                        <button
                            onClick={handleLoadMore}
                            className="text-xs font-black uppercase tracking-widest text-gray-500 hover:text-[#0F3C4C] border-b border-dashed border-gray-300 hover:border-[#0F3C4C] transition-colors pb-0.5"
                        >
                            + Cargar más ofertas
                        </button>
                    )}
                </div>
            </header>

            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
                <input
                    type="text"
                    placeholder="Buscar por zona, especialidad o tarifa..."
                    className="w-full pl-12 pr-4 py-3 rounded-[16px] border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none shadow-sm"
                />
            </div>

            {/* Job List */}
            {loading ? (
                <div className="text-center py-12 text-gray-400">Cargando ofertas...</div>
            ) : displayJobs.length === 0 ? (
                <div className="text-center py-12">
                    <Briefcase size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">No hay ofertas disponibles en este momento.</p>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 gap-6">
                    {displayJobs.map(job => {
                        const checkId = job.isGroup ? job.appointments[0].id : job.id;
                        const applicationStatus = appliedJobs[checkId];
                        const isPulso = job.client?.subscription_status === 'active';
                        const isPack = job.isGroup;

                        // Helper to get valid categories for this specific job
                        const getValidAgendaCategories = (agenda) => {
                            if (!agenda || agenda.length === 0) return [];
                            return [...new Set(agenda.map(item => {
                                const activityName = typeof item === 'string' ? item : (item.activity || item.name);
                                let category = null;

                                // 1. Try finding by Activity Name (Direct match in any category)
                                category = CARE_AGENDA_CATEGORIES.find(cat => {
                                    if (cat.activities?.includes(activityName)) return true;
                                    if (cat.sections) {
                                        return cat.sections.some(sec => sec.activities?.includes(activityName));
                                    }
                                    return false;
                                });

                                // 2. Try finding by Category ID (if activityName matches a category ID directly)
                                if (!category) {
                                    category = CARE_AGENDA_CATEGORIES.find(cat => cat.id === activityName);
                                }

                                // 3. Map legacy keys to new categories
                                if (!category) {
                                    const LEGACY_MAP = {
                                        // Original Legacy
                                        'medication': 'technical_advanced',
                                        'companionship': 'connective',
                                        'exercise': 'technical_routine',
                                        'transport': 'mobility',
                                        'shopping': 'home_food',
                                        'night_care': 'high_specialized',

                                        // ServiceSelector Mappings
                                        // Vida Diaria
                                        'hygiene': 'dependent_life',
                                        'mobility': 'mobility', // Self-match fallback
                                        'routine_org': 'dependent_life',

                                        // Hogar
                                        'food_prep': 'home_food',
                                        'light_tasks': 'home_food',
                                        'activity_reminders': 'dependent_life',

                                        // Emocional
                                        'active_company': 'connective',
                                        'emotional_support': 'connective',
                                        'recreational': 'connective',

                                        // Movilidad
                                        'outdoor_accompany': 'mobility',
                                        'appointments_support': 'mobility',
                                        'safe_transfers': 'mobility',

                                        // Coordinación
                                        'family_comm': 'dependent_life',
                                        'routine_followup': 'dependent_life',
                                        'agenda_org': 'dependent_life',

                                        // Activación
                                        'gentle_walks': 'technical_routine',
                                        'light_exercises': 'technical_routine',
                                        'stretches': 'technical_routine',

                                        // Humanizado
                                        'close_presence': 'high_specialized',
                                        'personalized_attention': 'high_specialized',
                                        'delicate_support': 'high_specialized'
                                    };
                                    const mappedId = LEGACY_MAP[activityName];
                                    if (mappedId) {
                                        category = CARE_AGENDA_CATEGORIES.find(cat => cat.id === mappedId);
                                    }
                                }

                                return category ? category.name : null;
                            }).filter(Boolean))];
                        };

                        const careAgenda = job.care_agenda || [];
                        const validCategories = getValidAgendaCategories(careAgenda);
                        const hasAgendaItems = careAgenda.length > 0;
                        const hasValidAgenda = hasAgendaItems; // Strict check: must have items

                        return (
                            <div key={job.id} className="bg-white p-8 rounded-[16px] border border-slate-100 hover:border-[var(--secondary-color)]/30 hover:shadow-2xl hover:shadow-slate-200 transition-all group relative overflow-hidden flex flex-col">
                                <div className="absolute top-0 right-0 flex flex-col items-end z-10">
                                    {isPulso && !isPack && (
                                        <div className="bg-[#4F46E5] !text-[#FAFAF7] text-[9px] font-black px-4 py-1.5 rounded-bl-2xl shadow-lg flex items-center gap-2 uppercase tracking-widest">
                                            <Briefcase size={10} className="animate-pulse" /> SERVICIO PULSO
                                        </div>
                                    )}
                                    {hasValidAgenda && (
                                        <div className={`bg-amber-500 !text-[#FAFAF7] text-[9px] font-black px-4 py-1.5 shadow-lg flex items-center gap-2 uppercase tracking-widest ${isPulso && !isPack ? 'rounded-bl-xl' : 'rounded-bl-2xl'}`}>
                                            <Clock size={10} /> EXIGE AGENDA DE CUIDADOS
                                        </div>
                                    )}
                                </div>
                                <h3 className="text-2xl font-brand font-bold !text-[#0F3C4C] mb-1 group-hover:text-[var(--secondary-color)] transition-colors uppercase tracking-tight pr-24">{job.title}</h3>
                                <div className="flex items-center gap-2 text-xs text-[#07212e] font-black uppercase tracking-widest mb-6 opacity-60">
                                    <User size={14} className="text-[var(--secondary-color)]" />
                                    <span className="text-[#0F3C4C]">Cliente: {job.client?.full_name || 'Particular'}</span>
                                </div>

                                <div className="space-y-4 text-sm text-gray-600 mb-4">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] font-black text-[#0F3C4C] uppercase tracking-widest">Dirección del Servicio</span>
                                        <div className="flex items-center gap-2">
                                            <MapPin size={16} className="text-gray-400" />
                                            <span className="font-bold text-gray-700">{job.address || 'Dirección no especificada'}</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-3 bg-slate-50/50 p-4 rounded-[16px] border border-slate-100">
                                        <div className="flex items-center gap-2 text-[#0F3C4C] font-black uppercase text-[10px] tracking-wider">
                                            <Calendar size={14} className="text-[var(--secondary-color)]" />
                                            {isPack ? (
                                                <span>
                                                    {(() => {
                                                        const formatDate = (dStr, withYear) => {
                                                            const d = new Date(dStr + 'T12:00:00');
                                                            const weekday = d.toLocaleDateString('es-ES', { weekday: 'long' });
                                                            const day = d.getDate();
                                                            const month = d.toLocaleDateString('es-ES', { month: 'short' }).replace('.', '');
                                                            return withYear
                                                                ? `${weekday}, ${day} ${month} de ${d.getFullYear()}`
                                                                : `${weekday}, ${day} ${month}`;
                                                        };
                                                        return `${formatDate(job.startDate, false)} - ${formatDate(job.endDate, true)}`;
                                                    })()}
                                                </span>
                                            ) : (
                                                <span>{new Date(job.date + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-[#0F3C4C] font-black uppercase text-[10px] tracking-wider">
                                            <Clock size={14} className="text-[var(--secondary-color)]" />
                                            Turno: {job.time?.substring(0, 5)} {job.end_time ? `- ${job.end_time.substring(0, 5)}` : ''}
                                        </div>
                                    </div>
                                    {/* Programs (for Pack) or Activities (for Singles) */}
                                    <div className="mb-2">
                                        {isPack && job.allPrograms?.length > 0 ? (
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <span className="text-[10px] font-black text-[#0F3C4C] uppercase tracking-widest">Programas Incluidos</span>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {job.allPrograms.map((p, idx) => (
                                                            <span key={idx} className="px-3 py-1 bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase rounded-full border border-emerald-100">
                                                                {p}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            hasValidAgenda ? (
                                                <div className="space-y-2">
                                                    <span className="text-[11px] font-black text-[#0F3C4C] uppercase tracking-widest">Agenda de Cuidado</span>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {validCategories.map((catName, i) => (
                                                            <span key={i} className="px-3 py-1 bg-amber-50 text-amber-700 text-[9px] font-black uppercase rounded-full border border-amber-100">
                                                                {catName}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    <span className="text-[11px] font-black text-[#0F3C4C] uppercase tracking-widest">Información del Servicio</span>
                                                    <p className="text-xs text-slate-500 font-medium italic">
                                                        {job.details?.split('---SERVICES---')[0]?.replace('[PLAN DE CUIDADO]', '').trim() || 'Acompañamiento y cuidado general según necesidades del paciente.'}
                                                    </p>
                                                </div>
                                            )
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                        <div className="flex items-center gap-2">
                                            <DollarSign size={20} className="text-[var(--secondary-color)]" />
                                            <span className="text-2xl font-brand font-bold text-[#0F3C4C]">{job.offered_rate || 'Por definir'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="mt-auto pt-6 flex flex-col gap-3">
                                    {applicationStatus === 'pending' ? (
                                        <>
                                            <div className="w-full py-4 rounded-[16px] font-black uppercase tracking-widest text-xs text-center bg-green-100 text-green-700 border border-green-200 shadow-sm flex items-center justify-center gap-2">
                                                <Briefcase size={16} /> ¡SOLICITUD ENVIADA!
                                            </div>
                                            <button
                                                onClick={() => handleApply(job)}
                                                disabled={applying === job.id}
                                                className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-700 transition-colors"
                                            >
                                                {applying === job.id ? 'CANCELANDO...' : 'CANCELAR SOLICITUD'}
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={() => handleApply(job)}
                                            disabled={applying === job.id}
                                            className="w-full py-5 bg-[#0F3C4C] !text-[#FAFAF7] rounded-[16px] font-black uppercase tracking-[0.2em] text-xs shadow-xl hover:bg-[#164b5f] hover:scale-[1.02] transition-all disabled:opacity-50"
                                        >
                                            {applying === job.id ? 'PROCESANDO...' : 'ENVIAR SOLICITUD'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {!loading && displayJobs.length > 0 && hasMore && (
                <div className="text-center py-12 border-t border-gray-100 mt-8">
                    <p className="text-gray-400 text-xs uppercase tracking-widest">
                        Mostrando {jobs.length} resultados
                    </p>
                </div>
            )}
        </div>
    );
};

export default JobBoard;
