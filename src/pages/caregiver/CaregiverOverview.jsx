import React, { useState, useEffect } from 'react';
import { DollarSign, Clock, Star, Calendar, ArrowRight, User, Bell, Check, X, Loader2, FileText, Activity, History, MapPin, AlertCircle, Phone, Layers, Heart, Wind } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { supabase } from '../../lib/supabase';

import EditPaymentModal from '../../components/dashboard/EditPaymentModal';
import AddCareLogModal from '../../components/dashboard/AddCareLogModal';
import WellnessReportModal from '../../components/dashboard/WellnessReportModal';
import AllApplicationsModal from '../../components/dashboard/AllApplicationsModal';
import ShiftDetailsModal from '../../components/dashboard/ShiftDetailsModal';

// Persistent cache to avoid loading screens when navigating back
let DASHBOARD_CACHE = (() => {
    try {
        const cached = sessionStorage.getItem('DASHBOARD_CACHE');
        if (!cached) return null;
        return JSON.parse(cached);
    } catch (e) {
        return null;
    }
})();

// Static icons mapping to avoid serializing React components
const STAT_ICONS = {
    'Ganancias (Mes)': DollarSign,
    'Horas Trabajadas': Clock,
    'Calificación': Star,
    'Próximos Turnos': Calendar
};

