
import React from 'react';
import { X, Calendar, Clock, Check, User } from 'lucide-react';

const AllApplicationsModal = ({ isOpen, onClose, applications }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col relative animate-scale-in">

                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 className="text-xl font-brand font-bold text-[var(--primary-color)] flex items-center gap-2">
                        <Check size={24} className="text-purple-600" />
                        Historial de Postulaciones ({applications.length})
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                    >
                        <X size={24} className="text-gray-500" />
                    </button>
                </div>

                {/* List Content */}
                <div className="overflow-y-auto p-6 space-y-4">
                    {applications.length > 0 ? (
                        applications.map((app) => (
                            <div key={app.id} className="p-4 bg-white rounded-[16px] border border-gray-100 hover:border-[var(--secondary-color)]/30 transition-all shadow-sm flex flex-col sm:flex-row justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex justify-between items-start mb-1">
                                        <p className="text-sm font-bold text-[var(--primary-color)] mb-1">{app.appointment?.title || 'Servicio'}</p>
                                    </div>

                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">
                                            {app.appointment?.client?.full_name?.charAt(0) || <User size={12} />}
                                        </div>
                                        <p className="text-xs text-gray-600 font-medium">{app.appointment?.client?.full_name || 'Cliente Anónimo'}</p>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-500 font-medium uppercase tracking-wide">
                                        <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                                            <Calendar size={12} className="text-[var(--secondary-color)]" />
                                            {app.appointment?.date}
                                        </span>
                                        <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                                            <Clock size={12} className="text-[var(--secondary-color)]" />
                                            {app.appointment?.time?.substring(0, 5)}
                                            {app.appointment?.end_time ? ` - ${app.appointment?.end_time?.substring(0, 5)}` : ''}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-center gap-2">
                                    <span className={`text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest ${app.status === 'approved' ? 'bg-green-100 text-green-700' :
                                            app.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                                (app.status === 'cancelled' || app.appointment?.status === 'cancelled') ? 'bg-gray-200 text-gray-600' :
                                                    'bg-yellow-100 text-yellow-700'
                                        }`}>
                                        {app.status === 'approved' ? 'Aprobada' :
                                            app.status === 'rejected' ? 'Rechazada' :
                                                (app.status === 'cancelled' || app.appointment?.status === 'cancelled') ? 'Cancelada/Exp' : 'Pendiente'}
                                    </span>
                                    <span className="text-[10px] text-gray-400 font-mono">
                                        Total: 20
                                    </span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-12 text-gray-400 italic">
                            No hay postulaciones registradas.
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 bg-gray-50 text-center text-xs text-gray-400">
                    Mostrando las últimas {applications.length} postulaciones.
                </div>
            </div>
        </div>
    );
};

export default AllApplicationsModal;
