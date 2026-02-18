import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, CheckCircle, AlertCircle, Loader2, Layers, ChevronRight, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { translateAppointmentType } from '../../utils/translations';

import ShiftDetailsModal from '../../components/dashboard/ShiftDetailsModal';
import ServiceGroupModal from '../../components/dashboard/ServiceGroupModal';

const MyShifts = () => {
    const { user } = useAuth();
    const [shifts, setShifts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedShift, setSelectedShift] = useState(null);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming', 'completed', 'cancelled'
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [lastGroup, setLastGroup] = useState(null); // To return to calendar after closing details

    const cleanupExpiredShifts = async () => {
        try {
            const now = new Date();
            const todayStr = now.toLocaleDateString('en-CA');
            const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`;

            // Confirmed shifts that were not started by their END TIME
            const { data: maybePastShifts, error: fetchError } = await supabase
                .from('appointments')
                .select('id, date, time, end_time')
                .eq('caregiver_id', user.id)
                .eq('status', 'confirmed')
                .lte('date', todayStr);

            if (fetchError) throw fetchError;

            const expiredShifts = (maybePastShifts || []).filter(s => {
                if (s.date < todayStr) return true;
                const endTime = s.end_time || s.time;
                return endTime < currentTime;
            });

            if (fetchError) throw fetchError;

            if (expiredShifts && expiredShifts.length > 0) {
                const ids = expiredShifts.map(s => s.id);
                const { error: updateError } = await supabase
                    .from('appointments')
                    .update({ status: 'cancelled' })
                    .in('id', ids);

                if (updateError) throw updateError;
                console.log(`Auto-cancelled ${ids.length} expired confirmed shifts.`);
            }
        } catch (err) {
            console.error("Error cleaning up expired shifts:", err);
        }
    };

    useEffect(() => {
        let isMounted = true;

        if (user) {
            const init = async () => {
                // Safety Timeout
                const safetyTimer = setTimeout(() => {
                    if (isMounted) {
                        console.warn("Safety timeout triggered for MyShifts load");
                        setLoading(false);
                    }
                }, 8000);

                try {
                    await cleanupExpiredShifts().catch(e => console.error("Cleanup failed", e));
                    await loadShifts().catch(e => console.error("LoadShifts failed", e));
                } catch (err) {
                    console.error("Error in MyShifts init:", err);
                } finally {
                    clearTimeout(safetyTimer);
                    // Ensure loading is false even if loadShifts failed silently or didn't run
                    // But loadShifts handles its own loading state, so we just double check
                }
            };
            init();

            // Subscribe to real-time changes
            const subscription = supabase
                .channel('appointments_changes')
                .on('postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'appointments',
                        filter: `caregiver_id=eq.${user.id}`
                    },
                    (payload) => {
                        console.log('Appointment changed:', payload);
                        loadShifts(); // Reload shifts on any change
                    }
                )
                .subscribe();

            return () => {
                isMounted = false;
                subscription.unsubscribe();
                clearTimeout(init); // Clear any pending timeouts if init was an ID (it wasn't, but good practice for safetyTimer to be cleared in init's scope)
            };
        }
    }, [user]);

    const loadShifts = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('appointments')
                .select(`
                    *,
                    client:client_id (full_name, address, avatar_url)
                `)
                .eq('caregiver_id', user.id)
                .order('date', { ascending: true });

            if (error) throw error;
            setShifts(data || []);
        } catch (error) {
            console.error("Error loading shifts:", error);
            // alert("Error cargando turnos"); // Optional
        } finally {
            setLoading(false);
            console.log("Shifts loaded, loading set to false");
        }
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return {
            day: date.getUTCDate().toString().padStart(2, '0'),
            month: date.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase()
        };
    };

    const statusMap = {
        'confirmed': 'Confirmado',
        'pending': 'Pendiente',
        'cancelled': 'Cancelado',
        'completed': 'Completado'
    };

    // --- GROUPING LOGIC ---
    const getProcessedShifts = () => {
        // 1. Filter by status based on tab
        const filtered = shifts.filter(shift => {
            if (activeTab === 'upcoming') return ['confirmed', 'pending'].includes(shift.status);
            if (activeTab === 'completed') return ['completed', 'paid'].includes(shift.status);
            if (activeTab === 'cancelled') return ['cancelled', 'denied'].includes(shift.status);
            return true;
        });

        // 2. Group Cuidado+ items
        const processed = [];
        const seenGroupIds = new Set();

        filtered.forEach(shift => {
            if (shift.type === 'Cuidado+' && shift.service_group_id) {
                if (seenGroupIds.has(shift.service_group_id)) return; // Already processed this group

                // Find all shifts in this group (from the original full list to get context, BUT filtered by tab relevance?)
                // Actually, if we are in 'Upcoming', we want to show the group if it has ANY upcoming shift?
                // OR duplicate the group in 'Completed' if it has completed shifts?
                // Requirement: "Don't fill the screen with 27 items".
                // Better approach: Show the group in the tab where the *current/next* shift belongs.

                // Let's stick to simple grouping within the current filtered list for now to respect tabs.
                // If I have 10 upcoming and 10 completed in the same group, and I'm in 'Upcoming', I show the group with 10 upcoming.

                const groupShifts = filtered.filter(s => s.service_group_id === shift.service_group_id);

                // Construct Group Object
                // Get full group history for the modal (from ALL shifts, not just filtered)
                const fullGroupShifts = shifts.filter(s => s.service_group_id === shift.service_group_id).sort((a, b) => new Date(a.date) - new Date(b.date));

                processed.push({
                    isGroup: true,
                    id: shift.service_group_id,
                    title: shift.title, // Assume simplified title or take from first
                    client: shift.client,
                    address: shift.address,
                    shifts: groupShifts, // Shifts currently in this tab
                    fullShifts: fullGroupShifts, // ALL shifts for modal
                    startDate: groupShifts[0].date,
                    endDate: groupShifts[groupShifts.length - 1].date,
                    status: shift.status // Use status of current/first
                });
                seenGroupIds.add(shift.service_group_id);
            } else {
                processed.push(shift);
            }
        });

        return processed;
    };

    const processedItems = getProcessedShifts();
    const upcomingCount = shifts.filter(s => ['confirmed', 'pending'].includes(s.status)).length;
    const completedCount = shifts.filter(s => ['completed', 'paid'].includes(s.status)).length;
    const cancelledCount = shifts.filter(s => ['cancelled', 'denied'].includes(s.status)).length;


    const handleAction = async (id, status) => {
        setIsActionLoading(true);
        try {
            const updateData = { status };

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

            if (status === 'in_progress') {
                alert("🚀 Turno iniciado. ¡Buen trabajo!");
            } else if (status === 'completed') {
                alert("🏆 Turno finalizado con éxito. No olvides completar la bitácora.");
            }

            loadShifts(); // Refresh list
        } catch (error) {
            console.error("Error updating appointment:", error);
            alert("❌ Error: " + (error.message || "No se pudo actualizar el turno."));
        } finally {
            setIsActionLoading(false);
        }
    };

    return (
        <>
            <div className="space-y-6 animate-fade-in">
                <header>
                    <h1 className="text-3xl font-brand font-bold !text-[#0F3C4C]">Mis Turnos</h1>
                    <p className="text-gray-500 font-secondary mt-1">Gestiona tu agenda y confirma tus próximas visitas.</p>
                </header>

                {/* Tabs */}
                <div className="flex gap-8 border-b border-gray-100">
                    <button
                        onClick={() => setActiveTab('upcoming')}
                        className={`pb-4 border-b-2 font-brand font-black uppercase text-xs tracking-widest transition-all ${activeTab === 'upcoming' ? 'border-[var(--secondary-color)] text-[var(--secondary-color)]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                    >
                        Próximos <span className="ml-1 bg-gray-100 px-2 py-0.5 rounded-full text-[10px] text-gray-600">{upcomingCount}</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('completed')}
                        className={`pb-4 border-b-2 font-brand font-black uppercase text-xs tracking-widest transition-all ${activeTab === 'completed' ? 'border-[var(--secondary-color)] text-[var(--secondary-color)]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                    >
                        Completados <span className="ml-1 bg-gray-100 px-2 py-0.5 rounded-full text-[10px] text-gray-600">{completedCount}</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('cancelled')}
                        className={`pb-4 border-b-2 font-brand font-black uppercase text-xs tracking-widest transition-all ${activeTab === 'cancelled' ? 'border-[var(--secondary-color)] text-[var(--secondary-color)]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                    >
                        Cancelados <span className="ml-1 bg-gray-100 px-2 py-0.5 rounded-full text-[10px] text-gray-600">{cancelledCount}</span>
                    </button>
                </div>

                <div className="space-y-4">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="animate-spin text-blue-600" size={32} />
                        </div>
                    ) : processedItems.length > 0 ? (
                        processedItems.map((item) => {
                            // RENDER GROUP CARD (Cuidado+)
                            if (item.isGroup) {
                                return (
                                    <div key={item.id} className="bg-white rounded-[16px] border border-[#C5A265]/30 shadow-xl shadow-[#C5A265]/10 p-0 overflow-hidden hover:shadow-2xl transition-all group relative">
                                        <div className="h-1.5 w-full bg-gradient-to-r from-[#0F3C4C] to-[#C5A265]"></div>
                                        <div className="p-8 flex flex-col md:flex-row gap-8">
                                            {/* Date Block */}
                                            <div className="flex flex-col items-center justify-center min-w-[120px] text-center bg-[#0F3C4C]/5 rounded-[16px] p-4 border border-[#0F3C4C]/10">
                                                <Layers size={24} className="text-[#0F3C4C] mb-2" />
                                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                                    Pack Agenda PULSO
                                                </span>
                                                <span className="text-xl font-brand font-bold text-[#0F3C4C] mt-1">
                                                    {item.shifts.length} Días
                                                </span>
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 space-y-2">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="bg-[#C5A265] text-[#0F3C4C] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                                                        AGENDA PULSO
                                                    </span>
                                                </div>
                                                <h3 className="text-2xl font-brand font-bold text-[#0F3C4C] tracking-tight">
                                                    {item.title}
                                                </h3>
                                                {item.client?.full_name && (
                                                    <p className="text-sm font-bold text-[var(--secondary-color)] uppercase tracking-wide flex items-center gap-1.5 mt-1">
                                                        <User size={14} />
                                                        {item.client.full_name}
                                                    </p>
                                                )}
                                                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600 mt-2">
                                                    <span className="flex items-center gap-2">
                                                        <Calendar size={16} className="text-[#C5A265]" />
                                                        Del {new Date(item.startDate).toLocaleDateString()} al {new Date(item.endDate).toLocaleDateString()}
                                                    </span>
                                                    <span className="flex items-center gap-2">
                                                        <MapPin size={16} className="text-[#C5A265]" />
                                                        {item.address || item.client?.address || 'Ubicación registrada'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Action */}
                                            <div className="flex flex-col justify-center gap-2 min-w-[160px]">
                                                <button
                                                    onClick={() => setSelectedGroup({
                                                        shifts: item.fullShifts, // Pass ALL shifts to the calendar
                                                        client: item.client,
                                                        title: item.title,
                                                        address: item.address,
                                                        type: 'Cuidado+'
                                                    })}
                                                    className="bg-[#0F3C4C] !text-[#FAFAF7] px-8 py-5 rounded-[16px] font-black text-xs uppercase tracking-widest hover:bg-[#1a5a70] transition-all shadow-xl shadow-[#0F3C4C]/20 border-none flex items-center justify-center gap-2 group-hover:scale-105"
                                                >
                                                    <Calendar size={16} /> Ver Calendario
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }

                            // RENDER SINGLE SHIFT (Basic/Others)
                            const shift = item;
                            const { day, month } = formatDate(shift.date);
                            return (
                                <div key={shift.id} className={`bg-white rounded-[16px] border border-slate-100 border-l-[6px] ${shift.status === 'confirmed' ? 'border-l-[var(--secondary-color)]' : 'border-l-[var(--primary-color)]'} shadow-xl shadow-slate-200/50 p-8 flex flex-col md:flex-row gap-8 hover:shadow-2xl transition-all group`}>
                                    <div className="flex flex-col items-center justify-center min-w-[100px] text-center bg-slate-50 rounded-[16px] p-4 border border-slate-100">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{new Date(shift.date).toLocaleDateString('es-ES', { weekday: 'short' })}</span>
                                        <span className="text-4xl font-brand font-bold text-[#0F3C4C]">{day}</span>
                                        <span className="text-xs font-black text-[var(--secondary-color)] uppercase tracking-tighter mt-1">{month}</span>
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className={`px-2 py-0.5 rounded text-xs font-bold ${shift.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                                shift.status === 'cancelled' ? 'bg-red-100 text-red-600' :
                                                    'bg-blue-100 text-blue-700'
                                                }`}>
                                                {(statusMap[shift.status] || shift.status).toUpperCase()}
                                            </div>
                                            {shift.type && (
                                                <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-medium">
                                                    {translateAppointmentType(shift.type)}
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="text-2xl font-brand font-bold !text-[#0F3C4C] tracking-tight">{shift.title}</h3>
                                        {shift.client?.full_name && (
                                            <p className="text-sm font-bold text-[var(--secondary-color)] uppercase tracking-wide flex items-center gap-1.5 mt-1">
                                                <User size={14} />
                                                {shift.client.full_name}
                                            </p>
                                        )}
                                        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600 mt-2">
                                            <span className="flex items-center gap-1">
                                                <Clock size={16} />
                                                {shift.time?.substring(0, 5)} {shift.end_time ? `- ${shift.end_time.substring(0, 5)}` : ''}
                                            </span>
                                            <span className="flex items-center gap-1 line-clamp-1" title={shift.address || shift.client?.address || 'Ubicación registrada'}>
                                                <MapPin size={16} />
                                                {shift.address || shift.client?.address || 'Ubicación registrada'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col justify-center gap-2 min-w-[140px]">
                                        <button
                                            onClick={() => setSelectedShift(shift)}
                                            className="bg-[var(--primary-color)] !text-[#FAFAF7] px-8 py-4 rounded-[16px] font-black text-xs uppercase tracking-widest hover:bg-[#1a5a70] transition-all shadow-xl shadow-blue-900/10 border-none"
                                        >
                                            Ver Detalles
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="bg-white rounded-[16px] p-12 text-center border border-gray-100 italic text-gray-400">
                            {activeTab === 'upcoming'
                                ? 'No tienes turnos programados próximamente.'
                                : activeTab === 'completed'
                                    ? 'No tienes turnos completados aún.'
                                    : 'No tienes turnos cancelados.'}
                        </div>
                    )}
                </div>

                {/* Alert */}
                <div className="bg-orange-50 border border-orange-200 rounded-[16px] p-4 flex items-start gap-3">
                    <AlertCircle className="text-orange-500 mt-0.5" size={20} />
                    <div>
                        <h4 className="font-bold text-orange-800 text-sm">Recordatorio importante</h4>
                        <p className="text-orange-700 text-sm">Recuerda completar tu bitácora de servicio al finalizar cada turno para mantener tus datos actualizados.</p>
                    </div>
                </div>
            </div>

            <ShiftDetailsModal
                isOpen={!!selectedShift}
                onClose={() => {
                    setSelectedShift(null);
                    // Automatically return to calendar if we were in one
                    if (lastGroup) {
                        setSelectedGroup(lastGroup);
                        setLastGroup(null);
                    }
                }}
                shift={selectedShift}
                onAction={handleAction}
                isLoading={isActionLoading}
            />

            <ServiceGroupModal
                isOpen={!!selectedGroup}
                onClose={() => setSelectedGroup(null)}
                serviceGroup={selectedGroup}
                onSelectShift={(shift) => {
                    setLastGroup(selectedGroup); // Save context
                    setSelectedGroup(null); // Close calendar
                    setSelectedShift(shift); // Open details of single shift
                }}
            />
        </>
    );
};

export default MyShifts;
