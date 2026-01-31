import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Star, TrendingUp, Users, MessageSquare, Bell, Check, Info, AlertTriangle, CheckCircle, ArrowRight, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import AppointmentsListModal from '../../components/dashboard/AppointmentsListModal';
import EditAppointmentModal from '../../components/dashboard/EditAppointmentModal'; // New Import

const StatCard = ({ icon: Icon, title, value, colorClass, onClick }) => (
    <div
        onClick={onClick}
        className={`card !p-8 flex items-center gap-6 ${onClick ? 'cursor-pointer hover:border-[var(--secondary-color)]/40 hover:shadow-2xl transition-all hover:scale-[1.02]' : ''} relative overflow-hidden group`}
    >
        <div className={`p-4 rounded-[16px] ${colorClass.includes('secondary') ? 'bg-[var(--secondary-color)] !text-[#FAFAF7]' : 'bg-[var(--primary-color)] !text-[#FAFAF7]'} group-hover:scale-110 transition-transform shadow-lg relative z-10`}>
            <Icon size={32} strokeWidth={2.5} />
        </div>
        <div className="relative z-10 text-left">
            <p className="text-[10px] text-[var(--text-light)] font-black uppercase tracking-[0.2em] mb-1">{title}</p>
            <h3 className="text-4xl font-brand font-bold text-[var(--primary-color)] tracking-tight">{value}</h3>
        </div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent-color)]/5 rounded-full translate-x-1/2 -translate-y-1/2 blur-2xl group-hover:bg-[var(--secondary-color)]/10 transition-colors"></div>
    </div>
);

const AppointmentCard = ({ name, role, time, date, image, rating, onViewProfile, onRate, status }) => (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 bg-white border border-gray-100 rounded-[16px] mb-4 last:mb-0 hover:border-[var(--secondary-color)]/30 hover:shadow-xl transition-all animate-fade-in group relative overflow-hidden">
        <div className="flex items-center gap-5 relative z-10">
            <div className={`w-14 h-14 rounded-[16px] bg-[var(--accent-color)]/30 text-[var(--primary-color)] flex items-center justify-center font-brand font-bold text-xl overflow-hidden shrink-0 shadow-inner group-hover:scale-105 transition-transform border border-white`}>
                {image ? (
                    <img src={image} alt={name} className="w-full h-full object-cover" />
                ) : (
                    name.charAt(0)
                )}
            </div>
            <div className="text-left">
                <h4 className="font-brand font-bold text-[var(--primary-color)] text-lg group-hover:text-[var(--secondary-color)] transition-colors tracking-tight">{name}</h4>
                <div className="flex flex-col gap-1 mt-1">
                    <p className="text-[10px] text-[var(--text-light)] font-black font-secondary uppercase tracking-widest">{role}</p>
                    <div className="flex items-center gap-3 text-[var(--text-light)] mt-1 flex-wrap">
                        <div className="flex items-center gap-1.5">
                            <Clock size={12} className="text-[var(--secondary-color)]" />
                            <span className="text-xs font-bold font-brand">{time}</span>
                        </div>
                        <span className="text-xs font-bold font-brand opacity-80">{date}</span>
                    </div>
                </div>
            </div>
        </div>

        <div className="mt-4 sm:mt-0 flex flex-col items-end gap-3 relative z-10">
            {onViewProfile && !onRate && !rating && (
                <button
                    onClick={onViewProfile}
                    className="bg-[var(--base-bg)] text-[var(--primary-color)] px-4 py-2 rounded-[16px] text-[10px] font-black uppercase tracking-widest hover:bg-[var(--secondary-color)] hover:text-white transition-all border border-gray-100 shadow-sm"
                >
                    Ver perfil
                </button>
            )}

            {(status === 'completed' || status === 'paid') && (
                <div className="flex flex-col items-end gap-2">
                    {rating ? (
                        <div className="flex items-center gap-2 bg-orange-50 px-4 py-2 rounded-[16px] border border-orange-100 shadow-sm">
                            <Star size={14} className="fill-orange-400 text-orange-400" />
                            <span className="text-sm font-black text-orange-600">{rating}</span>
                        </div>
                    ) : (
                        <button
                            onClick={onRate || onViewProfile}
                            className="bg-orange-50 text-orange-600 px-5 py-2.5 rounded-[16px] text-[10px] font-black uppercase tracking-widest hover:bg-orange-100 transition-all flex items-center gap-2 border border-orange-200 shadow-md shadow-orange-100"
                        >
                            <Star size={12} className="fill-current" /> Calificar servicio
                        </button>
                    )}
                </div>
            )}
        </div>
        <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--accent-color)]/5 rounded-full translate-x-1/2 -translate-y-1/2 blur-2xl group-hover:bg-[var(--secondary-color)]/5 transition-colors"></div>
    </div>
);

