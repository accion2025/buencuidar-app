import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, MapPin, Clock, User, X, Loader2, CheckCircle, Trash2, Edit2, Info, BookOpen, Briefcase, Star, Lock, Settings } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ServiceSelector, { SERVICE_CATEGORIES } from '../../components/dashboard/ServiceSelector';
import ConfigureAgendaModal from '../../components/dashboard/ConfigureAgendaModal';

const CalendarPage = () => {
    const { user, profile } = useAuth();
    const navigate = useNavigate();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);
    const [showModal, setShowModal] = useState(false);

    // Agenda Modal States
    const [showAgendaModal, setShowAgendaModal] = useState(false);
    const [selectedAgendaId, setSelectedAgendaId] = useState(null);
    const [currentCareAgenda, setCurrentCareAgenda] = useState([]);

    // Subscription Check
    const isSubscribed = profile?.subscription_status === 'active';

    const [appointments, setAppointments] = useState([]);
    const [fetching, setFetching] = useState(true);
    const [saving, setSaving] = useState(false);
    const [patients, setPatients] = useState([]);

    const [newAppointment, setNewAppointment] = useState({
        title: '',
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
                .gte('date', firstDay.split('T')[0])
                .lte('date', lastDay.split('T')[0])
                .neq('status', 'cancelled');

            if (error) throw error;

            setAppointments(data.map(app => {
                const [year, month, day] = app.date.split('-').map(Number);
                return {
                    ...app,
                    date: day,
                    originalDate: app.date
                };
            }));
        } catch (error) {
            console.error("Error loading appointments:", error);
        } finally {
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

        setNewAppointment({
            title: appointment.title,
            time: appointment.time,
            endTime: appointment.end_time || '',
            type: appointment.type,
            patient_id: appointment.patient_id || '',
            address: appointment.address || '',
            selectedServices: services
        });

        setEditingId(appointment.id);
        setSelectedDate(appointment.calendar_date_day || appointment.date);
        setShowModal(true);
    };

    const handleAddAppointment = async (e) => {
        e.preventDefault();
        if (!newAppointment.title || !selectedDate || !user) return;

        setSaving(true);
        try {
            const y = currentDate.getFullYear();
            const m = String(currentDate.getMonth() + 1).padStart(2, '0');
            const d = String(selectedDate).padStart(2, '0');
            const dateStr = `${y}-${m}-${d}`;

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
            setNewAppointment({ title: '', time: '', endTime: '', type: 'medical', patient_id: '', address: '', details: '', selectedServices: [] });
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

    const confirmDelete = async () => {
        const id = deleteConfirm.id;
        const appointment = appointments.find(a => a.id === id);
        const hasCaregiver = !!appointment?.caregiver_id;

        setDeleteConfirm(null);
        try {
            // ALWAYS perform soft delete: Change status to cancelled so it stays in history
            const { error } = await supabase
                .from('appointments')
                .update({
                    status: 'cancelled',
                    modification_seen_by_caregiver: false,
                    is_modification: true // Mark for UI highlight
                })
                .eq('id', id);

            if (error) throw error;

            if (hasCaregiver) {
                alert('Cita cancelada correctamente. El cuidador ha sido notificado.');
            } else {
                alert('Cita cancelada correctamente. Se ha movido a tu historial.');
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

    const getEventColor = (event) => {
        const now = new Date();
        const todayStr = now.toLocaleDateString('en-CA');
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`;

        // Case 1: Status based (historical/cancelled)
        if (['completed', 'paid', 'cancelled'].includes(event.status)) {
            return 'bg-gray-100 text-gray-400 border-gray-200 opacity-60 italic';
        }

        // Case 2: Past dates (Strictly before today)
        if (event.originalDate < todayStr) {
            return 'bg-slate-50 text-slate-400 border-slate-200 opacity-70';
        }

        // Case 3: Expired Today (Today but past time) -> Requirement 2
        if (event.originalDate === todayStr && event.time < currentTime) {
            return 'bg-slate-50 text-slate-400 border-slate-200 opacity-70';
        }

        // Case 4: Confirmed (Active)
        if (event.status === 'confirmed') {
            return 'bg-green-100 text-green-700 border-green-200 font-bold';
        }

        // Default: Pending/Future
        return 'bg-blue-100 text-blue-700 border-blue-200 font-medium';
    };

    const openModal = (date = null) => {
        if (date) setSelectedDate(date);
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
                .neq('status', 'cancelled'); // Exclude cancelled from stats

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
                <div className="flex justify-between items-end mb-8">
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
                </div>

                <div className="grid grid-cols-7 mb-2 text-center text-gray-500 font-medium">
                    {['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'].map(day => (
                        <div key={day} className="py-2">{day}</div>
                    ))}
                </div>

                <div className="grid grid-cols-7 flex-grow auto-rows-fr gap-2 bg-gray-50 p-2 rounded-[16px] border border-gray-200 overflow-y-auto relative">
                    {fetching && (
                        <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center z-20">
                            <Loader2 className="animate-spin text-blue-600" size={40} />
                        </div>
                    )}
                    {emptyDays.map((_, index) => (<div key={`empty-${index}`} className="opacity-0"></div>))}
                    {days.map(day => {
                        const dayEvents = appointments.filter(a => a.date === day);
                        const isSelected = selectedDate === day;
                        return (
                            <div
                                key={day}
                                onClick={() => setSelectedDate(day)}
                                className={`bg-white rounded-[16px] p-2 border transition-all cursor-pointer min-h-[100px] flex flex-col gap-1 ${isSelected ? 'border-blue-600 ring-2 ring-blue-100' : 'border-gray-200 hover:border-gray-300'}`}
                            >
                                <div className="flex justify-between items-start">
                                    <span className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-semibold mb-1 ${isSelected ? 'bg-blue-600 !text-[#FAFAF7]' : 'text-gray-700'}`}>
                                        {day}
                                    </span>
                                    <button onClick={(e) => { e.stopPropagation(); openModal(day); }} className="text-gray-300 hover:text-blue-600 group-hover:opacity-100 transition-opacity"><Plus size={16} /></button>
                                </div>
                                {dayEvents.map(event => (
                                    <div key={event.id} className={`text-[10px] p-1 rounded border mb-0.5 truncate flex justify-between items-center group/dayevent ${getEventColor(event)} ${event.caregiver_id ? '!border-green-200 !bg-green-50/50' : ''}`}>
                                        <span className={`truncate flex-1 ${event.caregiver_id ? 'text-green-800 font-bold' : ''}`}>{event.time} - {event.title}</span>
                                        {event.caregiver_id && <User size={10} className="ml-1 text-green-600 shrink-0" />}
                                    </div>
                                ))}
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
                        {appointments.filter(a => a.date === selectedDate).length > 0 ? (
                            <>
                                <button onClick={() => openModal(selectedDate)} className="w-full mb-4 py-2 border border-dashed border-blue-600 text-blue-600 rounded-[16px] font-medium hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"><Plus size={16} /> Agregar otra cita</button>
                                {appointments.filter(a => a.date === selectedDate).map(event => {
                                    const isGray = ['completed', 'paid', 'cancelled'].includes(event.status);
                                    return (
                                        <div key={event.id} className={`p-4 rounded-[16px] shadow-sm border relative group/event ${isGray ? 'bg-gray-50 border-gray-200 opacity-60' : 'bg-white border-gray-100'}`}>
                                            <div className="flex gap-1 absolute top-2 right-2">
                                                {(() => {
                                                    const now = new Date();
                                                    const todayStr = now.toLocaleDateString('en-CA');
                                                    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`;
                                                    const isPast = event.originalDate < todayStr || (event.originalDate === todayStr && event.time < currentTime);

                                                    return !isGray && !isPast ? (
                                                        <>
                                                            <button onClick={() => handleEditAppointment(event)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-[16px]"><Edit2 size={16} /></button>
                                                            <button onClick={() => handleDeleteAppointment(event.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-[16px]"><Trash2 size={16} /></button>
                                                        </>
                                                    ) : isPast ? (
                                                        <span className="p-1.5 text-gray-300" title="Registro histórico no editable"><Lock size={16} /></span>
                                                    ) : (
                                                        <button onClick={() => handleDeleteAppointment(event.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-[16px]"><Trash2 size={16} /></button>
                                                    );
                                                })()}
                                            </div>
                                            <h4 className={`font-bold mb-1 pr-8 ${isGray ? 'text-gray-500' : 'text-gray-800'}`}>{event.title} {isGray && `(${event.status === 'cancelled' ? 'Cancelada' : 'Finalizada'})`}</h4>
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
                                                const now = new Date();
                                                const todayStr = now.toLocaleDateString('en-CA');
                                                const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`;
                                                const isPast = event.originalDate < todayStr || (event.originalDate === todayStr && event.time < currentTime);

                                                return (
                                                    <>
                                                        {!isGray && !isPast && (
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedAgendaId(event.id);
                                                                    setCurrentCareAgenda(event.care_agenda || []);
                                                                    setShowAgendaModal(true);
                                                                }}
                                                                className="w-full mt-3 py-2 bg-[var(--secondary-color)]/10 text-[var(--secondary-color)] rounded-[12px] text-[10px] font-black uppercase tracking-widest hover:bg-[var(--secondary-color)]/20 flex items-center justify-center gap-2 border border-[var(--secondary-color)]/20 transition-all font-primary"
                                                            >
                                                                <Settings size={14} /> Configurar Agenda BC PULSO
                                                            </button>
                                                        )}
                                                        {isPast && (
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
                                <p className="text-sm text-gray-500 font-medium mt-1">Servicio para el {selectedDate} de {months[currentDate.getMonth()]}</p>
                            </div>
                            <button onClick={() => { setShowModal(false); setEditingId(null); setNewAppointment({ title: '', time: '', endTime: '', type: 'medical', patient_id: '', selectedServices: [] }); }} className="p-3 bg-gray-100 text-gray-500 rounded-[16px]"><X size={24} /></button>
                        </div>

                        <form onSubmit={handleAddAppointment} className="flex flex-col md:flex-row divide-x divide-gray-100">
                            <div className="flex-1 p-10 space-y-8">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-1">Título</label>
                                        <input type="text" required className="w-full px-6 py-4 rounded-[16px] border-2 border-gray-100 font-bold" value={newAppointment.title} onChange={e => setNewAppointment({ ...newAppointment, title: e.target.value })} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-1">Inicio</label>
                                            <input type="time" required className="w-full px-6 py-4 rounded-[16px] border-2 border-gray-100 font-bold" value={newAppointment.time} onChange={e => setNewAppointment({ ...newAppointment, time: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-1">Fin</label>
                                            <input type="time" className="w-full px-6 py-4 rounded-[16px] border-2 border-gray-100 font-bold" value={newAppointment.endTime || ''} onChange={e => setNewAppointment({ ...newAppointment, endTime: e.target.value })} />
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
                    <div className="bg-white rounded-[16px] p-10 max-w-sm text-center">
                        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 size={32} /></div>
                        <h3 className="text-xl font-bold mb-2">¿Eliminar cita?</h3>
                        <p className="text-gray-500 mb-8 font-medium">Esta acción no se puede deshacer.</p>
                        <div className="flex gap-4">
                            <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-3 bg-gray-100 rounded-[16px] font-bold">No</button>
                            <button onClick={confirmDelete} className="flex-1 py-3 bg-red-600 !text-[#FAFAF7] rounded-[16px] font-bold">Sí, eliminar</button>
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
        </div>
    );
};

export default CalendarPage;