const CaregiverOverview = () => {
    const navigate = useNavigate();
    const { profile, user, profileLoading } = useAuth();
    const { notifications, markAsRead } = useNotifications();
    const [newRequests, setNewRequests] = useState(DASHBOARD_CACHE?.newRequests || []);
    const [myApplications, setMyApplications] = useState(DASHBOARD_CACHE?.myApplications || []);
    const [isLoading, setIsLoading] = useState(!DASHBOARD_CACHE); // No loading if cache exists
    const [isLogModalOpen, setIsLogModalOpen] = useState(false);
    const [showWellnessModal, setShowWellnessModal] = useState(false);
    const [isAppsModalOpen, setIsAppsModalOpen] = useState(false);
    const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
    const [selectedShiftForDetails, setSelectedShiftForDetails] = useState(null);
    const [showMoreNotifications, setShowMoreNotifications] = useState(false);

    // Payment Modal State
    const [editingPayment, setEditingPayment] = useState(null);
    const [recentPayments, setRecentPayments] = useState(DASHBOARD_CACHE?.recentPayments || []);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [isAlertLoading, setIsAlertLoading] = useState(false);
    const [activeAlert, setActiveAlert] = useState(null);

    // Unified notifications are now handled by NotificationContext
    const handleAcknowledge = async (notif) => {
        try {
            // 1. Mark notification as read
            await markAsRead(notif.id);

            // 2. Identify critical notifications for chat confirmation
            const criticalTitles = ['❌ Turno Cancelado', '📅 Turno Reprogramado', '📝 Cambio en Agenda', '✏️ Cita Modificada'];
            const isCritical = criticalTitles.includes(notif.title);
            const appointmentId = notif.metadata?.appointment_id;

            if (isCritical && appointmentId) {
                // Fetch appointment to get client_id
                const { data: appointment } = await supabase
                    .from('appointments')
                    .select('client_id, title')
                    .eq('id', appointmentId)
                    .single();

                if (appointment?.client_id) {
                    // Find or create conversation
                    let { data: conv } = await supabase
                        .from('conversations')
                        .select('id')
                        .or(`and(participant1_id.eq.${user.id},participant2_id.eq.${appointment.client_id}),and(participant1_id.eq.${appointment.client_id},participant2_id.eq.${user.id})`)
                        .single();

                    if (!conv) {
                        const { data: newConv } = await supabase
                            .from('conversations')
                            .insert([{
                                participant1_id: user.id,
                                participant2_id: appointment.client_id,
                                last_message: 'Iniciando conversación',
                                last_message_at: new Date().toISOString()
                            }])
                            .select()
                            .single();
                        conv = newConv;
                    }

                    if (conv) {
                        const confirmMsg = `He recibido la notificación sobre: "${notif.title}" para la cita "${appointment.title || 'solicitada'}". Confirmado.`;

                        // Insert Message
                        await supabase.from('messages').insert([{
                            conversation_id: conv.id,
                            sender_id: user.id,
                            content: confirmMsg
                        }]);

                        // Update Conversation
                        await supabase.from('conversations').update({
                            last_message: confirmMsg,
                            last_message_at: new Date().toISOString()
                        }).eq('id', conv.id);
                    }
                }
            }

            // 3. If it was an appointment modification, update the appointment too
            if (appointmentId && notif.is_modification) {
                const { error } = await supabase
                    .from('appointments')
                    .update({ modification_seen_by_caregiver: true })
                    .eq('id', appointmentId);
                if (error) throw error;
            }

            fetchDashboardData();
        } catch (error) {
            console.error('Error al confirmar notificación:', error);
        }
    };

    const handleFamilyAlert = async () => {
        // Restriction: Only allow if there's an active shift in progress
        if (!activeAlert && !activeAppointment) {
            alert('Solo puedes enviar una alerta cuando tienes un turno en curso.');
            return;
        }

        setIsAlertLoading(true);
        try {
            if (activeAlert) {
                // RESOLVE current alert
                const { error } = await supabase
                    .from('emergency_alerts')
                    .update({
                        status: 'resolved',
                        resolved_at: new Date(),
                        resolved_by: user?.id
                    })
                    .eq('id', activeAlert.id);

                if (error) throw error;
                setActiveAlert(null); // Optimistic clear
            } else {
                // SEND new alert - Uses activeAppointment exclusively
                const appointment = activeAppointment;

                const { data, error } = await supabase
                    .from('emergency_alerts')
                    .insert([{
                        caregiver_id: user?.id,
                        client_id: appointment?.client_id || appointment?.client?.id,
                        appointment_id: appointment?.id,
                        status: 'active'
                    }])
                    .select()
                    .single();

                if (error) throw error;
                if (data) setActiveAlert(data); // Update state with the new alert
            }
        } catch (error) {
            console.error('Error al gestionar alerta:', error);
            alert(`Error al ${activeAlert ? 'cancelar' : 'enviar'} la alerta. Por favor, intenta de nuevo.`);
        } finally {
            setIsAlertLoading(false);
        }
    };

    const rawName = profile?.full_name ? profile.full_name.split(' ')[0] : '...';
    const firstName = rawName.charAt(0).toUpperCase() + rawName.slice(1).toLowerCase();

    const [stats, setStats] = useState(DASHBOARD_CACHE?.stats || [
        { label: 'Ganancias (Mes)', value: '$0', color: 'text-green-600', bg: 'bg-green-100' },
        { label: 'Horas Trabajadas', value: '0h', color: 'text-blue-600', bg: 'bg-blue-100' },
        { label: 'Calificación', value: '5.0', color: 'text-orange-500', bg: 'bg-orange-100' },
        { label: 'Próximos Turnos', value: '0', color: 'text-purple-600', bg: 'bg-purple-100' },
    ]);
    const [nextShifts, setNextShift] = useState(DASHBOARD_CACHE?.nextShifts || []);
    const [loadingRequests, setLoadingRequests] = useState(!DASHBOARD_CACHE);
    const [isAvailable, setIsAvailable] = useState(true);

    const isPro = profile?.plan_type === 'professional_pro' || profile?.plan_type === 'premium';

    useEffect(() => {
        let isMounted = true;
        let safetyTimer;

        if (user && !profileLoading) {
            const loadData = async () => {
                // Safety timeout to force exit loading state
                safetyTimer = setTimeout(() => {
                    if (isMounted) {
                        console.warn("Safety timeout triggered for Dashboard load");
                        setIsLoading(false);
                    }
                }, 8000);

                try {
                    // Check if profile exists and has caregiver_details
                    if (!profile) {
                        console.warn("No profile found for current user");
                        if (isMounted) setIsLoading(false);
                        return;
                    }

                    // Execute requests individually to avoid total failure
                    // Capture results for cache
                    const requestsData = await fetchNewRequests().catch(e => { console.error("NewRequests failed", e); return DASHBOARD_CACHE?.newRequests || []; });
                    const appsData = await fetchMyApplications().catch(e => { console.error("MyApplications failed", e); return DASHBOARD_CACHE?.myApplications || []; });
                    const dashboardData = await fetchDashboardData().catch(e => { console.error("DashboardData failed", e); return DASHBOARD_CACHE || {}; });
                    await fetchAvailability().catch(e => console.error("Availability failed", e));

                    // Fetch INITIAL active emergency alert
                    const { data: currentAlerts } = await supabase
                        .from('emergency_alerts')
                        .select('*')
                        .eq('caregiver_id', user?.id)
                        .eq('status', 'active')
                        .order('created_at', { ascending: false })
                        .limit(1);

                    if (currentAlerts && currentAlerts.length > 0 && isMounted) {
                        setActiveAlert(currentAlerts[0]);
                    }

                    // Update persistent cache
                    DASHBOARD_CACHE = {
                        stats: dashboardData.stats || stats,
                        nextShifts: dashboardData.nextShifts || [],
                        newRequests: requestsData,
                        myApplications: appsData,
                        recentPayments: dashboardData.recentPayments || [],
                        timestamp: Date.now()
                    };
                    sessionStorage.setItem('DASHBOARD_CACHE', JSON.stringify(DASHBOARD_CACHE));

                } catch (error) {
                    console.error("Error loading dashboard data:", error);
                } finally {
                    if (safetyTimer) clearTimeout(safetyTimer);
                    if (isMounted) setIsLoading(false);
                }
            };

            loadData();

            // Realtime Subscription for Emergency Alerts (Caregiver Side)
            const alertsChannel = supabase
                .channel(`caregiver-alerts-${user.id}`)
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'emergency_alerts',
                        filter: `caregiver_id=eq.${user?.id}`
                    },
                    (payload) => {
                        console.log('Cambio en alerta detectado:', payload);
                        if (payload.eventType === 'INSERT' && payload.new.status === 'active') {
                            setActiveAlert(payload.new);
                        } else if (payload.eventType === 'UPDATE' && payload.new.status === 'resolved') {
                            setActiveAlert(null);
                        } else if (payload.eventType === 'DELETE') {
                            setActiveAlert(null);
                        }
                    }
                )
                .subscribe();

            return () => {
                isMounted = false;
                if (safetyTimer) clearTimeout(safetyTimer);
                supabase.removeChannel(alertsChannel);
            };
        } else if (!user && !profileLoading) {
            setIsLoading(false);
        }

        return () => {
            isMounted = false;
            if (safetyTimer) clearTimeout(safetyTimer);
        };
    }, [user, profileLoading]);

    // Unified notifications handled by context

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
                .eq('id', user?.id)
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

    const cleanupExpiredShifts = async () => {
        try {
            const now = new Date();
            const todayStr = now.toLocaleDateString('en-CA');
            // Add 5 minutes grace period
            const graceTime = new Date(now.getTime() - 5 * 60 * 1000);
            const currentGraceTimeStr = `${String(graceTime.getHours()).padStart(2, '0')}:${String(graceTime.getMinutes()).padStart(2, '0')}:00`;

            // Confirmed shifts that were not started by their END TIME (+ 5 min)
            const { data: maybePastShifts, error: fetchError } = await supabase
                .from('appointments')
                .select('id, date, time, end_time')
                .eq('caregiver_id', user?.id)
                .eq('status', 'confirmed')
                .lte('date', todayStr);

            if (fetchError) throw fetchError;

            const expiredShifts = (maybePastShifts || []).filter(s => {
                if (s.date < todayStr) return true;
                const endTime = s.end_time || s.time;
                return endTime < currentGraceTimeStr;
            });

            if (fetchError) throw fetchError;

            if (expiredShifts && expiredShifts.length > 0) {
                const ids = expiredShifts.map(s => s.id);
                await supabase
                    .from('appointments')
                    .update({ status: 'cancelled' })
                    .in('id', ids);
            }

            // NEW: Public jobs (pending) that expired (Clean up applications) - 5 min grace
            const { data: expiredJobs } = await supabase
                .from('appointments')
                .select('id, title, date, client_id')
                .is('caregiver_id', null)
                .eq('status', 'pending')
                .or(`date.lt.${todayStr},and(date.eq.${todayStr},end_time.lt.${currentGraceTimeStr})`);

            if (expiredJobs && expiredJobs.length > 0) {
                for (const job of expiredJobs) {
                    const { data: applicants } = await supabase
                        .from('job_applications')
                        .select('caregiver_id')
                        .eq('appointment_id', job.id);

                    if (applicants && applicants.length > 0) {
                        for (const applicant of applicants) {
                            try {
                                // Notification Center (Always)
                                await supabase.from('notifications').insert({
                                    user_id: applicant.caregiver_id,
                                    title: 'Oferta Expirada',
                                    message: `La vacante "${job.title}" ha expirado.`,
                                    type: 'system',
                                    is_read: false
                                });
                            } catch (err) { }
                        }
                        // Mark applications as CANCELLED (Do NOT delete)
                        await supabase
                            .from('job_applications')
                            .update({ status: 'cancelled' })
                            .eq('appointment_id', job.id);
                    }
                    // Cancel appointment
                    await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', job.id);
                }
            }
        } catch (err) {
            console.error("Error cleaning up expired shifts/jobs in overview:", err);
        }
    };

    const fetchDashboardData = async () => {
        try {
            await cleanupExpiredShifts();
            const today = new Date().toLocaleDateString('en-CA'); // Local YYYY-MM-DD

            // 1. Fetch Next Shift with care_logs pre-loaded
            const { data: nextShiftData } = await supabase
                .from('appointments')
                .select(`
                    *,
                    client:client_id (
                        full_name,
                        address,
                        avatar_url,
                        subscription_status,
                        patients (*)
                    ),
                    patient:patient_id (*),
                    care_logs (action, detail, category, created_at)
                `)
                .eq('caregiver_id', user?.id)
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
                .select('*, offered_rate')
                .eq('caregiver_id', user.id)
                .gte('date', startOfMonth)
                .or('status.eq.completed,status.eq.paid'); // Include paid ones too

            // 2b. Calculate Real Rating (Fetch ALL reviews)
            const { data: allReviews } = await supabase
                .from('reviews')
                .select('rating')
                .eq('caregiver_id', user?.id);

            const calculatedRating = allReviews && allReviews.length > 0
                ? (allReviews.reduce((acc, curr) => acc + curr.rating, 0) / allReviews.length).toFixed(1)
                : (profile?.caregiver_details?.rating || '0.0');



            let monthlyEarnings = 0;
            let monthlyHours = 0;

            (completedThisMonth || []).forEach(app => {
                // Logic: Use payment_amount if paid, otherwise estimate from offered_rate * hours
                let pay = 0;

                // Calculate Hours first
                let hours = 0;
                if (app.started_at && app.ended_at) {
                    const start = new Date(app.started_at);
                    const end = new Date(app.ended_at);
                    const diffMs = end - start;
                    hours = diffMs / (1000 * 60 * 60);
                } else if (app.time && app.end_time) {
                    const parseTime = (t) => {
                        const [h, m] = t.split(':').map(Number);
                        return h + (m / 60);
                    };
                    const start = parseTime(app.time);
                    const end = parseTime(app.end_time);
                    if (!isNaN(start) && !isNaN(end) && end > start) {
                        hours = (end - start);
                    }
                }

                if (app.payment_status === 'paid' && app.payment_amount) {
                    pay = parseFloat(app.payment_amount);
                } else if (app.offered_rate && hours > 0) {
                    pay = parseFloat(app.offered_rate) * hours;
                }

                // Add to monthly totals
                monthlyEarnings += pay;
                if (hours > 0) monthlyHours += hours;
            });

            const { count: upcomingCount } = await supabase
                .from('appointments')
                .select('*', { count: 'exact', head: true })
                .eq('caregiver_id', user?.id)
                .gte('date', today)
                .eq('status', 'confirmed');

            const newStats = [];

            // Only add Financial/Hours stats if user is PREMIUM (Reports & Finance package)
            if (profile?.plan_type === 'premium' || profile?.plan_type === 'professional_pro') {
                newStats.push(
                    { label: 'Ganancias (Mes)', value: `$${Math.round(monthlyEarnings).toLocaleString()}`, color: 'text-green-600', bg: 'bg-green-100' },
                    { label: 'Horas Trabajadas', value: `${Math.round(monthlyHours)}h`, color: 'text-blue-600', bg: 'bg-blue-100' }
                );
            }

            // Always add core stats
            newStats.push(
                {
                    label: 'Calificación',
                    value: `${calculatedRating} / 5`,
                    color: (allReviews?.length > 0) ? 'text-orange-500' : 'text-gray-400',
                    bg: (allReviews?.length > 0) ? 'bg-orange-100' : 'bg-gray-100'
                },
                { label: 'Próximos Turnos', value: upcomingCount || '0', color: 'text-purple-600', bg: 'bg-purple-100' }
            );

            setStats(newStats);


            // 4. Fetch Recent Activity (Mixed)
            // A. Recent Completed/Paid Appointments
            const { data: recentCompleted } = await supabase
                .from('appointments')
                .select(`*, client:client_id(full_name)`)
                .eq('caregiver_id', user?.id)
                .eq('status', 'completed')
                .order('date', { ascending: false })
                .limit(3);

            // B. Recent Reviews
            const { data: recentReviews } = await supabase
                .from('reviews')
                .select(`*, reviewer:reviewer_id(full_name)`)
                .eq('caregiver_id', user?.id)
                .order('created_at', { ascending: false })
                .limit(2);

            // Merge and Sort
            let activity = [];

            (recentCompleted || []).forEach(app => {
                activity.push({
                    type: 'appointment',
                    date: new Date(app.updated_at || app.date), // Use updated_at to show when it was actually completed
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

            return {
                stats: newStats,
                nextShifts: filteredShifts,
                recentPayments: activity.slice(0, 5)
            };

        } catch (error) {
            console.error("Error fetching dashboard data:", error);
            return {
                stats: DASHBOARD_CACHE?.stats || stats,
                nextShifts: DASHBOARD_CACHE?.nextShifts || [],
                recentPayments: DASHBOARD_CACHE?.recentPayments || []
            };
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
                .eq('caregiver_id', user?.id)
                .eq('status', 'pending')
                .limit(5);

            if (error) throw error;
            setNewRequests(data || []);
            return data || [];
        } catch (error) {
            console.error("Error fetching requests:", error);
            return DASHBOARD_CACHE?.newRequests || [];
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
                .eq('caregiver_id', user?.id)
                .order('created_at', { ascending: false })
                .limit(20); // Fetches more to allow for filtering

            if (error) throw error;

            // NEW POLICY: Show ALL applications (History), including cancelled/expired
            // We just sort them by date (already sorted by query)
            setMyApplications(data);
            return data || [];
        } catch (error) {
            console.error("Error fetching applications:", error);
            return DASHBOARD_CACHE?.myApplications || [];
        }
    };

    const handleAction = async (id, status, shiftObject = null) => {
        setIsActionLoading(true);
        try {
            // --- MANADATORY WORKFLOW FOR PULSO ---
            if (status === 'completed') {
                const currentShift = shiftObject || nextShifts.find(s => s.id === id);

                if (currentShift && currentShift.type === 'Cuidado+') {
                    const hasBitacora = currentShift.care_logs?.some(l => l.category !== 'Wellness');
                    const hasWellness = currentShift.care_logs?.some(l => l.category === 'Wellness');

                    if (!hasBitacora || !hasWellness) {
                        alert("⚠️ AGENDA DE CUIDADO INCOMPLETA\n\nPara finalizar este turno debes:\n1. Completar la Bitácora de Actividades.\n2. Enviar el Reporte PULSO de Bienestar.\n\nPor favor ajusta los registros antes de salir.");
                        setIsActionLoading(false);
                        return;
                    }
                }
            }
            // ----------------------------------------

            const updateData = { status };

            // Add real timestamps
            if (status === 'in_progress') {
                updateData.started_at = new Date().toISOString();
            } else if (status === 'completed') {
                updateData.ended_at = new Date().toISOString();
            }

            const { error } = await supabase
                .from('appointments')
                .update(updateData)
                .eq('id', id);

            if (error) throw error;

            // Clear successful feedback
            if (status === 'confirmed') {
                alert("✅ Turno aceptado correctamente.");
            } else if (status === 'in_progress') {
                alert("🚀 Turno iniciado. ¡Buen trabajo!");
            } else if (status === 'completed') {
                alert("🏆 Turno finalizado con éxito. No olvides completar la bitácora.");
            } else if (status === 'cancelled') {
                alert("⚠️ Turno ignorado/cancelado.");
            }

            setNewRequests(prev => prev.filter(r => r.id !== id));
            fetchDashboardData(); // Refresh stats/next shift if accepted
        } catch (error) {
            console.error("Error updating request:", error);
            alert("❌ Error: " + (error.message || "No se pudo actualizar el turno."));
        } finally {
            setIsActionLoading(false);
        }
    };




    if ((isLoading || profileLoading) && !DASHBOARD_CACHE) { // Check both and ONLY block if no cache exists
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 size={48} className="animate-spin text-blue-600" />
                    <p className="text-gray-500 font-medium animate-pulse">Cargando tu actividad...</p>
                </div>
            </div>
        );
    }

    const activeAppointment = nextShifts.length > 0 && nextShifts[0].status === 'in_progress' ? nextShifts[0] : null;

    return (
        <>
            <div className="space-y-10 animate-fade-in pb-12">
                {/* Header */}
                <div className={`bg-gradient-to-br ${isPro ? 'from-[#0F3C4C] via-[#1a5a70] to-[#2FAE8F]' : 'from-slate-700 to-slate-900'} rounded-[16px] p-10 !text-[#FAFAF7] shadow-2xl relative overflow-hidden mb-12 transition-all duration-700`}>
                    <div className={`absolute top-0 right-0 w-80 h-80 ${isPro ? 'bg-[var(--secondary-color)]' : 'bg-slate-400'} rounded-full -translate-y-1/2 translate-x-1/2 blur-[120px] opacity-20 transition-colors duration-700`}></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-[var(--accent-color)] rounded-full translate-y-1/2 -translate-x-1/2 blur-[100px] opacity-10"></div>

                    <div className="relative z-10">
                        <div className="grid lg:grid-cols-3 gap-8 items-start md:items-center">
                            <div className="lg:col-span-2 flex flex-col md:flex-row items-start md:items-center gap-10">
                                {/* Avatar integration in overview */}
                                <div className="w-24 h-24 rounded-[20px] border-[4px] border-white/20 shadow-2xl relative overflow-hidden shrink-0 ring-4 ring-white/10 flex items-center justify-center">
                                    {profile?.avatar_url ? (
                                        <img
                                            src={profile.avatar_url}
                                            alt="Profile"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#A7D8E8' }}>
                                            <User size={64} style={{ color: '#0F3C4C' }} strokeWidth={1.5} />
                                        </div>
                                    )}
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
                            <div className="lg:col-span-1 flex items-center gap-2 justify-start">
                                <button
                                    onClick={handleFamilyAlert}
                                    disabled={isAlertLoading || (!activeAlert && !activeAppointment)}
                                    className={`btn flex items-center gap-2 px-4 py-2 rounded-[16px] font-black uppercase tracking-widest text-[10px] sm:text-xs transition-all shadow-xl hover:scale-105 active:scale-95 border-none whitespace-nowrap ${activeAlert
                                        ? 'bg-white !text-red-600 animate-pulse ring-4 ring-white/30'
                                        : (activeAppointment ? 'bg-red-600 !text-white' : 'bg-slate-300 !text-slate-500 cursor-not-allowed grayscale')
                                        }`}
                                >
                                    <AlertCircle size={20} className={activeAlert ? 'animate-bounce' : ''} />
                                    {activeAlert ? 'CANCELAR ALERTA' : 'ALERTA FAMILIAR'}
                                </button>
                                <button
                                    onClick={() => navigate('/caregiver/jobs')}
                                    className="btn bg-[var(--secondary-color)] hover:bg-emerald-600 !text-[#FAFAF7] px-4 py-2 rounded-[16px] font-black uppercase tracking-widest text-[10px] sm:text-xs shadow-2xl shadow-green-900/40 border-none group transition-all whitespace-nowrap"
                                >
                                    Buscar Turnos
                                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform ml-2" />
                                </button>
                            </div>
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
                                        {(() => {
                                            const IconComp = STAT_ICONS[stat.label] || Activity;
                                            return <IconComp size={32} strokeWidth={2.5} {...(IconComp === Star ? { fill: 'currentColor' } : {})} />;
                                        })()}
                                    </div>
                                    <div className="relative z-10 text-left">
                                        <p className="text-[10px] text-[var(--text-light)] font-black uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                                        <h3 className="text-4xl font-brand font-bold text-[var(--primary-color)] tracking-tight">{stat.value}</h3>
                                    </div>
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent-color)]/5 rounded-full translate-x-1/2 -translate-y-1/2 blur-2xl group-hover:bg-[var(--secondary-color)]/10 transition-colors"></div>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-8">
                            {nextShifts.length > 0 ? (
                                <div className="space-y-10">
                                    {/* Current/Next Shift Hero Section */}
                                    {(() => {
                                        const shift = nextShifts[0];
                                        const isCuidadoPlus = shift.type === 'Cuidado+';

                                        // Parse activities specific for today if available, or fall back to general details
                                        let todayActivities = [];
                                        try {
                                            if (shift.care_agenda && Array.isArray(shift.care_agenda) && shift.care_agenda.length > 0) {
                                                todayActivities = shift.care_agenda.map(item => ({
                                                    name: item.activity || item.name,
                                                    category: item.program_name || item.program || item.category
                                                }));
                                            } else if (shift.details) {
                                                // Try JSON from details
                                                if (shift.details.includes('---SERVICES---')) {
                                                    try {
                                                        const jsonStr = shift.details.split('---SERVICES---')[1];
                                                        const services = JSON.parse(jsonStr);
                                                        if (Array.isArray(services)) {
                                                            todayActivities = services.map(s => ({
                                                                name: s.activity_name || s.name || s.activity,
                                                                category: s.program_name || s.program || s.category
                                                            }));
                                                        }
                                                    } catch (e) { }
                                                }

                                                // Fallback to legacy parsing if still empty
                                                if (todayActivities.length === 0) {
                                                    const parts = shift.details.split('[PLAN DE CUIDADO]');
                                                    if (parts.length > 1) {
                                                        const planSection = parts[1].split('---SERVICES---')[0];
                                                        todayActivities = planSection.split('•').map(s => s.trim()).filter(s => s && s.length > 2).map(s => ({ name: s }));
                                                    } else if (shift.type === 'Cuidado+' && shift.details.includes('[')) {
                                                        try {
                                                            const jsonStart = shift.details.indexOf('[');
                                                            const jsonStr = shift.details.substring(jsonStart);
                                                            const services = JSON.parse(jsonStr);
                                                            if (Array.isArray(services)) {
                                                                todayActivities = services.map(s => ({
                                                                    name: s.activity_name || s.name || s.activity,
                                                                    category: s.program_name || s.program || s.category
                                                                }));
                                                            }
                                                        } catch (e) { }
                                                    }
                                                }
                                            }
                                        } catch (e) {
                                            console.error("Error parsing shift activities", e);
                                        }

                                        return (
                                            <div key={shift.id}>
                                                {/* External Status Indicator */}
                                                {shift.status === 'in_progress' && (
                                                    <div className="flex items-center gap-4 mb-6 bg-emerald-500/20 w-fit px-8 py-5 rounded-full border border-emerald-500/40 shadow-xl animate-fade-in backdrop-blur-md">
                                                        <span className="relative flex h-4 w-4">
                                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                            <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
                                                        </span>
                                                        <span className="text-lg font-black text-emerald-500 uppercase tracking-[0.25em]">Turno en curso</span>
                                                    </div>
                                                )}

                                                <div className={`rounded-[16px] p-10 !text-[#FAFAF7] shadow-2xl relative overflow-hidden group border ${isCuidadoPlus ? 'bg-[#0F3C4C] border-[#C5A265]/50' : 'bg-[var(--primary-color)] border-white/10'}`}>

                                                    {isCuidadoPlus && (
                                                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#C5A265] via-[#E5C585] to-[#C5A265]"></div>
                                                    )}

                                                    <div className="absolute top-0 right-0 w-80 h-80 bg-[var(--secondary-color)] rounded-full -translate-y-1/2 translate-x-1/2 blur-[100px] opacity-20 group-hover:opacity-30 transition-all"></div>
                                                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-[var(--accent-color)] rounded-full translate-y-1/2 -translate-x-1/2 blur-[80px] opacity-10"></div>

                                                    <div className="relative z-10 flex flex-col xl:flex-row justify-between xl:items-center gap-10">
                                                        <div className="flex-1 text-left">
                                                            <div className="flex items-center gap-6 mb-8">
                                                                <div className="w-20 h-20 rounded-[16px] flex items-center justify-center backdrop-blur-md shadow-inner ${isCuidadoPlus ? 'bg-[#C5A265]/20 border border-[#C5A265]/50 text-[#C5A265]' : 'bg-white/10 border border-white/20'}">
                                                                    <User size={40} strokeWidth={1.5} />
                                                                </div>
                                                                <div>
                                                                    {isCuidadoPlus && (
                                                                        <span className="bg-[#C5A265] text-[#0F3C4C] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-2 inline-block shadow-lg shadow-[#C5A265]/20">
                                                                            Agenda de Cuidado PULSO Activa
                                                                        </span>
                                                                    )}
                                                                    <h3 className="text-4xl font-brand font-bold tracking-tight mb-1 !text-white">{shift.client?.full_name || 'Cliente'}</h3>
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
                                                                <div className={`inline-block !text-[#FAFAF7] px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest shadow-xl border border-white/10 ${isCuidadoPlus ? 'bg-[#C5A265] !text-[#0F3C4C]' : 'bg-[var(--secondary-color)]'}`}>
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
                                                                        <div className="flex items-center justify-between gap-2 mb-3">
                                                                            <div className="flex items-center gap-2 text-[var(--accent-color)] text-[10px] font-black uppercase tracking-[0.2em] opacity-80">
                                                                                <Activity size={12} className="animate-pulse" /> Instrucciones del Plan
                                                                            </div>
                                                                        </div>

                                                                        {todayActivities.length > 0 ? (
                                                                            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                                                                {todayActivities.map((act, i) => (
                                                                                    <div key={i} className="flex items-start gap-4 p-4 rounded-[14px] bg-white/10 border border-white/5 hover:bg-white/15 transition-all">
                                                                                        <div className="mt-1 w-2 h-2 rounded-full bg-[var(--secondary-color)] shrink-0 shadow-[0_0_8px_var(--secondary-color)]"></div>
                                                                                        <div className="flex-1 min-w-0">
                                                                                            <span className="text-sm font-bold !text-white leading-tight block">
                                                                                                {act.name}
                                                                                            </span>
                                                                                            {act.category && (
                                                                                                <span className="text-[9px] font-black uppercase tracking-widest text-[#E5C585] bg-[#E5C585]/10 px-2 py-0.5 rounded border border-[#E5C585]/20 mt-1.5 inline-block">
                                                                                                    {act.category}
                                                                                                </span>
                                                                                            )}
                                                                                        </div>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        ) : (
                                                                            <p className="text-base !text-[#FAFAF7]/90 leading-relaxed italic font-secondary">
                                                                                "{shift.details.replace('[PLAN DE CUIDADO]', '').replace('---SERVICES---', '').trim()}"
                                                                            </p>
                                                                        )}

                                                                        {isCuidadoPlus && (
                                                                            <div className="mt-4 pt-4 border-t border-white/10">
                                                                                <button
                                                                                    onClick={() => setIsLogModalOpen(true)}
                                                                                    className="w-full bg-[#C5A265]/20 hover:bg-[#C5A265]/30 border border-[#C5A265]/50 text-[#C5A265] py-4 rounded-[16px] text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg"
                                                                                >
                                                                                    <FileText size={18} /> Agenda de Cuidado
                                                                                </button>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}

                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col gap-4 min-w-[240px]">
                                                            {shift.status === 'confirmed' ? (
                                                                <div className="flex flex-col gap-4">
                                                                    <button
                                                                        onClick={() => handleAction(shift.id, 'in_progress', shift)}
                                                                        className="btn bg-[var(--secondary-color)] hover:bg-emerald-600 !text-[#FAFAF7] py-6 text-xl rounded-[16px] font-black uppercase tracking-widest shadow-2xl shadow-green-900 border-none group transition-all"
                                                                    >
                                                                        Iniciar Turno
                                                                        <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform ml-2" />
                                                                    </button>
                                                                </div>
                                                            ) : shift.status === 'in_progress' ? (
                                                                <div className="flex flex-col gap-4">
                                                                    <button
                                                                        onClick={() => handleAction(shift.id, 'completed', shift)}
                                                                        className="bg-white text-[var(--primary-color)] px-8 py-5 rounded-[16px] font-black text-sm uppercase tracking-widest hover:bg-[var(--base-bg)] transition-all shadow-xl border-none"
                                                                    >
                                                                        Finalizar Turno
                                                                    </button>
                                                                    <div className="grid grid-cols-2 gap-3">
                                                                        <button
                                                                            onClick={() => setIsLogModalOpen(true)}
                                                                            className={`bg-white/10 !text-[#FAFAF7] p-4 rounded-[16px] font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-white/10 backdrop-blur-sm hover:bg-white/20`}
                                                                        >
                                                                            <FileText size={16} /> Bitácora
                                                                        </button>
                                                                        <button
                                                                            onClick={() => {
                                                                                if (shift.client?.subscription_status === 'active') {
                                                                                    setShowWellnessModal(true);
                                                                                } else {
                                                                                    alert("Esta función requiere que el cliente tenga una suscripción activa a BC PULSO.");
                                                                                }
                                                                            }}
                                                                            disabled={shift.client?.subscription_status !== 'active'}
                                                                            className={`bg-white/10 !text-[#FAFAF7] p-4 rounded-[16px] font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-white/10 backdrop-blur-sm ${shift.client?.subscription_status !== 'active' ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white/20'}`}
                                                                        >
                                                                            <Activity size={16} /> PULSO
                                                                        </button>
                                                                    </div>

                                                                    {/* Wellness Summary Section */}
                                                                    {shift.care_logs && shift.care_logs.some(l => l.category === 'Wellness') && (
                                                                        <div className="mt-4 p-5 bg-white/5 rounded-[20px] border border-white/10 backdrop-blur-md shadow-inner">
                                                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--accent-color)] mb-4 flex items-center gap-2 opacity-90">
                                                                                <Heart size={14} className="animate-pulse" /> Último Estado de Bienestar
                                                                            </p>
                                                                            <div className="grid grid-cols-3 gap-3">
                                                                                {[
                                                                                    { label: 'Estado General', action: 'Estado General', icon: Heart },
                                                                                    { label: 'Energía', action: 'Nivel de Energía', icon: Activity },
                                                                                    { label: 'Ánimo', action: 'Bienestar Hoy', icon: Wind }
                                                                                ].map((item, i) => {
                                                                                    const log = shift.care_logs
                                                                                        .filter(l => l.category === 'Wellness' && l.action === item.action)
                                                                                        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];

                                                                                    if (!log) return null;

                                                                                    return (
                                                                                        <div key={i} className="flex flex-col items-center gap-2 p-3 bg-white/5 rounded-[16px] border border-white/5 hover:bg-white/10 transition-all group/item">
                                                                                            <item.icon size={16} className="text-[var(--secondary-color)] group-hover/item:scale-110 transition-transform" />
                                                                                            <div className="text-center">
                                                                                                <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">{item.label}</p>
                                                                                                <p className="text-[11px] font-bold text-white leading-tight">{log.detail}</p>
                                                                                            </div>
                                                                                        </div>
                                                                                    );
                                                                                })}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <button className="bg-white/10 !text-[#FAFAF7]/50 px-8 py-5 rounded-[16px] font-black text-sm uppercase tracking-widest cursor-not-allowed border border-white/5">
                                                                    Completado
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {/* Next Shifts Title relocated below the Hero card */}
                                    <h2 className="text-2xl font-brand font-bold text-[var(--primary-color)] pt-4 mb-4 flex items-center gap-3">
                                        <Calendar size={24} className="text-[var(--secondary-color)]" />
                                        Tus Próximos Turnos
                                    </h2>

                                    <div className="space-y-6">
                                        {nextShifts.slice(1).map((shift) => (
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
                                        ))}
                                    </div>
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
                                    {(() => {
                                        const val = parseFloat(stats.find(s => s.label === 'Calificación')?.value || '0');
                                        if (val >= 4.8) return '¡Eres una Superestrella!';
                                        if (val >= 4.5) return '¡Excelente Trabajo!';
                                        if (val >= 4.0) return '¡Muy Buen Desempeño!';
                                        if (val > 0) return '¡Vamos por buen camino!';
                                        return '¡Bienvenido!';
                                    })()}
                                </h3>
                                <p className="!text-[#FAFAF7]/80 text-lg mb-10 font-secondary leading-relaxed mx-auto max-w-xs">
                                    {(() => {
                                        const val = parseFloat(stats.find(s => s.label === 'Calificación')?.value || '0');
                                        if (val >= 4.5) return 'Has mantenido una calificación excelente de ';
                                        if (val > 0) return 'Tu calificación actual basada en tus clientes es de ';
                                        return 'Tu primera calificación llegará muy pronto. Comienza con ';
                                    })()}
                                    <span className="!text-[#FAFAF7] font-black underline decoration-[var(--accent-color)] underline-offset-4">{stats.find(s => s.label === 'Calificación')?.value || '0.0 / 5'}</span>.
                                </p>
                                <button
                                    onClick={() => navigate('/caregiver/profile')}
                                    className="bg-white text-[var(--primary-color)] text-[10px] font-black uppercase tracking-[0.2em] py-5 px-8 rounded-[12px] transition-all hover:bg-[var(--accent-color)] w-full shadow-2xl transform active:scale-95"
                                >
                                    Ver mis logros y medallas
                                </button>
                            </div>
                        </div>

                        {/* Notifications / Requests Card */}
                        <div className="bg-white rounded-[12px] p-10 border border-slate-100 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--secondary-color)]/5 rounded-full translate-x-1/2 -translate-y-1/2 blur-2xl"></div>
                            <div className="flex justify-between items-center mb-10 relative z-10">
                                <h3
                                    onClick={() => navigate('/caregiver/notifications')}
                                    className="font-brand font-bold text-2xl text-[var(--primary-color)] tracking-tight flex items-center gap-3 cursor-pointer hover:opacity-70 transition-opacity"
                                >
                                    <span className="p-2.5 bg-emerald-50 text-[var(--secondary-color)] rounded-[12px]">
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
                                        <div key={req.id} className="p-6 bg-white rounded-[12px] border border-gray-100 group transition-all hover:border-[var(--secondary-color)]/30 shadow-xl shadow-gray-100/50">
                                            <div className="flex items-center gap-4 mb-6">
                                                <div className="w-14 h-14 rounded-[12px] bg-[var(--base-bg)] shadow-inner text-[var(--primary-color)] flex items-center justify-center font-brand font-bold text-xl border border-gray-50 transform group-hover:scale-105 transition-transform">
                                                    {req.client?.full_name?.charAt(0) || 'C'}
                                                </div>
                                                <div className="flex-1 min-w-0 text-left">
                                                    <p className="text-lg font-brand font-bold text-[var(--primary-color)] truncate tracking-tight">{req.client?.full_name || 'Cliente'}</p>
                                                    <p className="text-[10px] text-[var(--secondary-color)] font-black uppercase tracking-[0.2em] truncate">{req.title}</p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-3 text-[11px] text-[var(--text-main)] mb-8 font-black uppercase tracking-widest bg-[var(--base-bg)] p-4 rounded-[12px] border border-gray-50">
                                                <span className="flex items-center gap-3"><Calendar size={14} className="text-[var(--secondary-color)]" /> {req.date}</span>
                                                <span className="flex items-center gap-3">
                                                    <Clock size={14} className="text-[var(--secondary-color)]" />
                                                    Desde {req.time?.substring(0, 5)} {req.end_time ? `hasta ${req.end_time?.substring(0, 5)}` : ''}
                                                </span>
                                                <span className="flex items-start gap-3">
                                                    <MapPin size={14} className="text-[var(--secondary-color)] shrink-0 mt-0.5" />
                                                    <span className="normal-case font-bold">{req.address || 'Ubicación no especificada'}</span>
                                                </span>
                                                {req.details && (
                                                    <div className="mt-2 pt-2 border-t border-gray-100/50">
                                                        <span className="flex items-start gap-3 opacity-70">
                                                            <FileText size={14} className="text-[var(--secondary-color)] shrink-0 mt-0.5" />
                                                            <span className="normal-case font-medium italic line-clamp-3">"{req.details}"</span>
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <button
                                                    onClick={() => handleAction(req.id, 'confirmed')}
                                                    className="bg-[var(--primary-color)] !text-[#FAFAF7] py-4 rounded-[12px] font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[var(--secondary-color)] transition-all shadow-xl shadow-green-900/10 border-none"
                                                >
                                                    <Check size={16} strokeWidth={4} /> Aceptar
                                                </button>
                                                <button
                                                    onClick={() => handleAction(req.id, 'cancelled')}
                                                    className="bg-white text-gray-400 py-4 rounded-[12px] font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-50 hover:text-[var(--error-color)] border border-gray-100 transition-all"
                                                >
                                                    <X size={16} strokeWidth={4} /> Denegada
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-10 bg-[var(--base-bg)]/50 rounded-[12px] border border-dashed border-gray-200">
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
                        <div id="notifications" className="bg-white rounded-[12px] p-6 border border-gray-200 shadow-sm">
                            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <Bell size={18} className="text-orange-500" />
                                Notificaciones
                            </h3>

                            <div className="space-y-4">
                                {notifications.length > 0 ? (
                                    <>
                                        {notifications.slice(0, showMoreNotifications ? 20 : 5).map(notif => (
                                            <div
                                                key={notif.id}
                                                onClick={() => !notif.is_read && handleAcknowledge(notif)}
                                                className={`flex gap-3 items-start animate-fade-in border-b border-gray-50 pb-3 last:border-0 last:pb-0 cursor-pointer hover:bg-gray-50/50 p-2 rounded-lg transition-colors ${!notif.is_read ? 'bg-blue-50/30' : 'opacity-60'}`}
                                            >
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${!notif.is_read ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                                                    {notif.type === 'alert' ? <AlertCircle size={14} /> : <Bell size={14} />}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="text-xs text-gray-800">
                                                        <p className="font-bold mb-0.5">{notif.title}</p>
                                                        <p className="text-gray-600 leading-tight">{notif.message}</p>
                                                        {!notif.is_read && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleAcknowledge(notif);
                                                                }}
                                                                className="mt-2 text-[10px] bg-[var(--primary-color)] !text-[#FAFAF7] px-2 py-1 rounded font-black uppercase tracking-widest hover:bg-[var(--secondary-color)] transition-colors"
                                                            >
                                                                {['❌ Turno Cancelado', '📅 Turno Reprogramado', '📝 Cambio en Agenda', '✏️ Cita Modificada'].includes(notif.title)
                                                                    ? 'Enviar confirmación de lectura'
                                                                    : 'Marcar como leído'}
                                                            </button>
                                                        )}
                                                    </div>
                                                    <p className="text-[9px] text-gray-400 mt-1">
                                                        {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(notif.created_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}

                                        {notifications.length > 5 && !showMoreNotifications && (
                                            <button
                                                onClick={() => setShowMoreNotifications(true)}
                                                className="w-full mt-4 text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] hover:text-[var(--primary-color)] transition-colors border-t border-gray-50 pt-4 flex items-center justify-center gap-2 group"
                                            >
                                                <History size={14} className="group-hover:rotate-[-45deg] transition-transform" /> Ver anteriores ({notifications.length - 5})
                                            </button>
                                        )}
                                    </>
                                ) : (
                                    <p className="text-xs text-gray-400 text-center py-2 italic">No tienes nuevas notificaciones.</p>
                                )}
                            </div>
                        </div>

                        {/* My Applications Card */}
                        <div className="bg-white rounded-[12px] p-6 border border-gray-200 shadow-sm overflow-hidden">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                    <Check size={18} className="text-purple-600" />
                                    Mis Postulaciones
                                </h3>
                            </div>

                            <div className="space-y-3">
                                {myApplications.length > 0 ? (
                                    myApplications.slice(0, 5).map(app => (
                                        <div key={app.id} className="p-3 bg-gray-50 rounded-[12px] border border-gray-100">
                                            <div className="flex justify-between items-start mb-1">
                                                <p className="text-xs font-bold text-gray-800">{app.appointment?.title || 'Servicio'}</p>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${// Case 1: Appointment is finished (Completed/Paid)
                                                    (app.appointment?.status === 'completed' || app.appointment?.status === 'paid')
                                                        ? (app.status === 'accepted' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500')
                                                        : // Case 2: Appointment is active/confirmed
                                                        (app.appointment?.status === 'confirmed' || app.appointment?.status === 'in_progress')
                                                            ? (app.status === 'accepted' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500')
                                                            : // Case 3: Rejected/Cancelled
                                                            app.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                                                (app.status === 'cancelled' || app.appointment?.status === 'cancelled') ? 'bg-gray-200 text-gray-600' :
                                                                    'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                    {(app.appointment?.status === 'completed' || app.appointment?.status === 'paid')
                                                        ? (app.status === 'accepted' ? 'Completado' : 'Finalizado')
                                                        : (app.appointment?.status === 'confirmed' || app.appointment?.status === 'in_progress')
                                                            ? (app.status === 'accepted' ? 'Confirmado' : 'Cerrado')
                                                            : app.status === 'rejected' ? 'Denegada' :
                                                                (app.status === 'cancelled' || app.appointment?.status === 'cancelled') ? 'Cancelada/Exp' : 'Pendiente'}
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

                                {myApplications.length > 5 && (
                                    <button
                                        onClick={() => setIsAppsModalOpen(true)}
                                        className="w-full mt-4 text-xs text-gray-500 font-bold hover:text-[var(--primary-color)] transition-colors border-t border-gray-100 pt-3 flex items-center justify-center gap-1"
                                    >
                                        Ver anteriores ({myApplications.length - 5})
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals outside the animated container */}
            <AllApplicationsModal
                isOpen={isAppsModalOpen}
                onClose={() => setIsAppsModalOpen(false)}
                applications={myApplications}
            />

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
                        caregiverId={user?.id}
                        clientName={nextShifts[0].client?.full_name}
                        appointmentDetails={nextShifts[0].details}
                        careAgenda={nextShifts[0].care_agenda}
                        clientId={nextShifts[0].client_id}
                        initialLogs={nextShifts[0].care_logs}
                        onSaved={fetchDashboardData}
                    />
                    <WellnessReportModal
                        isOpen={showWellnessModal}
                        onClose={() => setShowWellnessModal(false)}
                        appointmentId={nextShifts[0].id}
                        caregiverId={user?.id}
                        initialLogs={nextShifts[0].care_logs}
                        onSaved={() => {
                            fetchDashboardData();
                        }}
                    />
                    {isShiftModalOpen && (
                        <ShiftDetailsModal
                            isOpen={isShiftModalOpen}
                            onClose={() => {
                                setIsShiftModalOpen(false);
                                setSelectedShiftForDetails(null);
                            }}
                            shift={selectedShiftForDetails}
                            onAction={(id, status) => {
                                handleAction(id, status, selectedShiftForDetails);
                            }}
                            isLoading={isActionLoading}
                        />
                    )}
                </>
            )}
        </>
    );
};

export default CaregiverOverview;
