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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-end sm:items-center justify-center p-0 sm:p-6 animate-fade-in">
            <div className="bg-white rounded-t-[24px] sm:rounded-[16px] shadow-2xl w-full max-w-lg h-[90vh] sm:h-auto max-h-[90vh] overflow-hidden relative border border-white/20 flex flex-col animate-slide-up">

                {/* Header Map/Gradient - SHRINK-0 */}
                <div className="h-24 bg-gradient-to-br from-[var(--primary-color)] to-[#1a5a70] relative overflow-hidden shrink-0">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--secondary-color)] rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl opacity-20"></div>

                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 bg-black/20 hover:bg-black/30 !text-[#FAFAF7] p-2 rounded-full transition-all backdrop-blur-sm z-20"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Scrollable Content Area - FLEX-1 OVERFLOW-Y-AUTO */}
                <div className="flex-1 overflow-y-auto pt-6 sm:pt-8 px-6 sm:px-8 pb-12 sm:pb-8 pb-safe">
                    {/* Title & Status */}
                    <div className="flex justify-between items-start mb-6 sm:mb-8">
                        <div>
                            <h2 className="text-2xl sm:text-3xl font-brand font-bold !text-[#0F3C4C] leading-tight mb-2 tracking-tight">{shift.title || translateAppointmentType(shift.type)}</h2>
                        </div>
                        <span className={`px-3 sm:px-4 py-1.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] border ${statusColors[shift.status] || 'bg-gray-100'} shrink-0`}>
                            {translateAppointmentStatus(shift.status)}
                        </span>
                    </div>

                    {/* Date Time Grid */}
                    <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-6">
                        <div className="bg-slate-50 p-4 rounded-[16px] border border-slate-100 flex flex-col justify-center">
                            <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase mb-1">
                                <Calendar size={12} /> Fecha
                            </div>
                            <p className="text-slate-800 font-bold text-xs sm:text-sm">
                                {new Date(shift.date + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                            </p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-[16px] border border-slate-100 flex flex-col justify-center">
                            <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase mb-1">
                                <Clock size={12} /> Horario
                            </div>
                            <p className="text-slate-800 font-bold text-xs sm:text-sm">
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
                                <h3 className="font-brand font-bold text-[#0F3C4C] text-lg mb-4 sm:mb-6 flex items-center gap-3">
                                    <div className="p-2 bg-blue-50 text-[var(--primary-color)] rounded-[16px]"><FileText size={18} /></div>
                                    Instrucciones del Servicio
                                </h3>

                                {description && (
                                    <div className="p-6 sm:p-8 bg-slate-50 rounded-[16px] border border-slate-100 text-sm sm:text-base text-[#07212e] leading-relaxed font-medium mb-6 sm:mb-8 shadow-inner relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-4 opacity-5">
                                            <FileText size={60} />
                                        </div>
                                        <p className="relative z-10 font-secondary italic">"{description}"</p>
                                    </div>
                                )}

                                {services.length > 0 && (
                                    <div className="grid grid-cols-1 gap-2">
                                        {services.map((service, idx) => (
                                            <div key={idx} className="flex items-center gap-3 p-3 bg-white rounded-[16px] border border-slate-100 shadow-sm">
                                                <CheckCircle size={16} className="text-green-500 shrink-0" />
                                                <span className="text-xs sm:text-sm text-slate-700 font-bold">{service}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })()}

                    {/* Location Card */}
                    <div className="mt-8 bg-[#0F3C4C] p-6 sm:p-8 rounded-[16px] border border-white/5 flex flex-col sm:flex-row items-start gap-4 sm:gap-6 shadow-2xl relative overflow-hidden group !text-[#FAFAF7]">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--secondary-color)] rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl opacity-10 transition-all group-hover:opacity-20"></div>
                        <div className="bg-white/10 text-[var(--accent-color)] p-3 sm:p-4 rounded-[16px] relative z-10 shadow-lg shrink-0">
                            <MapPin size={24} className="sm:w-7 sm:h-7" />
                        </div>
                        <div className="flex-1 relative z-10">
                            <h4 className="font-black !text-[#FAFAF7]/40 text-[10px] uppercase tracking-[0.2em] mb-2 leading-none">Dirección del Servicio</h4>
                            <p className="text-sm sm:text-base !text-[#FAFAF7] font-brand font-bold leading-tight mb-6">
                                {shift.address || 'Dirección no especificada'}
                            </p>
                            <a
                                href={shift.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(shift.address)}` : '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`text-[10px] font-black bg-[var(--secondary-color)] !text-[#FAFAF7] px-6 py-3 rounded-[16px] flex items-center justify-center gap-2 hover:bg-emerald-600 transition-all w-full sm:w-fit uppercase tracking-widest shadow-xl shadow-green-900/40 ${!shift.address ? 'opacity-50 pointer-events-none' : ''}`}
                            >
                                <Navigation size={12} fill="currentColor" />
                                Ver Ruta en el Mapa
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShiftDetailsModal;
