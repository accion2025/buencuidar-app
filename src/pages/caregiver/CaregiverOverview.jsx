import React, { useState, useEffect } from 'react';
import { DollarSign, Clock, Star, Calendar, ArrowRight, User, Bell, Check, X, Loader2, FileText, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

import EditPaymentModal from '../../components/dashboard/EditPaymentModal';
import AddCareLogModal from '../../components/dashboard/AddCareLogModal';
import WellnessReportModal from '../../components/dashboard/WellnessReportModal';

const CaregiverOverview = () => {
    const navigate = useNavigate();
    const { profile, user, profileLoading } = useAuth();
    const [newRequests, setNewRequests] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [myApplications, setMyApplications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLogModalOpen, setIsLogModalOpen] = useState(false);
    const [showWellnessModal, setShowWellnessModal] = useState(false);

    // Payment Modal State
    const [editingPayment, setEditingPayment] = useState(null);
    const [recentPayments, setRecentPayments] = useState([]);

    const handleAcknowledge = async (notification) => {
        try {
            // 1. Mark as seen locally and in DB
            const { error: updateError } = await supabase
                .from('appointments')
                .update({ modification_seen_by_caregiver: true })
                .eq('id', notification.id);

            if (updateError) throw updateError;

            // Updated local state
            setNotifications(prev => prev.map(n =>
                n.id === notification.id ? { ...n, modification_seen_by_caregiver: true } : n
            ));

            // 2. Send acknowledgment message to client
            if (notification.client_id) {
                // Formatting date and time for the message
                const timeString = notification.end_time
                    ? `${notification.time.substring(0, 5)} - ${notification.end_time.substring(0, 5)}`
                    : notification.time.substring(0, 5);

                let msgContent = '';
                if (notification.status === 'cancelled') {
                    msgContent = `SISTEMA: He recibido el aviso de cancelación para el turno del ${notification.date} (${timeString}). Queda eliminado de mi agenda de trabajo.`;
                } else if (notification.is_modification) {
                    msgContent = `SISTEMA: Confirmo que he visto los cambios en el turno para el ${notification.date} (${timeString}). Asistencia confirmada con los nuevos datos.`;
                } else {
                    msgContent = `SISTEMA: ¡Cita aprobada! Muchas gracias por la confianza. Confirmo mi asistencia para el ${notification.date} a las ${timeString}.`;
                }

                // Check for existing conversation
                const { data: existingConv } = await supabase
                    .from('conversations')
                    .select('id')
                    .or(`and(participant1_id.eq.${user.id},participant2_id.eq.${notification.client_id}),and(participant1_id.eq.${notification.client_id},participant2_id.eq.${user.id})`)
                    .single();

                let conversationId = existingConv?.id;

                if (!conversationId) {
                    const { data: newConv, error: createError } = await supabase
                        .from('conversations')
                        .insert({
                            participant1_id: user.id,
                            participant2_id: notification.client_id,
                            last_message: msgContent,
                            last_message_at: new Date().toISOString()
                        })
                        .select()
                        .single();
                    if (!createError) conversationId = newConv.id;
                }

                if (conversationId) {
                    await supabase.from('messages').insert({
                        conversation_id: conversationId,
                        sender_id: user.id,
                        content: msgContent
                    });
                    // Update conversation timestamp
                    await supabase
                        .from('conversations')
                        .update({ last_message: msgContent, last_message_at: new Date().toISOString() })
                        .eq('id', conversationId);
                }
            }

        } catch (error) {
            console.error('Error acknowledging modification:', error);
        }
    };
    const rawName = profile?.full_name ? profile.full_name.split(' ')[0] : '...';
    const firstName = rawName.charAt(0).toUpperCase() + rawName.slice(1).toLowerCase();

    const [stats, setStats] = useState([
        { label: 'Ganancias (Mes)', value: '$0', icon: DollarSign, color: 'text-green-600', bg: 'bg-green-100' },
        { label: 'Horas Trabajadas', value: '0h', icon: Clock, color: 'text-blue-600', bg: 'bg-blue-100' },
        { label: 'Calificación', value: '5.0', icon: Star, color: 'text-yellow-600', bg: 'bg-yellow-100' },
        { label: 'Próximos Turnos', value: '0', icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-100' },
    ]);
    const [nextShifts, setNextShift] = useState([]);
    const [loadingRequests, setLoadingRequests] = useState(true);
    const [isAvailable, setIsAvailable] = useState(true);

    useEffect(() => {
        if (user && !profileLoading) { // Wait for auth and profile attempt to finish
            const loadData = async () => {
                try {
                    await Promise.all([
                        fetchNewRequests(),
                        fetchMyApplications(),
                        fetchDashboardData(),
                        fetchAvailability(),
                        fetchNotifications()
                    ]);
                } catch (error) {
                    console.error("Error loading dashboard data:", error);
                } finally {
                    setIsLoading(false);
                }
            };
            loadData();
        }
    }, [user, profileLoading, profile]);

    const fetchNotifications = async () => {
        try {
            const { data, error } = await supabase
                .from('appointments')
                .select(`
                    *,
                    client:client_id (full_name),
                    modification_seen_by_caregiver
                `)
                .eq('caregiver_id', user.id)
                .in('status', ['confirmed', 'cancelled'])
                .order('updated_at', { ascending: false }) // Order by updated_at to show latest changes
                .limit(5);

            if (error) throw error;
            setNotifications(data || []);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    // ... (keep existing functions)

    const timeAgo = (dateIdx) => {
        const date = new Date(dateIdx);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return 'Hace un momento';
        if (diffInSeconds < 3600) return `Hace ${Math.floor(diffInSeconds / 60)} min`;
        if (diffInSeconds < 86400) return `Hace ${Math.floor(diffInSeconds / 3600)} h`;
        return `Hace ${Math.floor(diffInSeconds / 86400)} días`;
    };

    // ... (in render)



    const fetchAvailability = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('is_available')
                .eq('id', user.id)
                .single();

            if (error) throw error;
            if (data) setIsAvailable(data.is_available);
        } catch (error) {
            console.error("Error fetching availability:", error);
        }
    };

    const handleAvailabilityToggle = async (e) => {
        const newValue = e.target.checked;
        setIsAvailable(newValue); // Optimistic update

        try {
            const { error } = await supabase
                .from('profiles')
                .update({ is_available: newValue })
                .eq('id', user.id);

            if (error) {
                throw error;
                setIsAvailable(!newValue); // Revert on error
            }
        } catch (error) {
            console.error("Error updating availability:", error);
            setIsAvailable(!newValue); // Revert on error
            alert("Error al actualizar disponibilidad");
        }
    };

    const fetchDashboardData = async () => {
        try {
            const today = new Date().toLocaleDateString('en-CA'); // Local YYYY-MM-DD

            // 1. Fetch Next Shift
            const { data: nextShiftData } = await supabase
                .from('appointments')
                .select(`
                    *,
                    client:client_id (
                        full_name,
                        address,
                        avatar_url,
                        avatar_url,
                        patients (*)
                    ),
                    patient:patient_id (*)
                `)
                .eq('caregiver_id', user.id)
                .neq('status', 'cancelled')
                .or(`status.eq.in_progress,and(status.eq.confirmed,date.gte.${today})`)
                .order('date', { ascending: true })
                .order('time', { ascending: true })
                .limit(3);

            const filteredShifts = (nextShiftData || []).filter(s => s.status !== 'cancelled');
            setNextShift(filteredShifts);

            // 2. Fetch Completed Shifts (Current Month) for Stats
            const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

            const { data: completedThisMonth } = await supabase
                .from('appointments')
                .select('*')
                .eq('caregiver_id', user.id)
                .gte('date', startOfMonth)
                .or('status.eq.completed,status.eq.paid'); // Include paid ones too

            // 2b. Calculate Real Rating (Fetch ALL reviews)
            const { data: allReviews } = await supabase
                .from('reviews')
                .select('rating')
                .eq('caregiver_id', user.id);

            const calculatedRating = allReviews && allReviews.length > 0
                ? (allReviews.reduce((acc, curr) => acc + curr.rating, 0) / allReviews.length).toFixed(1)
                : (profile?.caregiver_details?.rating || '5.0');



            let monthlyEarnings = 0;
            let monthlyHours = 0;

            (completedThisMonth || []).forEach(app => {
                // Calculate Earnings (Prefer payment_amount, fallback to offered_rate, else 0)
                const pay = app.payment_amount || app.offered_rate || 0;
                // Only count earnings if Marked as Paid? Or just accrued? 
                // Usually "Ganancias" implies accrued, but user wants to "edit payments".
                // Let's count it if status is 'paid' OR just accrue it. 
                // Better to show ACCRUED EARNINGS for the month regardless of payment status, or purely PAID.
                // Let's assume Accrued for now, or sum only 'paid'. 
                // Given the prompt "payments received", let's sum ALL completed, but maybe distinguish?
                // Simple approach: Sum all 'payment_amount' (if set) + 'offered_rate' (if not set) for completed.

                // However, if we want "Pagos Recibidos", we should strictly check payment_status === 'paid'.
                // But "Ganancias (Mes)" typically means Income Generated.
                // Let's stick to Income Generated (Accrued) but utilize payment_amount if customized.
                if (app.payment_status === 'paid') {
                    monthlyEarnings += parseFloat(pay);
                } else {
                    // Optionally count pending payments? For now let's only count PAID for "Ganancias Reales"
                    // Or maybe the user wants to see potential. Let's count PAID for safety as "Earnings" usually means "Money in pocket".
                    // Actually, usually "Earnings" in gig apps shows total completed value.
                    // modifying logic:
                    monthlyEarnings += parseFloat(pay);
                }

                // Calculate Hours
                if (app.time && app.end_time) {
                    const parseTime = (t) => {
                        const [h, m] = t.split(':').map(Number);
                        return h + (m / 60);
                    };
                    const start = parseTime(app.time);
                    const end = parseTime(app.end_time);

                    if (!isNaN(start) && !isNaN(end) && end > start) {
                        monthlyHours += (end - start);
                    }
                }
            });

            // 3. Upcoming Count
            const { count: upcomingCount } = await supabase
                .from('appointments')
                .select('*', { count: 'exact', head: true })
                .eq('caregiver_id', user.id)
                .gte('date', today)
                .neq('status', 'cancelled');

            setStats([
                { label: 'Calificación', value: calculatedRating, icon: Star, color: 'text-yellow-600', bg: 'bg-yellow-100' },
                { label: 'Próximos Turnos', value: upcomingCount || '0', icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-100' },
            ]);


            // 4. Fetch Recent Activity (Mixed)
            // A. Recent Completed/Paid Appointments
            const { data: recentCompleted } = await supabase
                .from('appointments')
                .select(`*, client:client_id(full_name)`)
                .eq('caregiver_id', user.id)
                .eq('status', 'completed')
                .order('date', { ascending: false })
                .limit(3);

            // B. Recent Reviews
            const { data: recentReviews } = await supabase
                .from('reviews')
                .select(`*, reviewer:reviewer_id(full_name)`)
                .eq('caregiver_id', user.id)
                .order('created_at', { ascending: false })
                .limit(2);

            // Merge and Sort
            let activity = [];

            (recentCompleted || []).forEach(app => {
                activity.push({
                    type: 'appointment',
                    date: new Date(app.date), // Use updated_at if marked completed? date is simpler
                    data: app
                });
            });

            (recentReviews || []).forEach(rev => {
                activity.push({
                    type: 'review',
                    date: new Date(rev.created_at),
                    data: rev
                });
            });

            activity.sort((a, b) => b.date - a.date);
            setRecentPayments(activity.slice(0, 5));

        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        }
    };

    const fetchNewRequests = async () => {
        try {
            const { data, error } = await supabase
                .from('appointments')
                .select(`
                    *,
                    client:client_id (
                        full_name,
                        avatar_url
                    )
                `)
                .eq('caregiver_id', user.id)
                .eq('status', 'pending')
                .limit(5);

            if (error) throw error;
            setNewRequests(data || []);
        } catch (error) {
            console.error("Error fetching requests:", error);
        } finally {
            setLoadingRequests(false);
        }
    }


    const fetchMyApplications = async () => {
        try {
            const { data, error } = await supabase
                .from('job_applications')
                .select(`
                    id,
                    status,
                    created_at,
                    appointment:appointment_id (
                        title,
                        date,
                        time,
                        end_time,
                        status,
                        client:client_id (full_name)
                    )
                `)
                .eq('caregiver_id', user.id)
                .order('created_at', { ascending: false })
                .limit(10); // increased limit slightly to allow filtering junk without empty list

            if (error) throw error;
            // DUAL-FILTER: Both at DB level (where possible) and JS level
            const activeApplications = (data || []).filter(app =>
                app.appointment &&
                app.appointment.status !== 'cancelled' &&
                app.appointment.status !== 'deleted'
            );
            setMyApplications(activeApplications.slice(0, 5));
        } catch (error) {
            console.error("Error fetching applications:", error);
        }
    };

    const handleAction = async (id, status) => {
        try {
            const { error } = await supabase
                .from('appointments')
                .update({ status })
                .eq('id', id);

            if (error) throw error;
            setNewRequests(prev => prev.filter(r => r.id !== id));
            fetchDashboardData(); // Refresh stats/next shift if accepted
        } catch (error) {
            console.error("Error updating request:", error);
        }
    };



    if (isLoading || profileLoading) { // Check both
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 size={48} className="animate-spin text-blue-600" />
                    <p className="text-gray-500 font-medium animate-pulse">Cargando tu actividad...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Hola, <span className="text-blue-600">{firstName}</span> 👋</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <p className="text-gray-500">Aquí tienes el resumen de tu actividad profesional.</p>
                        <div className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-bold border border-blue-100 flex items-center gap-1">
                            <span className="opacity-60 underline">MI CÓDIGO:</span>
                            <span className="font-mono text-sm tracking-wider">{profile?.caregiver_code || '---'}</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => navigate('/caregiver/jobs')}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                    >
                        Buscar Nuevos Turnos
                    </button>
                </div>
            </div>


            {/* Main Content Split */}
            <div className="grid lg:grid-cols-3 gap-8">
                {/* Left Primary Column */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Stats Row (Moved Here) */}
                    <div className="grid grid-cols-2 gap-4">
                        {stats.map((stat, idx) => (
                            <div key={idx} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                                <div className={`${stat.bg} p-3 rounded-xl ${stat.color}`}>
                                    <stat.icon size={20} />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wide">{stat.label}</p>
                                    <h3 className="text-xl font-bold text-gray-800">{stat.value}</h3>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <Calendar size={20} className="text-gray-400" />
                            Tus Próximos Turnos
                            {nextShifts.length > 0 && nextShifts[0].date === new Date().toISOString().split('T')[0] && (
                                <span className="text-xs font-normal text-white bg-red-500 px-2 py-1 rounded-full animate-pulse">Hoy</span>
                            )}
                        </h2>

                        {nextShifts.length > 0 ? (
                            <div className="space-y-4">
                                {nextShifts.map((shift, index) => {
                                    const isFirst = index === 0;

                                    if (isFirst) {
                                        // Hero Card for Next Shift
                                        return (
                                            <div key={shift.id} className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden group">
                                                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-white/20 transition-all"></div>

                                                <div className="relative z-10 flex flex-col md:flex-row justify-between md:items-center gap-6">
                                                    <div>
                                                        <div className="flex items-center gap-3 mb-4">
                                                            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                                                                <User size={24} />
                                                            </div>
                                                            <div>
                                                                <h3 className="text-2xl font-bold">{shift.client?.full_name || 'Cliente'}</h3>
                                                                <p className="text-blue-200">{shift.client?.address || 'Ubicación remota'}</p>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <div className="flex items-center gap-2 text-blue-100">
                                                                <Calendar size={18} />
                                                                <span className="font-mono text-lg">{shift.date}</span>
                                                                <Clock size={18} className="ml-2" />
                                                                <span className="font-mono text-lg">
                                                                    {shift.time?.substring(0, 5)}
                                                                    {shift.end_time ? ` - ${shift.end_time.substring(0, 5)}` : ''}
                                                                </span>
                                                            </div>
                                                            <div className="inline-block bg-white/20 px-3 py-1 rounded-lg text-sm backdrop-blur-md">
                                                                {shift.title || 'Servicio de Cuidado'}
                                                            </div>

                                                            {/* Patient Info Display (Simplified for Hero) */}
                                                            {shift.patient && (
                                                                <div className="mt-4 flex items-center gap-2 text-blue-200 text-sm">
                                                                    <User size={14} />
                                                                    <span>Cuidar a: <strong>{shift.patient.full_name}</strong></span>
                                                                </div>
                                                            )}

                                                            {/* Details/Instructions Section */}
                                                            {shift.details && (
                                                                <div className="mt-4 bg-white/10 p-3 rounded-xl border border-white/10">
                                                                    <div className="flex items-center gap-2 text-blue-100 text-xs font-bold mb-1 uppercase tracking-wider opacity-80">
                                                                        <Loader2 size={12} className="animate-spin" style={{ animationDuration: '3s' }} /> Instrucciones
                                                                    </div>
                                                                    <p className="text-sm text-white/90 leading-relaxed italic">
                                                                        "{shift.details.split('[PLAN DE CUIDADO]')[0].trim() || shift.details.split('---SERVICES---')[0].trim()}"
                                                                    </p>
                                                                </div>
                                                            )}

                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col gap-3 min-w-[140px]">
                                                        {shift.status === 'confirmed' ? (
                                                            <div className="flex flex-col gap-2">
                                                                <button
                                                                    onClick={() => handleAction(shift.id, 'in_progress')}
                                                                    className="bg-white text-blue-900 px-6 py-3 rounded-xl font-bold hover:bg-blue-50 transition-colors shadow-lg border-2 border-transparent hover:border-blue-200"
                                                                >
                                                                    Iniciar Turno
                                                                </button>
                                                                {/* Disabled Finish Button for visibility of workflow */}
                                                                <button disabled className="bg-gray-100 text-gray-400 px-6 py-2 rounded-xl font-bold text-sm cursor-not-allowed opacity-60">
                                                                    Finalizar
                                                                </button>
                                                            </div>
                                                        ) : shift.status === 'in_progress' ? (
                                                            <div className="flex flex-col gap-2">
                                                                {/* Disabled Start Button */}
                                                                <button disabled className="bg-green-100 text-green-700 px-6 py-2 rounded-xl font-bold text-sm cursor-not-allowed flex items-center justify-center gap-2">
                                                                    <Loader2 size={14} className="animate-spin" /> En Curso...
                                                                </button>
                                                                <button
                                                                    onClick={() => handleAction(shift.id, 'completed')}
                                                                    className="bg-white text-red-600 px-6 py-3 rounded-xl font-bold hover:bg-red-50 hover:text-red-700 transition-colors shadow-lg border-2 border-transparent hover:border-red-200"
                                                                >
                                                                    Finalizar Turno
                                                                </button>
                                                                <button
                                                                    onClick={() => setIsLogModalOpen(true)}
                                                                    className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
                                                                >
                                                                    <FileText size={16} /> Bitácora
                                                                </button>
                                                                <button
                                                                    onClick={() => setShowWellnessModal(true)}
                                                                    className="bg-indigo-50 text-indigo-600 border border-indigo-100 px-6 py-2 rounded-xl font-bold text-sm hover:bg-indigo-100 transition-colors shadow-sm flex items-center justify-center gap-2"
                                                                >
                                                                    <Activity size={16} /> Reportar Bienestar
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <button className="bg-white/20 text-white px-6 py-3 rounded-xl font-bold cursor-not-allowed">
                                                                Completado
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    } else {
                                        // Smaller Cards for Subsequent Shifts
                                        return (
                                            <div key={shift.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between hover:border-blue-300 transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-bold">
                                                        {shift.client?.full_name?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-800">{shift.client?.full_name}</p>
                                                        <p className="text-xs text-gray-500">{shift.title}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-gray-800 text-sm">{shift.date}</p>
                                                    <p className="text-xs text-gray-500">
                                                        {shift.time?.substring(0, 5)}
                                                        {shift.end_time ? ` - ${shift.end_time.substring(0, 5)}` : ''}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    }
                                })}
                                <div className="text-center pt-2">
                                    <button onClick={() => navigate('/caregiver/shifts')} className="text-sm text-blue-600 font-bold hover:underline">
                                        Ver todos mis turnos
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white rounded-3xl p-8 border border-gray-200 text-center text-gray-400">
                                <div className="mb-4 bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                                    <Calendar size={32} />
                                </div>
                                <h3 className="text-lg font-bold text-gray-600">No tienes turnos próximos</h3>
                                <p className="mb-4">Cuando aceptes una solicitud, aparecerá aquí.</p>
                                <button onClick={() => navigate('/caregiver/jobs')} className="text-blue-600 font-medium hover:underline">
                                    Buscar disponibles
                                </button>
                            </div>
                        )}

                        <h2 className="text-xl font-bold text-gray-800 pt-4">Actividad Reciente</h2>
                        <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-100">
                            {recentPayments.length > 0 ? (
                                recentPayments.map((item, idx) => {
                                    const isReview = item.type === 'review';
                                    const Icon = isReview ? Star : DollarSign; // Or use Check for completed shift 
                                    const bgColor = isReview ? "bg-yellow-100" : (item.data.payment_status === 'paid' ? "bg-green-100" : "bg-blue-100");
                                    const txtColor = isReview ? "text-yellow-600" : (item.data.payment_status === 'paid' ? "text-green-600" : "text-blue-600");

                                    return (
                                        <div key={idx} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors group">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${bgColor} ${txtColor}`}>
                                                    {isReview ? <Star size={18} /> : (item.data.payment_status === 'paid' ? <DollarSign size={18} /> : <Check size={18} />)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-800 text-sm">
                                                        {isReview ? 'Nueva Reseña' : 'Turno Completado'}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {isReview
                                                            ? `"${item.data.comment?.substring(0, 30)}..." - ${item.data.reviewer?.full_name}`
                                                            : `${item.data.title || 'Servicio'} - ${item.data.client?.full_name}`
                                                        }
                                                    </p>
                                                    {!isReview && (
                                                        <p className="text-[10px] font-bold text-gray-400">
                                                            {item.data.payment_amount ? `$${item.data.payment_amount}` : (item.data.offered_rate ? `$${item.data.offered_rate} (Est.)` : 'Sin monto')}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="text-right">
                                                <span className="text-xs text-gray-400 font-medium block mb-1">
                                                    {new Date(item.date).toLocaleDateString()}
                                                </span>

                                                {!isReview && (
                                                    <button
                                                        onClick={() => setEditingPayment(item.data)}
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-2 py-1 rounded"
                                                    >
                                                        {item.data.payment_status === 'paid' ? 'Editar' : 'Registrar Pago'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="p-6 text-center text-gray-400 text-sm italic">
                                    Sin actividad reciente.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar Widgets */}
                <div className="space-y-6">
                    {/* Tips Card */}
                    <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl p-6 text-white text-center">
                        <Star className="w-12 h-12 mx-auto mb-4 text-yellow-300 fill-current" />
                        <h3 className="font-bold text-lg mb-2">¡Eres una Superestrella!</h3>
                        <p className="text-purple-100 text-sm mb-4">Has mantenido una calificación perfecta de 5.0 esta semana.</p>
                        <button
                            onClick={() => navigate('/caregiver/profile')}
                            className="bg-white/20 hover:bg-white/30 text-white text-sm font-bold py-2 px-4 rounded-lg transition-colors w-full"
                        >
                            Ver mis insignias
                        </button>
                    </div>

                    {/* Notifications / Requests Card */}
                    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm overflow-hidden">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                <Bell size={18} className="text-blue-600" />
                                Nuevas Solicitudes
                            </h3>
                            {newRequests.length > 0 && (
                                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                    {newRequests.length}
                                </span>
                            )}
                        </div>

                        <div className="space-y-4">
                            {loadingRequests ? (
                                <div className="flex justify-center py-4">
                                    <Loader2 className="animate-spin text-gray-300" />
                                </div>
                            ) : newRequests.length > 0 ? (
                                newRequests.map(req => (
                                    <div key={req.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 group transition-all">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                                                {req.client?.full_name?.charAt(0) || 'C'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-gray-800 truncate">{req.client?.full_name || 'Cliente'}</p>
                                                <p className="text-[10px] text-gray-500 truncate">{req.title}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between text-[10px] text-gray-400 mb-3">
                                            <span className="flex items-center gap-0.5"><Calendar size={10} /> {req.date}</span>
                                            <span className="flex items-center gap-0.5"><Clock size={10} /> {req.time} {req.end_time ? `- ${req.end_time.substring(0, 5)}` : ''}</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                onClick={() => handleAction(req.id, 'confirmed')}
                                                className="bg-blue-600 text-white py-1.5 rounded-lg font-bold flex items-center justify-center gap-1 hover:bg-blue-700 transition-colors"
                                            >
                                                <Check size={12} /> Aceptar
                                            </button>
                                            <button
                                                onClick={() => handleAction(req.id, 'cancelled')}
                                                className="bg-gray-200 text-gray-700 py-1.5 rounded-lg font-bold flex items-center justify-center gap-1 hover:bg-gray-300 transition-colors"
                                            >
                                                <X size={12} /> Ignorar
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-gray-400 text-center py-4 italic">Sin solicitudes pendientes.</p>
                            )}
                        </div>
                    </div>

                    {/* Quick Availability Switch */}
                    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-gray-800">Disponibilidad</h3>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={isAvailable}
                                    onChange={handleAvailabilityToggle}
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                            </label>
                        </div>
                        <p className="text-xs text-gray-500">Activo para recibir ofertas de trabajo urgentes en tu zona.</p>
                    </div>

                    {/* Notifications Panel */}
                    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Bell size={18} className="text-orange-500" />
                            Notificaciones
                        </h3>

                        <div className="space-y-4">
                            {notifications.length > 0 ? (
                                notifications.map(notif => (
                                    <div key={notif.id} className="flex gap-3 items-start animate-fade-in border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${notif.is_modification && !notif.modification_seen_by_caregiver ? 'bg-red-100' :
                                            notif.status === 'confirmed' ? 'bg-green-100' : 'bg-red-100'
                                            }`}>
                                            {notif.status === 'confirmed' && !notif.is_modification ? (
                                                <Check size={14} className="text-green-600" />
                                            ) : notif.status === 'confirmed' && notif.is_modification ? (
                                                <Clock size={14} className={notif.modification_seen_by_caregiver ? "text-blue-600" : "text-red-600"} />
                                            ) : (
                                                <X size={14} className="text-red-600" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-xs text-gray-800">
                                                {notif.status === 'confirmed' ? (
                                                    notif.is_modification ? (
                                                        <div>
                                                            {!notif.modification_seen_by_caregiver ? (
                                                                <>
                                                                    <span className="text-red-600 font-black animate-pulse">¡CAMBIO EN TURNO!</span> Tu cita con <span className="font-bold">{notif.client?.full_name}</span> ha sido modificada.
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <span className="text-blue-600 font-bold">¡TURNO ACTUALIZADO!</span> Los cambios en tu cita con <span className="font-bold">{notif.client?.full_name}</span> han sido revisados.
                                                                </>
                                                            )}
                                                            {!notif.modification_seen_by_caregiver && (
                                                                <button
                                                                    onClick={() => handleAcknowledge(notif)}
                                                                    className="mt-2 w-full text-center text-xs bg-red-600 text-white px-3 py-1.5 rounded-md font-bold hover:bg-red-700 transition-colors shadow-sm flex items-center justify-center gap-1"
                                                                >
                                                                    <Check size={12} /> Aceptar cambios y confirmar asistencia
                                                                </button>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div>
                                                            <span className="text-green-600 font-bold">¡FELICITACIONES!</span> Tu cita con <span className="font-bold">{notif.client?.full_name}</span> ha sido aprobada.
                                                            {!notif.modification_seen_by_caregiver && (
                                                                <button
                                                                    onClick={() => handleAcknowledge(notif)}
                                                                    className="mt-2 w-full text-center text-xs bg-blue-600 text-white px-3 py-1.5 rounded-md font-bold hover:bg-blue-700 transition-colors shadow-sm flex items-center justify-center gap-1"
                                                                >
                                                                    <Check size={12} /> Muchas gracias, confirmo asistencia
                                                                </button>
                                                            )}
                                                        </div>
                                                    )
                                                ) : (
                                                    <div>
                                                        <span className="text-red-700 font-black animate-pulse uppercase tracking-tighter">¡TURNO CANCELADO!</span> Tu cita con <span className="font-bold">{notif.client?.full_name}</span> ha sido eliminada por el cliente.
                                                        {!notif.modification_seen_by_caregiver && (
                                                            <button
                                                                onClick={() => handleAcknowledge(notif)}
                                                                className="mt-2 w-full text-center text-xs bg-red-700 text-white px-3 py-1.5 rounded-md font-bold hover:bg-red-800 transition-colors shadow-sm flex items-center justify-center gap-1"
                                                            >
                                                                <Check size={12} /> Entendido, cita cancelada
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-[10px] text-gray-400 mt-1">
                                                {timeAgo(notif.updated_at || notif.created_at)}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-gray-400 text-center py-2 italic">No tienes nuevas notificaciones.</p>
                            )}
                        </div>
                    </div>

                    {/* My Applications Card */}
                    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm overflow-hidden">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                <Check size={18} className="text-purple-600" />
                                Mis Postulaciones
                            </h3>
                        </div>

                        <div className="space-y-3">
                            {myApplications.length > 0 ? (
                                myApplications.map(app => (
                                    <div key={app.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                                        <div className="flex justify-between items-start mb-1">
                                            <p className="text-xs font-bold text-gray-800">{app.appointment?.title || 'Servicio'}</p>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${app.status === 'approved' ? 'bg-green-100 text-green-700' :
                                                app.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                                    'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {app.status === 'approved' ? 'Aprobada' :
                                                    app.status === 'rejected' ? 'Rechazada' : 'Pendiente'}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-gray-500 mb-2">Cliente: {app.appointment?.client?.full_name || 'Anónimo'}</p>
                                        <div className="flex items-center gap-3 text-[10px] text-gray-400">
                                            <span className="flex items-center gap-1"><Calendar size={10} /> {app.appointment?.date}</span>
                                            <span className="flex items-center gap-1">
                                                <Clock size={10} />
                                                {app.appointment?.time?.substring(0, 5)}
                                                {app.appointment?.end_time ? ` - ${app.appointment?.end_time?.substring(0, 5)}` : ''}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-gray-400 text-center py-4 italic">No tienes postulaciones activas.</p>
                            )}

                            <button
                                onClick={() => navigate('/caregiver/jobs')}
                                className="w-full mt-2 text-xs text-blue-600 font-bold hover:underline"
                            >
                                Ver Bolsa de Trabajo
                            </button>
                        </div>
                    </div>
                </div>
            </div >

            <EditPaymentModal
                appointment={editingPayment}
                isOpen={!!editingPayment}
                onClose={() => setEditingPayment(null)}
                onUpdate={() => {
                    setEditingPayment(null);
                    fetchDashboardData();
                }}
            />

            {/* Care Log Modal */}
            {nextShifts.length > 0 && nextShifts[0].status === 'in_progress' && (
                <>
                    <AddCareLogModal
                        isOpen={isLogModalOpen}
                        onClose={() => setIsLogModalOpen(false)}
                        appointmentId={nextShifts[0].id}
                        caregiverId={user.id}
                        clientName={nextShifts[0].client?.full_name}
                        appointmentDetails={nextShifts[0].details}
                        careAgenda={nextShifts[0].care_agenda}
                        clientId={nextShifts[0].client_id}
                    />
                    <WellnessReportModal
                        isOpen={showWellnessModal}
                        onClose={() => setShowWellnessModal(false)}
                        appointmentId={nextShifts[0].id}
                        caregiverId={user.id}
                        onSaved={() => {
                            // Optional hook
                        }}
                    />
                </>
            )}
        </div >
    );
};

export default CaregiverOverview;
