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


    return (
        <div className="space-y-6 animate-fade-in">
            <header>
                <h1 className="text-2xl font-bold text-gray-800">Mis Turnos</h1>
                <p className="text-gray-500">Gestiona tu agenda y confirma tus próximas visitas.</p>
            </header>

            {/* Tabs (Mock) */}
            <div className="flex gap-6 border-b border-gray-200">
                <button className="pb-4 border-b-2 border-blue-600 text-blue-600 font-bold">Próximos</button>
                <button className="pb-4 border-b-2 border-transparent text-gray-500 hover:text-gray-700 font-medium">Completados</button>
                <button className="pb-4 border-b-2 border-transparent text-gray-500 hover:text-gray-700 font-medium">Cancelados</button>
            </div>

            <div className="space-y-4">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="animate-spin text-blue-600" size={32} />
                    </div>
                ) : shifts.length > 0 ? (
                    shifts.map((shift) => {
                        const { day, month } = formatDate(shift.date);
                        return (
                            <div key={shift.id} className={`bg-white rounded-xl border-l-4 ${shift.status === 'confirmed' ? 'border-green-600' : 'border-blue-600'} shadow-sm p-6 flex flex-col md:flex-row gap-6`}>
                                <div className="flex flex-col items-center justify-center min-w-[80px] text-center">
                                    <span className="text-sm font-bold text-gray-500 uppercase">{new Date(shift.date).toLocaleDateString('es-ES', { weekday: 'short' })}</span>
                                    <span className="text-3xl font-bold text-gray-800">{day}</span>
                                    <span className="text-sm text-gray-400">{month}</span>
                                </div>
                                <div className="flex-1 space-y-2">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className={`px-2 py-0.5 rounded text-xs font-bold ${shift.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                            {(statusMap[shift.status] || shift.status).toUpperCase()}
                                        </div>
                                        <span className="text-xs text-gray-400">ID: #{shift.id.slice(0, 5)}</span>
                                        {shift.type && (
                                            <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-medium">
                                                {translateAppointmentType(shift.type)}
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-800">{shift.title}</h3>
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
                                        className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                                    >
                                        Ver Detalles
                                    </button>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="bg-white rounded-xl p-12 text-center border border-gray-100 italic text-gray-400">
                        No tienes turnos programados próximamente.
                    </div>
                )}
            </div>

            {/* Alert */}
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="text-orange-500 mt-0.5" size={20} />
                <div>
                    <h4 className="font-bold text-orange-800 text-sm">Recordatorio importante</h4>
                    <p className="text-orange-700 text-sm">Recuerda completar tu bitácora de servicio al finalizar cada turno para mantener tus datos actualizados.</p>
                </div>
            </div>

            <ShiftDetailsModal
                isOpen={!!selectedShift}
                onClose={() => setSelectedShift(null)}
                shift={selectedShift}
                onStartShift={(s) => alert("Iniciando turno: " + s.id)}
            />
        </div>
    );
};

export default MyShifts;
