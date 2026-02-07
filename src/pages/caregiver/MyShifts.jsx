import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { translateAppointmentType } from '../../utils/translations';

import ShiftDetailsModal from '../../components/dashboard/ShiftDetailsModal';

const MyShifts = () => {
    const { user } = useAuth();
    const [shifts, setShifts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedShift, setSelectedShift] = useState(null);
    const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming', 'completed', 'cancelled'
    const [isActionLoading, setIsActionLoading] = useState(false);

    useEffect(() => {
        if (user) {
            loadShifts();

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
                subscription.unsubscribe();
            };
        }
    }, [user]);

    const loadShifts = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('appointments')
                .select('*')
                .eq('caregiver_id', user.id)
                .order('date', { ascending: true });

            if (error) throw error;
            setShifts(data);
        } catch (error) {
            console.error("Error loading shifts:", error);
        } finally {
            setLoading(false);
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

    const filteredShifts = shifts.filter(shift => {
        if (activeTab === 'upcoming') return ['confirmed', 'pending'].includes(shift.status);
        if (activeTab === 'completed') return shift.status === 'completed';
        if (activeTab === 'cancelled') return shift.status === 'cancelled';
        return true;
    });

    const upcomingCount = shifts.filter(s => ['confirmed', 'pending'].includes(s.status)).length;
    const completedCount = shifts.filter(s => s.status === 'completed').length;
    const cancelledCount = shifts.filter(s => s.status === 'cancelled').length;


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
                    ) : filteredShifts.length > 0 ? (
                        filteredShifts.map((shift) => {
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
                                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                                            <span className="flex items-center gap-1">
                                                <Clock size={16} />
                                                {shift.time?.substring(0, 5)} {shift.end_time ? `- ${shift.end_time.substring(0, 5)}` : ''}
                                            </span>
                                            <span className="flex items-center gap-1"><MapPin size={16} /> Ubicación en detalles</span>
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
                onClose={() => setSelectedShift(null)}
                shift={selectedShift}
                onAction={handleAction}
                isLoading={isActionLoading}
            />
        </>
    );
};

export default MyShifts;
