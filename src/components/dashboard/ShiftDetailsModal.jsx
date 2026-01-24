import React from 'react';
import { X, Calendar, Clock, MapPin, User, Navigation, Phone, MessageCircle, AlertTriangle, FileText, CheckCircle } from 'lucide-react';
import { translateAppointmentStatus, translateAppointmentType } from '../../utils/translations';

const ShiftDetailsModal = ({ isOpen, onClose, shift, onStartShift }) => {
    if (!isOpen || !shift) return null;

    const statusColors = {
        'confirmed': 'bg-green-100 text-green-700 border-green-200',
        'pending': 'bg-blue-100 text-blue-700 border-blue-200',
        'completed': 'bg-gray-100 text-gray-700 border-gray-200',
        'cancelled': 'bg-red-100 text-red-700 border-red-200'
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-start justify-center pt-20 p-4 animate-fade-in overflow-y-auto">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden relative border border-white/20 flex flex-col animate-slide-up">

                {/* Header Map/Gradient */}
                <div className="h-20 bg-gradient-to-r from-blue-600 to-indigo-700 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>

                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 bg-black/20 hover:bg-black/30 text-white p-2 rounded-full transition-all backdrop-blur-sm"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="pt-8 px-8 pb-8">
                    {/* Title & Status */}
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-2xl font-black text-gray-800 leading-tight">{shift.title || translateAppointmentType(shift.type)}</h2>
                        </div>
                        <span className={`px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-wider border ${statusColors[shift.status] || 'bg-gray-100'}`}>
                            {translateAppointmentStatus(shift.status)}
                        </span>
                    </div>

                    {/* Date Time Grid */}
                    <div className="grid grid-cols-2 gap-4 mt-6">
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col justify-center">
                            <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase mb-1">
                                <Calendar size={12} /> Fecha
                            </div>
                            <p className="text-slate-800 font-bold text-sm">
                                {new Date(shift.date + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col justify-center">
                            <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase mb-1">
                                <Clock size={12} /> Horario
                            </div>
                            <p className="text-slate-800 font-bold text-sm">
                                {shift.time?.substring(0, 5)} {shift.end_time ? `- ${shift.end_time.substring(0, 5)}` : ''}
                            </p>
                        </div>
                    </div>

                    {/* New: Description Section */}
                    {(() => {
                        const details = shift.details || '';
                        let description = details;
                        let services = [];

                        const planMarker = "[PLAN DE CUIDADO]";
                        const servicesMarker = "---SERVICES---";

                        // Extract services first
                        const planMatch = details.match(/\[PLAN DE CUIDADO\]([\s\S]*?)(\[INSTRUCCIONES ADICIONALES\]|---SERVICES---|$)/);
                        if (planMatch) {
                            services = planMatch[1].trim().split('\n').map(s => s.replace('• ', '').trim()).filter(Boolean);
                        }

                        // Extract description
                        if (details.includes(planMarker)) {
                            const parts = details.split(planMarker);
                            const beforePlan = parts[0].trim();
                            const afterPlan = parts[1] ? parts[1].split(servicesMarker)[1]?.split(servicesMarker)[1]?.trim() : '';

                            const descMatch = details.match(/\[INSTRUCCIONES ADICIONALES\]\n?([\s\S]*?)(---SERVICES---|$)/);
                            if (descMatch) {
                                description = descMatch[1].trim();
                            } else {
                                description = (beforePlan + "\n" + (afterPlan || '')).trim();
                            }
                        }

                        if (description === details && details.includes(planMarker)) {
                            description = "";
                        }

                        // Filter out default/placeholder text
                        const ignorePhrases = ['Sin instrucciones adicionales', 'Sin instrucciones especiales'];
                        if (ignorePhrases.some(phrase => description.trim().toLowerCase() === phrase.toLowerCase())) {
                            description = "";
                        }

                        if (!description && services.length === 0) return null;

                        return (
                            <div className="mt-8">
                                <h3 className="font-black text-xs text-slate-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <FileText size={16} className="text-blue-500" />
                                    Descripción de la Cita
                                </h3>

                                {description && (
                                    <div className="p-5 bg-blue-50/30 rounded-3xl border border-blue-100/50 text-sm text-slate-700 leading-relaxed font-medium italic shadow-inner mb-4">
                                        {description}
                                    </div>
                                )}

                                {services.length > 0 && (
                                    <div className="grid grid-cols-1 gap-2">
                                        {services.map((service, idx) => (
                                            <div key={idx} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                                                <CheckCircle size={16} className="text-green-500" />
                                                <span className="text-sm text-slate-700 font-bold">{service}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })()}

                    {/* Location Card */}
                    <div className="mt-8 bg-slate-900 p-6 rounded-3xl border border-white/10 flex items-start gap-4 shadow-xl shadow-slate-200">
                        <div className="bg-white/10 text-white p-3 rounded-2xl mt-1">
                            <MapPin size={24} />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-black text-white text-xs uppercase tracking-widest mb-1 opacity-60">Dirección del Servicio</h4>
                            <p className="text-sm text-white font-medium leading-relaxed mb-4">
                                {shift.location || 'Calle Principal 123, Colonia Centro, CDMX'}
                            </p>
                            <button className="text-[10px] font-black bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition-colors w-fit uppercase tracking-tighter">
                                <Navigation size={12} />
                                Ver Ruta en el Mapa
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShiftDetailsModal;
