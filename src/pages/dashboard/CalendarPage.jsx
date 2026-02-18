import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, MapPin, Clock, User, X, Loader2, CheckCircle, Trash2, Edit2, Info, BookOpen, Briefcase, Star, Lock, Settings, Activity, ShieldCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ServiceSelector, { SERVICE_CATEGORIES } from '../../components/dashboard/ServiceSelector';
import ConfigureAgendaModal from '../../components/dashboard/ConfigureAgendaModal';
import CreateServiceWizard from '../../components/dashboard/CreateServiceWizard';
import { usePermissions } from '../../hooks/usePermissions';

const CalendarPage = () => {
    const { user, profile } = useAuth();
    const { can } = usePermissions();
    const navigate = useNavigate();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);
    const [showModal, setShowModal] = useState(false);

    // BC Cuidado Plus Wizard State
    const [showWizard, setShowWizard] = useState(false);
    const [wizardInitialData, setWizardInitialData] = useState(null);
    const [wizardIsRestricted, setWizardIsRestricted] = useState(false);
    const [wizardInitialStep, setWizardInitialStep] = useState(1);

    // Agenda Modal States
    const [showAgendaModal, setShowAgendaModal] = useState(false);
    const [selectedAgendaId, setSelectedAgendaId] = useState(null);
    const [currentCareAgenda, setCurrentCareAgenda] = useState([]);
    const [showDualEditModal, setShowDualEditModal] = useState(false);
    const [dualEditTarget, setDualEditTarget] = useState(null);

    const handleEditGroup = async (groupEvent, targetStep = 1) => {
        try {
            const groupId = groupEvent.service_group_id;
            const { data: groupApps, error } = await supabase
                .from('appointments')
                .select('*')
                .eq('service_group_id', groupId)
                .order('date', { ascending: true });

            if (error) throw error;
            if (!groupApps || groupApps.length === 0) return;

            const firstApp = groupApps[0];
            const lastApp = groupApps[groupApps.length - 1];

            // Parse details to get programs and agenda
            const detailsParts = firstApp.details?.split('---SERVICES---');
            const programNamesStr = detailsParts?.[0]?.replace('Cuidado Especializado: ', '').trim();
            const agendaJson = detailsParts?.[1];

            const programNames = programNamesStr ? programNamesStr.split(' + ') : [];
            let parsedAgenda = [];
            try {
                parsedAgenda = agendaJson ? JSON.parse(agendaJson) : [];
            } catch (e) {
                console.error("Error parsing agenda:", e);
            }

            // Fetch all programs to find matching IDs for selection
            const { data: allPrograms } = await supabase.from('care_programs').select('*');
            const selectedPrograms = allPrograms?.filter(p => programNames.includes(p.name)) || [];

            setWizardInitialData({
                customTitle: firstApp.title?.split(': ')[1] || firstApp.title,
                startDate: firstApp.date,
                endDate: lastApp.date,
                startTime: firstApp.time,
                endTime: firstApp.end_time || '',
                patient_id: firstApp.patient_id || '',
                address: firstApp.address || '',
                selectedPrograms: selectedPrograms,
                agendaItems: parsedAgenda,
                service_group_id: groupId
            });

            setWizardInitialStep(targetStep);
            setShowWizard(true);
            setWizardIsRestricted(false);
        } catch (error) {
            console.error("Error preparing edit:", error);
            alert("Error al cargar datos del servicio para edición.");
        }
    };

    const handleWizardComplete = async (selection) => {
        try {
            setSaving(true);
            const { customTitle, startDate, endDate, startTime, endTime, agendaItems, selectedPrograms, address, patient_id } = selection;

            const resolvedPatientId = patient_id || patients[0]?.id;

            if (!resolvedPatientId) {
                throw new Error("No se ha seleccionado una persona a atender válida.");
            }

            // Reuse Group ID if editing, otherwise generate a new one
            let service_group_id = selection.service_group_id;

            // SINGLE DAY UPDATE LOGIC
            if (wizardIsRestricted && editingId) {
                const programNames = selectedPrograms.map(p => p.name).join(' + ');
                const selectedAgenda = agendaItems.filter(i => i.selected);

                const payload = {
                    title: customTitle || `Agenda de Cuidado PULSO: ${programNames}`,
                    // Date is NOT updated in restricted mode, it remains the same
                    time: startTime, // Updated time for this specific day
                    end_time: endTime,
                    details: `Cuidado Especializado: ${programNames}\n---SERVICES---${JSON.stringify(selectedAgenda)}`,
                    address: address || profile?.address || '',
                    modification_seen_by_caregiver: false,
                    is_modification: true
                };

                const { error } = await supabase
                    .from('appointments')
                    .update(payload)
                    .eq('id', editingId);

                if (error) throw error;

                alert('Cambios guardados para el día seleccionado.');
                setShowWizard(false);
                setWizardIsRestricted(false);
                setEditingId(null);
                loadAppointments();
                return; // EXIT FUNCTION
            }

            // BULK CREATION / UPDATE LOGIC
            // Generate dates ensuring continuity
            const start = new Date(startDate);
            const end = new Date(endDate);
            const dates = [];
            let curr = new Date(start);

            while (curr <= end) {
                dates.push(new Date(curr).toISOString().split('T')[0]);
                curr.setDate(curr.getDate() + 1);
            }

            // SAFETY CHECK: Limit creating too many records at once
            if (dates.length > 30) {
                throw new Error(`El servicio es demasiado largo (${dates.length} días). Máximo permitido: 30 días.`);
            }

            const programNames = selectedPrograms.map(p => p.name).join(' + ');
            const selectedAgenda = agendaItems.filter(i => i.selected);
            const detailsJson = `Cuidado Especializado: ${programNames}\n---SERVICES---${JSON.stringify(selectedAgenda)}`;
            const todayStr = new Date().toLocaleDateString('en-CA');

            if (service_group_id) {
                // --- SYNC UPDATE LOGIC (Non-destructive) ---
                console.log("Actualizando paquete existente (Sincronización Inteligente)...");

                // 1. Update Group metadata
                await supabase
                    .from('service_groups')
                    .upsert({
                        id: service_group_id,
                        title: customTitle || `Agenda de Cuidado PULSO: ${programNames}`,
                        client_id: user.id
                    });

                // 2. Fetch existing future appointments for this group
                const { data: existingAppts, error: fetchError } = await supabase
                    .from('appointments')
                    .select('id, date, status, caregiver_id')
                    .eq('service_group_id', service_group_id)
                    .gte('date', todayStr);

                if (fetchError) throw fetchError;

                // Map for quick lookup: date -> appointment
                const existingMap = {};
                existingAppts.forEach(app => { existingMap[app.date] = app; });

                const updates = [];
                const inserts = [];
                const processedIds = new Set();

                // 3. Iterate through NEW desired dates
                for (const date of dates) {
                    const existing = existingMap[date];

                    if (existing) {
                        // UPDATE existing appointment
                        processedIds.add(existing.id);
                        updates.push(
                            supabase.from('appointments').update({
                                title: customTitle || `Agenda de Cuidado PULSO: ${programNames}`,
                                time: startTime,
                                end_time: endTime,
                                details: detailsJson,
                                patient_id: resolvedPatientId,
                                address: address || profile?.address || '',
                                modification_seen_by_caregiver: false,
                                is_modification: true,
                                updated_at: new Date()
                            }).eq('id', existing.id)
                        );
                    } else {
                        // INSERT new appointment
                        inserts.push({
                            client_id: user.id,
                            patient_id: resolvedPatientId,
                            title: customTitle || `Agenda de Cuidado PULSO: ${programNames}`,
                            date: date,
                            time: startTime,
                            end_time: endTime,
                            status: 'pending',
                            type: 'Cuidado+',
                            details: detailsJson,
                            address: address || profile?.address || '',
                            service_group_id: service_group_id
                        });
                    }
                }

                // 4. Identify Surplus appointments to DELETE
                const idsToDelete = existingAppts
                    .filter(app => !processedIds.has(app.id))
                    .map(app => app.id);

                // EXECUTE OPERATIONS
                const promises = [...updates];
                if (inserts.length > 0) promises.push(supabase.from('appointments').insert(inserts));
                if (idsToDelete.length > 0) promises.push(supabase.from('appointments').delete().in('id', idsToDelete));

                await Promise.all(promises);
                alert('Paquete actualizado correctamente.');

            } else {
                // --- NEW PACKAGE CREATION ---
                service_group_id = crypto.randomUUID();

                // 1. Create Group Entry first
                const { error: groupError } = await supabase
                    .from('service_groups')
                    .insert([{
                        id: service_group_id,
                        title: customTitle || `Agenda de Cuidado PULSO: ${programNames}`,
                        client_id: user.id
                    }]);

                if (groupError) throw groupError;

                const appointmentsToInsert = dates.map(date => ({
                    client_id: user.id,
                    patient_id: resolvedPatientId,
                    title: customTitle || `Servicio Cuidado+: ${programNames}`,
                    date: date,
                    time: startTime,
                    end_time: endTime,
                    status: 'pending',
                    type: 'Cuidado+',
                    details: detailsJson,
                    address: address || profile?.address || '',
                    service_group_id: service_group_id
                }));

                const { error } = await supabase.from('appointments').insert(appointmentsToInsert);
                if (error) throw error;

                alert(`¡Servicio Cuidado+ creado exitosamente para ${dates.length} días!`);
            }

            setShowWizard(false);
            loadAppointments();
        } catch (error) {
            console.error("Error creating/updating specialized service:", error);
            alert("Error al procesar el servicio: " + error.message);
        } finally {
            setSaving(false);
        }
    };

    // Subscription Check (keeping for technical state if needed elsewhere, but prioritizing permissions)
    const isSubscribed = profile?.subscription_status === 'active';

    const [appointments, setAppointments] = useState([]);
    const [fetching, setFetching] = useState(true);
    const [saving, setSaving] = useState(false);
    const [patients, setPatients] = useState([]);

    const [newAppointment, setNewAppointment] = useState({
        title: '',
        date: '', // Initialize date
        time: '',
        endTime: '',
        type: 'medical',
        patient_id: '',
        address: '',
        selectedServices: []
    });

    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [editingId, setEditingId] = useState(null);

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
        setSelectedDate(null);
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
        setSelectedDate(null);
    };

    const fetchPatients = async () => {
        try {
            const { data, error } = await supabase
                .from('patients')
                .select('id, full_name')
                .eq('family_id', user.id);

            if (data) setPatients(data);
        } catch (error) {
            console.error("Error fetching patients:", error);
        }
    };

    const loadAppointments = async () => {
        setFetching(true);
        console.log("Starting calendar data load...");

        // Safety Timeout to prevent infinite loading
        const safetyTimer = setTimeout(() => {
            console.warn("Safety timeout: Calendar data took too long (>8s), forcing stop.");
            setFetching(false);
        }, 8000);

        try {
            const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString();
            const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString();

            const { data, error } = await supabase
                .from('appointments')
                .select(`
                *,
                caregiver:caregiver_id (
                    full_name
                )
            `)
                .or(`client_id.eq.${user.id},caregiver_id.eq.${user.id}`)
                .neq('type', 'Cuidado+') // EXCLUDE Cuidado+ for V1.0
                .gte('date', firstDay.split('T')[0])
                .lte('date', lastDay.split('T')[0]);
            // Removed .neq('status', 'cancelled') to show historical records

            if (error) throw error;

            if (data) {
                setAppointments(data.map(app => {
                    const [year, month, day] = app.date.split('-').map(Number);
                    return {
                        ...app,
                        date: day,
                        originalDate: app.date
                    };
                }));
            }
        } catch (error) {
            console.error("Error loading appointments:", error);
        } finally {
            clearTimeout(safetyTimer);
            setFetching(false);
        }
    };

    useEffect(() => {
        if (user) {
            loadAppointments();
            fetchPatients();
        }
    }, [user, currentDate]);

    const handleEditAppointment = async (appointment) => {
        let services = [];
        let cleanDetails = appointment.details || '';

        if (cleanDetails.includes('---SERVICES---')) {
            const parts = cleanDetails.split('---SERVICES---');
            try {
                services = JSON.parse(parts[1]);
            } catch (e) {
                console.warn("Failed to parse services");
            }
        }

        const now = new Date();
        const todayStr = now.toLocaleDateString('en-CA');
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`;
        const endTime = appointment.end_time || appointment.time;
        const isPast = appointment.originalDate < todayStr || (appointment.originalDate === todayStr && endTime < currentTime);
        const isHistorical = ['completed', 'paid', 'cancelled'].includes(appointment.status) || isPast;

        // If it's a Cuidado+ service, redirect to Wizard Step 2 (Programs)
        if (appointment.type === 'Cuidado+') {
            if (isHistorical) {
                alert("No se pueden editar citas pasadas, finalizadas o canceladas.");
                return;
            }
            setDualEditTarget(appointment);
            setShowDualEditModal(true);
            return;
        }

        if (isHistorical) {
            alert("No se pueden editar citas pasadas o finalizadas.");
            return;
        }

        setNewAppointment({
            title: appointment.title,
            date: appointment.originalDate, // Use original full date
            time: appointment.time,
            endTime: appointment.end_time || '',
            type: appointment.type,
            patient_id: appointment.patient_id || '',
            address: appointment.address || '',
            selectedServices: services
        });

        setEditingId(appointment.id);
        setSelectedDate(appointment.date); // Use the day number for background calendar context
        setShowModal(true);
        setDualEditTarget(null); // Reset target
    };

    const handleAddAppointment = async (e) => {
        e.preventDefault();
        if (!newAppointment.title || !newAppointment.date || !user) return;

        setSaving(true);
        try {
            // Use explicit date from state
            const dateStr = newAppointment.date;

            let formattedDetails = "";

            if (newAppointment.selectedServices.length > 0) {
                const allItems = SERVICE_CATEGORIES.flatMap(c => c.items);
                const selectedLabels = newAppointment.selectedServices
                    .map(id => allItems.find(i => i.id === id)?.label)
                    .filter(Boolean);

                formattedDetails += "[PLAN DE CUIDADO]\n" + selectedLabels.map(l => "• " + l).join("\n") + "\n\n";
                formattedDetails += "---SERVICES---" + JSON.stringify(newAppointment.selectedServices) + "---SERVICES---\n";
            }

            const payload = {
                title: newAppointment.title,
                date: dateStr,
                time: newAppointment.time,
                end_time: newAppointment.endTime || null,
                type: newAppointment.type,
                client_id: user.id,
                patient_id: newAppointment.patient_id || null,
                address: newAppointment.address || null,
                details: formattedDetails,
                status: 'pending'
            };

            if (editingId) {
                const { error } = await supabase
                    .from('appointments')
                    .update(payload)
                    .eq('id', editingId);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('appointments')
                    .insert([payload]);
                if (error) throw error;
            }

            setShowModal(false);
            setNewAppointment({ title: '', date: '', time: '', endTime: '', type: 'medical', patient_id: '', address: '', details: '', selectedServices: [] });
            setEditingId(null);
            await loadAppointments();
        } catch (error) {
            console.error("Error saving appointment:", error);
            alert(`Error: ${error.message}.`);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteAppointment = async (id) => {
        const appointment = appointments.find(a => a.id === id);
        setDeleteConfirm({ id, title: appointment?.title || 'esta cita' });
    };

    const confirmDelete = async (scope = 'single') => {
        const id = deleteConfirm.id;
        const appointment = appointments.find(a => a.id === id);
        const hasCaregiver = !!appointment?.caregiver_id;
        const serviceGroupId = appointment?.service_group_id;

        setDeleteConfirm(null);
        try {
            if (scope === 'group' && serviceGroupId) {
                // Delete the whole group
                const { error } = await supabase
                    .from('appointments')
                    .update({
                        status: 'cancelled',
                        modification_seen_by_caregiver: false,
                        is_modification: true
                    })
                    .eq('service_group_id', serviceGroupId);

                if (error) throw error;
                alert('Paquete de servicios cancelado correctamente.');
            } else {
                // Standard soft delete for single appointment
                const { error } = await supabase
                    .from('appointments')
                    .update({
                        status: 'cancelled',
                        modification_seen_by_caregiver: false,
                        is_modification: true
                    })
                    .eq('id', id);

                if (error) throw error;
                if (hasCaregiver) {
                    alert('Cita cancelada correctamente. El cuidador ha sido notificado.');
                } else {
                    alert('Cita cancelada correctamente.');
                }
            }

            await loadAppointments();
        } catch (error) {
            console.error("Error deleting appointment:", error);
            alert("Error al eliminar: " + error.message);
        }
    };

    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
    const emptyDays = Array(firstDayOfMonth).fill(null);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    // Calculate total weeks to determine row count
    const totalSlots = firstDayOfMonth + daysInMonth;
    const totalWeeks = Math.ceil(totalSlots / 7);

    // Map number of weeks to Tailwind grid-row classes
    const gridRowsClass = {
        4: 'grid-rows-4',
        5: 'grid-rows-5',
        6: 'grid-rows-6'
    }[totalWeeks] || 'grid-rows-5';

    const getEventColor = (event) => {
        const now = new Date();
        const todayStr = now.toLocaleDateString('en-CA');
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`;

        const statusColors = {
            'confirmed': 'bg-green-100 text-green-700 border-green-200 font-bold',
            'cancelled': 'bg-gray-100 text-gray-400 border-gray-100 opacity-60 italic line-through',
            'completed': 'bg-slate-100 text-slate-400 border-slate-100 opacity-60',
            'paid': 'bg-slate-100 text-slate-400 border-slate-200 opacity-60'
        };

        if (statusColors[event.status]) {
            if (['cancelled', 'completed', 'paid'].includes(event.status)) return statusColors[event.status];
        }

        const isPastDate = event.originalDate < todayStr;
        const endTime = event.end_time || event.time;
        const isPastTime = event.originalDate === todayStr && endTime < currentTime;

        // Visual priority: Block only if the END TIME has passed (today or before)
        if (isPastDate || isPastTime) {
            return 'bg-gray-100 text-gray-400 border-gray-100 opacity-50 italic';
        }

        // Catch-all for other non-past confirmed/pending
        if (event.status === 'confirmed') return statusColors.confirmed;
        return 'bg-blue-100 text-blue-700 border-blue-200 font-medium';
    };

    const openModal = (day = null) => {
        let initialDate = '';
        if (day) {
            setSelectedDate(day);
            // Construct date string YYYY-MM-DD from current month/year and selected day
            const y = currentDate.getFullYear();
            const m = String(currentDate.getMonth() + 1).padStart(2, '0');
            const d = String(day).padStart(2, '0');
            initialDate = `${y}-${m}-${d}`;
        } else {
            // If no day selected (New Appointment button), default to Today
            const now = new Date();
            const y = now.getFullYear();
            const m = String(now.getMonth() + 1).padStart(2, '0');
            const d = String(now.getDate()).padStart(2, '0');
            initialDate = `${y}-${m}-${d}`;
        }

        setNewAppointment(prev => ({ ...prev, date: initialDate }));
        setShowModal(true);
    };

    const [showMonthSelector, setShowMonthSelector] = useState(false);
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    const handleMonthSelect = (monthIndex) => {
        setCurrentDate(new Date(currentDate.getFullYear(), monthIndex, 1));
        setShowMonthSelector(false);
        setSelectedDate(null);
    };

    const [yearStats, setYearStats] = useState({});

    const fetchYearStats = async () => {
        if (!user) return;
        try {
            const startOfYear = `${currentDate.getFullYear()}-01-01`;
            const endOfYear = `${currentDate.getFullYear()}-12-31`;

            const { data, error } = await supabase
                .from('appointments')
                .select('date, status')
                .or(`client_id.eq.${user.id},caregiver_id.eq.${user.id}`)
                .gte('date', startOfYear)
                .lte('date', endOfYear)
                .neq('status', 'cancelled')
                .neq('type', 'Cuidado+'); // Exclude cancelled AND Cuidado+ from stats

            if (error) throw error;

            const stats = {};
            // Get local date string YYYY-MM-DD for accurate comparison (ignoring time)
            const todayVal = new Date().toLocaleDateString('en-CA');

            data.forEach(app => {
                const month = parseInt(app.date.split('-')[1]) - 1; // 0-indexed
                if (!stats[month]) stats[month] = { count: 0, hasUpcoming: false };
                stats[month].count++;

                // Check if upcoming (future date and confirmed/pending/in_progress) using string comparison
                if (app.date >= todayVal && (app.status === 'confirmed' || app.status === 'pending' || app.status === 'in_progress')) {
                    stats[month].hasUpcoming = true;
                }
            });
            setYearStats(stats);
        } catch (error) {
            console.error("Error fetching year stats:", error);
        }
    };

    useEffect(() => {
        if (user) {
            fetchYearStats();
        }
    }, [user, currentDate.getFullYear()]); // Refetch when year changes

    return (
        <div translate="no" className="flex bg-white rounded-[16px] shadow-sm border border-gray-200 h-[calc(100vh-140px)] overflow-hidden relative">
            <div className="flex-grow flex flex-col p-6 overflow-hidden">
                <div className="flex justify-between items-end mb-4 shrink-0">
                    <div className="flex flex-col">
                        <div className="flex items-baseline justify-start gap-4 mb-2 w-full">
                            <span className="text-8xl font-black !text-[#2FAE8F] tracking-tighter leading-none drop-shadow-sm">
                                {currentDate.getFullYear()}
                            </span>
                            <h2 className="text-3xl font-bold text-gray-400 tracking-tight">
                                Agenda tu cita
                            </h2>
                        </div>
                        <div className="flex items-center justify-start mt-1 px-1 relative">
                            <div className="relative">
                                <button
                                    onClick={() => setShowMonthSelector(!showMonthSelector)}
                                    className="text-3xl font-black text-gray-800 uppercase tracking-[0.15em] text-center hover:text-blue-600 transition-colors flex items-center justify-center gap-2 group w-full px-4"
                                >
                                    {months[currentDate.getMonth()]}
                                    <ChevronRight size={20} className={`transform transition-transform ${showMonthSelector ? 'rotate-90' : 'rotate-0'} text-gray-400 group-hover:text-blue-600`} />
                                </button>

                                {showMonthSelector && (
                                    <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-[16px] shadow-2xl border border-gray-100 z-50 overflow-hidden animate-fade-in">
                                        <div className="grid grid-cols-1 max-h-[300px] overflow-y-auto custom-scrollbar">
                                            {months.map((month, idx) => (
                                                <button
                                                    key={month}
                                                    onClick={() => handleMonthSelect(idx)}
                                                    className={`px-4 py-3 text-left font-bold text-sm tracking-wide transition-colors flex justify-between items-center ${currentDate.getMonth() === idx ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'}`}
                                                >
                                                    {month.toUpperCase()}
                                                    {yearStats[idx] && (
                                                        <div className="flex items-center gap-1">
                                                            {yearStats[idx].hasUpcoming && (
                                                                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" title="Citas programadas"></span>
                                                            )}
                                                            {!yearStats[idx].hasUpcoming && (
                                                                <span className="w-2 h-2 rounded-full bg-gray-300" title="Citas pasadas"></span>
                                                            )}
                                                        </div>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3 pb-2">
                        {/* {can('useSmartWizard') && (
                            <button
                                onClick={() => setShowWizard(true)}
                                className="flex items-center gap-3 bg-[var(--primary-color)] !text-[#FAFAF7] px-8 py-4 rounded-[22px] text-[11px] font-black uppercase tracking-widest hover:scale-[1.05] transition-all shadow-xl shadow-blue-900/10 border-none group"
                            >
                                <Activity size={18} className="animate-pulse group-hover:rotate-12" />
                                ASISTENTE INTELIGENTE
                            </button>
                        )} */}
                        <button
                            onClick={() => setShowModal(true)}
                            className="flex items-center gap-3 bg-white text-[var(--primary-color)] px-8 py-4 rounded-[22px] text-[11px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all shadow-lg border-2 border-slate-100"
                        >
                            <Plus size={18} /> NUEVA CITA
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-7 mb-2 text-center text-gray-500 font-medium shrink-0">
                    {['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'].map(day => (
                        <div key={day} className="py-1">{day}</div>
                    ))}
                </div>

                <div className={`grid grid-cols-7 ${gridRowsClass} gap-2 bg-gray-50 p-2 rounded-[16px] border border-gray-200 overflow-y-scroll relative h-full min-h-0`}>
                    {fetching && (
                        <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center z-20">
                            <Loader2 className="animate-spin text-blue-600" size={40} />
                        </div>
                    )}
                    {emptyDays.map((_, index) => (<div key={`empty-${index}`} className="opacity-0"></div>))}
                    {days.map(day => {
                        const dayEvents = appointments.filter(a => a.date === day && a.type !== 'Cuidado+');
                        const isSelected = selectedDate === day;
                        const hasCuidadoPlus = dayEvents.some(e => e.type === 'Cuidado+');
                        return (
                            <div
                                key={day}
                                onClick={() => setSelectedDate(day)}
                                className={`bg-white rounded-[16px] p-2 border transition-all cursor-pointer h-full min-h-0 flex flex-col gap-1 relative overflow-hidden ${isSelected ? 'border-blue-600 ring-2 ring-blue-100' : 'border-gray-200 hover:border-gray-300'} ${hasCuidadoPlus ? '!bg-emerald-50/20' : ''}`}
                            >
                                {hasCuidadoPlus && (
                                    <div className="absolute top-0 left-0 w-full h-1.5 bg-[var(--secondary-color)] opacity-80 z-10" />
                                )}
                                <div className="flex justify-between items-start relative z-10 shrink-0">
                                    <span className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-semibold mb-1 ${isSelected ? 'bg-blue-600 !text-[#FAFAF7]' : 'text-gray-700'}`}>
                                        {day}
                                    </span>
                                    <button onClick={(e) => { e.stopPropagation(); openModal(day); }} className="text-gray-300 hover:text-blue-600 group-hover:opacity-100 transition-opacity"><Plus size={16} /></button>
                                </div>
                                <div className="flex-1 overflow-y-auto no-scrollbar space-y-0.5">
                                    {dayEvents.map(event => (
                                        <div
                                            key={event.id}
                                            onClick={(e) => {
                                                if (event.type === 'Cuidado+') {
                                                    // Check historical/status
                                                    const now = new Date();
                                                    const todayStr = now.toLocaleDateString('en-CA');
                                                    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`;
                                                    const endTime = event.end_time || event.time;
                                                    const isPast = event.originalDate < todayStr || (event.originalDate === todayStr && endTime < currentTime);
                                                    const isHistorical = ['completed', 'paid', 'cancelled'].includes(event.status) || isPast;

                                                    if (isHistorical) {
                                                        // Let it bubble to the day cell onClick, which opens the Side Panel (Detalles del Día)
                                                        // The Side Panel handles the read-only view with Lock icons.
                                                        return;
                                                    }

                                                    e.stopPropagation();
                                                    setDualEditTarget(event);
                                                    setShowDualEditModal(true);
                                                }
                                            }}
                                            className={`text-[10px] p-1 rounded border mb-0.5 truncate flex justify-between items-center group/dayevent ${getEventColor(event)} ${event.type === 'Cuidado+' ? '!bg-[var(--secondary-color)] !text-white !border-transparent font-black uppercase tracking-tighter cursor-pointer hover:brightness-110' : ''} ${event.caregiver_id && event.type !== 'Cuidado+' ? '!border-green-200 !bg-green-50/50' : ''}`}
                                        >
                                            <span className={`truncate flex-1 min-w-0 ${event.caregiver_id ? 'font-bold' : ''}`}>{event.time?.substring(0, 5)} - {event.title}</span>
                                            {(event.caregiver_id || event.type === 'Cuidado+') && (
                                                event.type === 'Cuidado+' ? <ShieldCheck size={10} className="ml-1 shrink-0" /> : <User size={10} className="ml-1 text-green-600 shrink-0" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className={`w-80 border-l border-gray-200 bg-gray-50 p-6 flex flex-col transition-all duration-300 absolute top-0 right-0 h-full z-20 shadow-2xl lg:static lg:h-auto lg:shadow-none ${selectedDate ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg text-gray-800">Detalles del Día</h3>
                    <button onClick={() => setSelectedDate(null)} className="text-gray-400 hover:text-gray-600">×</button>
                </div>
                {selectedDate && (
                    <div className="space-y-4">
                        <div className="text-4xl font-light text-blue-600 mb-4">
                            {selectedDate} <span className="text-base text-gray-500 font-normal">de {months[currentDate.getMonth()]}</span>
                        </div>
                        {appointments.filter(a => a.date === selectedDate && a.type !== 'Cuidado+').length > 0 ? (
                            <>
                                <button onClick={() => openModal(selectedDate)} className="w-full mb-4 py-2 border border-dashed border-blue-600 text-blue-600 rounded-[16px] font-medium hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"><Plus size={16} /> Agregar otra cita</button>
                                {appointments.filter(a => a.date === selectedDate && a.type !== 'Cuidado+').map(event => {
                                    const now = new Date();
                                    const todayStr = now.toLocaleDateString('en-CA');
                                    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`;
                                    const isPastDate = event.originalDate < todayStr;
                                    const endTime = event.end_time || event.time;
                                    const isPastTime = event.originalDate === todayStr && endTime < currentTime;

                                    // General Rule: Past if END TIME reached (today or before)
                                    const isActuallyPast = isPastDate || isPastTime;
                                    const isGray = ['completed', 'paid', 'cancelled'].includes(event.status) || isActuallyPast;
                                    return (
                                        <div key={event.id} className={`p-4 rounded-[16px] shadow-sm border relative group/event ${isGray ? 'bg-gray-50 border-gray-200 opacity-60' : 'bg-white border-gray-100'} ${event.status === 'cancelled' ? 'line-through' : ''}`}>
                                            <div className="flex gap-1 absolute top-2 right-2">
                                                {(() => {
                                                    return !isGray && !isActuallyPast ? (
                                                        <>
                                                            <button onClick={() => handleEditAppointment(event)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-[16px]"><Edit2 size={16} /></button>
                                                            <button onClick={() => handleDeleteAppointment(event.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-[16px]"><Trash2 size={16} /></button>
                                                        </>
                                                    ) : isActuallyPast ? (
                                                        <span className="p-1.5 text-gray-300" title="Registro histórico no editable"><Lock size={16} /></span>
                                                    ) : (
                                                        <button onClick={() => handleDeleteAppointment(event.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-[16px]"><Trash2 size={16} /></button>
                                                    );
                                                })()}
                                            </div>
                                            <h4 className={`font-bold mb-1 pr-8 ${isGray ? 'text-gray-500' : 'text-gray-800'}`}>{event.title} {event.status === 'cancelled' ? '(Cancelada)' : isActuallyPast ? '(Finalizada)' : ''}</h4>
                                            <div className="text-sm text-gray-600 flex items-center gap-2"><Clock size={14} /> {event.time} {event.end_time ? `- ${event.end_time.substring(0, 5)}` : ''}</div>

                                            <div className={`mt-3 p-3 rounded-[12px] flex items-center gap-3 border ${event.caregiver_id ? 'bg-green-50 border-green-100 text-green-700' : 'bg-amber-50 border-amber-100 text-amber-700'}`}>
                                                <div className={`p-2 rounded-full ${event.caregiver_id ? 'bg-green-500' : 'bg-amber-500'} text-white`}>
                                                    <User size={14} />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-[10px] uppercase font-black tracking-widest opacity-60">Cuidador</p>
                                                    <p className="text-xs font-bold">{event.caregiver?.full_name || 'Sin asignar'}</p>
                                                </div>
                                                {!event.caregiver_id && <Info size={14} className="opacity-40" />}
                                            </div>

                                            {(() => {
                                                // Using the same variables defined above (isGray, isActuallyPast) 
                                                // which are already in scope from the parent map.
                                                return (
                                                    <>
                                                        {!isGray && !isActuallyPast && (
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedAgendaId(event.id);
                                                                    setCurrentCareAgenda(event.care_agenda || []);
                                                                    setShowAgendaModal(true);
                                                                }}
                                                                className={`w-full mt-3 py-2 ${can('manualAgendaUpdate') ? 'bg-[var(--secondary-color)]/10 text-[var(--secondary-color)]' : 'bg-gray-100 text-gray-500'} rounded-[12px] text-[10px] font-black uppercase tracking-widest hover:bg-[var(--secondary-color)]/20 flex items-center justify-center gap-2 border border-[var(--secondary-color)]/20 transition-all font-primary`}
                                                            >
                                                                {can('manualAgendaUpdate') ? <Settings size={14} /> : <Lock size={14} />} Configurar Agenda BC PULSO
                                                            </button>
                                                        )}
                                                        {isActuallyPast && (
                                                            <div className="mt-3 py-2 bg-gray-100 text-gray-400 rounded-[12px] text-[9px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 border border-gray-200">
                                                                <Lock size={12} /> Registro Histórico (No editable)
                                                            </div>
                                                        )}
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    );
                                })}
                            </>
                        ) : (
                            <div className="text-center py-10 text-gray-400">
                                <p>No hay citas programadas.</p>
                                <button onClick={() => openModal(selectedDate)} className="mt-4 text-blue-600 font-medium hover:underline">+ Agregar Cita</button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] px-4 overflow-y-auto p-4">
                    <div className="bg-white rounded-[16px] shadow-2xl w-full max-w-4xl flex flex-col animate-slide-up border border-white/20 overflow-hidden">
                        <div className="p-10 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h3 className="text-3xl font-black text-gray-800 tracking-tight">{editingId ? 'Editar Cita' : 'Nueva Cita'}</h3>
                                <p className="text-sm text-gray-500 font-medium mt-1">Configura los detalles del servicio</p>
                            </div>
                            <button onClick={() => { setShowModal(false); setEditingId(null); setNewAppointment({ title: '', date: '', time: '', endTime: '', type: 'medical', patient_id: '', selectedServices: [] }); }} className="p-3 bg-gray-100 text-gray-500 rounded-[16px]"><X size={24} /></button>
                        </div>

                        <form onSubmit={handleAddAppointment} className="flex flex-col md:flex-row divide-x divide-gray-100">
                            <div className="flex-1 p-10 space-y-8">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-1">Título</label>
                                        <input type="text" required className="w-full px-6 py-4 rounded-[16px] border-2 border-gray-100 font-bold" value={newAppointment.title} onChange={e => setNewAppointment({ ...newAppointment, title: e.target.value })} />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-1">Fecha</label>
                                            <input type="date" required className="w-full px-6 py-4 rounded-[16px] border-2 border-gray-100 font-bold" value={newAppointment.date} onChange={e => setNewAppointment({ ...newAppointment, date: e.target.value })} />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-1">Inicio</label>
                                                <input type="time" required className="w-full px-6 py-4 rounded-[16px] border-2 border-gray-100 font-bold" value={newAppointment.time} onChange={e => setNewAppointment({ ...newAppointment, time: e.target.value })} />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-1">Fin</label>
                                                <input type="time" className="w-full px-6 py-4 rounded-[16px] border-2 border-gray-100 font-bold" value={newAppointment.endTime || ''} onChange={e => setNewAppointment({ ...newAppointment, endTime: e.target.value })} />
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-1">Persona a Cuidar</label>
                                        <select required className="w-full px-6 py-4 rounded-[16px] border-2 border-gray-100 font-bold appearance-none" value={newAppointment.patient_id || ''} onChange={e => setNewAppointment({ ...newAppointment, patient_id: e.target.value })}>
                                            <option value="">Seleccionar familiar...</option>
                                            {patients.map(p => (<option key={p.id} value={p.id}>{p.full_name}</option>))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-1">Dirección del servicio</label>
                                        <div className="relative">
                                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                            <input
                                                type="text"
                                                className="w-full pl-12 pr-6 py-4 rounded-[16px] border-2 border-gray-100 font-bold"
                                                placeholder="Ej. Av. Siempre Viva 123"
                                                value={newAppointment.address}
                                                onChange={e => setNewAppointment({ ...newAppointment, address: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                </div>
                                <button type="submit" disabled={saving} className="w-full bg-slate-900 !text-[#FAFAF7] py-5 rounded-[16px] font-black text-lg shadow-xl hover:bg-slate-800 flex items-center justify-center gap-3">
                                    {saving ? <Loader2 className="animate-spin" size={24} /> : (editingId ? 'Guardar Cambios' : 'Agendar Cita')}
                                </button>
                            </div>
                            <div className="flex-1 p-10 bg-gray-50/30">
                                <h4 className="text-xs font-black text-blue-600 uppercase mb-6">Explorador de Servicios ({newAppointment.selectedServices.length})</h4>
                                <ServiceSelector selectedServices={newAppointment.selectedServices} onChange={(services) => setNewAppointment({ ...newAppointment, selectedServices: services })} />
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[110]">
                    <div className="bg-white rounded-[16px] p-10 max-w-lg text-center">
                        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 size={32} /></div>
                        <h3 className="text-xl font-bold mb-2">¿Eliminar {deleteConfirm.title}?</h3>
                        <p className="text-gray-500 mb-8 font-medium">Esta acción marcará el servicio como cancelado.</p>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => confirmDelete('single')}
                                className="w-full py-4 bg-gray-100 rounded-[16px] font-bold text-gray-700 hover:bg-gray-200 transition-colors"
                            >
                                ELIMINAR SOLO ESTA CITA
                            </button>

                            {appointments.find(a => a.id === deleteConfirm.id)?.service_group_id && (
                                <button
                                    onClick={() => confirmDelete('group')}
                                    className="w-full py-4 bg-red-600 !text-white rounded-[16px] font-bold shadow-lg hover:bg-red-700 transition-colors"
                                >
                                    ELIMINAR TODO EL PAQUETE
                                </button>
                            )}

                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="w-full py-4 text-xs font-black uppercase tracking-widest text-gray-400 mt-2"
                            >
                                CANCELAR
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ConfigureAgendaModal
                isOpen={showAgendaModal}
                onClose={() => setShowAgendaModal(false)}
                appointmentId={selectedAgendaId}
                currentAgenda={currentCareAgenda}
                onSave={(newAgenda) => {
                    loadAppointments(); // Refresh to get the update
                    setShowAgendaModal(false);
                }}
            />

            <CreateServiceWizard
                isOpen={showWizard}
                onClose={() => { setShowWizard(false); setWizardInitialData(null); setWizardIsRestricted(false); setWizardInitialStep(1); }}
                onComplete={handleWizardComplete}
                patients={patients}
                initialData={wizardInitialData}
                isSaving={saving}
                isRestricted={wizardIsRestricted}
                initialStep={wizardInitialStep}
            />

            {/* Dual Edit Selection Modal */}
            {showDualEditModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[10000] px-4">
                    <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-lg overflow-hidden animate-scale-up border-8 border-emerald-50 min-h-[500px] flex flex-col items-center justify-center">
                        <div className="p-10 text-center">
                            <div className="w-20 h-20 bg-emerald-50 text-[var(--secondary-color)] rounded-[24px] flex items-center justify-center mx-auto mb-6">
                                <Activity size={40} className="animate-pulse" />
                            </div>
                            <h3 className="text-3xl font-brand font-bold text-[var(--primary-color)] mb-3">Gestión Cuidado+</h3>
                            <p className="text-sm text-[var(--text-light)] font-secondary leading-relaxed mb-10 px-4">
                                Este día es parte de un plan especializado. ¿Qué deseas modificar?
                            </p>

                            <div className="grid gap-4">
                                <button
                                    onClick={async () => {
                                        setShowDualEditModal(false);
                                        const event = dualEditTarget;
                                        setEditingId(event.id);
                                        // Trigger Restricted Wizard logic instead of Modal
                                        try {
                                            // Parse existing details
                                            const detailsParts = event.details?.split('---SERVICES---');
                                            const programNamesStr = detailsParts?.[0]?.replace('Cuidado Especializado: ', '').trim();
                                            const agendaJson = detailsParts?.[1];
                                            const programNames = programNamesStr ? programNamesStr.split(' + ') : [];
                                            let parsedAgenda = [];
                                            try {
                                                parsedAgenda = agendaJson ? JSON.parse(agendaJson) : [];
                                            } catch (e) {
                                                console.error("Error parsing agenda:", e);
                                            }

                                            // Fetch Programs
                                            const { data: allPrograms } = await supabase.from('care_programs').select('*');
                                            const selectedPrograms = allPrograms?.filter(p => programNames.includes(p.name)) || [];

                                            setWizardInitialData({
                                                customTitle: event.title?.split(': ')[1] || event.title,
                                                startDate: event.date,
                                                endDate: event.date,
                                                startTime: event.time,
                                                endTime: event.end_time || '',
                                                patient_id: event.patient_id || '',
                                                address: event.address || '',
                                                selectedPrograms: selectedPrograms,
                                                agendaItems: parsedAgenda,
                                                service_group_id: event.service_group_id
                                            });
                                            setWizardIsRestricted(true);
                                            setWizardInitialStep(2);
                                            setShowWizard(true);
                                        } catch (error) {
                                            console.error("Error preparing single edit:", error);
                                            alert("Error al cargar editor.");
                                        }
                                    }}
                                    className="w-full py-6 rounded-[24px] bg-white border-2 border-gray-100 font-brand font-bold text-[var(--primary-color)] hover:border-[var(--secondary-color)] hover:bg-emerald-50 transition-all flex items-center justify-center gap-3 group"
                                >
                                    <Clock size={20} className="text-gray-400 group-hover:text-[var(--secondary-color)]" />
                                    <span>EDITAR SOLO HOY (ASISTENTE)</span>
                                </button>

                                <button
                                    onClick={() => {
                                        setShowDualEditModal(false);
                                        const event = dualEditTarget;
                                        setDualEditTarget(null);
                                        handleEditGroup(event, 2);
                                    }}
                                    className="w-full py-6 rounded-[24px] bg-[var(--primary-color)] !text-white font-brand font-bold hover:scale-[1.02] transition-all flex items-center justify-center gap-3 shadow-xl"
                                >
                                    <Settings size={20} />
                                    <span>EDITAR TODO EL SERVICIO</span>
                                </button>
                            </div>

                            <button
                                onClick={() => {
                                    setShowDualEditModal(false);
                                    setDualEditTarget(null);
                                }}
                                className="mt-8 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-red-500 transition-colors"
                            >
                                CANCELAR
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CalendarPage;
