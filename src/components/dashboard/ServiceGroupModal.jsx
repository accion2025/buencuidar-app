import React, { useState } from 'react';
import { X, Calendar, MapPin, User, Clock, CheckCircle, AlertCircle, ChevronRight, ChevronLeft } from 'lucide-react';

const ServiceGroupModal = ({ isOpen, onClose, serviceGroup, onSelectShift }) => {
    if (!isOpen || !serviceGroup) return null;

    const { shifts, client, title, type, address } = serviceGroup;
    const [currentMonth, setCurrentMonth] = useState(() => {
        if (shifts && shifts.length > 0) {
            const firstDate = new Date(shifts[0].date);
            // Use UTC to avoid timezone shifts during initialization
            return new Date(firstDate.getUTCFullYear(), firstDate.getUTCMonth(), 1);
        }
        return new Date();
    });

    const getInitials = (name) => {
        if (!name) return 'U';
        const parts = name.trim().split(/\s+/);
        if (parts.length >= 2) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return parts[0][0].toUpperCase();
    };

    // Helper to get days in month
    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay(); // 0 = Sunday
        return { days, firstDay };
    };

    const { days, firstDay } = getDaysInMonth(currentMonth);
    const monthName = currentMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

    const changeMonth = (offset) => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1));
    };

    const getShiftForDay = (day) => {
        const dateStr = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day).toLocaleDateString('en-CA');
        return shifts.find(s => s.date === dateStr);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col relative animate-scale-in">

                {/* Header Distinctivo Cuidado+ */}
                <div className="bg-[#0F3C4C] p-6 text-[#FAFAF7] relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#C5A265] rounded-full -translate-y-1/2 translate-x-1/2 blur-[80px] opacity-20"></div>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onClose();
                        }}
                        className="absolute top-4 right-4 p-3 hover:bg-white/20 rounded-full transition-all z-[100] cursor-pointer group"
                        title="Cerrar"
                    >
                        <X size={24} className="group-hover:rotate-90 transition-transform" />
                    </button>

                    <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start md:items-center">
                        <div className="w-16 h-16 rounded-[16px] bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10 shadow-inner">
                            <Calendar size={32} className="text-[#C5A265]" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <span className="bg-[#C5A265] text-[#0F3C4C] px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                                    Protocolo Cuidado+
                                </span>
                                <span className="text-white/60 text-xs font-medium uppercase tracking-wider">
                                    Grupo de Servicio
                                </span>
                            </div>
                            <h2 className="text-2xl md:text-3xl font-brand font-bold mb-1">{title}</h2>
                            <p className="text-white/80 font-secondary text-sm flex items-center gap-2">
                                <User size={14} /> Cliente: {client?.full_name || 'Cliente'}
                            </p>
                            <p className="text-white/60 font-secondary text-xs flex items-center gap-2 mt-0.5">
                                <MapPin size={12} /> <span className="font-bold">Dirección del Servicio:</span> {address || client?.address || 'No especificada'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
                    <div className="grid lg:grid-cols-3 gap-8">

                        {/* Left: Summary */}
                        <div className="lg:col-span-1 space-y-6">
                            <div className="bg-white p-6 rounded-[20px] shadow-sm border border-gray-100">
                                <h3 className="font-brand font-bold text-[#0F3C4C] mb-4">Resumen del Servicio</h3>
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <div className="bg-blue-50 p-2 rounded-lg text-blue-600 mt-1">
                                            <Calendar size={18} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black uppercase text-gray-400">Duración</p>
                                            <p className="text-gray-700 font-medium">
                                                {shifts.length} días agendados
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                Del {new Date(shifts[0].date).toLocaleDateString()} al {new Date(shifts[shifts.length - 1].date).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <div className="bg-emerald-50 p-2 rounded-lg text-emerald-600 mt-1">
                                            <CheckCircle size={18} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black uppercase text-gray-400">Progreso</p>
                                            <p className="text-gray-700 font-medium">
                                                {shifts.filter(s => s.status === 'completed' || s.status === 'paid').length} / {shifts.length} Completados
                                            </p>
                                            <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2 overflow-hidden">
                                                <div
                                                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                                                    style={{ width: `${(shifts.filter(s => s.status === 'completed').length / shifts.length) * 100}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <div className="bg-orange-50 p-2 rounded-lg text-orange-600 mt-1">
                                            <MapPin size={18} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black uppercase text-gray-400">Dirección del Servicio</p>
                                            <p className="text-gray-700 font-medium text-sm">
                                                {address || client?.address || 'No especificada para este servicio'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right: Mini Calendar */}
                        <div className="lg:col-span-2">
                            <div className="bg-white p-6 rounded-[20px] shadow-sm border border-gray-100 h-full">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="font-brand font-bold text-[#0F3C4C] capitalize">{monthName}</h3>
                                    <div className="flex gap-2">
                                        <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-[#0F3C4C]">
                                            <ChevronLeft size={20} />
                                        </button>
                                        <button onClick={() => changeMonth(1)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-[#0F3C4C]">
                                            <ChevronRight size={20} />
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-7 gap-2 mb-2 text-center">
                                    {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => (
                                        <div key={d} className="text-[10px] font-black text-gray-400 uppercase tracking-wider py-2">
                                            {d}
                                        </div>
                                    ))}
                                </div>

                                <div className="grid grid-cols-7 gap-2">
                                    {/* Empty cells for start padding */}
                                    {Array.from({ length: firstDay }).map((_, i) => (
                                        <div key={`empty-${i}`} className="aspect-square"></div>
                                    ))}

                                    {/* Days */}
                                    {Array.from({ length: days }).map((_, i) => {
                                        const day = i + 1;
                                        const shift = getShiftForDay(day);
                                        const isToday = new Date().toDateString() === new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day).toDateString();

                                        let bgClass = "bg-gray-50 text-gray-400 border-transparent hover:bg-gray-100";
                                        let statusIcon = null;

                                        if (shift) {
                                            if (shift.status === 'completed' || shift.status === 'paid') {
                                                bgClass = "bg-green-100 text-green-700 border-green-200 hover:bg-green-200 cursor-pointer";
                                                statusIcon = <CheckCircle size={12} className="absolute top-1 right-1 opacity-50" />;
                                            } else if (shift.status === 'in_progress') {
                                                bgClass = "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200 cursor-pointer ring-2 ring-blue-200 ring-offset-1";
                                                statusIcon = <span className="absolute top-1 right-1 flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span></span>;
                                            } else if (shift.status === 'cancelled') {
                                                bgClass = "bg-red-50 text-red-300 border-red-100 cursor-not-allowed";
                                            } else {
                                                // Pending / Confirmed Future
                                                if (isToday) {
                                                    bgClass = "bg-[#0F3C4C] text-[#FAFAF7] border-[#0F3C4C] shadow-lg cursor-pointer scale-105 z-10";
                                                } else {
                                                    bgClass = "bg-white text-[#0F3C4C] border-gray-200 hover:border-[#0F3C4C] hover:shadow-md cursor-pointer";
                                                }
                                            }
                                        }

                                        return (
                                            <div
                                                key={day}
                                                onClick={() => shift && onSelectShift(shift)}
                                                className={`aspect-square rounded-[12px] border flex flex-col items-center justify-center relative transition-all duration-200 ${bgClass}`}
                                            >
                                                {statusIcon}
                                                <span className={`text-sm font-bold ${isToday ? 'scale-110' : ''}`}>{day}</span>
                                                {shift && (
                                                    <span className="text-[9px] font-medium opacity-80 mt-1 hidden sm:block">
                                                        {shift.time?.substring(0, 5)}
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 rounded-[12px] font-bold text-gray-500 hover:bg-gray-200 transition-colors"
                    >
                        Cerrar Calendario
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ServiceGroupModal;
