import { X, Calendar, Clock, MapPin, User, Trash2 } from 'lucide-react';

const AppointmentsListModal = ({ isOpen, onClose, appointments, onEdit, onDelete }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-24 p-4 animate-fade-in overflow-y-auto">
            <div className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-lg">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Mis Citas Programadas</h2>
                        <p className="text-gray-500 text-sm">Resumen de todos tus servicios futuros</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* List Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                    {appointments.length > 0 ? (
                        appointments.map((app) => (
                            <div key={app.id} className="bg-white border border-gray-100 rounded-lg p-5 hover:shadow-md transition-shadow flex flex-col sm:flex-row gap-4 sm:items-center group">
                                {/* Date Box */}
                                <div className="bg-blue-50 rounded-lg p-3 flex flex-col items-center justify-center min-w-[80px] text-blue-600">
                                    <span className="text-xs font-bold uppercase tracking-wider">
                                        {new Date(app.date + 'T00:00:00').toLocaleDateString('es-ES', { month: 'short' }).replace('.', '')}
                                    </span>
                                    <span className="text-2xl font-black leading-none">
                                        {new Date(app.date + 'T00:00:00').getDate()}
                                    </span>
                                    <span className="text-xs font-medium text-blue-400">
                                        {new Date(app.date + 'T00:00:00').getFullYear()}
                                    </span>
                                </div>

                                {/* Info */}
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                                            <User size={14} className="text-gray-500" />
                                        </div>
                                        <span className="font-bold text-gray-800 text-sm">
                                            {app.caregiver?.full_name || 'Cuidador Asignado'}
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-lg text-gray-900 leading-tight">
                                        {app.title || 'Servicio de Cuidado'}
                                    </h3>
                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                        <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded">
                                            <Clock size={12} /> {app.time?.substring(0, 5)} {app.end_time ? `- ${app.end_time.substring(0, 5)}` : ''}
                                        </span>
                                        {app.caregiver?.address && (
                                            <span className="flex items-center gap-1 truncate max-w-[150px]">
                                                <MapPin size={12} /> {app.caregiver.address}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Status Badge & Actions */}
                                <div className="flex sm:flex-col items-center sm:items-end gap-2 text-xs">
                                    <span className={`px-3 py-1 rounded-full font-bold ${app.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                        {app.status === 'confirmed' ? 'Confirmada' : 'Pendiente'}
                                    </span>

                                    <div className="flex gap-2 mt-1">
                                        {onEdit && (
                                            <button
                                                onClick={() => onEdit(app)}
                                                className="px-3 py-1.5 bg-blue-50 text-blue-600 font-bold rounded-lg hover:bg-blue-100 transition-colors"
                                            >
                                                Editar
                                            </button>
                                        )}
                                        {onDelete && (
                                            <button
                                                onClick={() => onDelete(app)}
                                                className="p-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors"
                                                title="Eliminar cita"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-12">
                            <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Calendar size={40} className="text-gray-300" />
                            </div>
                            <h3 className="text-gray-900 font-bold text-lg">No tienes citas programadas</h3>
                            <p className="text-gray-500 text-sm max-w-xs mx-auto mt-2">
                                Agenda un nuevo servicio desde el calendario o busca un cuidador.
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 bg-gray-50/50 rounded-b-lg">
                    <button
                        onClick={onClose}
                        className="w-full bg-white border border-gray-200 text-gray-700 font-bold py-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Cerrar Informe
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AppointmentsListModal;
