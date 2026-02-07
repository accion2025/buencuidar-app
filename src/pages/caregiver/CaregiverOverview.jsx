import React, { useState, useEffect } from 'react';
import { DollarSign, Clock, Star, Calendar, ArrowRight, User, Bell, Check, X, Loader2, FileText, Activity, History } from 'lucide-react';
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
        { label: 'Calificación', value: '5.0', icon: Star, color: 'text-orange-500', bg: 'bg-orange-100' },
        { label: 'Próximos Turnos', value: '0', icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-100' },
    ]);
    const [nextShifts, setNextShift] = useState([]);
    const [loadingRequests, setLoadingRequests] = useState(true);
    const [isAvailable, setIsAvailable] = useState(true);

    const isPro = profile?.plan_type === 'professional_pro' || profile?.plan_type === 'premium';

    useEffect(() => {
        if (user && !profileLoading) {
            const loadData = async () => {
                try {
                    // Check if profile exists and has caregiver_details
                    // If not, we might need a one-time repair or just stop loading
                    if (!profile) {
                        console.warn("No profile found for current user");
                        setIsLoading(false);
                        return;
                    }

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
        } else if (!user && !profileLoading) {
            setIsLoading(false);
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
                .order('updated_at', { ascending: false })
                .limit(10); // Fetches more to allow for filtering

            if (error) throw error;

            // 24-hour expiration for "cancelled" notifications
            const now = new Date();
            const filteredData = (data || []).filter(notif => {
                const isCancellation = notif.status === 'cancelled';
                if (isCancellation) {
                    const time = new Date(notif.updated_at || notif.created_at);
                    const diffInHours = (now - time) / (1000 * 60 * 60);
                    return diffInHours < 24; // Keep if less than 24 hours old
                }
                return true; // Keep confirmed or already acknowledged notifications
            });

            setNotifications(filteredData.slice(0, 5)); // Maintain UI limit
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
                // Logic: STRICTLY use payment_amount ONLY if status is 'paid'.
                // If not paid, earnings are 0.
                const pay = app.payment_status === 'paid' && app.payment_amount
                    ? parseFloat(app.payment_amount)
                    : 0;

                // Add to monthly earnings
                monthlyEarnings += pay;

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

            const newStats = [];

            // Only add Financial/Hours stats if user is PREMIUM (Reports & Finance package)
            if (profile?.plan_type === 'premium' || profile?.plan_type === 'professional_pro') {
                newStats.push(
                    { label: 'Ganancias (Mes)', value: `$${monthlyEarnings}`, icon: DollarSign, color: 'text-green-600', bg: 'bg-green-100' },
                    { label: 'Horas Trabajadas', value: `${Math.round(monthlyHours)}h`, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-100' }
                );
            }

            // Always add core stats
            newStats.push(
                {
                    label: 'Calificación',
                    value: calculatedRating,
                    icon: Star,
                    color: (allReviews?.length > 0) ? 'text-orange-500' : 'text-gray-400',
                    bg: (allReviews?.length > 0) ? 'bg-orange-100' : 'bg-gray-100'
                },
                { label: 'Próximos Turnos', value: upcomingCount || '0', icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-100' }
            );

            setStats(newStats);


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
        <>
            <div className="space-y-10 animate-fade-in pb-12">
                {/* Header */}
                <div className={`bg-gradient-to-br ${isPro ? 'from-[#0F3C4C] via-[#1a5a70] to-[#2FAE8F]' : 'from-slate-700 to-slate-900'} rounded-[16px] p-10 !text-[#FAFAF7] shadow-2xl relative overflow-hidden mb-12 transition-all duration-700`}>
                    <div className={`absolute top-0 right-0 w-80 h-80 ${isPro ? 'bg-[var(--secondary-color)]' : 'bg-slate-400'} rounded-full -translate-y-1/2 translate-x-1/2 blur-[120px] opacity-20 transition-colors duration-700`}></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-[var(--accent-color)] rounded-full translate-y-1/2 -translate-x-1/2 blur-[100px] opacity-10"></div>

                    <div className="relative z-10">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                            <div className="flex flex-col md:flex-row items-start md:items-center gap-10">
                                {/* Avatar integration in overview */}
                                <div className="w-24 h-24 rounded-[20px] border-[4px] border-white/20 bg-slate-900 shadow-2xl relative overflow-hidden shrink-0 ring-4 ring-white/10">
                                    <img
                                        src={profile?.avatar_url || "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"}
                                        alt="Profile"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div>
                                    <span className={`bg-white/10 ${isPro ? 'text-[var(--accent-color)] border-white/20' : 'text-slate-400 border-white/5'} px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-4 inline-block border backdrop-blur-md transition-colors`}>
                                        {isPro ? 'PANEL BC PRO' : 'PANEL DEL CUIDADOR'}
                                    </span>
                                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-brand font-bold tracking-tight mb-3 text-left !text-[#FAFAF7] break-words drop-shadow-sm">
                                        Hola, <span className="!text-[#FAFAF7] font-black">{firstName}</span> 👋
                                    </h1>
                                    <div className="flex flex-wrap items-center gap-4 mt-4">
                                        <p className="!text-[#FAFAF7]/80 text-lg font-secondary text-left">Aquí tienes el resumen de tu actividad profesional.</p>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => navigate('/caregiver/jobs')}
                                className="btn bg-[var(--secondary-color)] hover:bg-emerald-600 !text-[#FAFAF7] px-8 py-5 rounded-[16px] font-black uppercase tracking-widest shadow-2xl shadow-green-900/40 border-none group transition-all"
                            >
                                Buscar Nuevos Turnos
                                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform ml-2" />
                            </button>
                        </div>
                    </div>
                </div>


                {/* Main Content Split */}
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Left Primary Column */}
                    <div className="lg:col-span-2 space-y-10">

                        {/* Stats Row */}
                        <div className="grid grid-cols-2 gap-8">
                            {stats.map((stat, idx) => (
                                <div key={idx} className="bg-white rounded-[16px] p-8 border border-slate-100 shadow-xl shadow-slate-200/50 flex items-center gap-6 hover:border-[var(--secondary-color)]/40 hover:shadow-2xl transition-all hover:scale-[1.02] relative overflow-hidden group">
                                    <div className={`p-5 rounded-[16px] ${stat.bg.includes('green') || stat.bg.includes('yellow') ? 'bg-[var(--secondary-color)] !text-[#FAFAF7]' :
                                        stat.bg.includes('orange') ? 'bg-orange-100 text-orange-500' :
                                            'bg-[var(--primary-color)] !text-[#FAFAF7]'
                                        } group-hover:scale-110 transition-transform shadow-lg relative z-10`}>
                                        <stat.icon size={32} strokeWidth={2.5} {...(stat.icon === Star ? { fill: 'currentColor' } : {})} />
                                    </div>
                                    <div className="relative z-10 text-left">
                                        <p className="text-[10px] text-[var(--text-light)] font-black uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                                        <h3 className="text-4xl font-brand font-bold text-[var(--primary-color)] tracking-tight">{stat.value}</h3>
                                    </div>
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent-color)]/5 rounded-full translate-x-1/2 -translate-y-1/2 blur-2xl group-hover:bg-[var(--secondary-color)]/10 transition-colors"></div>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-6">
                            <h2 className="text-2xl font-brand font-bold text-[var(--primary-color)] flex items-center gap-3">
                                <Calendar size={24} className="text-[var(--secondary-color)]" />
                                Tus Próximos Turnos
                                {nextShifts.length > 0 && nextShifts[0].date === new Date().toISOString().split('T')[0] && (
                                    <span className="text-[10px] font-black !text-[#FAFAF7] bg-[var(--error-color)] px-3 py-1 rounded-full animate-pulse uppercase tracking-widest">Hoy</span>
                                )}
                            </h2>

                            {nextShifts.length > 0 ? (
                                <div className="space-y-6">
                                    {nextShifts.map((shift, index) => {
                                        const isFirst = index === 0;

                                        if (isFirst) {
                                            // Hero Card for Next Shift
                                            return (
                                                <div key={shift.id} className="bg-[var(--primary-color)] rounded-[16px] p-10 !text-[#FAFAF7] shadow-2xl relative overflow-hidden group border border-white/10">
                                                    <div className="absolute top-0 right-0 w-80 h-80 bg-[var(--secondary-color)] rounded-full -translate-y-1/2 translate-x-1/2 blur-[100px] opacity-20 group-hover:opacity-30 transition-all"></div>
                                                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-[var(--accent-color)] rounded-full translate-y-1/2 -translate-x-1/2 blur-[80px] opacity-10"></div>

                                                    <div className="relative z-10 flex flex-col xl:flex-row justify-between xl:items-center gap-10">
                                                        <div className="flex-1 text-left">
                                                            <div className="flex items-center gap-6 mb-8">
                                                                <div className="w-20 h-20 bg-white/10 rounded-[16px] flex items-center justify-center backdrop-blur-md border border-white/20 shadow-inner">
                                                                    <User size={40} strokeWidth={1.5} />
                                                                </div>
                                                                <div>
                                                                    <h3 className="text-4xl font-brand font-bold tracking-tight mb-1">{shift.client?.full_name || 'Cliente'}</h3>
                                                                    <p className="text-[var(--accent-color)] font-secondary opacity-90 text-lg">{shift.client?.address || 'Ubicación remota'}</p>
                                                                </div>
                                                            </div>
                                                            <div className="space-y-6">
                                                                <div className="flex flex-wrap items-center gap-4 !text-[#FAFAF7]">
                                                                    <div className="flex items-center gap-3 bg-white/10 px-6 py-3 rounded-[16px] backdrop-blur-sm border border-white/10">
                                                                        <Calendar size={22} className="text-[var(--secondary-color)]" />
                                                                        <span className="font-brand font-bold text-lg !text-[#FAFAF7]">{shift.date}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-3 bg-white/10 px-6 py-3 rounded-[16px] backdrop-blur-sm border border-white/10">
                                                                        <Clock size={22} className="text-[var(--secondary-color)]" />
                                                                        <span className="font-brand font-bold text-xl !text-[#FAFAF7]">
                                                                            {shift.time?.substring(0, 5)}
                                                                            {shift.end_time ? ` - ${shift.end_time.substring(0, 5)}` : ''}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <div className="inline-block bg-[var(--secondary-color)] !text-[#FAFAF7] px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest shadow-xl shadow-green-900/20 border border-white/10">
                                                                    {shift.title || 'Servicio de Cuidado'}
                                                                </div>

                                                                {/* Patient Info */}
                                                                {shift.patient && (
                                                                    <div className="mt-8 flex items-center gap-4 !text-white/90 py-4 px-6 bg-white/5 rounded-[16px] border border-white/10 backdrop-blur-sm">
                                                                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/10">
                                                                            <User size={20} />
                                                                        </div>
                                                                        <span className="font-secondary text-base !text-white/80">Cuidar a: <strong className="!text-white font-brand text-lg">{shift.patient.full_name}</strong></span>
                                                                    </div>
                                                                )}

                                                                {/* Details/Instructions */}
                                                                {shift.details && (
                                                                    <div className="mt-6 bg-white/5 p-6 rounded-[16px] border border-white/10 backdrop-blur-md">
                                                                        <div className="flex items-center gap-2 text-[var(--accent-color)] text-[10px] font-black mb-3 uppercase tracking-[0.2em] opacity-80">
                                                                            <Activity size={12} className="animate-pulse" /> Instrucciones del Plan
                                                                        </div>
                                                                        <p className="text-base !text-[#FAFAF7]/90 leading-relaxed italic font-secondary">
                                                                            "{shift.details.split('[PLAN DE CUIDADO]')[0].trim() || shift.details.split('---SERVICES---')[0].trim()}"
                                                                        </p>
                                                                    </div>
                                                                )}

                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col gap-4 min-w-[240px]">
                                                            {shift.status === 'confirmed' ? (
                                                                <div className="flex flex-col gap-4">
                                                                    <button
                                                                        onClick={() => handleAction(shift.id, 'in_progress')}
                                                                        className="btn bg-[var(--secondary-color)] hover:bg-emerald-600 !text-[#FAFAF7] py-6 text-xl rounded-[16px] font-black uppercase tracking-widest shadow-2xl shadow-green-900 border-none group transition-all"
                                                                    >
                                                                        Iniciar Turno
                                                                        <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform ml-2" />
                                                                    </button>
                                                                </div>
                                                            ) : shift.status === 'in_progress' ? (
                                                                <div className="flex flex-col gap-4">
                                                                    <div className="bg-white/10 text-[var(--secondary-color)] px-8 py-5 rounded-[16px] font-black text-sm uppercase tracking-widest flex items-center justify-center gap-4 backdrop-blur-md border border-[var(--secondary-color)]/30">
                                                                        <span className="relative flex h-4 w-4">
                                                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--secondary-color)] opacity-75"></span>
                                                                            <span className="relative inline-flex rounded-full h-4 w-4 bg-[var(--secondary-color)]"></span>
                                                                        </span>
                                                                        En Curso...
                                                                    </div>
                                                                    <button
                                                                        onClick={() => handleAction(shift.id, 'completed')}
                                                                        className="bg-white text-[var(--primary-color)] px-8 py-5 rounded-[16px] font-black text-sm uppercase tracking-widest hover:bg-[var(--base-bg)] transition-all shadow-xl border-none"
                                                                    >
                                                                        Finalizar Turno
                                                                    </button>
                                                                    <div className="grid grid-cols-2 gap-3">
                                                                        <button
                                                                            onClick={() => setIsLogModalOpen(true)}
                                                                            className="bg-white/10 !text-[#FAFAF7] p-4 rounded-[16px] font-black text-[10px] uppercase tracking-widest hover:bg-white/20 transition-all flex items-center justify-center gap-2 border border-white/10 backdrop-blur-sm"
                                                                        >
                                                                            <FileText size={16} /> Bitácora
                                                                        </button>
                                                                        <button
                                                                            onClick={() => setShowWellnessModal(true)}
                                                                            className="bg-white/10 !text-[#FAFAF7] p-4 rounded-[16px] font-black text-[10px] uppercase tracking-widest hover:bg-white/20 transition-all flex items-center justify-center gap-2 border border-white/10 backdrop-blur-sm"
                                                                        >
                                                                            <Activity size={16} /> PULSO
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <button className="bg-white/10 !text-[#FAFAF7]/50 px-8 py-5 rounded-[16px] font-black text-sm uppercase tracking-widest cursor-not-allowed border border-white/5">
                                                                    Completado
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        } else {
                                            // Smaller Cards
                                            return (
                                                <div key={shift.id} className="card !p-5 flex items-center justify-between hover:border-[var(--secondary-color)]/20 transition-all group">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 bg-[var(--accent-color)]/20 text-[var(--primary-color)] rounded-[16px] flex items-center justify-center font-brand font-bold text-lg group-hover:bg-[var(--secondary-color)] group-hover:!text-[#FAFAF7] transition-colors">
                                                            {shift.client?.full_name?.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="font-brand font-bold text-[var(--primary-color)]">{shift.client?.full_name}</p>
                                                            <p className="text-[10px] text-[var(--text-light)] font-black uppercase tracking-widest">{shift.title}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-brand font-bold text-[var(--primary-color)] text-sm">{shift.date}</p>
                                                        <p className="text-[10px] text-[var(--text-light)] font-bold uppercase tracking-widest mt-1">
                                                            {shift.time?.substring(0, 5)}
                                                            {shift.end_time ? ` - ${shift.end_time.substring(0, 5)}` : ''}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        }
                                    })}
                                    <div className="text-center pt-2">
                                        <button onClick={() => navigate('/caregiver/shifts')} className="text-xs font-black text-[var(--secondary-color)] uppercase tracking-[0.2em] hover:underline">
                                            Ver todos mis turnos
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="card !p-12 text-center">
                                    <div className="mb-6 bg-[var(--base-bg)] w-20 h-20 rounded-full flex items-center justify-center mx-auto text-[var(--text-light)]">
                                        <Calendar size={40} />
                                    </div>
                                    <h3 className="text-xl font-brand font-bold text-[var(--primary-color)] mb-2">No tienes turnos próximos</h3>
                                    <p className="text-[var(--text-light)] font-secondary mb-6">Cuando aceptes una solicitud, aparecerá aquí.</p>
                                    <button onClick={() => navigate('/caregiver/jobs')} className="btn btn-outline uppercase text-xs tracking-widest px-8">
                                        Buscar disponibles
                                    </button>
                                </div>
                            )}

                            <h2 className="text-2xl font-brand font-bold text-[var(--primary-color)] pt-8 mb-8 flex items-center gap-3">
                                <History size={24} className="text-[var(--secondary-color)]" />
                                Actividad Reciente
                            </h2>
                            <div className="bg-white rounded-[16px] shadow-xl shadow-slate-200/50 border border-slate-100 p-0 overflow-hidden divide-y divide-gray-50">
                                {recentPayments.length > 0 ? (
                                    recentPayments.map((item, idx) => {
                                        const isPremiumUser = profile?.plan_type === 'premium' || profile?.plan_type === 'professional_pro';
                                        const isReview = item.type === 'review';
                                        const Icon = isReview ? Star : DollarSign;
                                        const bgColor = isReview ? "bg-orange-50 text-orange-500" : (item.data.payment_status === 'paid' ? "bg-emerald-50 text-[var(--secondary-color)]" : "bg-blue-50 text-blue-600");

                                        return (
                                            <div key={idx} className="p-6 flex items-center justify-between hover:bg-gray-50/50 transition-all group relative overflow-hidden">
                                                <div className="flex items-center gap-6 relative z-10">
                                                    <div className={`w-14 h-14 rounded-[16px] flex items-center justify-center shadow-sm border border-black/5 ${bgColor} group-hover:scale-105 transition-transform`}>
                                                        {isReview ? <Star size={24} fill="currentColor" /> : (item.data.payment_status === 'paid' ? <DollarSign size={24} strokeWidth={2.5} /> : <Check size={24} strokeWidth={3} />)}
                                                    </div>
                                                    <div className="text-left">
                                                        <p className="font-brand font-bold text-[var(--primary-color)] text-lg tracking-tight flex items-center gap-2">
                                                            {isReview ? 'Nueva Valoración' : 'Turno Completado'}
                                                            {isReview && <span className="bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full text-xs animate-pulse">⭐ {item.data.rating}</span>}
                                                        </p>
                                                        <p className="text-sm text-[var(--text-light)] font-secondary mt-1 max-w-md line-clamp-1">
                                                            {isReview
                                                                ? `"${item.data.comment}" - ${item.data.reviewer?.full_name}`
                                                                : `${item.data.title || 'Servicio'} - ${item.data.client?.full_name}`
                                                            }
                                                        </p>
                                                        {!isReview && (
                                                            <div className="flex items-center gap-2 mt-2">
                                                                <span className="text-[10px] font-black !text-[#FAFAF7] bg-[var(--primary-color)] px-2 py-0.5 rounded-md uppercase tracking-widest">
                                                                    {item.data.payment_amount ? `$${item.data.payment_amount}` : (item.data.offered_rate ? `$${item.data.offered_rate}` : '---')}
                                                                </span>
                                                                <span className="text-[10px] text-[var(--text-light)] font-black uppercase tracking-widest opacity-60">Pago Recibido</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="text-right relative z-10">
                                                    <span className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] block mb-3">
                                                        {new Date(item.date).toLocaleDateString()}
                                                    </span>

                                                    {!isReview && (
                                                        <button
                                                            onClick={() => setEditingPayment(item.data)}
                                                            className="text-[10px] font-black uppercase tracking-widest bg-white hover:bg-[var(--secondary-color)] hover:!text-[#FAFAF7] text-[var(--primary-color)] px-4 py-2 rounded-[16px] border border-gray-100 shadow-md transition-all active:scale-95"
                                                        >
                                                            {item.data.payment_status === 'paid' ? 'Editar Registro' : 'Registrar Pago'}
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--accent-color)]/5 rounded-full translate-x-1/2 -translate-y-1/2 blur-2xl group-hover:bg-[var(--secondary-color)]/5 transition-colors"></div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="p-16 text-center text-[var(--text-light)] text-lg italic font-secondary bg-gray-50/50">
                                        Sin actividad reciente registrada.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Widgets */}
                    <div className="space-y-8">
                        {/* Tips Card */}
                        <div className="bg-gradient-to-br from-[var(--primary-color)] to-[var(--secondary-color)] rounded-[16px] p-10 !text-[#FAFAF7] text-center shadow-2xl relative overflow-hidden group mb-10">
                            <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
                            <div className="relative z-10">
                                <div className="w-20 h-20 bg-white/20 rounded-[16px] flex items-center justify-center mx-auto mb-8 backdrop-blur-md border border-white/20 shadow-2xl">
                                    <Star className={`w-12 h-12 ${stats.find(s => s.label === 'Calificación')?.color.includes('orange') ? 'text-orange-400 fill-current' : 'text-gray-300'} drop-shadow-lg`} />
                                </div>
                                <h3 className="font-brand font-bold text-3xl mb-4 tracking-tight italic !text-[#FAFAF7]">
                                    {parseFloat(stats.find(s => s.label === 'Calificación')?.value || '5.0') >= 4.8 ? '¡Eres una Superestrella!' : '¡Buen Trabajo!'}
                                </h3>
                                <p className="!text-[#FAFAF7]/80 text-lg mb-10 font-secondary leading-relaxed mx-auto max-w-xs">
                                    {parseFloat(stats.find(s => s.label === 'Calificación')?.value || '5.0') >= 4.8
                                        ? `Has mantenido una calificación excelente de `
                                        : `Tu calificación actual es de `
                                    }
                                    <span className="!text-[#FAFAF7] font-black underline decoration-[var(--accent-color)] underline-offset-4">{stats.find(s => s.label === 'Calificación')?.value || '5.0'}</span>.
                                </p>
                                <button
                                    onClick={() => navigate('/caregiver/profile')}
                                    className="bg-white text-[var(--primary-color)] text-[10px] font-black uppercase tracking-[0.2em] py-5 px-8 rounded-[16px] transition-all hover:bg-[var(--accent-color)] w-full shadow-2xl transform active:scale-95"
                                >
                                    Ver mis logros y medallas
                                </button>
                            </div>
                        </div>

                        {/* Notifications / Requests Card */}
                        <div className="bg-white rounded-[16px] p-10 border border-slate-100 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--secondary-color)]/5 rounded-full translate-x-1/2 -translate-y-1/2 blur-2xl"></div>
                            <div className="flex justify-between items-center mb-10 relative z-10">
                                <h3 className="font-brand font-bold text-2xl text-[var(--primary-color)] tracking-tight flex items-center gap-3">
                                    <span className="p-2.5 bg-emerald-50 text-[var(--secondary-color)] rounded-[16px]">
                                        <Bell size={24} />
                                    </span>
                                    Solicitudes
                                </h3>
                                {newRequests.length > 0 && (
                                    <span className="bg-[var(--error-color)] !text-[#FAFAF7] text-[10px] font-black px-3 py-1 rounded-full shadow-lg shadow-red-100 animate-pulse">
                                        {newRequests.length} NUEVAS
                                    </span>
                                )}
                            </div>

                            <div className="space-y-6 relative z-10">
                                {loadingRequests ? (
                                    <div className="flex justify-center py-10">
                                        <Loader2 className="animate-spin text-[var(--secondary-color)]" size={32} />
                                    </div>
                                ) : newRequests.length > 0 ? (
                                    newRequests.map(req => (
                                        <div key={req.id} className="p-6 bg-white rounded-[16px] border border-gray-100 group transition-all hover:border-[var(--secondary-color)]/30 shadow-xl shadow-gray-100/50">
                                            <div className="flex items-center gap-4 mb-6">
                                                <div className="w-14 h-14 rounded-[16px] bg-[var(--base-bg)] shadow-inner text-[var(--primary-color)] flex items-center justify-center font-brand font-bold text-xl border border-gray-50 transform group-hover:scale-105 transition-transform">
                                                    {req.client?.full_name?.charAt(0) || 'C'}
                                                </div>
                                                <div className="flex-1 min-w-0 text-left">
                                                    <p className="text-lg font-brand font-bold text-[var(--primary-color)] truncate tracking-tight">{req.client?.full_name || 'Cliente'}</p>
                                                    <p className="text-[10px] text-[var(--secondary-color)] font-black uppercase tracking-[0.2em] truncate">{req.title}</p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-3 text-[11px] text-[var(--text-main)] mb-8 font-black uppercase tracking-widest bg-[var(--base-bg)] p-4 rounded-[16px] border border-gray-50">
                                                <span className="flex items-center gap-3"><Calendar size={14} className="text-[var(--secondary-color)]" /> {req.date}</span>
                                                <span className="flex items-center gap-3"><Clock size={14} className="text-[var(--secondary-color)]" /> {req.time}</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <button
                                                    onClick={() => handleAction(req.id, 'confirmed')}
                                                    className="bg-[var(--primary-color)] !text-[#FAFAF7] py-4 rounded-[16px] font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[var(--secondary-color)] transition-all shadow-xl shadow-green-900/10 border-none"
                                                >
                                                    <Check size={16} strokeWidth={4} /> Aceptar
                                                </button>
                                                <button
                                                    onClick={() => handleAction(req.id, 'cancelled')}
                                                    className="bg-white text-gray-400 py-4 rounded-[16px] font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-50 hover:text-[var(--error-color)] border border-gray-100 transition-all"
                                                >
                                                    <X size={16} strokeWidth={4} /> Ignorar
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-10 bg-[var(--base-bg)]/50 rounded-[16px] border border-dashed border-gray-200">
                                        <p className="text-sm text-[var(--text-light)] font-secondary italic">Sin solicitudes pendientes en este momento.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Quick Availability Switch */}
                        <div className="card !p-6">
                            <div className="flex justify-between items-center">
                                <h3 className="font-brand font-bold text-[var(--primary-color)]">Disponibilidad</h3>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={isAvailable}
                                        onChange={handleAvailabilityToggle}
                                    />
                                    <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--secondary-color)] shadow-inner"></div>
                                </label>
                            </div>
                            <p className="text-xs text-gray-500">Activo para recibir ofertas de trabajo urgentes en tu zona.</p>
                        </div>

                        {/* Notifications Panel */}
                        <div id="notifications" className="bg-white rounded-[16px] p-6 border border-gray-200 shadow-sm">
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
                                                                        className="mt-2 w-full text-center text-xs bg-red-600 !text-[#FAFAF7] px-3 py-1.5 rounded-md font-bold hover:bg-red-700 transition-colors shadow-sm flex items-center justify-center gap-1"
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
                                                                        className="mt-2 w-full text-center text-xs bg-blue-600 !text-[#FAFAF7] px-3 py-1.5 rounded-md font-bold hover:bg-blue-700 transition-colors shadow-sm flex items-center justify-center gap-1"
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
                                                                    className="mt-2 w-full text-center text-xs bg-red-700 !text-[#FAFAF7] px-3 py-1.5 rounded-md font-bold hover:bg-red-800 transition-colors shadow-sm flex items-center justify-center gap-1"
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
                        <div className="bg-white rounded-[16px] p-6 border border-gray-200 shadow-sm overflow-hidden">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                    <Check size={18} className="text-purple-600" />
                                    Mis Postulaciones
                                </h3>
                            </div>

                            <div className="space-y-3">
                                {myApplications.length > 0 ? (
                                    myApplications.map(app => (
                                        <div key={app.id} className="p-3 bg-gray-50 rounded-[16px] border border-gray-100">
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
                </div>
            </div>

            {/* Modals outside the animated container */}
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
            {
                nextShifts.length > 0 && nextShifts[0].status === 'in_progress' && (
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
                )
            }
        </>
    );
};

export default CaregiverOverview;
