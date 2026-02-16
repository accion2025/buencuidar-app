import { X, Calendar, Clock, MapPin, User, Trash2 } from 'lucide-react';

const AppointmentsListModal = ({ isOpen, onClose, appointments, onEdit, onDelete }) => {
    if (!isOpen) return null;

    const groupedAppointments = (() => {
        // Grouping Logic
        const grouped = [];
        const groups = {};

        // Sort by date first
        const sortedApps = [...appointments].sort((a, b) => new Date(a.date) - new Date(b.date));

        sortedApps.forEach(app => {
            if (app.status === 'cancelled') return;
            if (app.type === 'Cuidado+') return; // EXCLUDE Cuidado+ services (Shown only in Cuidado+ Panel)

            const groupId = app.service_group_id;
            if (groupId) {
                if (!groups[groupId]) {
                    groups[groupId] = {
                        ...app,
                        isGroup: true,
                        appointments: [],
                        startDate: app.date,
                        endDate: app.date,
                        count: 0
                    };
                    grouped.push(groups[groupId]);
                }
                groups[groupId].appointments.push(app);
                groups[groupId].count++;
                // Update range
                if (app.date < groups[groupId].startDate) groups[groupId].startDate = app.date;
                if (app.date > groups[groupId].endDate) groups[groupId].endDate = app.date;
            } else {
                // Single appointment
                grouped.push({ ...app, isGroup: false });
            }
        });

        // Sort groups by start date desc
        grouped.sort((a, b) => new Date(b.isGroup ? b.startDate : b.date) - new Date(a.isGroup ? a.startDate : a.date));
        return grouped;
    })();

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-24 p-6 animate-fade-in overflow-y-auto">
            <div className="bg-white rounded-[16px] w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
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
                    {groupedAppointments.length > 0 ? (
                        groupedAppointments.map((item) => (
                            <div key={item.id} className="bg-white border border-gray-100 rounded-[16px] p-5 hover:shadow-md transition-shadow flex flex-col sm:flex-row gap-4 sm:items-center group">
                                {/* Date Box */}
                                <div className={`rounded-[16px] p-3 flex flex-col items-center justify-center min-w-[80px] ${item.isGroup ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                                    {item.isGroup ? (
                                        <>
                                            <span className="text-[10px] font-black uppercase tracking-wider text-center leading-tight mb-1">INICIA</span>
                                            <span className="text-xl font-black leading-none">
                                                {new Date(item.startDate + 'T00:00:00').getDate()}
                                            </span>
                                            <span className="text-xs font-bold uppercase mt-1">
                                                {new Date(item.startDate + 'T00:00:00').toLocaleDateString('es-ES', { month: 'short' }).replace('.', '')}
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="text-sm font-bold uppercase tracking-wider">
                                                {new Date(item.date + 'T00:00:00').toLocaleDateString('es-ES', { month: 'short' }).replace('.', '')}
                                            </span>
                                            <span className="text-2xl font-black leading-none">
                                                {new Date(item.date + 'T00:00:00').getDate()}
                                            </span>
                                            <span className="text-sm font-medium opacity-60">
                                                {new Date(item.date + 'T00:00:00').getFullYear()}
                                            </span>
                                        </>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                                            <User size={14} className="text-gray-500" />
                                        </div>
                                        <span className="font-bold text-gray-800 text-sm">
                                            {item.caregiver?.full_name || (item.status === 'pending' ? 'Sin cuidador asignado' : 'Cuidador Asignado')}
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-lg text-gray-900 leading-tight flex items-center gap-2">
                                        {item.title || 'Servicio de Cuidado'}
                                        {item.isGroup && (
                                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[9px] font-black uppercase tracking-widest rounded-full">
                                                PAQUETE ({item.count} días)
                                            </span>
                                        )}
                                    </h3>
                                    <div className="flex items-center gap-4 text-sm text-gray-500">
                                        {item.isGroup ? (
                                            <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded text-xs font-mono">
                                                📅 {new Date(item.startDate).toLocaleDateString()} - {new Date(item.endDate).toLocaleDateString()}
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded">
                                                <Clock size={12} /> {item.time?.substring(0, 5)} {item.end_time ? `- ${item.end_time.substring(0, 5)}` : ''}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Status Badge & Actions */}
                                <div className="flex sm:flex-col items-center sm:items-end gap-2 text-xs">
                                    {(() => {
                                        const today = new Date().toLocaleDateString('en-CA');
                                        const now = new Date();
                                        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`;
                                        const isPendingAndRunning = item.status === 'pending' && item.date === today && item.time <= currentTime;

                                        return (
                                            <span className={`px-3 py-1 rounded-full font-bold border ${isPendingAndRunning
                                                ? 'bg-orange-100 text-orange-700 border-orange-200'
                                                : item.status === 'confirmed'
                                                    ? 'bg-green-100 text-green-700 border-green-200'
                                                    : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                                                }`}>
                                                {isPendingAndRunning ? 'PENDIENTE' : (item.status === 'confirmed' ? 'Confirmada' : 'Pendiente')}
                                            </span>
                                        );
                                    })()}

                                    <div className="flex gap-2 mt-1">
                                        {/* Edit not yet supported for groups in this modal, but we show delete */}
                                        {onDelete && (
                                            <button
                                                onClick={() => {
                                                    if (item.isGroup) {
                                                        if (confirm(`¿Eliminar todo el paquete de ${item.count} citas?`)) {
                                                            // We need to implement group delete or just pass one ID and handle logic in parent
                                                            // For now, let's assuming parent handles single ID deletion well, but we need group deletion logic
                                                            // The parent 'handleDeleteAppointment' can check 'service_group_id'
                                                            onDelete(item);
                                                        }
                                                    } else {
                                                        onDelete(item);
                                                    }
                                                }}
                                                className="px-3 py-1.5 bg-red-50 text-red-600 font-bold rounded-[16px] hover:bg-red-100 transition-colors flex items-center gap-1"
                                                title="Eliminar"
                                            >
                                                <Trash2 size={14} />
                                                {item.isGroup ? 'Eliminar Paquete' : 'Eliminar'}
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
                        className="w-full bg-white border border-gray-200 text-gray-700 font-bold py-3 rounded-[16px] hover:bg-gray-50 transition-colors"
                    >
                        Cerrar Informe
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AppointmentsListModal;
