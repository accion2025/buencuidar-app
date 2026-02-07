import React, { useState, useEffect } from 'react';
import { X, Check, FileText, Loader2, ListTodo, ClipboardList, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const AddCareLogModal = ({ isOpen, onClose, appointmentId, caregiverId, clientName, appointmentDetails, careAgenda, clientId, onSaved }) => {
    const [loading, setLoading] = useState(false); // Used for saving
    const [checklistItems, setChecklistItems] = useState([]);
    const [completedItems, setCompletedItems] = useState(new Set());
    const [initialCompletedItems, setInitialCompletedItems] = useState(new Set());
    const [loadingLogs, setLoadingLogs] = useState(true);

    // Parse items from appointmentDetails or careAgenda
    useEffect(() => {
        if (careAgenda && Array.isArray(careAgenda) && careAgenda.length > 0) {
            // Keep the objects but filter duplicates by name (activity)
            const seen = new Set();
            const items = [];
            careAgenda.forEach(item => {
                const name = typeof item === 'string' ? item : (item.activity || item.name);
                if (!seen.has(name)) {
                    seen.add(name);
                    items.push(typeof item === 'string' ? item : { activity: name, time: item.time });
                }
            });
            setChecklistItems(items);
        } else if (appointmentDetails) {
            let items = [];
            if (appointmentDetails.includes('[PLAN DE CUIDADO]')) {
                const parts = appointmentDetails.split('[PLAN DE CUIDADO]');
                if (parts.length > 1) {
                    const planSection = parts[1].split('---SERVICES---')[0];
                    items = planSection.split('•').map(s => s.trim()).filter(s => s && s.length > 2);
                }
            }
            if (items.length === 0) {
                items = appointmentDetails.split(/[\n•]/).map(s => s.trim()).filter(s => s.length > 2);
            }
            setChecklistItems([...new Set(items)]);
        }
    }, [appointmentDetails, careAgenda]);

    // Fetch existing logs on open
    useEffect(() => {
        if (isOpen && appointmentId) {
            fetchExistingLogs();
        }
    }, [isOpen, appointmentId]);

    const fetchExistingLogs = async () => {
        setLoadingLogs(true);
        try {
            const { data, error } = await supabase
                .from('care_logs')
                .select('action')
                .eq('appointment_id', appointmentId);

            if (error) throw error;

            const completed = new Set(data.map(log => log.action));
            setCompletedItems(completed);
            setInitialCompletedItems(completed); // Save initial state for comparison
        } catch (error) {
            console.error("Error fetching logs:", error);
        } finally {
            setLoadingLogs(false);
        }
    };

    // Toggle local state only
    const toggleItem = (item) => {
        const itemName = typeof item === 'string' ? item : item.activity;
        setCompletedItems(prev => {
            const next = new Set(prev);
            if (next.has(itemName)) {
                next.delete(itemName);
            } else {
                next.add(itemName);
            }
            return next;
        });
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            // Find differences
            const toAdd = [...completedItems].filter(x => !initialCompletedItems.has(x));
            const toRemove = [...initialCompletedItems].filter(x => !completedItems.has(x));

            if (toRemove.length > 0) {
                const { error: removeError } = await supabase
                    .from('care_logs')
                    .delete()
                    .eq('appointment_id', appointmentId)
                    .in('action', toRemove);

                if (removeError) throw removeError;
            }

            if (toAdd.length > 0) {
                const { error: insertError } = await supabase
                    .from('care_logs')
                    .insert(toAdd.map(item => ({
                        appointment_id: appointmentId,
                        caregiver_id: caregiverId,
                        action: item,
                        detail: 'Completado según agenda',
                        category: 'Plan de Cuidado'
                    })));

                if (insertError) throw insertError;

                // NOTIFICATION: Handled by Database Trigger (notify_client_on_care_log_insert)
                // We only handle "Routine 100% Complete" if needed, but for now we rely on the trigger per task.
            }


            if (onSaved) onSaved();
            alert("¡Cambios guardados con éxito!");
            onClose();
        } catch (error) {
            console.error("Error saving logs:", error);
            alert("Error al guardar cambios.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm pt-5 px-6 pb-6 animate-fade-in overflow-y-auto">
            <div className="bg-white rounded-[16px] w-full max-w-md shadow-2xl p-6 relative overflow-hidden flex flex-col max-h-[80vh]">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full transition-colors z-10"
                >
                    <X size={20} />
                </button>

                <div className="flex items-center gap-3 mb-2 relative z-10 flex-shrink-0">
                    <div className="bg-blue-100 p-3 rounded-[16px] text-blue-600">
                        <ClipboardList size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Agenda de Cuidado</h2>
                        <p className="text-sm text-gray-500">Objetivos con {clientName}</p>
                    </div>
                </div>

                <div className="mt-6 mb-6 overflow-y-auto flex-grow pr-2 custom-scrollbar">
                    {checklistItems.length > 0 ? (
                        <div className="space-y-3">
                            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Tareas Asignadas</p>
                            {loadingLogs ? (
                                <div className="flex justify-center py-4"><Loader2 className="animate-spin text-gray-400" /></div>
                            ) : (
                                checklistItems.map((item, idx) => {
                                    const itemName = typeof item === 'string' ? item : item.activity;
                                    const checked = completedItems.has(itemName);
                                    return (
                                        <div
                                            key={idx}
                                            onClick={() => toggleItem(item)}
                                            className={`flex items-start gap-4 p-5 rounded-[16px] border transition-all cursor-pointer min-h-[72px] ${checked
                                                ? 'bg-green-50 border-green-200 shadow-sm'
                                                : 'bg-white border-gray-100 hover:border-blue-200 hover:shadow-md'
                                                }`}
                                        >
                                            <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${checked ? 'bg-green-500 border-green-500' : 'border-gray-300'
                                                }`}>
                                                {checked && <Check size={12} className="!text-[#FAFAF7]" />}
                                            </div>
                                            <div className="flex-1">
                                                <span className={`text-sm font-bold leading-tight block ${checked ? 'text-green-800 line-through opacity-70' : 'text-gray-700'}`}>
                                                    {typeof item === 'string' ? item : item.activity}
                                                </span>
                                                {typeof item !== 'string' && item.time && (
                                                    <span className={`text-[10px] font-black uppercase tracking-widest mt-1 flex items-center gap-1.5 ${checked ? 'text-green-600/50' : 'text-[var(--secondary-color)]'}`}>
                                                        <Clock size={10} /> {item.time}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-8 bg-gray-50 rounded-[16px] border border-dashed border-gray-200">
                            <ListTodo size={32} className="mx-auto text-gray-300 mb-2" />
                            <p className="text-sm text-gray-500 font-medium">No hay tareas específicas configuradas.</p>
                            <p className="text-sm text-gray-400">Todo el registro será manual.</p>
                        </div>
                    )}
                </div>

                <div className="pt-4 border-t border-gray-100 flex gap-3 flex-shrink-0">
                    <button
                        onClick={onClose}
                        className="flex-1 bg-white border border-gray-200 text-gray-500 font-bold py-3 rounded-[16px] hover:bg-gray-50 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="flex-[2] bg-blue-600 !text-[#FAFAF7] font-bold py-3 rounded-[16px] hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 size={20} className="animate-spin" /> : 'Guardar y Cerrar'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddCareLogModal;
