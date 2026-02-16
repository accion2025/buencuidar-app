import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
    ShieldCheck,
    User,
    CheckCircle,
    XCircle,
    Clock,
    Activity,
    Star,
    MessageSquare,
    MapPin,
    Calendar,
    ChevronRight,
    Loader2,
    Download,
    ChevronDown,
    AlertCircle,
    History,
    FileText,
    ListTodo,
    Check,
    HandHeart,
    Accessibility,
    HeartPulse,
    Dumbbell,
    Coffee,
    Heart
} from 'lucide-react';
import { formatTimeAgo, formatDateRange } from '../../utils/time';

import RateCaregiverModal from '../../components/dashboard/RateCaregiverModal';
import CaregiverDetailModal from '../../components/dashboard/CaregiverDetailModal';
import { CARE_AGENDA_CATEGORIES } from '../../constants/careAgenda';

const CuidadoPlusPanel = () => {
    const { user, profile } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState("Sincronizando...");

    // Data States
    const [applications, setApplications] = useState([]);
    const [groupedApplications, setGroupedApplications] = useState({});
    const [inProgressServices, setInProgressServices] = useState([]);
    const [scheduledServices, setScheduledServices] = useState([]);
    const [completedServices, setCompletedServices] = useState([]);
    const [pendingRequests, setPendingRequests] = useState({});

    // UI States
    const [ratingAppointment, setRatingAppointment] = useState(null);
    const [selectedCaregiver, setSelectedCaregiver] = useState(null);
    const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
    const [selectedSchedulePackage, setSelectedSchedulePackage] = useState(null);
    const [expandedAppointmentId, setExpandedAppointmentId] = useState(null);
    const [activeAlert, setActiveAlert] = useState(null);

    // New States for Monitoring
    const [careLogs, setCareLogs] = useState([]);
    const [packageHistory, setPackageHistory] = useState([]);

    useEffect(() => {
        let isMounted = true;

        const CACHE_KEY = `bc_cuidado_plus_cache_${user?.id}`;
        const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

        const fetchData = async (isBackground = false) => {
            if (!user) {
                if (isMounted) setLoading(false);
                return;
            }

            if (!isBackground) setLoading(true);

            // Safety Timeout
            const safetyTimer = setTimeout(() => {
                if (isMounted) {
                    console.warn("Safety timeout triggered for Cuidado+ Panel");
                    setLoading(false);
                }
            }, 8000);

            try {
                // Realtime Subscription for Emergency Alerts
                const alertsChannel = supabase
                    .channel('emergency-alerts-cp')
                    .on(
                        'postgres_changes',
                        {
                            event: 'INSERT',
                            schema: 'public',
                            table: 'emergency_alerts',
                            filter: `client_id=eq.${user.id}`
                        },
                        (payload) => {
                            console.log('¡ALERTA CUIDADO+ RECIBIDA!', payload.new);
                            setActiveAlert(payload.new);
                        }
                    )
                    .subscribe();

                // INITIAL FETCH of active alerts
                supabase
                    .from('emergency_alerts')
                    .select('*')
                    .eq('client_id', user.id)
                    .eq('status', 'active')
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .then(({ data }) => {
                        if (data && data.length > 0) setActiveAlert(data[0]);
                    });

                const fetchApps = async () => {
                    const { data: rawApps, error: appsError } = await supabase
                        .from('job_applications')
                        .select('*')
                        .eq('status', 'pending');

                    if (appsError) throw appsError;

                    if (!rawApps || rawApps.length === 0) {
                        return { apps: [], groups: {} };
                    }

                    const appointmentIds = [...new Set(rawApps.map(a => a.appointment_id))];
                    const { data: appointments, error: appError } = await supabase
                        .from('appointments')
                        .select('id, title, date, type, status, service_group_id')
                        .in('id', appointmentIds);

                    if (appError) console.error("Error fetching appointments:", appError);
                    const appointmentMap = (appointments || []).reduce((acc, app) => ({ ...acc, [app.id]: app }), {});

                    const caregiverIds = [...new Set(rawApps.map(a => a.caregiver_id))];
                    const { data: caregivers, error: careError } = await supabase
                        .from('profiles')
                        .select('id, full_name, avatar_url, phone, plan_type')
                        .in('id', caregiverIds);

                    if (careError) console.error("Error fetching caregivers:", careError);
                    const caregiverMap = (caregivers || []).reduce((acc, c) => ({ ...acc, [c.id]: c }), {});

                    const joinedApps = rawApps.map(app => ({
                        ...app,
                        appointment: appointmentMap[app.appointment_id] || null,
                        caregiver: caregiverMap[app.caregiver_id] || null
                    })).filter(app => {
                        if (!app.appointment) return false;
                        if (['cancelled', 'rejected', 'archived'].includes(app.appointment.status)) return false;

                        const isCuidadoType = app.appointment.type === 'Cuidado+';
                        const isPackageTitle = app.appointment.title && (
                            app.appointment.title.toUpperCase().includes('PACK') ||
                            app.appointment.title.toUpperCase().includes('CUIDADO') ||
                            app.appointment.title.toUpperCase().includes('(PS)')
                        );
                        return isCuidadoType || isPackageTitle || !!app.appointment.service_group_id;
                    });

                    // Fetch group titles if applicable
                    const groupIds = [...new Set(joinedApps.map(app => app.appointment?.service_group_id).filter(id => !!id))];
                    let groupTitleMap = {};
                    if (groupIds.length > 0) {
                        const { data: groupsData } = await supabase
                            .from('service_groups')
                            .select('id, title')
                            .in('id', groupIds);
                        groupTitleMap = (groupsData || []).reduce((acc, g) => ({ ...acc, [g.id]: g.title }), {});
                    }

                    const groups = {};
                    joinedApps.forEach(app => {
                        const groupId = app.appointment?.service_group_id;
                        const groupTitle = groupId ? groupTitleMap[groupId] : null;
                        const key = groupId
                            ? `${app.caregiver_id}_${groupId}`
                            : `${app.caregiver_id}_${app.appointment?.title}`;

                        if (!groups[key]) {
                            groups[key] = {
                                service_group_id: groupId,
                                caregiver: app.caregiver,
                                title: groupTitle || app.appointment?.title,
                                applications: [],
                                dates: []
                            };
                        }
                        groups[key].applications.push(app);
                        groups[key].dates.push(app.appointment?.date);
                    });

                    return { apps: joinedApps, groups };
                };

                // 2. Fetch Completed Services
                const fetchCompleted = async () => {
                    const { data: completedData, error: completedError } = await supabase
                        .from('appointments')
                        .select(`*, caregiver:caregiver_id (full_name, avatar_url)`)
                        .eq('client_id', user.id)
                        .eq('type', 'Cuidado+')
                        .in('status', ['completed', 'paid'])
                        .order('date', { ascending: false })
                        .limit(5);

                    if (completedError) throw completedError;

                    // Fetch reviews for these appointments
                    if (completedData && completedData.length > 0) {
                        const ids = completedData.map(a => a.id);
                        const { data: reviews } = await supabase
                            .from('reviews')
                            .select('appointment_id, rating')
                            .in('appointment_id', ids);

                        const reviewsMap = (reviews || []).reduce((acc, r) => ({ ...acc, [r.appointment_id]: r.rating }), {});
                        return completedData.map(a => ({ ...a, reviews: reviewsMap[a.id] ? [{ rating: reviewsMap[a.id] }] : [] }));
                    }

                    return completedData || [];
                };

                // 3. Fetch Pending Requests (Waiting for selection)
                const fetchPending = async () => {
                    const { data: pendingData, error: pendingError } = await supabase
                        .from('appointments')
                        .select('*')
                        .eq('client_id', user.id)
                        .eq('status', 'pending')
                        .is('caregiver_id', null)
                        .order('date', { ascending: true });

                    if (pendingError) throw pendingError;

                    const filtered = (pendingData || []).filter(app =>
                        app.type === 'Cuidado+' ||
                        (app.title && (app.title.toUpperCase().includes('PACK') || app.title.toUpperCase().includes('CUIDADO')))
                    );

                    const groups = {};
                    filtered.forEach(app => {
                        const key = app.service_group_id || `${app.title}_${app.date}`;
                        if (!groups[key]) {
                            groups[key] = {
                                title: app.title,
                                service_group_id: app.service_group_id,
                                appointments: [],
                                startDate: app.date,
                                endDate: app.date,
                                firstAppId: app.id
                            };
                        }
                        groups[key].appointments.push(app);
                        if (app.date < groups[key].startDate) groups[key].startDate = app.date;
                        if (app.date > groups[key].endDate) groups[key].endDate = app.date;
                    });

                    return groups;
                };

                // 4. Fetch Services (In Progress & Scheduled)
                const fetchServices = async () => {
                    const now = new Date();
                    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`;

                    // Fetch all Cuidado+ appointments to determine package status and last turns
                    // Note: We fetch even those without 'confirmed' to determine historical state or if they are in progress
                    const { data: servicesData, error: servicesError } = await supabase
                        .from('appointments')
                        .select(`*, caregiver:caregiver_id (full_name, avatar_url)`)
                        .eq('client_id', user.id)
                        .eq('type', 'Cuidado+')
                        .order('date', { ascending: true });

                    if (servicesError) throw servicesError;

                    const inProgress = [];
                    const allScheduled = [];
                    const scheduledGroups = {};
                    const activeGroupIds = new Set();
                    const packageMap = {};

                    // 1. Group by package and find status
                    (servicesData || []).forEach(srv => {
                        const groupId = srv.service_group_id || `single-${srv.id}`;

                        if (!packageMap[groupId]) {
                            packageMap[groupId] = {
                                appointments: [],
                                hasFuture: false,
                                activeMonitoringTarget: null,
                                lastCompleted: null,
                                title: srv.title
                            };
                        }

                        const pkg = packageMap[groupId];
                        pkg.appointments.push(srv);

                        // Robust time comparison: ensure 08:00:00 format
                        const srvTime = srv.time ? (srv.time.split(':').length === 2 ? `${srv.time}:00` : srv.time) : "00:00:00";
                        const isFuture = srv.date > today || (srv.date === today && srvTime > currentTime);

                        if (isFuture && srv.status === 'confirmed') {
                            pkg.hasFuture = true;
                        }

                        // Determine priority target for monitoring
                        if (srv.status === 'in_progress') {
                            pkg.activeMonitoringTarget = srv;
                        } else {
                            const isPastOrPresent = srv.date < today || (srv.date === today && srvTime <= currentTime);

                            // Track most recent active/recent turn
                            const isMostRecent = !pkg.lastCompleted ||
                                srv.date > pkg.lastCompleted.date ||
                                (srv.date === pkg.lastCompleted.date && srvTime > (pkg.lastCompleted.time || "00:00:00"));

                            if (isMostRecent) {
                                // Priority to completed/paid, but allow past confirmed/pending as fallback if it's the most recent past item
                                if (['completed', 'paid'].includes(srv.status)) {
                                    pkg.lastCompleted = srv;
                                } else if (isPastOrPresent) {
                                    pkg.lastCompleted = srv;
                                }
                            }
                        }
                    });

                    // 2. Process monitoring targets and scheduled list
                    Object.keys(packageMap).forEach(groupId => {
                        const pkg = packageMap[groupId];

                        // Rule: Show monitoring if package has future appointments OR there is one in_progress
                        // OR if there is a recently completed/confirmed turn to show the summary
                        const isPackageActive = pkg.hasFuture || pkg.activeMonitoringTarget || pkg.lastCompleted;

                        if (isPackageActive) {
                            // Priority to in_progress, fallback to last completed
                            const target = pkg.activeMonitoringTarget || pkg.lastCompleted;
                            if (target) {
                                inProgress.push({
                                    ...target,
                                    isHistoricalDisplay: !pkg.activeMonitoringTarget && target.status !== 'in_progress'
                                });
                                if (target.service_group_id) activeGroupIds.add(target.service_group_id);
                            }
                        }

                        // Populate scheduled list (ONLY confirmed appointments as per user request)
                        pkg.appointments.forEach(a => {
                            if (a.status !== 'confirmed') return;
                            if (a.date < today) return; // Expired pending (shouldn't be confirmed but safe check)
                            if (a.date === today && a.time <= currentTime) return; // Already started or monitoring target

                            if (a.service_group_id) {
                                if (!scheduledGroups[a.service_group_id]) {
                                    scheduledGroups[a.service_group_id] = {
                                        id: a.service_group_id,
                                        service_group_id: a.service_group_id,
                                        isGroup: true,
                                        title: a.title,
                                        caregiver: a.caregiver,
                                        appointments: [],
                                        startDate: a.date,
                                        endDate: a.date
                                    };
                                    allScheduled.push(scheduledGroups[a.service_group_id]);
                                }
                                const g = scheduledGroups[a.service_group_id];
                                g.appointments.push(a);
                                if (a.date < g.startDate) g.startDate = a.date;
                                if (a.date > g.endDate) g.endDate = a.date;
                            } else {
                                allScheduled.push(a);
                            }
                        });
                    });

                    // 3. Fetch Care Logs for visible targets
                    let logs = [];
                    if (inProgress.length > 0) {
                        const appIds = inProgress.map(s => s.id);
                        const { data: logData } = await supabase
                            .from('care_logs')
                            .select('*')
                            .in('appointment_id', appIds)
                            .order('created_at', { ascending: false });
                        logs = logData || [];
                    }

                    // 4. Fetch Package History architectures (all past and TODAY'S completed for active groups)
                    let history = [];
                    if (activeGroupIds.size > 0) {
                        const { data: historyData } = await supabase
                            .from('appointments')
                            .select(`*, caregiver:caregiver_id (full_name, avatar_url)`)
                            .in('service_group_id', Array.from(activeGroupIds))
                            .lte('date', today) // Include today
                            .order('date', { ascending: false });

                        // Filter out future indices from today (only count completed/paid for today)
                        history = (historyData || []).filter(h => {
                            if (h.date < today) return true;
                            return ['completed', 'paid'].includes(h.status);
                        });

                        // Fetch reviews for history
                        if (history.length > 0) {
                            const ids = history.map(h => h.id);
                            const { data: reviews } = await supabase
                                .from('reviews')
                                .select('appointment_id, rating')
                                .in('appointment_id', ids);
                            const reviewsMap = (reviews || []).reduce((acc, r) => ({ ...acc, [r.appointment_id]: r.rating }), {});
                            history = history.map(h => ({ ...h, reviews: reviewsMap[h.id] ? [{ rating: reviewsMap[h.id] }] : [] }));
                        }
                    }

                    return {
                        inProgress,
                        scheduled: allScheduled.sort((a, b) => new Date(a.startDate || a.date) - new Date(b.startDate || b.date)),
                        logs,
                        history
                    };
                };

                const [resultsApps, resultsCompleted, resultsPending, resultsServices] = await Promise.all([
                    fetchApps(),
                    fetchCompleted(),
                    fetchPending(),
                    fetchServices()
                ]);

                if (isMounted) {
                    setApplications(resultsApps.apps);
                    setGroupedApplications(resultsApps.groups);
                    setCompletedServices(resultsCompleted);
                    setPendingRequests(resultsPending);
                    setInProgressServices(resultsServices.inProgress);
                    setScheduledServices(resultsServices.scheduled);
                    setCareLogs(resultsServices.logs);
                    setPackageHistory(resultsServices.history);

                    // Save to Cache
                    const cacheData = {
                        timestamp: Date.now(),
                        data: {
                            applications: resultsApps.apps,
                            groupedApplications: resultsApps.groups,
                            completedServices: resultsCompleted,
                            pendingRequests: resultsPending,
                            inProgressServices: resultsServices.inProgress,
                            scheduledServices: resultsServices.scheduled,
                            careLogs: resultsServices.logs,
                            packageHistory: resultsServices.history,
                            lastUpdateStr: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        }
                    };
                    sessionStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
                    setLastUpdate(cacheData.data.lastUpdateStr);
                }

            } catch (error) {
                console.error("Error fetching Cuidado+ data:", error);
            } finally {
                clearTimeout(safetyTimer);
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        // 1. Try to Load from Cache First
        const cached = sessionStorage.getItem(CACHE_KEY);
        let shouldFetchFresh = true;

        if (cached) {
            try {
                const { timestamp, data } = JSON.parse(cached);
                const isFresh = (Date.now() - timestamp) < CACHE_TTL;

                if (isMounted) {
                    setApplications(data.applications);
                    setGroupedApplications(data.groupedApplications);
                    setCompletedServices(data.completedServices);
                    setPendingRequests(data.pendingRequests);
                    setInProgressServices(data.inProgressServices);
                    setScheduledServices(data.scheduledServices);
                    setLastUpdate(data.lastUpdateStr);

                    if (isFresh) {
                        setLoading(false);
                        // If it's very fresh (e.g. < 30 sec), maybe don't even background fetch?
                        // For now we always background fetch to ensure correctness, but we hide the loader
                    }
                }
            } catch (e) {
                console.error("Error parsing cache:", e);
                sessionStorage.removeItem(CACHE_KEY);
            }
        }

        fetchData(!!cached); // If we have cache, do background fetch
        return () => { isMounted = false; };
    }, [user]);

    const openScheduleModal = (service) => {
        setSelectedSchedulePackage(service);
        setScheduleModalOpen(true);
    };

    // Handlers
    const handleCancelPackage = async (group) => {
        if (!confirm(`¿Estás seguro que deseas CANCELAR y ELIMINAR esta solicitud de servicio ("${group.title}")?`)) return;
        try {
            setLoading(true);
            const appointmentIds = group.appointments.map(a => a.id);
            await supabase.from('job_applications').delete().in('appointment_id', appointmentIds);
            const { error } = await supabase.from('appointments').delete().in('id', appointmentIds);
            if (error) throw error;
            sessionStorage.removeItem(`bc_cuidado_plus_cache_${user?.id}`);
            alert("Solicitud cancelada correctamente.");
            window.location.reload();
        } catch (error) {
            console.error("Error cancelling package:", error);
            alert("Error al cancelar.");
        } finally {
            setLoading(false);
        }
    };

    const handleGroupAction = async (group, action) => {
        if (!confirm(`¿Estás seguro que deseas ${action === 'accept' ? 'APROBAR' : 'RECHAZAR'} este paquete?`)) return;

        try {
            setLoading(true);
            if (action === 'accept') {
                if (!group.caregiver?.id) throw new Error("No se identificó al cuidador.");
                const { data, error } = await supabase.rpc('approve_service_group', {
                    p_service_group_id: group.service_group_id,
                    p_caregiver_id: group.caregiver.id
                });
                if (error) throw error;
                sessionStorage.removeItem(`bc_cuidado_plus_cache_${user?.id}`);
                alert(`✅ Paquete aprobado correctamente.`);
            } else {
                const applicationIds = group.applications.map(app => app.id);
                const { error } = await supabase.from('job_applications').update({ status: 'rejected' }).in('id', applicationIds);
                if (error) throw error;
                sessionStorage.removeItem(`bc_cuidado_plus_cache_${user?.id}`);
                alert(`🚫 Postulación rechazada.`);
            }
            window.location.reload();
        } catch (error) {
            console.error("Error processing group action:", error);
            alert("Error al procesar la acción: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    // Modal Helpers
    const parseAppointmentActivities = (details) => {
        if (!details) return [];
        try {
            const parts = details.split('---SERVICES---');
            if (parts.length < 2) return [];
            return JSON.parse(parts[1]);
        } catch (e) {
            return [];
        }
    };

    const renderScheduleModal = () => {
        if (!scheduleModalOpen || !selectedSchedulePackage) return null;
        const appointments = [...selectedSchedulePackage.appointments].sort((a, b) => new Date(a.date) - new Date(b.date));

        return (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                <div className="bg-white rounded-xl w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl animate-scale-in flex flex-col">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-[#0F3C4C] text-white shrink-0">
                        <div>
                            <h3 className="font-brand font-bold text-xl !text-[#FAFAF7]">Calendario del Paquete</h3>
                            <p className="text-white/80 text-xs">{selectedSchedulePackage.title}</p>
                        </div>
                        <button onClick={() => setScheduleModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                            <XCircle size={24} />
                        </button>
                    </div>

                    <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                        <div className="bg-blue-50/50 p-4 rounded-xl mb-6 flex items-start gap-4 border border-blue-100 shrink-0">
                            <div className="w-12 h-12 rounded-full bg-white border-2 border-blue-200 overflow-hidden shrink-0">
                                {selectedSchedulePackage.caregiver?.avatar_url ? (
                                    <img src={selectedSchedulePackage.caregiver.avatar_url} alt="Caregiver" className="w-full h-full object-cover" />
                                ) : (
                                    <User size={24} className="text-gray-400 m-auto mt-2.5" />
                                )}
                            </div>
                            <div>
                                <h4 className="font-bold text-[#0F3C4C] text-sm">Cuidador Asignado</h4>
                                <p className="text-blue-600 font-bold text-lg leading-none">{selectedSchedulePackage.caregiver?.full_name}</p>
                            </div>
                        </div>

                        <h4 className="font-brand font-bold text-[#0F3C4C] mb-4 flex items-center gap-2 sticky top-0 bg-white z-10 py-2">
                            <Calendar size={18} /> Cronograma de Visitas
                        </h4>

                        <div className="space-y-3">
                            {appointments.map((app, idx) => {
                                const isExpanded = expandedAppointmentId === app.id;
                                const activities = isExpanded ? parseAppointmentActivities(app.details) : [];
                                return (
                                    <div key={app.id} className={`border rounded-[12px] overflow-hidden transition-all duration-300 ${isExpanded ? 'border-blue-200 shadow-md bg-blue-50/30' : 'border-gray-100 hover:border-blue-200 bg-white'}`}>
                                        <div onClick={() => setExpandedAppointmentId(isExpanded ? null : app.id)} className="p-4 flex items-center justify-between cursor-pointer group">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${isExpanded ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-blue-100 group-hover:text-blue-600'}`}>
                                                    {idx + 1}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-[#0F3C4C] text-sm capitalize">
                                                        {(() => {
                                                            if (!app.date) return '';
                                                            const [y, m, d] = app.date.split('-');
                                                            const dateObj = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
                                                            return dateObj.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                                                        })()}
                                                    </p>
                                                    <p className="text-xs text-gray-500 flex items-center gap-1">
                                                        <Clock size={10} /> {app.time?.substring(0, 5)} - {app.end_time?.substring(0, 5)}
                                                    </p>
                                                </div>
                                            </div>
                                            <ChevronRight size={16} className={`text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-90 text-blue-500' : ''}`} />
                                        </div>
                                        {isExpanded && (
                                            <div className="px-4 pb-4 animate-fade-in">
                                                <div className="pl-12 border-l-2 border-blue-100 space-y-3">
                                                    {activities.length > 0 ? (
                                                        activities.map((act, actIdx) => (
                                                            <div key={actIdx} className="bg-white p-3 rounded-lg border border-blue-50 shadow-sm">
                                                                <p className="font-bold text-[#0F3C4C] text-xs mb-1">{act.activity_name || act.name}</p>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {act.cycles?.map((cycle, cIdx) => (
                                                                        <span key={cIdx} className="text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded border border-green-100 font-medium">
                                                                            Ciclo {cIdx + 1}: {cycle.startTime} - {cycle.endTime}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <p className="text-xs text-gray-400 italic">No hay detalles de actividades registrados.</p>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    if (loading && !inProgressServices.length) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
                <Loader2 size={48} className="animate-spin text-[#C5A265]" />
                <p className="text-[#0F3C4C] font-brand font-bold animate-pulse">Sincronizando la experiencia BC Cuidado+...</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-12 animate-fade-in pb-20" translate="no">
            {/* Active Emergency Alert Banner */}
            {activeAlert && activeAlert.status === 'active' && (
                <div className="fixed top-0 left-0 right-0 z-[200] bg-red-600 !text-white p-4 shadow-2xl animate-pulse flex flex-col md:flex-row items-center justify-center gap-4 border-b-4 border-red-800">
                    <div className="flex items-center gap-3">
                        <AlertCircle size={32} className="animate-bounce" />
                        <div className="text-center md:text-left">
                            <h2 className="text-xl font-black uppercase tracking-tighter">ALERTA DE EMERGENCIA (CUIDADO+)</h2>
                            <p className="text-sm font-bold opacity-90">Un cuidador en servicio ha activado el protocolo de pánico.</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button
                            className="bg-white text-red-600 px-6 py-2 rounded-full font-black uppercase text-xs hover:bg-gray-100 transition-all"
                        >
                            Ir a CUIDADO+ (Vivo)
                        </button>
                        <button
                            onClick={async () => {
                                await supabase.from('emergency_alerts').update({ status: 'resolved', resolved_at: new Date(), resolved_by: user.id }).eq('id', activeAlert.id);
                                setActiveAlert(null);
                            }}
                            className="bg-red-800 text-white px-6 py-2 rounded-full font-black uppercase text-xs hover:bg-red-900 transition-all border border-red-400/30"
                        >
                            Resolver Alerta
                        </button>
                    </div>
                </div>
            )}

            {renderScheduleModal()}

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-[#0F3C4C] p-8 rounded-xl shadow-2xl relative overflow-hidden !text-[#FAFAF7]">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#C5A265] rounded-full -translate-y-1/2 translate-x-1/2 blur-[100px] opacity-20"></div>
                <div className="relative z-10 text-white">
                    <div className="flex items-center gap-4 mb-2">
                        <h1 className="text-5xl font-brand font-bold !text-[#FAFAF7] tracking-tighter italic drop-shadow-sm">
                            B<span className="text-[#2FAE8F]">C</span> <span className="text-[#C5A265]">Cuidado+</span>
                        </h1>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full border border-[#C5A265]/30 bg-[#C5A265]/10 text-[#C5A265] backdrop-blur-md flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#C5A265] animate-pulse"></span>
                            Premium
                        </span>
                    </div>
                    <p className="text-[#FAFAF7]/70 text-sm mt-3 flex items-center gap-2 font-secondary opacity-80">
                        <Clock size={16} /> Última actualización: {lastUpdate}
                    </p>
                </div>
                <div className="flex flex-col items-end gap-3 w-full md:w-auto relative z-10">
                    <button className="w-full max-w-[280px] bg-white/10 hover:bg-white/20 !text-[#FAFAF7] px-6 py-2.5 rounded-[12px] font-black uppercase tracking-widest flex items-center justify-center gap-3 border border-white/20 transition-all hover:scale-105 active:scale-95">
                        <Download size={18} /> Descargar Reporte
                    </button>

                    <div className="bg-white/5 border border-white/10 p-4 rounded-xl backdrop-blur-md max-w-[280px] text-right">
                        <div className="flex items-center justify-end gap-2 mb-1">
                            <ShieldCheck size={16} className="text-[#2FAE8F]" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#2FAE8F]">Seguridad BuenCuidar Activa</span>
                        </div>
                        <p className="text-[11px] text-white font-secondary leading-tight italic">
                            Sistema de Alerta Familiar Inteligente: El cuidador dispone de un botón de alerta familiar y digital para cualquier eventualidad.
                        </p>
                    </div>
                </div>
            </div>

            {/* Service Explanation Card */}
            <div className="card !p-8 hover:border-[#C5A265]/10 transition-all mb-12">
                <div className="flex flex-col md:flex-row items-center gap-8">
                    <div className="bg-[#C5A265]/10 p-5 rounded-[24px] text-[#C5A265] shadow-inner">
                        <ShieldCheck size={48} strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <h2 className="text-2xl font-brand font-bold mb-2 text-[#0F3C4C]">BC Cuidado+ garantiza la excelencia en cada servicio contratado.</h2>
                        <p className="text-[#0F3C4C]/70 font-secondary leading-relaxed">
                            Gestiona tus servicios de alta especialización, revisa postulaciones de cuidadores certificados y monitorea el bienestar de tus seres queridos.
                        </p>
                    </div>
                    <div className="flex gap-8">
                        <div className="text-center">
                            <p className="text-3xl font-brand font-black text-[#0F3C4C]">100%</p>
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Certificado</p>
                        </div>
                        <div className="w-px h-12 bg-gray-100 self-center"></div>
                        <div className="text-center">
                            <p className="text-3xl font-brand font-black text-[#C5A265]">24/7</p>
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Soporte</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* SECTION 1: Servicio en Curso */}
            <section className="animate-fade-in-up mb-12">
                <h2 className="text-2xl font-brand font-bold text-[#0F3C4C] mb-6 flex items-center gap-3">
                    {inProgressServices.some(s => s.status === 'in_progress') && (
                        <span className="relative flex h-4 w-4">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500"></span>
                        </span>
                    )}
                    Agenda de Cuidado Cuidado+ Sincronizada
                </h2>
                {inProgressServices.length > 0 ? (
                    <div className="grid lg:grid-cols-1 gap-8">
                        {inProgressServices.map(service => (
                            <div key={service.id} className={`bg-white rounded-2xl p-8 shadow-2xl border ${service.isHistoricalDisplay ? 'border-blue-100 opacity-95' : 'border-green-100'} relative overflow-hidden group`}>
                                <div className={`absolute top-0 right-0 py-1.5 px-6 ${service.isHistoricalDisplay ? 'bg-blue-600' : 'bg-green-600'} text-white text-[11px] font-black uppercase tracking-widest rounded-bl-2xl shadow-lg z-10 flex items-center gap-2`}>
                                    {!service.isHistoricalDisplay && <span className="w-2 h-2 bg-white rounded-full animate-pulse shadow-[0_0_8px_white]"></span>}
                                    {service.isHistoricalDisplay ? 'Último Turno Finalizado' : 'Monitoreo en Vivo'}
                                </div>

                                <div className="flex flex-col xl:flex-row gap-8">
                                    {/* Left Column: Info & History */}
                                    <div className="xl:w-1/3 space-y-6">
                                        <div className="flex items-center gap-5">
                                            <div className="w-20 h-20 rounded-2xl bg-gray-100 overflow-hidden border-2 border-green-200 shadow-inner">
                                                {service.caregiver?.avatar_url ? <img src={service.caregiver.avatar_url} alt="Caregiver" className="w-full h-full object-cover" /> : <User size={32} className="text-gray-400 m-auto mt-5" />}
                                            </div>
                                            <div>
                                                <h3 className="font-brand font-bold text-2xl text-[#0F3C4C] leading-none mb-2">{service.title}</h3>
                                                <div className="flex items-center gap-2 text-blue-600 font-bold text-sm bg-blue-50 px-3 py-1 rounded-lg w-fit">
                                                    <User size={14} />
                                                    {service.caregiver?.full_name}
                                                </div>
                                                <div className="flex items-center gap-3 mt-3 text-xs font-bold text-gray-400">
                                                    <span className="flex items-center gap-1.5"><Clock size={12} /> {service.time?.substring(0, 5)} - {service.end_time?.substring(0, 5)}</span>
                                                    <span className="flex items-center gap-1.5 font-black text-gray-300">|</span>
                                                    <span>{(() => {
                                                        if (!service.date) return '';
                                                        const [y, m, d] = service.date.split('-');
                                                        return `${d}/${m}/${y}`;
                                                    })()}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Subsection C: Historial del Paquete active */}
                                        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                                            <h4 className="font-bold text-[#0F3C4C] text-[11px] uppercase tracking-widest mb-4 flex items-center justify-between">
                                                <span className="flex items-center gap-2"><History size={14} className="text-blue-500" /> Historial del Paquete</span>
                                                <span className="bg-blue-100 text-blue-700 font-black px-2 py-0.5 rounded-full text-[11px]">{packageHistory.length} citas completadas</span>
                                            </h4>
                                            <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                                                {packageHistory.length > 0 ? packageHistory.map((h, i) => (
                                                    <div key={i} className="bg-white p-3 rounded-xl border border-gray-100 flex items-center justify-between group/hist">
                                                        <div>
                                                            <p className="text-xs font-bold text-gray-700">{(() => {
                                                                if (!h.date) return '';
                                                                const [y, m, d] = h.date.split('-');
                                                                const dateObj = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
                                                                return dateObj.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
                                                            })()}</p>
                                                            <p className="text-[11px] text-gray-400">{h.caregiver?.full_name}</p>
                                                        </div>
                                                        {h.reviews?.[0]?.rating ? (
                                                            <div className="flex items-center gap-1.5 bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-100">
                                                                <Star size={12} className="fill-orange-400 text-orange-400" />
                                                                <span className="text-[11px] font-black text-orange-600">{h.reviews[0].rating}</span>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={() => setRatingAppointment(h)}
                                                                className="text-[11px] font-black uppercase tracking-widest text-blue-600 hover:text-white hover:bg-blue-600 border border-blue-200 px-3 py-1.5 rounded-lg transition-all"
                                                            >
                                                                Calificar
                                                            </button>
                                                        )}
                                                    </div>
                                                )) : (
                                                    <p className="text-[11px] text-gray-400 italic text-center py-4">Aún no hay citas pasadas en este paquete.</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Middle Column: Bitácora */}
                                    <div className="xl:w-1/3">
                                        <div className="bg-white rounded-2xl p-5 border-2 border-gray-50 h-full flex flex-col">
                                            <h4 className="font-brand font-black text-[#0F3C4C] text-xs uppercase tracking-[0.2em] mb-4 flex items-center gap-2 shadow-sm pb-3 border-b border-gray-100">
                                                <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg"><FileText size={14} /></span>
                                                Bitácora de Cuidado
                                            </h4>
                                            <div className="space-y-4 flex-grow overflow-y-auto pr-2 custom-scrollbar max-h-[400px]">
                                                {careLogs.filter(log => log.appointment_id === service.id && log.category !== 'Plan de Cuidado').length > 0 ? (
                                                    careLogs.filter(log => log.appointment_id === service.id && log.category !== 'Plan de Cuidado').map((log, i) => (
                                                        <div key={i} className="relative pl-6 border-l-2 border-slate-100 py-2 group/log">
                                                            <div className="absolute -left-[5px] top-3 w-2 h-2 rounded-full bg-emerald-500 border-2 border-white shadow-sm transition-transform group-hover/log:scale-125"></div>
                                                            <p className="text-sm font-bold text-gray-700 leading-relaxed">
                                                                <span className="text-emerald-600 font-black tracking-widest">
                                                                    {new Date(log.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                                <span className="mx-4 text-gray-300 font-normal">--</span>
                                                                <span className="text-[#0F3C4C]">{log.action}</span>
                                                                <span className="mx-4 text-gray-300 font-normal">--</span>
                                                                <span className="text-gray-500 font-secondary font-medium">{log.detail}</span>
                                                            </p>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="text-center py-10 opacity-30">
                                                        <Activity size={32} className="mx-auto mb-2" />
                                                        <p className="text-[11px] font-bold uppercase tracking-widest">Esperando registros...</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Column: Progreso del Plan */}
                                    <div className="xl:w-1/3">
                                        <div className="bg-[#0F3C4C] rounded-2xl p-5 !text-white h-full flex flex-col shadow-xl">
                                            <h4 className="font-brand font-black !text-white text-xs uppercase tracking-[0.2em] mb-4 flex items-center justify-between pb-3 border-b border-white/10">
                                                <span className="flex items-center gap-2">
                                                    <CheckCircle size={14} className={service.isHistoricalDisplay ? 'text-blue-300' : 'text-[#2FAE8F]'} />
                                                    Agenda de Cuidado
                                                </span>
                                                <span className={`${service.isHistoricalDisplay ? 'bg-blue-600' : 'bg-green-600'} !text-white px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest`}>
                                                    {service.isHistoricalDisplay ? 'Modo Histórico' : 'Conexión Activa'}
                                                </span>
                                            </h4>
                                            <div className="space-y-3 flex-grow overflow-y-auto pr-2 custom-scrollbar max-h-[400px]">
                                                {(() => {
                                                    // 1. Get and Process Agenda Items (Expand Cycles)
                                                    let rawAgenda = [];
                                                    if (service.care_agenda && Array.isArray(service.care_agenda) && service.care_agenda.length > 0) {
                                                        rawAgenda = service.care_agenda;
                                                    } else if (service.details) {
                                                        if (service.details.includes('---SERVICES---')) {
                                                            try {
                                                                const jsonStr = service.details.split('---SERVICES---')[1];
                                                                const services = JSON.parse(jsonStr);
                                                                if (Array.isArray(services)) rawAgenda = services;
                                                            } catch (e) { }
                                                        }
                                                        if (rawAgenda.length === 0) {
                                                            rawAgenda = service.details.includes('[PLAN DE CUIDADO]')
                                                                ? service.details.split('[PLAN DE CUIDADO]')[1].split('---SERVICES---')[0].split('•').map(s => s.trim()).filter(s => s && s.length > 2)
                                                                : service.details.split(/[\n•]/).map(s => s.trim()).filter(s => s.length > 2);
                                                        }
                                                    }

                                                    // Expand Cycles to individual items and calculate duration
                                                    const agendaItems = [];
                                                    rawAgenda.forEach(item => {
                                                        const baseName = typeof item === 'string' ? item : (item.activity_name || item.name || item.activity);

                                                        if (typeof item === 'object' && item.cycles && Array.isArray(item.cycles)) {
                                                            item.cycles.forEach(cycle => {
                                                                if (cycle.startTime) {
                                                                    // Calculate duration for this cycle
                                                                    let duration = 0;
                                                                    if (cycle.startTime && cycle.endTime) {
                                                                        const [h1, m1] = cycle.startTime.split(':').map(Number);
                                                                        const [h2, m2] = cycle.endTime.split(':').map(Number);
                                                                        duration = (h2 * 60 + m2) - (h1 * 60 + m1);
                                                                    }

                                                                    agendaItems.push({
                                                                        ...item,
                                                                        activity_name: baseName,
                                                                        display_time: cycle.startTime,
                                                                        display_end_time: cycle.endTime,
                                                                        duration: duration
                                                                    });
                                                                } else {
                                                                    agendaItems.push({ ...item, duration: 0 });
                                                                }
                                                            });
                                                        } else {
                                                            agendaItems.push({
                                                                ...(typeof item === 'string' ? { activity_name: item } : item),
                                                                duration: 0
                                                            });
                                                        }
                                                    });

                                                    // 2. Identify Completed Tasks with robust matching
                                                    const cleanActionName = (name) => {
                                                        if (!name) return "";
                                                        // Important: Caregivers log "Activity (10:00)" if it's a cycle
                                                        // So we want to match EXACTLY if possible, or clean for general checks
                                                        return name.trim().toLowerCase();
                                                    };

                                                    const planLogs = careLogs.filter(log => log.appointment_id === service.id && log.category === 'Plan de Cuidado');
                                                    const completedCleanActions = new Set(planLogs.map(log => cleanActionName(log.action)));


                                                    // Icon Mapping for Official Programs
                                                    const PROGRAM_ICONS = {
                                                        'Activity': Activity,
                                                        'Heart': Heart,
                                                        'ShieldCheck': ShieldCheck,
                                                        'Dumbbell': Dumbbell,
                                                        'HeartPulse': HeartPulse,
                                                        'Accessibility': Accessibility,
                                                        'HandHeart': HandHeart,
                                                        'Coffee': Coffee
                                                    };

                                                    // 2.5 Chronological Sort by Start Time
                                                    const timeToMinutes = (t) => {
                                                        if (!t || t === '99:99') return 9999;
                                                        const [h, m] = t.split(':').map(Number);
                                                        return (h * 60) + (m || 0);
                                                    };

                                                    agendaItems.sort((a, b) => {
                                                        const timeA = a.display_time || (typeof a === 'string' ? null : a.time) || '99:99';
                                                        const timeB = b.display_time || (typeof b === 'string' ? null : b.time) || '99:99';
                                                        return timeToMinutes(timeA) - timeToMinutes(timeB);
                                                    });

                                                    // 3. Group Agenda Items by Category

                                                    if (agendaItems.length > 0) {
                                                        const groupedAgenda = {};

                                                        agendaItems.forEach(item => {
                                                            const activityName = typeof item === 'string' ? item : (item.activity_name || item.activity || item.name);
                                                            const cleanName = cleanActionName(activityName);

                                                            // Match category from official CARE_AGENDA_CATEGORIES or infer from item
                                                            let category = CARE_AGENDA_CATEGORIES.find(cat =>
                                                                (item.category_id === cat.id) ||
                                                                (cat.activities && cat.activities.some(a => activityName.toLowerCase().includes(a.toLowerCase())))
                                                            );

                                                            let categoryName = item.program_name || item.category_name || category?.name || 'Otros';
                                                            let categoryIcon = 'ListTodo';

                                                            // Special mapping for official assistant icons if available
                                                            if (item.icon_name && PROGRAM_ICONS[item.icon_name]) categoryIcon = item.icon_name;
                                                            else if (category?.icon) categoryIcon = category.icon;

                                                            const categoryId = categoryName.toLowerCase().trim();

                                                            if (!groupedAgenda[categoryId]) {
                                                                groupedAgenda[categoryId] = {
                                                                    name: categoryName,
                                                                    icon: categoryIcon,
                                                                    items: []
                                                                };
                                                            }
                                                            groupedAgenda[categoryId].items.push(item);
                                                        });

                                                        return Object.values(groupedAgenda).map((group, groupIdx) => {
                                                            const IconComp = PROGRAM_ICONS[group.icon] || ListTodo;
                                                            return (
                                                                <div key={groupIdx} className="mb-6 last:mb-0">
                                                                    <h5 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-[#2FAE8F] mb-3 bg-white/5 p-2 rounded-lg border border-white/5">
                                                                        <IconComp size={12} /> {group.name}
                                                                    </h5>
                                                                    <div className="space-y-2">
                                                                        {group.items.map((item, idx) => {
                                                                            const activityName = typeof item === 'string' ? item : (item.activity_name || item.activity || item.name);
                                                                            const activityTime = item.display_time || (typeof item === 'string' ? null : item.time);
                                                                            const activityEndTime = item.display_end_time || null;

                                                                            // REPLICATE AddCareLogModal logic for robust matching
                                                                            // Format: "Activity Name (HH:mm - HH:mm)" or "Activity Name (HH:mm)"
                                                                            let matchName = activityName;
                                                                            if (activityTime && activityTime !== '99:99') {
                                                                                matchName = `${activityName} (${activityTime}${activityEndTime ? ` - ${activityEndTime}` : ''})`;
                                                                            }

                                                                            const cleanName = cleanActionName(matchName);
                                                                            const isLongTask = item.duration > 60;

                                                                            // For long tasks, we look for - INICIO and - FIN
                                                                            const isStartDone = isLongTask ? completedCleanActions.has(`${cleanName} - inicio`) : false;
                                                                            const isEndDone = isLongTask ? completedCleanActions.has(`${cleanName} - fin`) : false;
                                                                            const isDone = isLongTask ? isEndDone : completedCleanActions.has(cleanName);

                                                                            const completionLog = planLogs.find(l => {
                                                                                const logClean = cleanActionName(l.action);
                                                                                if (isLongTask) return logClean === `${cleanName} - fin`;
                                                                                return logClean === cleanName;
                                                                            });

                                                                            const startLog = isLongTask ? planLogs.find(l => cleanActionName(l.action) === `${cleanName} - inicio`) : null;

                                                                            return (
                                                                                <div key={idx} className={`bg-white/5 border border-white/10 p-4 rounded-xl flex flex-col gap-3 hover:bg-white/10 transition-all ${!isDone && !service.isHistoricalDisplay ? 'opacity-90' : 'opacity-100'}`}>
                                                                                    <div className="flex items-center justify-between">
                                                                                        <div className="flex items-center gap-3">
                                                                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isDone ? 'bg-[#2FAE8F] shadow-lg shadow-[#2FAE8F]/30' : (service.isHistoricalDisplay ? 'bg-red-500/20 border border-red-500/30' : 'bg-white/5 border border-white/10')}`}>
                                                                                                {isDone ? <Check size={16} className="text-white" /> : (service.isHistoricalDisplay ? <XCircle size={14} className="text-red-400" /> : <Clock size={14} className="text-white/40" />)}
                                                                                            </div>
                                                                                            <div>
                                                                                                <p className={`text-xs font-bold ${isDone ? '!text-[#FAFAF7]' : (service.isHistoricalDisplay ? '!text-[#FAFAF7]/40 underline decoration-red-500/30' : '!text-[#FAFAF7]/80')}`}>
                                                                                                    {activityName} {isLongTask && <span className="text-[9px] opacity-40 font-normal ml-1">(Larga Duración)</span>}
                                                                                                </p>
                                                                                                <p className="text-[11px] text-white/40 flex items-center gap-1 mt-0.5 font-medium">
                                                                                                    <Calendar size={10} className="opacity-50" /> {activityTime}{activityEndTime ? ` - ${activityEndTime}` : ''}
                                                                                                </p>
                                                                                            </div>
                                                                                        </div>

                                                                                        {isDone && completionLog && (
                                                                                            <div className="text-right">
                                                                                                <span className="bg-[#2FAE8F]/20 text-[#2FAE8F] text-[10px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-widest border border-[#2FAE8F]/30">
                                                                                                    {new Date(completionLog.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                                                </span>
                                                                                            </div>
                                                                                        )}

                                                                                        {!isDone && service.isHistoricalDisplay && (
                                                                                            <div className="text-right">
                                                                                                <span className="bg-red-500/10 text-red-400 text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-widest border border-red-500/20">
                                                                                                    No Registrado
                                                                                                </span>
                                                                                            </div>
                                                                                        )}
                                                                                    </div>

                                                                                    {/* Start/End Status Bars for Long Tasks */}
                                                                                    {isLongTask && (
                                                                                        <div className="flex gap-2 mt-1">
                                                                                            <div className={`flex-1 h-1.5 rounded-full transition-all ${isStartDone ? 'bg-[#2FAE8F]' : 'bg-white/10'}`} title={isStartDone ? `Iniciado a las ${new Date(startLog.created_at).toLocaleTimeString()}` : 'Pendiente de inicio'}></div>
                                                                                            <div className={`flex-1 h-1.5 rounded-full transition-all ${isEndDone ? 'bg-[#2FAE8F]' : 'bg-white/10'}`} title={isEndDone ? `Finalizado a las ${new Date(completionLog.created_at).toLocaleTimeString()}` : 'Pendiente de fin'}></div>
                                                                                        </div>
                                                                                    )}

                                                                                    {isLongTask && (
                                                                                        <div className="flex justify-between text-[9px] font-black uppercase tracking-widest opacity-40">
                                                                                            <span className={isStartDone ? 'text-[#2FAE8F] opacity-100' : ''}>{isStartDone ? `Inicio: ${new Date(startLog.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Inicio pendiente'}</span>
                                                                                            <span className={isEndDone ? 'text-[#2FAE8F] opacity-100' : ''}>{isEndDone ? `Fin: ${new Date(completionLog.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Fin pendiente'}</span>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            );
                                                        });
                                                    }

                                                    // Fallback to logs if no agenda found
                                                    if (careLogs.filter(log => log.category === 'Plan de Cuidado').length > 0) {
                                                        return careLogs.filter(log => log.category === 'Plan de Cuidado').map((log, i) => (
                                                            <div key={i} className="bg-white/5 border border-white/10 p-3 rounded-xl flex items-center justify-between hover:bg-white/10 transition-colors">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-6 h-6 rounded-full bg-[#2FAE8F]/20 flex items-center justify-center">
                                                                        <Check size={12} className="text-[#2FAE8F]" />
                                                                    </div>
                                                                    <span className="text-xs font-bold !text-[#FAFAF7]">{log.action}</span>
                                                                </div>
                                                                <span className="text-[10px] font-medium text-white/40 italic">{new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                            </div>
                                                        ));
                                                    }

                                                    return (
                                                        <div className="text-center py-10 opacity-20">
                                                            <ListTodo size={32} className="mx-auto mb-2" />
                                                            <p className="text-[10px] font-bold uppercase tracking-widest">No hay actividades programadas</p>
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                            <div className="mt-4 pt-4 border-t border-white/10 text-center">
                                                <p className="text-[10px] text-white/40 italic">
                                                    {service.isHistoricalDisplay
                                                        ? 'Estás viendo el resumen de la última jornada. Los datos se actualizarán cuando inicie el próximo turno.'
                                                        : 'Las actividades aparecen aquí a medida que el cuidador las marca en su terminal.'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-gray-50 rounded-xl p-12 text-center border-dashed border-2 border-gray-200">
                        <Activity size={48} className="mx-auto mb-4 text-gray-300" />
                        <h3 className="text-xl font-brand font-bold text-[#0F3C4C] mb-2">Sin actividad en este momento</h3>
                        <p className="text-gray-500 font-secondary max-w-sm mx-auto">Aquí aparecerá el monitoreo en vivo una vez que inicie tu próxima cita programada.</p>
                    </div>
                )}
            </section>

            {/* SECTION 2: Servicios Programados */}
            <section className="animate-fade-in-up mb-12">
                <h2 className="text-2xl font-brand font-bold text-[#0F3C4C] mb-6 flex items-center gap-3">
                    <Calendar size={24} className="text-[#C5A265]" /> Servicios Programados
                </h2>
                {scheduledServices.length > 0 ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {scheduledServices.map((service, idx) => (
                            <div key={idx} className="bg-white rounded-xl p-6 shadow-lg border-l-[6px] border-l-[#C5A265] relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <span className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-2 bg-blue-50 text-blue-600">Confirmado</span>
                                        <h3 className="font-brand font-bold text-lg text-[#0F3C4C] line-clamp-1">{service.title}</h3>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden">
                                        {service.caregiver?.avatar_url ? <img src={service.caregiver.avatar_url} alt="Caregiver" className="w-full h-full object-cover" /> : <User size={20} className="text-gray-400 m-auto mt-2" />}
                                    </div>
                                    <div className="text-sm">
                                        <p className="font-bold text-[#0F3C4C]">{service.caregiver?.full_name}</p>
                                        <p className="text-xs text-gray-500">Cuidador Certificado</p>
                                    </div>
                                </div>
                                <div className="space-y-3 mb-6">
                                    <div className="flex items-center gap-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg"><Calendar size={16} className="text-[#0F3C4C]" /><span>{service.isGroup ? `${formatDateRange(service.startDate, service.endDate)} (${service.appointments.length} citas)` : service.date}</span></div>
                                </div>
                                {service.isGroup && (
                                    <div className="mt-auto pt-4 border-t border-gray-100">
                                        <button
                                            onClick={() => openScheduleModal(service)}
                                            className="w-full py-3 rounded-xl bg-[#0F3C4C] !text-white font-black text-xs uppercase tracking-widest hover:bg-[#1a5a70] shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                                        >
                                            <Calendar size={14} />
                                            VER CALENDARIO COMPLETO
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-gray-50 rounded-xl p-8 text-center border-dashed border-2 border-gray-200">
                        <p className="text-gray-500 font-secondary">No tienes servicios futuros programados.</p>
                    </div>
                )}
            </section>

            {/* SECTION 3: Solicitudes Publicadas */}
            <section className="mb-12 animate-fade-in-up">
                <h2 className="text-2xl font-brand font-bold text-[#0F3C4C] mb-6 flex items-center gap-3">
                    <span className="p-2 bg-yellow-100 rounded-lg text-yellow-600"><Clock size={24} /></span> Solicitudes Publicadas
                </h2>
                {Object.keys(pendingRequests).length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Object.values(pendingRequests).map((group, idx) => (
                            <div key={idx} className="bg-white rounded-xl p-6 shadow-sm border border-yellow-100 hover:shadow-md transition-all relative overflow-hidden group">
                                <div className="relative z-10">
                                    <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">Esperando Postulantes</span>
                                    <h3 className="font-brand font-bold text-xl text-[#0F3C4C] mb-2 leading-tight">{group.title}</h3>
                                    <p className="text-sm text-gray-500 font-medium mb-4 flex items-center gap-2"><Calendar size={14} />{formatDateRange(group.startDate, group.endDate)}</p>
                                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
                                        <span className="text-xs font-bold text-gray-400">{group.appointments.length} Citas</span>
                                        <button onClick={() => handleCancelPackage(group)} className="text-red-400 text-xs font-bold uppercase hover:text-red-600 border border-red-100 rounded-lg px-3 py-1 hover:bg-red-50 transition-all">Cancelar</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-gray-50 rounded-xl p-8 text-center border-dashed border-2 border-gray-200">
                        <p className="text-gray-500 font-secondary">No tienes solicitudes pendientes de cuidadores.</p>
                    </div>
                )}
            </section>

            {/* SECTION 4: Postulaciones */}
            <section className="animate-fade-in-up mb-12">
                <h2 className="text-2xl font-brand font-bold text-[#0F3C4C] mb-6 flex items-center gap-3">
                    <User size={24} className="text-[#C5A265]" /> Cuidadores Postulados (Paquetes)
                    <span className="bg-[#C5A265] text-[#0F3C4C] text-xs px-2 py-1 rounded-full font-black">{Object.keys(groupedApplications).length}</span>
                </h2>
                {Object.keys(groupedApplications).length > 0 ? (
                    <div className="grid md:grid-cols-2 gap-6">
                        {Object.values(groupedApplications).map((group, idx) => (
                            <div key={idx} className="bg-white rounded-xl p-6 shadow-xl border border-gray-100 hover:border-[#C5A265]/30 transition-all group relative overflow-hidden">
                                <div className="flex items-start justify-between mb-6 relative z-10">
                                    <div className="flex items-center gap-4">
                                        <div className="w-20 h-20 rounded-full bg-gray-100 overflow-hidden border-2 border-[#C5A265] shadow-md">
                                            {group.caregiver?.avatar_url ? <img src={group.caregiver.avatar_url} alt="Caregiver" className="w-full h-full object-cover" /> : <User size={32} className="text-gray-400 m-auto mt-6" />}
                                        </div>
                                        <div>
                                            <h3 className="font-brand font-bold text-xl text-[#0F3C4C]">{group.caregiver?.full_name}</h3>
                                            <p className="text-xs font-black uppercase tracking-widest text-[#C5A265] mt-1">Nueva Postulación a Paquete</p>
                                            <p className="text-sm font-bold text-gray-600 mt-2 flex items-center gap-2"><Activity size={16} className="text-[#0F3C4C]" />{group.title}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setSelectedCaregiver(group.caregiver)} className="text-xs font-bold uppercase text-[#0F3C4C] border border-[#0F3C4C]/20 hover:bg-[#0F3C4C] hover:text-white px-4 py-2 rounded-full transition-all flex items-center gap-2"><User size={14} /> Perfil</button>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-brand font-bold text-sm text-[#0F3C4C]">Fechas del Paquete:</h4>
                                        <span className="bg-[#0F3C4C] text-white text-[10px] font-black px-2 py-0.5 rounded-full">{group.applications.length} Citas</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-500 font-medium bg-white border border-gray-200 px-3 py-2 rounded-lg">
                                        <Calendar size={14} className="text-[#0F3C4C]" /> {(() => { const sorted = [...group.dates].sort(); return formatDateRange(sorted[0], sorted[sorted.length - 1]); })()}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <button onClick={() => handleGroupAction(group, 'reject')} className="w-full py-3 rounded-xl border-2 border-red-100 text-red-500 font-black text-xs uppercase hover:bg-red-50 transition-colors">Denegar</button>
                                    <button onClick={() => handleGroupAction(group, 'accept')} className="w-full py-3 rounded-xl bg-[#2FAE8F] text-white font-black text-xs uppercase hover:bg-[#238a71] shadow-lg transition-all hover:scale-105">Aprobar</button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-gray-50 rounded-xl p-8 text-center border-dashed border-2 border-gray-200">
                        <p className="text-gray-500 font-secondary">No hay nuevas postulaciones de cuidadores.</p>
                    </div>
                )}
            </section>

            {/* SECTION 5: Servicios Recientes */}
            <section className="animate-fade-in-up">
                <h2 className="text-2xl font-brand font-bold text-[#0F3C4C] mb-6 flex items-center gap-3">
                    <Star size={24} className="text-[#C5A265]" /> Servicios Recientes
                </h2>
                <div className="bg-white rounded-[24px] shadow-xl overflow-hidden">
                    {completedServices.length > 0 ? (
                        <div className="divide-y divide-gray-100">
                            {completedServices.map(service => (
                                <div key={service.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-[#0F3C4C]/10 flex items-center justify-center text-[#0F3C4C] font-bold text-xs">{new Date(service.date).getDate()}</div>
                                        <div>
                                            <h4 className="font-bold text-[#0F3C4C]">{service.title}</h4>
                                            <p className="text-sm text-gray-500">{(() => {
                                                if (!service.date) return '';
                                                const [y, m, d] = service.date.split('-');
                                                return `${d}/${m}/${y}`;
                                            })()} • {service.caregiver?.full_name}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-black uppercase tracking-widest">Finalizado</span>
                                        {service.reviews?.[0]?.rating ? (
                                            <div className="flex items-center gap-1.5 bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-100">
                                                <Star size={14} className="fill-orange-400 text-orange-400" />
                                                <span className="text-sm font-black text-orange-600">{service.reviews[0].rating}</span>
                                            </div>
                                        ) : (
                                            <button onClick={() => setRatingAppointment(service)} className="text-[#C5A265] font-black text-sm uppercase hover:underline flex items-center gap-1"><Star size={16} /> Calificar</button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-12 text-center text-gray-400"><p>No hay servicios finalizados recientemente.</p></div>
                    )}
                </div>
            </section>

            {/* Modals */}
            <RateCaregiverModal
                isOpen={!!ratingAppointment}
                onClose={() => setRatingAppointment(null)}
                appointment={ratingAppointment}
                onSuccess={() => window.location.reload()}
            />
            <CaregiverDetailModal
                isOpen={!!selectedCaregiver}
                onClose={() => setSelectedCaregiver(null)}
                caregiver={selectedCaregiver}
                hideContactButton={true}
                onContact={() => setSelectedCaregiver(null)}
            />
            {renderScheduleModal()}
        </div>
    );
};

export default CuidadoPlusPanel;
