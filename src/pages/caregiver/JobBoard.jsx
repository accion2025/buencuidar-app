import React, { useState, useEffect } from 'react';
import { Search, MapPin, DollarSign, Clock, Filter, Briefcase, MessageCircle, User, X, Calendar, Activity } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { translateAppointmentType } from '../../utils/translations';

const JobBoard = () => {
    const { user, profile } = useAuth();
    const navigate = useNavigate();
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [applying, setApplying] = useState(null);
    const [startingChat, setStartingChat] = useState(null);
    const [appliedJobs, setAppliedJobs] = useState({}); // Map: appointment_id -> status ('pending', 'rejected', 'approved')
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
        if (!user) {
            alert("Error: No se detecta usuario conectado. (User is null)");
            return;
        }

        const isCancelling = appliedJobs[job.id] === 'pending';

        if (isCancelling) {
            if (!window.confirm("¿Deseas cancelar tu solicitud para esta oferta?")) return;

            setApplying(job.id);
            try {
                const { error } = await supabase
                    .from('job_applications')
                    .delete()
                    .eq('appointment_id', job.id)
                    .eq('caregiver_id', user.id);

                if (error) throw error;

                // Update local state
                setAppliedJobs(prev => {
                    const next = { ...prev };
                    delete next[job.id];
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
            // New Flow: Insert into job_applications table
            const payload = {
                appointment_id: job.id,
                caregiver_id: user.id,
                status: 'pending'
            };

            const { error } = await supabase
                .from('job_applications')
                .insert([payload]);

            if (error) throw error;

            // Show success state locally
            setAppliedJobs(prev => ({ ...prev, [job.id]: 'pending' }));

        } catch (error) {
            console.error("Error applying:", error);
            if (error.code === '23505') {
                alert("Ya te has postulado a esta oferta.");
                setAppliedJobs(prev => ({ ...prev, [job.id]: 'pending' })); // Assume pending if exists
            } else {
                alert(`Error al postularse: ${error.message}`);
            }
        } finally {
            setApplying(null);
        }
    };

    const handleMessage = async (job) => {
        if (!user || !job.client?.id) return;
        setStartingChat(job.id);

        try {
            // 1. Check if conversation exists
            const { data: existingConvs, error: fetchError } = await supabase
                .from('conversations')
                .select('id')
                .or(`participant1_id.eq.${user.id},participant2_id.eq.${user.id}`)
                .or(`participant1_id.eq.${job.client.id},participant2_id.eq.${job.client.id}`);

            // Filter manually to ensure exact pair match (Supabase OR syntax can be tricky for exact pairing)
            // A conversation must allow BOTH participants.
            // Simplified query approach:

            // Re-query with explicit AND for the pair
            // (p1 = me AND p2 = them) OR (p1 = them AND p2 = me)
            const { data: conversations, error } = await supabase
                .from('conversations')
                .select('id')
                .or(`and(participant1_id.eq.${user.id},participant2_id.eq.${job.client.id}),and(participant1_id.eq.${job.client.id},participant2_id.eq.${user.id})`);

            if (error) throw error;

            let conversationId;

            if (conversations && conversations.length > 0) {
                conversationId = conversations[0].id;
            } else {
                // 2. Create new conversation
                const { data: newConv, error: createError } = await supabase
                    .from('conversations')
                    .insert([{
                        participant1_id: user.id,
                        participant2_id: job.client.id,
                        last_message: 'Hola, tengo interés en esta vacante.',
                        last_message_at: new Date()
                    }])
                    .select()
                    .single();

                if (createError) throw createError;
                conversationId = newConv.id;

                // 2b. Insert the actual initial message
                await supabase
                    .from('messages')
                    .insert([{
                        conversation_id: conversationId,
                        sender_id: user.id,
                        content: 'Hola, tengo interés en esta vacante.'
                    }]);
            }

            // 3. Navigate
            navigate('/caregiver/messages', { state: { conversationId: conversationId } });

        } catch (error) {
            console.error('Error starting chat:', error);
            alert('No se pudo iniciar el chat');
        } finally {
            setStartingChat(null);
        }
    };

    // DEBUG: Verify component re-render
    // console.log("JobBoard Rendered. User:", user);

    return (
        <div className="space-y-6 animate-fade-in" translate="no">
            {/* ... header ... */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-brand font-bold !text-[#0F3C4C]">Bolsa de Trabajo</h1>
                    <p className="text-gray-500 font-secondary mt-1">Encuentra oportunidades que se ajusten a tu horario.</p>
                </div>
                <div className="flex gap-2">
                    <button className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-[16px] text-sm font-medium hover:bg-gray-50">
                        <Filter size={16} /> Filtros
                    </button>
                    <button onClick={() => fetchJobs(0)} className="text-blue-600 text-sm font-medium hover:underline self-center">
                        Actualizar
                    </button>
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
            ) : jobs.length === 0 ? (
                <div className="text-center py-12">
                    <Briefcase size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">No hay ofertas disponibles en este momento.</p>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 gap-4">
                    {jobs.map(job => {
                        const applicationStatus = appliedJobs[job.id]; // 'pending', 'rejected', 'approved' or undefined
                        const isPulso = job.client?.subscription_status === 'active';

                        return (
                            <div key={job.id} className="bg-white p-8 rounded-[16px] border border-slate-100 hover:border-[var(--secondary-color)]/30 hover:shadow-2xl hover:shadow-slate-200 transition-all group relative overflow-hidden flex flex-col">
                                <div className="absolute top-0 right-0 flex flex-col items-end z-10">
                                    {isPulso && (
                                        <div className="bg-[#4F46E5] !text-[#FAFAF7] text-[10px] font-black px-4 py-1.5 rounded-bl-2xl shadow-lg flex items-center gap-2 uppercase tracking-widest">
                                            <Briefcase size={10} className="animate-pulse" /> SERVICIO PULSO
                                        </div>
                                    )}
                                    {job.care_agenda?.length > 0 && (
                                        <div className={`bg-amber-500 !text-white text-[9px] font-black px-4 py-1.5 shadow-lg flex items-center gap-2 uppercase tracking-widest ${isPulso ? 'rounded-bl-xl' : 'rounded-bl-2xl'}`}>
                                            <Clock size={10} /> EXIGE AGENDA DE CUIDADOS
                                        </div>
                                    )}
                                </div>
                                <h3 className="text-2xl font-brand font-bold !text-[#0F3C4C] mb-1 group-hover:text-[var(--secondary-color)] transition-colors uppercase tracking-tight pr-24">{job.title}</h3>
                                <div className="flex items-center gap-2 text-xs text-[#07212e] font-black uppercase tracking-widest mb-6 opacity-60">
                                    <User size={14} className="text-[var(--secondary-color)]" />
                                    <span>Cliente: {job.client?.full_name || 'Particular'}</span>
                                </div>

                                <div className="space-y-2 text-sm text-gray-600 mb-4">
                                    <div className="flex flex-col gap-1 mb-2">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Dirección del Servicio</span>
                                        <div className="flex items-center gap-2">
                                            <MapPin size={16} className="text-gray-400" />
                                            <span className="font-bold text-gray-700">{job.address || 'Dirección no especificada'}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-[#0F3C4C] font-semibold">
                                        <Calendar size={16} className="text-[var(--secondary-color)]" />
                                        {new Date(job.date + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                    </div>
                                    <div className="flex items-center gap-2 text-[#0F3C4C] font-semibold">
                                        <Clock size={16} className="text-[var(--secondary-color)]" />
                                        {job.time?.substring(0, 5)} {job.end_time ? `- ${job.end_time.substring(0, 5)}` : ''}
                                    </div>
                                    <div className="flex items-center gap-3 font-brand font-bold text-[#0F3C4C] text-lg bg-slate-50 p-4 rounded-[16px] border border-slate-100">
                                        <DollarSign size={20} className="text-[var(--secondary-color)]" /> {job.offered_rate || 'Por definir'}
                                    </div>
                                </div>

                                {/* Care Plan / Bitácora Section */}
                                <div className="mb-4">
                                    {(() => {
                                        // Priority 1: Structured Agenda
                                        if (job.care_agenda?.length > 0) {
                                            return (
                                                <div className="space-y-2">
                                                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-2">
                                                        <Clock size={12} /> Agenda Programada
                                                    </span>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {job.care_agenda.map((item, i) => (
                                                            <span key={i} className="text-[10px] bg-amber-50 text-amber-700 px-3 py-1.5 rounded-full font-black uppercase tracking-tighter border border-amber-100 flex items-center gap-1.5">
                                                                <span className="opacity-60">{item.time}</span> {item.activity}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        }

                                        // Priority 2: Standard Plan (Fallback)
                                        const details = job.details || '';
                                        const planMatch = details.match(/\[PLAN DE CUIDADO\]([\s\S]*?)(---SERVICES---|$)/);
                                        const services = planMatch ? planMatch[1].trim().split('\n').map(s => s.replace('• ', '').trim()).filter(Boolean) : [];

                                        if (services.length > 0) {
                                            return (
                                                <div className="space-y-2">
                                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                                        <Activity size={12} /> Actividades Definidas
                                                    </span>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {services.map((s, i) => (
                                                            <span key={i} className="text-[10px] bg-[var(--secondary-color)]/10 text-[var(--secondary-color)] px-3 py-1.5 rounded-full font-black uppercase tracking-tighter border border-[var(--secondary-color)]/10 flex items-center gap-1.5">
                                                                <Briefcase size={10} /> {s}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    })()}
                                </div>

                                {applicationStatus === 'rejected' ? (
                                    <div className="w-full py-2.5 rounded-[16px] font-bold text-center bg-red-100 text-red-600 border border-red-200 cursor-not-allowed">
                                        Solicitud Denegada
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-3 w-full">
                                        {applicationStatus === 'pending' ? (
                                            <>
                                                <div className="w-full py-4 rounded-[16px] font-black uppercase tracking-widest text-xs text-center bg-green-100 text-green-700 border border-green-200 shadow-sm flex items-center justify-center gap-2">
                                                    <Briefcase size={16} /> ¡SOLICITUD ENVIADA!
                                                </div>
                                                <button
                                                    onClick={() => handleApply(job)}
                                                    className="w-full py-3 rounded-[16px] font-bold uppercase tracking-widest text-[10px] border border-red-200 text-red-500 hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                                                >
                                                    <X size={14} /> CANCELAR SOLICITUD
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                onClick={() => handleApply(job)}
                                                disabled={applying === job.id}
                                                className="w-full py-5 rounded-[16px] font-black uppercase tracking-widest text-xs transition-all disabled:cursor-not-allowed shadow-xl bg-[var(--primary-color)] !text-[#FAFAF7] border-none hover:bg-[#1a5a70] shadow-blue-900/20 disabled:opacity-50"
                                            >
                                                {applying === job.id ? 'PROCESANDO...' : 'ENVIAR SOLICITUD'}
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Empty State / More jobs */}
            {!loading && jobs.length > 0 && hasMore && (
                <div className="text-center py-8">
                    <button onClick={handleLoadMore} className="text-blue-600 font-medium hover:underline">
                        Cargar más ofertas ({jobs.length} mostradas)
                    </button>
                    <div className="text-xs text-gray-400 mt-2">Página {page + 1}</div>
                </div>
            )}
        </div>
    );
};

export default JobBoard;
