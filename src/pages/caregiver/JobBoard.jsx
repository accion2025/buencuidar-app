import React, { useState, useEffect } from 'react';
import { Search, MapPin, DollarSign, Clock, Filter, Briefcase, MessageCircle } from 'lucide-react';
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

    useEffect(() => {
        let mounted = true;

        const loadJobs = async () => {
            if (!mounted) return;
            await fetchJobs();
        };

        loadJobs();

        return () => {
            mounted = false;
        };
    }, []);

    const fetchJobs = async () => {
        try {
            setLoading(true);

            // 1. Fetch appointments that are pending and have NO caregiver assigned (Open Jobs)
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
                .gte('date', new Date().toLocaleDateString('en-CA')) // YYYY-MM-DD in local time
                .order('date', { ascending: true });

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
            setJobs(jobsData || []);
        } catch (error) {
            console.error("Error fetching jobs:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleApply = async (job) => {
        if (!user) {
            alert("Error: No se detecta usuario conectado. (User is null)");
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
                    <h1 className="text-2xl font-bold text-gray-800">Bolsa de Trabajo</h1>
                    <p className="text-gray-500">Encuentra oportunidades que se ajusten a tu horario.</p>
                </div>
                <div className="flex gap-2">
                    <button className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">
                        <Filter size={16} /> Filtros
                    </button>
                    <button onClick={fetchJobs} className="text-blue-600 text-sm font-medium hover:underline self-center">
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
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none shadow-sm"
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
                            <div key={job.id} className="bg-white p-6 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all group relative overflow-hidden">
                                {isPulso && (
                                    <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl shadow-sm z-10 flex items-center gap-1">
                                        <Briefcase size={10} className="animate-pulse" /> SERVICIO PULSO
                                    </div>
                                )}
                                <h3 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors uppercase tracking-tight pr-20">{job.title}</h3>

                                <div className="space-y-2 text-sm text-gray-600 mb-4">
                                    <div className="flex items-center gap-2">
                                        <MapPin size={16} className="text-gray-400" /> {job.client?.address || 'Ubicación remota'}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {new Date(job.date + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock size={16} className="text-gray-400" />
                                        {job.time?.substring(0, 5)} {job.end_time ? `- ${job.end_time.substring(0, 5)}` : ''}
                                    </div>
                                    <div className="flex items-center gap-2 font-bold text-gray-800">
                                        <DollarSign size={16} className="text-green-600" /> {job.offered_rate || 'A convenir'}
                                    </div>
                                </div>

                                {/* Care Plan / Details cleanup */}
                                {job.details && (
                                    <div className="mb-4">
                                        {(() => {
                                            const details = job.details || '';
                                            const planMatch = details.match(/\[PLAN DE CUIDADO\]([\s\S]*?)(---SERVICES---|$)/);
                                            const services = planMatch ? planMatch[1].trim().split('\n').map(s => s.replace('• ', '').trim()).filter(Boolean) : [];

                                            if (services.length > 0) {
                                                return (
                                                    <div>
                                                        <div className="flex flex-wrap gap-1.5 mt-2">
                                                            {services.map((s, i) => (
                                                                <span key={i} className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md font-medium border border-blue-100 flex items-center gap-1">
                                                                    <Briefcase size={10} className="text-blue-500" /> {s}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        })()}
                                    </div>
                                )}

                                {applicationStatus === 'rejected' ? (
                                    <div className="w-full py-2.5 rounded-lg font-bold text-center bg-red-100 text-red-600 border border-red-200 cursor-not-allowed">
                                        Solicitud Rechazada
                                    </div>
                                ) : (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleApply(job)}
                                            disabled={applying === job.id || !!applicationStatus}
                                            className={`flex-grow py-2.5 rounded-lg font-bold transition-all disabled:cursor-not-allowed ${applicationStatus === 'pending'
                                                ? 'bg-green-600 text-white border border-green-600 disabled:opacity-100'
                                                : 'bg-blue-600 text-white border border-blue-600 hover:bg-blue-700 hover:border-blue-700 disabled:opacity-50'
                                                }`}
                                        >
                                            {applicationStatus === 'pending'
                                                ? '¡Solicitud Enviada!'
                                                : applying === job.id
                                                    ? 'Procesando...'
                                                    : 'Enviar solicitud'
                                            }
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Empty State / More jobs */}
            {!loading && jobs.length > 0 && (
                <div className="text-center py-8">
                    <button className="text-blue-600 font-medium hover:underline">Cargar más ofertas...</button>
                </div>
            )}
        </div>
    );
};

export default JobBoard;
