import React, { useState } from 'react';
import { X, DollarSign, Check, Calendar, Clock, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const EditPaymentModal = ({ isOpen, onClose, appointment, onUpdate }) => {
    const [amount, setAmount] = useState(appointment?.payment_amount || appointment?.offered_rate || '');
    const [status, setStatus] = useState(appointment?.payment_status || 'pending');
    const [startTime, setStartTime] = useState(appointment?.time || '');
    const [endTime, setEndTime] = useState(appointment?.end_time || '');
    const [loading, setLoading] = useState(false);

    // Reset state when appointment changes
    React.useEffect(() => {
        if (appointment) {
            setAmount(appointment.payment_amount || appointment.offered_rate || '');
            setStatus(appointment.payment_status || 'pending');
            setStartTime(appointment.time || '');
            setEndTime(appointment.end_time || '');
        }
    }, [appointment]);

    if (!isOpen || !appointment) return null;

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { error } = await supabase
                .from('appointments')
                .update({
                    payment_amount: parseFloat(amount) || 0,
                    payment_status: status,
                    time: startTime,
                    end_time: endTime
                })
                .eq('id', appointment.id);

            if (error) throw error;
            onUpdate(); // Refresh parent data
            onClose();
        } catch (error) {
            console.error("Error updating payment:", error);
            alert(`Error: ${error.message} \nDetalles: ${error.details || ''} \nHint: ${error.hint || ''}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-start justify-center pt-24 p-4 animate-fade-in overflow-y-auto">
            <div className="bg-white rounded-[16px] shadow-xl w-full max-w-md overflow-hidden animate-slide-up">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <DollarSign size={20} className="text-green-600" />
                        Registrar Pago
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-200 rounded-[16px] transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSave} className="p-6 space-y-6">
                    {/* Appointment Summary */}
                    <div className="bg-blue-50/50 p-4 rounded-[16px] border border-blue-100 space-y-2">
                        <div className="flex items-center gap-2 text-sm font-bold text-gray-800">
                            <User size={14} className="text-blue-500" />
                            {appointment.client?.full_name || 'Cliente'}
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                                <Calendar size={12} /> {appointment.date}
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="font-bold text-blue-600">Horario Original:</span> {appointment.time} - {appointment.end_time || '?'}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {/* Time Adjustment */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 flex items-center justify-between">
                                Horario Real
                                <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-normal">
                                    Ajustar si varió
                                </span>
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-gray-400 mb-1 block">Inicio</label>
                                    <input
                                        type="time"
                                        required
                                        className="w-full px-3 py-2 rounded-[16px] border-2 border-gray-100 focus:border-blue-500 outline-none transition-all font-mono font-bold text-gray-800"
                                        value={startTime}
                                        onChange={(e) => setStartTime(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 mb-1 block">Fin</label>
                                    <input
                                        type="time"
                                        required
                                        className="w-full px-3 py-2 rounded-[16px] border-2 border-gray-100 focus:border-blue-500 outline-none transition-all font-mono font-bold text-gray-800"
                                        value={endTime}
                                        onChange={(e) => setEndTime(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">Monto Recibido</label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</div>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    required
                                    className="w-full pl-8 pr-4 py-3 rounded-[16px] border-2 border-gray-100 focus:border-green-500 outline-none transition-all font-mono font-bold text-lg text-gray-800"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">Estatus del Pago</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setStatus('pending')}
                                    className={`py-2 px-4 rounded-[16px] border-2 font-bold text-sm transition-all flex items-center justify-center gap-2 ${status === 'pending'
                                        ? 'border-yellow-400 bg-yellow-50 text-yellow-700'
                                        : 'border-gray-100 text-gray-400 hover:border-gray-200'
                                        }`}
                                >
                                    Pendiente
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setStatus('paid')}
                                    className={`py-2 px-4 rounded-[16px] border-2 font-bold text-sm transition-all flex items-center justify-center gap-2 ${status === 'paid'
                                        ? 'border-green-500 bg-green-50 text-green-700'
                                        : 'border-gray-100 text-gray-400 hover:border-gray-200'
                                        }`}
                                >
                                    <Check size={14} /> Pagado
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-500 font-bold hover:bg-gray-100 rounded-[16px] transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-green-600 !text-[#FAFAF7] px-6 py-2 rounded-[16px] font-bold hover:bg-green-700 transition-colors shadow-lg shadow-green-200 flex items-center gap-2"
                        >
                            {loading ? 'Guardando...' : 'Confirmar Todo'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditPaymentModal;