import CaregiverDetailModal from '../../components/dashboard/CaregiverDetailModal';
import RateCaregiverModal from '../../components/dashboard/RateCaregiverModal';


const DashboardOverview = () => {
    const { profile, user } = useAuth();
    const navigate = useNavigate();
    const [appointments, setAppointments] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [patients, setPatients] = useState([]);
    const [caregiversCount, setCaregiversCount] = useState(0);

    // Modals State
    const [showListModal, setShowListModal] = useState(false);
    const [editingAppointment, setEditingAppointment] = useState(null);
    const [selectedCaregiver, setSelectedCaregiver] = useState(null); // For Detail Modal
    const [ratingAppointment, setRatingAppointment] = useState(null); // For Rating Modal


    const rawName = profile?.full_name ? profile.full_name.split(' ')[0] : '...';
    const firstName = rawName.charAt(0).toUpperCase() + rawName.slice(1).toLowerCase();

    useEffect(() => {
        if (user) {
            fetchAppointments();
            fetchNotifications();
            fetchPatients();
            fetchCaregiversCount();
        }
    }, [user]);

    const fetchAppointments = async () => {
        try {
            const today = new Date().toISOString().split('T')[0];

            // 1. Fetch Appointments (Simple, no deep joins)
            const { data: appsData, error: appsError } = await supabase
                .from('appointments')
                .select(`
                    *,
                    caregiver:caregiver_id (
                        full_name,
                        address,
                        avatar_url,
                        caregiver_details (*)
                    )
                `)
                .eq('client_id', user.id)
                // We need all appointments to filter for history/rating locally or we could optimize this query
                .order('date', { ascending: false }); // Sort by newest first to see recent history easily


            if (appsError) {
                throw appsError;
            }

            let appointmentsData = appsData || [];

            // 2. Fetch Job Applications manually if there are appointments
            if (appointmentsData.length > 0) {
                const appointmentIds = appointmentsData.map(a => a.id);

                const { data: jobsData, error: jobsError } = await supabase
                    .from('job_applications')
                    .select(`
                        id,
                        status,
                        created_at,
                        appointment_id,
                        caregiver:caregiver_id (
                            id,
                            full_name,
                            avatar_url,
                            caregiver_details (*)
                        )
                    `)
                    .in('appointment_id', appointmentIds);

                if (jobsError) {
                    console.error("Error fetching applications:", jobsError);
                    // Don't throw, just log. We can try to proceed without applications
                } else {
                    appointmentsData = appointmentsData.map(app => ({
                        ...app,
                        job_applications: jobsData?.filter(job => job.appointment_id === app.id) || []
                    }));
                }
            }

            // 3. Fetch Reviews manually to ensure we have rating data
            if (appointmentsData.length > 0) {
                const appointmentIds = appointmentsData.map(a => a.id);

                const { data: reviewsData, error: reviewsError } = await supabase
                    .from('reviews')
                    .select('appointment_id, rating')
                    .in('appointment_id', appointmentIds);

                if (reviewsError) {
                    console.error("Error fetching reviews:", reviewsError);
                } else {
                    // Merge reviews into appointments
                    appointmentsData = appointmentsData.map(app => ({
                        ...app,
                        // Create a 'reviews' array with the matching review if it exists
                        reviews: reviewsData?.filter(r => r.appointment_id === app.id) || []
                    }));
                }
            }

            setAppointments(appointmentsData);

        } catch (error) {
            // Ignore AbortError (benign, usually due to navigation/cleanup)
            if (error.name === 'AbortError' || error.message?.includes('aborted')) {
                console.log('Dashboard fetch aborted');
                return;
            }
            console.error('Error fetching dashboard data:', error);
            // alert("Error cargando el dashboard: " + error.message); // Commented out to reduce noise, or keep only for real errors
        }
    };

    const fetchNotifications = async () => {
        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(10);

            if (error) throw error;
            setNotifications(data || []);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    const markAsRead = async (id) => {
        try {
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('id', id);

            if (error) throw error;
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const fetchPatients = async () => {
        try {
            const { data, error } = await supabase
                .from('patients')
                .select('*')
                .eq('family_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setPatients(data || []);
        } catch (error) {
        }
    };

    const fetchCaregiversCount = async () => {
        try {
            const { count, error } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'caregiver')
                .eq('is_available', true); // Only count available caregivers

            if (error) throw error;
            setCaregiversCount(count || 0);
        } catch (error) {
            console.error('Error fetching caregivers count:', error);
        }
    };

    const handleApproveRequest = async (application, isApproved) => {
        try {
            if (isApproved) {
                // 1. Confirm the appointment with this caregiver
                const { error: appError } = await supabase
                    .from('appointments')
                    .update({
                        caregiver_id: application.caregiver.id,
                        status: 'confirmed',
                        is_modification: false, // Explicitly false for new approval
                        modification_seen_by_caregiver: false
                    })
                    .eq('id', application.appointment_id);

                if (appError) throw appError;

                // 2. Mark this application as approved
                const { error: jobError } = await supabase
                    .from('job_applications')
                    .update({ status: 'approved' })
                    .eq('id', application.id);

                if (jobError) throw jobError;

                // 3. Reject other applications for the same appointment (optional but cleaner)
                await supabase
                    .from('job_applications')
                    .update({ status: 'rejected' })
                    .eq('appointment_id', application.appointment_id)
                    .neq('id', application.id);

                alert("¡Solicitud aprobada con éxito! El turno ha sido confirmado.");

            } else {
                // REJECT Flow: Just mark application as rejected
                const { error } = await supabase
                    .from('job_applications')
                    .update({ status: 'rejected' })
                    .eq('id', application.id);

                if (error) throw error;
                alert("Solicitud rechazada.");
            }

            fetchAppointments();
            fetchNotifications();
        } catch (error) {
            console.error('Error updating request:', error);
            alert("Error al procesar la solicitud: " + error.message);
        }
    };

    const handleEditClick = (appointment) => {
        setEditingAppointment(appointment);
        setShowListModal(false); // Close list to verify editing, or keep open? Better to close to avoid z-index issues or clutter
        // Actually user might want to go back to list... but for simplicity let's open Edit Modal on top
    };

    const handleSaveChanges = async (updatedData) => {
        if (!editingAppointment?.id) return;

        try {
            const payload = {
                title: updatedData.title,
                date: updatedData.date,
                time: updatedData.time,
                end_time: updatedData.endTime || null,
                type: updatedData.type,
                type: updatedData.type,
                patient_id: updatedData.patient_id || null, // Fix: Convert empty string to null
                address: updatedData.address, // Added address
                details: updatedData.details,
                modification_seen_by_caregiver: false, // Reset flag for caregiver to see the change
                is_modification: true // Mark as a modification
            };

            const { error } = await supabase
                .from('appointments')
                .update(payload)
                .eq('id', editingAppointment.id);

            if (error) throw error;

            alert('Cita actualizada correctamente');
            setEditingAppointment(null);
            fetchAppointments();
            setShowListModal(true); // Re-open list after editing
        } catch (error) {
            console.error('Error updating appointment:', error);
            alert('Error al actualizar la cita: ' + error.message);
        }
    };

    const timeAgo = (dateIdx) => {
        const date = new Date(dateIdx);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return 'Hace un momento';
        if (diffInSeconds < 3600) return `Hace ${Math.floor(diffInSeconds / 60)} min`;
        if (diffInSeconds < 86400) return `Hace ${Math.floor(diffInSeconds / 3600)} h`;
        return `Hace ${Math.floor(diffInSeconds / 86400)} días`;
    };

    // Helper: Local Date "Today" (YYYY-MM-DD)
    const todayLocal = new Date().toLocaleDateString('en-CA');

    // Filter appointments for "Citas en curso"
    const inProgressAppointments = appointments.filter(a =>
        a.status === 'in_progress' && a.date === todayLocal
    );

    // Filter appointments for "Próximas Visitas" (Confirmed)
    // We exclude in_progress here to avoid duplication if shown in separate section
    const confirmedAppointments = appointments
        .filter(a => a.status === 'confirmed' && a.date >= todayLocal)
        .sort((a, b) => new Date(a.date) - new Date(b.date)) // Ascending (Closest first)
        .slice(0, 3); // Take first 3

    const handleDeleteAppointment = async (appointment) => {
        const hasCaregiver = !!appointment.caregiver_id;
        const confirmMsg = hasCaregiver
            ? 'Esta cita ya tiene un cuidador asignado. ¿Deseas cancelarla? El cuidador recibirá una notificación.'
            : '¿Estás seguro de que deseas eliminar esta cita? Se moverá al historial como cancelada.';

        if (window.confirm(confirmMsg)) {
            try {
                // Soft delete: Always change status to cancelled so it stays in DB history
                const { error } = await supabase
                    .from('appointments')
                    .update({
                        status: 'cancelled',
                        modification_seen_by_caregiver: false,
                        is_modification: true // Mark as modified/cancelled for UI highlight
                    })
                    .eq('id', appointment.id);

                if (error) throw error;

                if (hasCaregiver) {
                    alert('Cita cancelada correctamente. El cuidador ha sido notificado.');
                } else {
                    alert('Cita cancelada correctamente. Se ha movido a tu historial.');
                }

                fetchAppointments(); // Refresh list
            } catch (error) {
                console.error('Error handling appointment removal:', error);
                alert('Error: ' + error.message);
            }
        }
    };

    const handleMessage = async (caregiver) => {
        if (!user || !caregiver?.id) return;

        try {
            // 1. Check if conversation exists
            // Re-query with explicit AND for the pair
            const { data: conversations, error } = await supabase
                .from('conversations')
                .select('id')
                .or(`and(participant1_id.eq.${user.id},participant2_id.eq.${caregiver.id}),and(participant1_id.eq.${caregiver.id},participant2_id.eq.${user.id})`);

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
                        participant2_id: caregiver.id,
                        last_message: 'Hola, quiero coordinar una entrevista.',
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
                        content: 'Hola, quiero coordinar una entrevista.'
                    }]);
            }

            // 3. Navigate
            navigate('/dashboard/messages', { state: { conversationId: conversationId } });

        } catch (error) {
            console.error('Error starting chat:', error);
            alert('No se pudo iniciar el chat');
        }
    };

    // HISTORY FILTER Logic:
    // 1. Status is 'completed' or 'paid' (Always show)
    // 2. OR Status is 'confirmed' BUT Date is strictly less than Today (Past)
    // We EXCLUDE 'confirmed' appointments that are for TODAY (they belong in Upcoming)
    const historyAppointments = appointments
        .filter(a =>
            a.status === 'cancelled' ||
            a.status === 'completed' ||
            a.status === 'paid' ||
            (a.status === 'confirmed' && a.date < todayLocal)
        )
        .sort((a, b) => {
            // Priority: Completed/Paid > Cancelled
            const scoreA = (a.status === 'completed' || a.status === 'paid') ? 1 : 0;
            const scoreB = (b.status === 'completed' || b.status === 'paid') ? 1 : 0;
            if (scoreA !== scoreB) return scoreB - scoreA; // High score first
            // Secondary sort: Date descending (Newest first)
            return new Date(b.date) - new Date(a.date);
        });
    // Filter for "Citas Programadas" (Modal & Stat Card)
    const upcomingAppointmentsList = appointments.filter(a =>
        (a.status === 'confirmed' || a.status === 'pending' || a.status === 'in_progress') &&
        a.status !== 'cancelled' &&
        a.date >= todayLocal
    );

    return (
        <div className="max-w-7xl mx-auto animate-fade-in relative pb-12">
            <AppointmentsListModal
                isOpen={showListModal}
                onClose={() => setShowListModal(false)}
                appointments={upcomingAppointmentsList}
                onEdit={handleEditClick}
                onDelete={handleDeleteAppointment}
            />

            <EditAppointmentModal
                isOpen={!!editingAppointment}
                onClose={() => { setEditingAppointment(null); setShowListModal(true); }}
                appointment={editingAppointment}
                onSave={handleSaveChanges}
                patients={patients}
                isSubscribed={profile?.subscription_status === 'active'}
            />

            <CaregiverDetailModal
                isOpen={!!selectedCaregiver}
                onClose={() => setSelectedCaregiver(null)}
                caregiver={selectedCaregiver}
                onContact={(caregiver) => {
                    setSelectedCaregiver(null);
                    handleMessage(caregiver);
                }}
            />

            <RateCaregiverModal
                isOpen={!!ratingAppointment}
                onClose={() => setRatingAppointment(null)}
                appointment={ratingAppointment}
                onSuccess={() => {
                    alert("¡Gracias por tu calificación!");
                    fetchAppointments();
                }}
            />


            <div className="bg-gradient-to-br from-[var(--primary-color)] to-[#1a5a70] rounded-[16px] p-10 !text-[#FAFAF7] shadow-2xl relative overflow-hidden mb-12">
                <div className="absolute top-0 right-0 w-80 h-80 bg-[var(--secondary-color)] rounded-full -translate-y-1/2 translate-x-1/2 blur-[120px] opacity-20"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-[var(--accent-color)] rounded-full translate-y-1/2 -translate-x-1/2 blur-[100px] opacity-10"></div>

                <div className="relative z-10">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                        <div>
                            <span className="bg-white/10 text-[var(--accent-color)] px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-4 inline-block border border-white/10 backdrop-blur-md">
                                Panel de Control
                            </span>
                            <h1 className="text-3xl sm:text-4xl md:text-5xl font-brand font-bold tracking-tight mb-2 text-left !text-[#FAFAF7] break-words drop-shadow-sm">
                                ¡Hola de nuevo, {profile?.full_name?.split(' ')[0] || 'Usuario'}!
                            </h1>
                            <p className="!text-[#FAFAF7]/80 text-lg font-secondary max-w-xl text-left">
                                Aquí tienes el resumen de hoy y el estado de tus servicios de cuidado.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                <StatCard
                    icon={Users}
                    title="Cuidadores Disponibles"
                    value={caregiversCount.toString()}
                    colorClass="secondary"
                    onClick={() => navigate('/dashboard/caregivers')}
                />
                <StatCard
                    icon={Calendar}
                    title="Citas Programadas"
                    value={upcomingAppointmentsList.length.toString()}
                    colorClass="primary"
                    onClick={() => setShowListModal(true)}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Left Column Wrapper */}
                <div className="lg:col-span-2 space-y-10 text-left">
                    {/* In Progress Section (If any) */}
                    {inProgressAppointments.length > 0 && (
                        <div className="card !p-8 border-none bg-gradient-to-r from-emerald-50 to-white shadow-xl">
                            <div className="flex justify-between items-center mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="relative flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--secondary-color)] opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-[var(--secondary-color)]"></span>
                                    </div>
                                    <h3 className="font-brand font-bold text-2xl text-[var(--primary-color)] tracking-tight">Servicio en Curso</h3>
                                </div>
                                <button
                                    onClick={() => navigate('/dashboard/pulso')}
                                    className="text-[var(--secondary-color)] text-xs font-black uppercase tracking-widest hover:underline flex items-center gap-2"
                                >
                                    Ver en PULSO <Activity size={14} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                {inProgressAppointments.map(app => (
                                    <AppointmentCard
                                        key={app.id}
                                        name={app.caregiver?.full_name || 'Cuidador Asignado'}
                                        role={app.title}
                                        time={`${app.time?.substring(0, 5)} - ${app.end_time?.substring(0, 5) || '?'}`}
                                        date={new Date(app.date + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                        image={app.caregiver?.avatar_url}
                                        status={app.status}
                                        onViewProfile={() => setSelectedCaregiver(app.caregiver)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Upcoming Appointments */}
                    <div className="card !p-10 border-none shadow-2xl">
                        <div className="flex justify-between items-center mb-10">
                            <h3 className="font-brand font-bold text-2xl text-[var(--primary-color)] tracking-tight flex items-center gap-3">
                                <span className="p-2.5 bg-blue-50 text-blue-600 rounded-[16px]">
                                    <Calendar size={20} />
                                </span>
                                Próximas Citas
                            </h3>
                            <button onClick={() => setShowListModal(true)} className="text-[var(--secondary-color)] text-xs font-black uppercase tracking-[0.2em] hover:underline bg-[var(--base-bg)] px-4 py-2 rounded-[16px] transition-all">Ver Todo</button>
                        </div>

                        <div className="space-y-6">
                            {confirmedAppointments.length > 0 ? (
                                confirmedAppointments.map(app => (
                                    <AppointmentCard
                                        key={app.id}
                                        name={app.caregiver?.full_name || 'Cuidador Asignado'}
                                        role={app.title}
                                        time={`${app.time?.substring(0, 5)} - ${app.end_time?.substring(0, 5) || '?'}`}
                                        date={new Date(app.date + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                        image={app.caregiver?.avatar_url}
                                        status={app.status}
                                        onViewProfile={() => setSelectedCaregiver(app.caregiver)}
                                    />
                                ))
                            ) : (
                                <div className="text-center py-16 bg-gray-50/50 rounded-[16px] border border-dashed border-gray-200">
                                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                                        <Calendar size={32} className="text-gray-300" />
                                    </div>
                                    <p className="text-[var(--text-light)] italic font-secondary text-lg">No tienes visitas confirmadas próximamente.</p>
                                    <button
                                        onClick={() => navigate('/services')}
                                        className="mt-6 text-[var(--secondary-color)] text-xs font-black uppercase tracking-widest hover:underline"
                                    >
                                        Pedir mi primer servicio
                                    </button>
                                </div>
                            )}

                        </div>
                    </div>

                    {/* Completed Appointments */}
                    <div className="card !p-10 border-none shadow-2xl">
                        <div className="flex items-center gap-3 mb-10">
                            <div className="p-2.5 bg-orange-50 text-orange-500 rounded-[16px]">
                                <Star size={20} fill="currentColor" />
                            </div>
                            <h3 className="font-brand font-bold text-2xl text-[var(--primary-color)] tracking-tight">Historial de Citas</h3>
                        </div>
                        <div className="grid gap-6">
                            {historyAppointments.length > 0 ? (
                                historyAppointments
                                    .slice(0, 3)
                                    .map(app => (
                                        <AppointmentCard
                                            key={app.id}
                                            name={app.caregiver?.full_name || 'Cuidador'}
                                            role={app.title || 'Servicio Finalizado'}
                                            time={`${app.time?.substring(0, 5)} - ${app.end_time?.substring(0, 5) || '?'}`}
                                            date={new Date(app.date + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                            image={app.caregiver?.avatar_url}
                                            status={app.status}
                                            rating={app.reviews?.[0]?.rating}
                                            onViewProfile={() => setSelectedCaregiver(app.caregiver)}
                                            onRate={() => setRatingAppointment(app)}
                                        />
                                    ))
                            ) : (
                                <p className="text-[var(--text-light)] italic text-center py-8 font-secondary text-lg">No tienes citas completadas registradas.</p>
                            )}
                        </div>
                    </div>
                </div>


                {/* Right Column */}
                <div className="flex flex-col gap-10">
                    {/* Caregiver Requests Panel */}
                    <div className="card !p-10 border-none shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent-color)]/5 rounded-full translate-x-1/2 -translate-y-1/2 blur-2xl"></div>
                        <h3 className="font-brand font-bold text-2xl text-[var(--primary-color)] mb-10 tracking-tight flex items-center gap-3 relative z-10">
                            <span className="p-2.5 bg-emerald-50 text-[var(--secondary-color)] rounded-[16px]">
                                <Activity size={20} />
                            </span>
                            Postulaciones
                        </h3>

                        <div className="space-y-6 relative z-10">
                            {appointments.flatMap(a =>
                                (a.job_applications || [])
                                    .filter(app => {
                                        if (app.status !== 'pending') return false;
                                        // Grace Period: Only show if created > 5 minutes ago
                                        const createdTime = new Date(app.created_at).getTime();
                                        const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
                                        return createdTime < fiveMinutesAgo;
                                    })
                                    .map(app => ({ ...app, appointment: a }))
                            ).length > 0 ? (
                                appointments.flatMap(a =>
                                    (a.job_applications || [])
                                        .filter(app => {
                                            if (app.status !== 'pending') return false;
                                            const createdTime = new Date(app.created_at).getTime();
                                            const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
                                            return createdTime < fiveMinutesAgo;
                                        })
                                        .map(app => ({ ...app, appointment: a }))
                                ).map((req) => (
                                    <div key={req.id} className="bg-white border border-gray-100 rounded-[16px] p-6 animate-fade-in shadow-xl shadow-gray-100 hover:border-[var(--secondary-color)]/20 transition-all group">
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="w-14 h-14 rounded-[16px] bg-[var(--accent-color)]/20 shadow-inner text-[var(--primary-color)] flex items-center justify-center font-brand font-bold overflow-hidden border border-white">
                                                {req.caregiver?.avatar_url ? (
                                                    <img src={req.caregiver.avatar_url} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    req.caregiver?.full_name?.charAt(0) || '?'
                                                )}
                                            </div>
                                            <div className="text-left">
                                                <p className="font-brand font-bold text-[var(--primary-color)] text-lg line-clamp-1 tracking-tight">{req.caregiver?.full_name || 'Candidato'}</p>
                                                <p className="text-[10px] text-[var(--secondary-color)] font-black uppercase tracking-[0.2em] mt-0.5">Nueva Solicitud</p>
                                            </div>
                                        </div>

                                        <div className="text-sm text-[var(--text-main)] mb-6 space-y-3 font-secondary bg-[var(--base-bg)] p-4 rounded-[16px] border border-gray-50">
                                            <div className="flex items-center gap-3">
                                                <Calendar size={14} className="text-[var(--secondary-color)]" />
                                                <span className="font-bold text-[var(--primary-color)]">{req.appointment.date}</span>
                                            </div>
                                            <p className="text-xs italic text-[var(--text-light)] leading-relaxed">"{req.appointment.title}"</p>
                                        </div>

                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => handleMessage(req.caregiver)}
                                                className="p-3.5 rounded-[16px] border border-gray-100 bg-white text-[var(--primary-color)] hover:bg-[var(--base-bg)] transition-all shadow-sm group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-100"
                                                title="Enviar mensaje"
                                            >
                                                <MessageSquare size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleApproveRequest({ ...req, appointment_id: req.appointment.id }, true)}
                                                className="flex-1 bg-[var(--secondary-color)] !text-[#FAFAF7] py-3.5 rounded-[16px] font-black text-[10px] uppercase tracking-widest shadow-lg shadow-green-100 hover:bg-emerald-600 transition-all border-none"
                                            >
                                                Aprobar
                                            </button>
                                            <button
                                                onClick={() => handleApproveRequest({ ...req, appointment_id: req.appointment.id }, false)}
                                                className="px-4 bg-white border border-gray-100 text-gray-400 rounded-[16px] hover:text-[var(--error-color)] hover:bg-red-50 hover:border-red-100 transition-all"
                                                title="Rechazar"
                                            >
                                                <Check size={20} className="rotate-45" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-10 bg-[var(--base-bg)]/50 rounded-[16px] border border-dashed border-gray-200">
                                    <Activity size={32} className="mx-auto text-gray-300 mb-4 opacity-50" />
                                    <p className="text-[var(--text-light)] text-sm italic font-secondary">No tienes solicitudes pendientes.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Family Members Card */}
                    <div className="card !p-10 border-none shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--secondary-color)]/5 rounded-full translate-x-1/2 -translate-y-1/2 blur-2xl"></div>
                        <div className="flex justify-between items-center mb-10 relative z-10">
                            <h3 className="font-brand font-bold text-2xl text-[var(--primary-color)] tracking-tight flex items-center gap-3">
                                <span className="p-2.5 bg-purple-50 text-purple-600 rounded-[16px]">
                                    <Users size={20} />
                                </span>
                                Familiares
                            </h3>
                            <button onClick={() => navigate('/dashboard/profile')} className="text-[var(--secondary-color)] text-[10px] font-black uppercase tracking-widest hover:underline bg-[var(--base-bg)] px-3 py-1.5 rounded-[16px] transition-all">Gestionar</button>
                        </div>

                        <div className="space-y-4 relative z-10">
                            {patients.length > 0 ? (
                                patients.map((patient) => (
                                    <div key={patient.id} className="flex items-center gap-5 p-5 bg-[var(--base-bg)]/50 rounded-[24px] border border-transparent hover:bg-white hover:border-[var(--secondary-color)]/20 hover:shadow-xl transition-all group">
                                        <div className="w-14 h-14 rounded-[16px] bg-white shadow-md text-[var(--primary-color)] flex items-center justify-center font-brand font-bold text-xl border border-gray-50 group-hover:bg-[var(--secondary-color)] group-hover:text-white transition-all transform group-hover:scale-105">
                                            {(patient.full_name || patient.name || '?').charAt(0)}
                                        </div>
                                        <div className="text-left">
                                            <p className="font-brand font-bold text-[var(--primary-color)] text-lg tracking-tight">{patient.full_name || patient.name}</p>
                                            <p className="text-[10px] text-[var(--text-light)] font-black uppercase tracking-[0.2em] mt-0.5">{patient.age} años</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-6">
                                    <p className="text-[var(--text-light)] text-sm italic font-secondary">No tienes familiares registrados.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Notifications Panel */}
                    <div className="card !p-10 border-none shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full translate-x-1/2 -translate-y-1/2 blur-2xl"></div>
                        <h3 className="font-brand font-bold text-2xl text-[var(--primary-color)] mb-10 tracking-tight flex items-center gap-3 relative z-10">
                            <span className="p-2.5 bg-blue-50 text-blue-600 rounded-[16px]">
                                <Bell size={20} />
                            </span>
                            Mensajes
                        </h3>

                        <div className="space-y-8 relative z-10">
                            {notifications.length > 0 ? (
                                notifications.map((notif) => (
                                    <div key={notif.id} className={`flex gap-5 items-start animate-fade-in transition-all ${notif.is_read ? 'opacity-40 grayscale-[0.5]' : 'hover:scale-[1.02]'}`}>
                                        <div className={`w-12 h-12 rounded-[16px] flex items-center justify-center flex-shrink-0 shadow-lg border-2 ${notif.type === 'alert' || notif.type === 'warning' ? 'bg-red-50 text-[var(--error-color)] border-red-100' :
                                            notif.type === 'success' ? 'bg-emerald-50 text-[var(--secondary-color)] border-emerald-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                                            }`}>
                                            {notif.type === 'alert' || notif.type === 'warning' ? (
                                                <AlertTriangle size={22} />
                                            ) : notif.type === 'success' ? (
                                                <CheckCircle size={22} />
                                            ) : (
                                                <Info size={22} />
                                            )}
                                        </div>
                                        <div className="flex-1 text-left min-w-0">
                                            <div className="flex justify-between items-start gap-4">
                                                <p className={`text-base font-brand leading-tight truncate ${notif.is_read ? 'font-medium text-[var(--text-main)]' : 'font-bold text-[var(--primary-color)]'}`}>
                                                    {notif.title}
                                                </p>
                                                {!notif.is_read && (
                                                    <button onClick={() => markAsRead(notif.id)} className="text-[var(--secondary-color)] hover:bg-[var(--secondary-color)]/10 p-2 rounded-[16px] transition-colors bg-[var(--base-bg)] border border-gray-100">
                                                        <Check size={16} strokeWidth={4} />
                                                    </button>
                                                )}
                                            </div>
                                            <p className="text-sm text-[var(--text-light)] mt-2 leading-relaxed font-secondary line-clamp-2">
                                                {notif.message}
                                            </p>
                                            <div className="flex items-center gap-2 mt-3 text-[10px] text-gray-400 font-bold uppercase tracking-[0.15em]">
                                                <Clock size={12} />
                                                {timeAgo(notif.created_at)}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-10 bg-[var(--base-bg)]/50 rounded-[16px] border border-dashed border-gray-200">
                                    <p className="text-[var(--text-light)] text-sm font-secondary">No tienes nuevas notificaciones.</p>
                                </div>
                            )}
                        </div>

                        <button className="w-full mt-12 py-4 bg-[var(--base-bg)] border border-gray-100 rounded-[16px] text-[10px] font-black text-[var(--primary-color)] uppercase tracking-[0.25em] hover:bg-white hover:border-[var(--secondary-color)]/30 hover:shadow-xl transition-all relative z-10">
                            Ver historial completo
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardOverview;
