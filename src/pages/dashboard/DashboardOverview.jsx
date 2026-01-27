import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Star, TrendingUp, Users, MessageSquare, Bell, Check, Info, AlertTriangle, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import AppointmentsListModal from '../../components/dashboard/AppointmentsListModal';
import EditAppointmentModal from '../../components/dashboard/EditAppointmentModal'; // New Import

const StatCard = ({ icon: Icon, title, value, colorClass, onClick }) => (
    <div
        onClick={onClick}
        className={`bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-start gap-4 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
    >
        <div className={`p-3 rounded-lg ${colorClass}`}>
            <Icon size={24} className="text-white" />
        </div>
        <div>
            <p className="text-sm text-gray-500 font-medium">{title}</p>
            <h3 className="text-2xl font-bold text-gray-800 mt-1">{value}</h3>
        </div>
    </div>
);

const AppointmentCard = ({ name, role, time, date, image, rating, onViewProfile, onRate, status }) => (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg mb-3 last:mb-0 animate-fade-in">
        <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm ${image ? '' : 'border border-blue-200'} shrink-0`}>
                {image ? (
                    <img src={image} alt={name} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                    name.charAt(0)
                )}
            </div>
            <div>
                <h4 className="font-bold text-sm text-gray-800 line-clamp-1">{name}</h4>
                <p className="text-xs text-gray-500">{role}</p>
            </div>
        </div>
        <div className="text-right flex flex-col items-end gap-1 min-w-[100px]">
            <p className="text-sm font-bold text-[var(--primary-color)]">{time}</p>
            <p className="text-xs text-gray-400">{date}</p>

            {/* View Profile Button - Only show if NO ACTION is required (not completable/ratable) OR if explicit view requested */}
            {onViewProfile && !onRate && !rating && (
                <button
                    onClick={onViewProfile}
                    className="text-[10px] font-bold text-blue-600 hover:bg-blue-50 px-2 py-0.5 rounded transition-colors mt-1"
                >
                    Ver perfil
                </button>
            )}

            {/* Rating Display or Action */}
            {(status === 'completed' || status === 'paid') && (
                <>
                    {rating ? (
                        <div className="flex items-center gap-1 mt-1 bg-orange-50 px-2 py-1 rounded-lg border border-orange-100">
                            <Star size={12} className="fill-orange-400 text-orange-400" />
                            <span className="text-xs font-bold text-orange-600">{rating}</span>
                        </div>
                    ) : (
                        <button
                            onClick={onRate || onViewProfile}
                            className="text-[10px] font-bold text-orange-600 hover:bg-orange-50 px-2 py-0.5 rounded transition-colors mt-1 flex items-center justify-end gap-1 ml-auto border border-orange-200"
                        >
                            <Star size={10} className="fill-current" /> Calificar
                        </button>
                    )}
                </>
            )}
        </div>
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
            console.error('Error fetching dashboard data:', error);
            alert("Error cargando el dashboard: " + error.message);
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
                patient_id: updatedData.patient_id || null, // Fix: Convert empty string to null
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
            ((a.status === 'completed' || a.status === 'paid') && a.date <= todayLocal) ||
            (a.status === 'confirmed' && a.date < todayLocal)
        )
    // Filter for "Citas Programadas" (Modal & Stat Card)
    const upcomingAppointmentsList = appointments.filter(a =>
        a.status !== 'completed' &&
        a.status !== 'paid' &&
        a.status !== 'cancelled' &&
        a.date >= todayLocal
    );

    return (
        <div className="max-w-7xl mx-auto animate-fade-in relative">
            <AppointmentsListModal
                isOpen={showListModal}
                onClose={() => setShowListModal(false)}
                appointments={upcomingAppointmentsList}
                onEdit={handleEditClick} // Pass edit handler
                onDelete={handleDeleteAppointment} // Pass delete handler
            />

            <EditAppointmentModal
                isOpen={!!editingAppointment}
                onClose={() => { setEditingAppointment(null); setShowListModal(true); }} // Re-open list on cancel?
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
                    fetchAppointments(); // Refresh to potentially hide the button or update stats
                }}
            />


            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-800">Panel de Control</h1>
                <p className="text-gray-500 text-lg">¡Hola de nuevo, <span className="text-[var(--primary-color)] font-bold">{firstName}</span>! ✨ Aquí tienes el resumen de hoy.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <StatCard
                    icon={Users}
                    title="Cuidadores Disponibles"
                    value={caregiversCount.toString()}
                    colorClass="bg-blue-500"
                    onClick={() => navigate('/dashboard/caregivers')}
                />
                <StatCard
                    icon={Calendar}
                    title="Citas Programadas"
                    value={upcomingAppointmentsList.length.toString()}
                    colorClass="bg-[var(--secondary-color)]"
                    onClick={() => setShowListModal(true)}
                />
                {/* Stats shifted to PULSO (Premium) - Keeping grid for visual weight if needed, or collapse */}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column Wrapper */}
                <div className="lg:col-span-2 space-y-6 text-left">
                    {/* Upcoming Appointments (Confirmed Only) */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-lg text-gray-800">Próximas Citas</h3>
                            <button onClick={() => setShowListModal(true)} className="text-[var(--primary-light)] text-sm font-medium hover:underline">Ver Todo</button>
                        </div>

                        <div className="space-y-4">
                            {confirmedAppointments.length > 0 ? (
                                confirmedAppointments.map(app => (
                                    <AppointmentCard
                                        key={app.id}
                                        name={app.caregiver?.full_name || 'Cuidador Asignado'}
                                        role={app.title}
                                        time={`${app.time?.substring(0, 5)} - ${app.end_time?.substring(0, 5) || '?'}`} // Show end time
                                        date={new Date(app.date + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                        image={app.caregiver?.avatar_url} // If available
                                        status={app.status} // Pass status
                                        onViewProfile={() => setSelectedCaregiver(app.caregiver)}
                                    />
                                ))
                            ) : (
                                <p className="text-gray-400 italic text-center py-4">No tienes visitas confirmadas próximamente.</p>
                            )}

                        </div>
                    </div>

                    {/* Completed Appointments (To Rate) */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="font-bold text-lg text-gray-800 mb-6 flex items-center gap-2">
                            <Star size={18} className="text-orange-500" />
                            Historial de Citas
                        </h3>
                        <div className="space-y-4">
                            {historyAppointments.length > 0 ? (
                                historyAppointments
                                    .map(app => (
                                        <AppointmentCard
                                            key={app.id}
                                            name={app.caregiver?.full_name || 'Cuidador'}
                                            role={app.title || 'Servicio Finalizado'}
                                            time={`${app.time?.substring(0, 5)} - ${app.end_time?.substring(0, 5) || '?'}`}
                                            date={new Date(app.date + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                            image={app.caregiver?.avatar_url}
                                            status={app.status} // Pass status for rating logic
                                            rating={app.reviews?.[0]?.rating} // Pass existing rating if any
                                            onViewProfile={() => setSelectedCaregiver(app.caregiver)} // View Full Profile
                                            onRate={() => setRatingAppointment(app)} // Trigger Rating
                                        />
                                    ))
                            ) : (
                                <p className="text-gray-400 italic text-center py-4">No tienes citas completadas registradas.</p>
                            )}
                        </div>
                    </div>
                </div>


                {/* Right Column */}
                <div className="flex flex-col gap-6">
                    {/* Caregiver Requests Panel */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="font-bold text-lg text-gray-800 mb-4">Solicitudes de Cuidadores</h3>

                        <div className="space-y-4">
                            {appointments.flatMap(a =>
                                (a.job_applications || [])
                                    .filter(app => app.status === 'pending')
                                    .map(app => ({ ...app, appointment: a }))
                            ).length > 0 ? (
                                appointments.flatMap(a =>
                                    (a.job_applications || [])
                                        .filter(app => app.status === 'pending')
                                        .map(app => ({ ...app, appointment: a }))
                                ).map((req) => (
                                    <div key={req.id} className="bg-blue-50 border border-blue-100 rounded-lg p-4 animate-fade-in">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-200 text-blue-700 flex items-center justify-center font-bold overflow-hidden">
                                                {req.caregiver?.avatar_url ? (
                                                    <img src={req.caregiver.avatar_url} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    req.caregiver?.full_name?.charAt(0) || '?'
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-800">{req.caregiver?.full_name || 'Candidato'}</p>
                                                <p className="text-xs text-gray-500 font-medium">Se postula para cuidar a tu familiar</p>
                                            </div>
                                        </div>

                                        <div className="text-sm text-gray-600 mb-3 space-y-1">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={14} className="text-gray-400" />
                                                <span className="font-semibold">{req.appointment.date}</span> • {req.appointment.time?.substring(0, 5)} {req.appointment.end_time ? `- ${req.appointment.end_time.substring(0, 5)}` : ''}
                                            </div>
                                            <p className="text-xs italic text-gray-500">"{req.appointment.title}"</p>
                                        </div>

                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleMessage(req.caregiver)}
                                                className="p-2 rounded-lg border border-blue-200 text-blue-600 hover:bg-white transition-colors"
                                                title="Enviar mensaje"
                                            >
                                                <MessageSquare size={18} />
                                            </button>
                                            <button
                                                onClick={() => setSelectedCaregiver(req.caregiver)}
                                                className="px-3 bg-blue-100 text-blue-700 text-xs font-bold py-2 rounded-lg hover:bg-blue-200 transition-colors"
                                            >
                                                Ver perfil
                                            </button>
                                            <button
                                                onClick={() => handleApproveRequest({ ...req, appointment_id: req.appointment.id }, true)}
                                                className="flex-1 bg-blue-600 text-white text-xs font-bold py-2 rounded-lg hover:bg-blue-700 transition-colors"
                                            >
                                                Aprobar
                                            </button>
                                            <button
                                                onClick={() => handleApproveRequest({ ...req, appointment_id: req.appointment.id }, false)}
                                                className="flex-1 bg-white border border-gray-300 text-gray-600 text-xs font-bold py-2 rounded-lg hover:bg-gray-50 transition-colors"
                                            >
                                                Rechazar
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-400 text-sm italic text-center py-4">No tienes solicitudes pendientes.</p>
                            )}
                        </div>
                    </div>

                    {/* Family Members Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg text-gray-800">Mis Familiares</h3>
                            <button onClick={() => navigate('/dashboard/profile')} className="text-[var(--primary-color)] text-sm font-medium hover:underline">Gestionar</button>
                        </div>

                        <div className="space-y-3">
                            {patients.length > 0 ? (
                                patients.map((patient) => (
                                    <div key={patient.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                                            {(patient.full_name || patient.name || '?').charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-800 text-sm">{patient.full_name || patient.name}</p>
                                            <p className="text-xs text-gray-500">{patient.age} años</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-400 text-sm italic text-center py-2">No tienes familiares registrados.</p>
                            )}
                        </div>
                    </div>

                    {/* Notifications Panel */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="font-bold text-lg text-gray-800 mb-6">Notificaciones</h3>

                        <div className="space-y-6">
                            {notifications.length > 0 ? (
                                notifications.map((notif) => (
                                    <div key={notif.id} className={`flex gap-3 items-start animate-fade-in ${notif.is_read ? 'opacity-60' : ''}`}>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${notif.type === 'alert' || notif.type === 'warning' ? 'bg-red-100' :
                                            notif.type === 'success' ? 'bg-emerald-100' : 'bg-blue-100'
                                            }`}>
                                            {notif.type === 'alert' || notif.type === 'warning' ? (
                                                <AlertTriangle size={14} className="text-red-600" />
                                            ) : notif.type === 'success' ? (
                                                <CheckCircle size={14} className="text-emerald-600" />
                                            ) : (
                                                <Info size={14} className="text-blue-600" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <p className={`text-sm ${notif.is_read ? 'font-medium text-gray-600' : 'font-bold text-gray-800'}`}>
                                                    {notif.title}
                                                </p>
                                                {!notif.is_read && (
                                                    <button onClick={() => markAsRead(notif.id)} className="text-blue-500 hover:text-blue-700 p-1" title="Marcar leída">
                                                        <Check size={12} />
                                                    </button>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500 mt-0.5 leading-snug">
                                                {notif.message}
                                            </p>
                                            <p className="text-[10px] text-gray-400 mt-1">
                                                {timeAgo(notif.created_at)}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-6">
                                    <p className="text-gray-400 text-sm">No tienes nuevas notificaciones.</p>
                                </div>
                            )}

                            {/* Placeholder for "No New Messages" */}
                            <div className="flex gap-3 items-start opacity-50">
                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                                    <MessageSquare size={14} className="text-gray-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">No tienes mensajes nuevos.</p>
                                </div>
                            </div>
                        </div>

                        <button className="w-full mt-6 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                            Ver todas
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardOverview;
