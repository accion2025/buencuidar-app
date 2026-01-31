import React, { useState, useEffect } from 'react';
import { X, Loader2, Info, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ServiceSelector, { SERVICE_CATEGORIES } from './ServiceSelector';

const EditAppointmentModal = ({ isOpen, onClose, appointment, onSave, patients = [], isSubscribed }) => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        title: '',
        date: '',
        time: '',
        endTime: '',
        type: 'medical',
        patient_id: '',
        address: '', // New field
        selectedServices: []
    });
    const [initialData, setInitialData] = useState(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (appointment) {
            let services = [];
            let cleanDetails = appointment.details || '';
            let description = '';

            if (cleanDetails.includes('---SERVICES---')) {
                const parts = cleanDetails.split('---SERVICES---');
                try {
                    services = JSON.parse(parts[1]);
                    cleanDetails = parts[0].trim();
                } catch (e) {
                    console.warn("Failed to parse services");
                }
            }

            // Separate description from [PLAN DE CUIDADO]
            if (cleanDetails.includes('[PLAN DE CUIDADO]')) {
                description = cleanDetails.split('[PLAN DE CUIDADO]')[0].trim();
            } else {
                description = cleanDetails;
            }

            const data = {
                title: appointment.title || '',
                date: appointment.date || '',
                time: appointment.time || '',
                endTime: appointment.end_time || '',
                type: appointment.type || 'medical',
                patient_id: appointment.patient_id || '',
                address: appointment.address || '', // Load existing address
                selectedServices: services
            };
            setFormData(data);
            setInitialData(data);
        }
    }, [appointment, isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            // Format details from services only
            let formattedDetails = "";

            if (formData.selectedServices.length > 0) {
                const allItems = SERVICE_CATEGORIES.flatMap(c => c.items);
                const selectedLabels = formData.selectedServices
                    .map(id => allItems.find(i => i.id === id)?.label)
                    .filter(Boolean);

                formattedDetails += "[PLAN DE CUIDADO]\n" + selectedLabels.map(l => "• " + l).join("\n") + "\n\n";
                formattedDetails += "---SERVICES---" + JSON.stringify(formData.selectedServices) + "---SERVICES---\n";
            }

            const payload = {
                ...formData,
                details: formattedDetails,
                end_time: formData.endTime || null
            };

            delete payload.selectedServices; // Clean up before sending

            await onSave(payload);
            onClose();
        } catch (error) {
            console.error("Error saving form:", error);
        } finally {
            setSaving(false);
        }
    };

    const isDirty = initialData && (
        formData.title !== initialData.title ||
        formData.date !== initialData.date ||
        formData.time !== initialData.time ||
        formData.endTime !== initialData.endTime ||
        formData.type !== initialData.type ||
        formData.patient_id !== initialData.patient_id ||
        formData.address !== initialData.address || // Check dirty state
        JSON.stringify(formData.selectedServices) !== JSON.stringify(initialData.selectedServices)
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center pt-24 p-4 animate-fade-in overflow-y-auto pb-10">
            <div className="bg-white rounded-[16px] shadow-2xl w-full max-w-4xl flex flex-col animate-slide-up border border-white/20 overflow-hidden">
                <div className="p-10 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h3 className="text-3xl font-black text-gray-800 tracking-tight">Editar Cita</h3>
                        <p className="text-sm text-gray-500 font-medium mt-1">Personaliza el plan de cuidado para este servicio</p>
                    </div>
                    <button onClick={onClose} className="p-3 bg-gray-100 text-gray-500 rounded-[16px] hover:bg-gray-200 transition-all">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col md:flex-row divide-x divide-gray-100">
                    {/* Left Side: Basic Info */}
                    <div className="flex-1 p-10 space-y-8">
                        <section className="space-y-4">
                            <h4 className="text-xs font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
                                <div className="w-1.5 h-4 bg-blue-600 rounded-full"></div>
                                Información General
                            </h4>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Título</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-6 py-4 rounded-[16px] border-2 border-gray-100 font-bold focus:border-blue-500 outline-none transition-all bg-gray-50/30"
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Fecha</label>
                                        <input
                                            type="date"
                                            required
                                            className="w-full px-6 py-4 rounded-[16px] border-2 border-gray-100 font-bold focus:border-blue-500 outline-none transition-all bg-gray-50/30"
                                            value={formData.date}
                                            onChange={e => setFormData({ ...formData, date: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Horario</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="time"
                                                required
                                                className="w-full px-4 py-4 rounded-[16px] border-2 border-gray-100 font-bold focus:border-blue-500 outline-none transition-all bg-gray-50/30 text-sm"
                                                value={formData.time}
                                                onChange={e => setFormData({ ...formData, time: e.target.value })}
                                            />
                                            <input
                                                type="time"
                                                className="w-full px-4 py-4 rounded-[16px] border-2 border-gray-100 font-bold focus:border-blue-500 outline-none transition-all bg-gray-50/30 text-sm"
                                                value={formData.endTime || ''}
                                                onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Persona a Cuidar</label>
                                    <select
                                        className="w-full px-6 py-4 rounded-[16px] border-2 border-gray-100 font-bold focus:border-blue-500 outline-none transition-all bg-gray-50/30 appearance-none cursor-pointer"
                                        value={formData.patient_id || ''}
                                        onChange={e => setFormData({ ...formData, patient_id: e.target.value })}
                                    >
                                        <option value="">Seleccionar familiar...</option>
                                        {patients.map(p => (
                                            <option key={p.id} value={p.id}>{p.full_name}</option>
                                        ))}
                                    </select>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Dirección del Servicio</label>
                                <input
                                    type="text"
                                    placeholder="Ej. Calle 123, Colonia Centro"
                                    className="w-full px-6 py-4 rounded-[16px] border-2 border-gray-100 font-bold focus:border-blue-500 outline-none transition-all bg-gray-50/30"
                                    value={formData.address}
                                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                                />
                            </div>



                    </div>
                </section>

                <button
                    type="submit"
                    disabled={saving || !isDirty}
                    className="w-full bg-slate-900 !text-[#FAFAF7] py-5 rounded-[16px] font-black text-lg shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {saving ? <Loader2 className="animate-spin" size={24} /> : 'Guardar Cambios'}
                </button>
            </div>

            {/* Right Side: Service Explorer */}
            <div className="flex-1 p-10 bg-gray-50/30">
                <div className="mb-6 flex justify-between items-center">
                    <h4 className="text-xs font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
                        <div className="w-1.5 h-4 bg-blue-600 rounded-full"></div>
                        Explorador de Servicios ({formData.selectedServices.length})
                    </h4>
                </div>

                <ServiceSelector
                    selectedServices={formData.selectedServices}
                    onChange={(services) => setFormData({ ...formData, selectedServices: services })}
                />

                <div className="mt-6 p-4 bg-blue-50 rounded-[16px] border border-blue-100 flex items-start gap-3">
                    <Info size={18} className="text-blue-600 mt-0.5" />
                    <p className="text-[10px] text-blue-700 font-medium leading-relaxed">
                        Estas selecciones actualizarán el plan de trabajo para el cuidador. Puedes seleccionar múltiples servicios.
                    </p>
                </div>
            </div>
        </form>
            </div >
        </div >
    );
};

export default EditAppointmentModal;
