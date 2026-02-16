import React, { useState, useEffect } from 'react';
import { X, Check, FileText, Loader2, ListTodo, ClipboardList, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const AddCareLogModal = ({ isOpen, onClose, appointmentId, caregiverId, clientName, appointmentDetails, careAgenda, clientId, initialLogs, onSaved }) => {
    const [loading, setLoading] = useState(false); // Used for saving
    const [checklistItems, setChecklistItems] = useState([]);
    const [completedItems, setCompletedItems] = useState(new Set());
    const [initialCompletedItems, setInitialCompletedItems] = useState(new Set());
    const [loadingLogs, setLoadingLogs] = useState(true);

    // Parse items from appointmentDetails or careAgenda
    useEffect(() => {
        let items = [];

        const processItems = (rawItems) => {
            const processed = [];
            if (!rawItems || !Array.isArray(rawItems)) return processed;

            rawItems.forEach(item => {
                if (!item) return;
                const baseName = typeof item === 'string' ? item : (item.activity || item.name || item.activity_name || 'Actividad sin nombre');
                const programName = (item && typeof item === 'object') ? (item.program_name || item.category_name) : null;

                // If has cycles, expand them
                if (item && item.cycles && Array.isArray(item.cycles) && item.cycles.length > 0) {
                    item.cycles.forEach(cycle => {
                        const start = cycle.startTime || '99:99';
                        const end = cycle.endTime || '';

                        // Calculate duration
                        let duration = 0;
                        if (start !== '99:99' && end) {
                            const [h1, m1] = start.split(':').map(Number);
                            const [h2, m2] = end.split(':').map(Number);
                            duration = (h2 * 60 + m2) - (h1 * 60 + m1);
                        }

                        processed.push({
                            activity: (start !== '99:99') ? `${baseName} (${start}${end ? ` - ${end}` : ''})` : baseName,
                            time: start,
                            endTime: end,
                            duration: duration,
                            originalName: baseName,
                            program: programName
                        });
                    });
                } else {
                    // Single time or flexible
                    const timeValue = (item && item.time) || '99:99';
                    processed.push({
                        activity: (timeValue !== '99:99') ? `${baseName} (${timeValue})` : baseName,
                        time: timeValue,
                        originalName: baseName,
                        program: programName,
                        duration: 0
                    });
                }
            });
            return processed;
        };

        if (careAgenda && Array.isArray(careAgenda) && careAgenda.length > 0) {
            items = processItems(careAgenda);
        } else if (appointmentDetails && typeof appointmentDetails === 'string') {
            // Handle Cuidado+ JSON format
            if (appointmentDetails.includes('---SERVICES---')) {
                try {
                    const jsonStr = appointmentDetails.split('---SERVICES---')[1];
                    if (jsonStr) {
                        const services = JSON.parse(jsonStr);
                        if (Array.isArray(services)) {
                            items = processItems(services);
                        }
                    }
                } catch (e) {
                    console.error("Error parsing services in modal", e);
                }
            }

            // Fallback to old format
            if (items.length === 0) {
                if (appointmentDetails.includes('[PLAN DE CUIDADO]')) {
                    const parts = appointmentDetails.split('[PLAN DE CUIDADO]');
                    if (parts.length > 1) {
                        const planSection = parts[1].split('---SERVICES---')[0];
                        if (planSection) {
                            items = planSection.split('•').map(s => s.trim()).filter(s => s && s.length > 2).map(s => ({ activity: s, time: '99:99' }));
                        }
                    }
                }
            }

            if (items.length === 0) {
                items = appointmentDetails.split(/[\n•]/).map(s => s.trim()).filter(s => s.length > 2).map(s => ({ activity: s, time: '99:99' }));
            }
        }

        // UNIFIED CHRONOLOGICAL SORT
        // Helper to convert time like "08:00" to minutes for sorting
        const timeToMinutes = (t) => {
            if (!t || t === '99:99') return 9999;
            const [h, m] = t.split(':').map(Number);
            return (h * 60) + (m || 0);
        };

        const sortedItems = items.sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));
        setChecklistItems(sortedItems);
    }, [appointmentDetails, careAgenda]);

    // Fetch existing logs on open if not provided in props
    useEffect(() => {
        if (isOpen && appointmentId) {
            if (initialLogs) {
                // Filter logs to only include those that are NOT Wellness (these are the Care Plan activities)
                const carePlanLogs = initialLogs.filter(log => log.category !== 'Wellness');
                const completed = new Set(carePlanLogs.map(log => log.action));
                setCompletedItems(completed);
                setInitialCompletedItems(completed);
                setLoadingLogs(false);
            } else {
                fetchExistingLogs();
            }
        }
    }, [isOpen, appointmentId, initialLogs]);

    const fetchExistingLogs = async () => {
        if (!appointmentId) {
            setLoadingLogs(false);
            return;
        }
        setLoadingLogs(true);
        try {
            const { data, error } = await supabase
                .from('care_logs')
                .select('action')
                .eq('appointment_id', appointmentId)
                .neq('category', 'Wellness');

            if (error) {
                console.error("Supabase error fetching logs:", error);
                setLoadingLogs(false);
                return;
            }

            const completed = new Set((data || []).map(log => log.action));
            setCompletedItems(completed);
            setInitialCompletedItems(completed);
        } catch (error) {
            console.error("Critical error fetching logs:", error);
        } finally {
            setLoadingLogs(false);
        }
    };

    // Toggle local state only
    const toggleItem = (item, suffix = '') => {
        const baseName = typeof item === 'string' ? item : item.activity;
        const itemName = suffix ? `${baseName} - ${suffix}` : baseName;

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
            const appointment_id_val = appointmentId;
            // Find differences
            const toAdd = [...completedItems].filter(x => !initialCompletedItems.has(x));
            const toRemove = [...initialCompletedItems].filter(x => !completedItems.has(x));

            console.log("Saving Care Agenda for appointment:", appointment_id_val);
            console.log("Current completed:", Array.from(completedItems));
            console.log("To Add:", toAdd);
            console.log("To Remove:", toRemove);

            if (toRemove.length > 0) {
                const { error: removeError } = await supabase
                    .from('care_logs')
                    .delete()
                    .eq('appointment_id', appointment_id_val)
                    .neq('category', 'Wellness')
                    .in('action', toRemove);

                if (removeError) throw removeError;
            }

            if (toAdd.length > 0) {
                const { error: insertError } = await supabase
                    .from('care_logs')
                    .insert(toAdd.map(actionName => {
                        const itemObj = checklistItems.find(i => i.activity === actionName);
                        return {
                            appointment_id: appointment_id_val,
                            caregiver_id: caregiverId,
                            action: actionName,
                            detail: 'Completado según agenda',
                            category: itemObj?.program || itemObj?.program_name || 'Plan de Cuidado'
                        };
                    }));

                if (insertError) throw insertError;
            }

            if (onSaved) onSaved();

            // UX Improvement: Success feedback without blocking alert
            setLoading(false);
            setTimeout(() => {
                onClose();
            }, 600);
        } catch (error) {
            console.error("Error saving logs:", error);
            alert("Error al guardar cambios.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm pt-5 px-6 pb-6 animate-fade-in overflow-y-auto"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="bg-white rounded-[12px] w-full max-w-md shadow-2xl p-6 relative overflow-hidden flex flex-col max-h-[80vh]">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full transition-colors z-10"
                >
                    <X size={20} />
                </button>

                <div className="flex items-center gap-3 mb-2 relative z-10 flex-shrink-0">
                    <div className="bg-blue-100 p-3 rounded-[12px] text-blue-600">
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
                                            className={`flex flex-col gap-2 p-5 rounded-[12px] border transition-all ${checked
                                                ? 'bg-green-50/50 border-green-200'
                                                : 'bg-white border-gray-100 hover:border-blue-200 hover:shadow-md'
                                                }`}
                                        >
                                            <div className="flex items-start gap-4">
                                                <div
                                                    onClick={() => item.duration <= 60 && toggleItem(item)}
                                                    className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${item.duration > 60 ? 'border-blue-200 bg-blue-50/50' : (checked ? 'bg-green-500 border-green-500' : 'border-gray-300 pointer-events-auto cursor-pointer')}`}>
                                                    {item.duration <= 60 && checked && <Check size={12} className="!text-[#FAFAF7]" />}
                                                    {item.duration > 60 && <Clock size={10} className="text-blue-400" />}
                                                </div>
                                                <div className="flex-1">
                                                    <span className={`text-sm font-bold leading-tight block ${checked && item.duration <= 60 ? 'text-green-800 line-through opacity-70' : 'text-gray-700'}`}>
                                                        {itemName}
                                                    </span>
                                                    {typeof item === 'object' && (item.program || item.program_name) && (
                                                        <span className="text-[9px] font-black uppercase tracking-widest text-blue-600/60 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100/50 mt-1 inline-block">
                                                            {item.program || item.program_name}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* BC Cuidado Plus: Dynamic Reporting for long cycles (> 1h) */}
                                            {item.duration > 60 && (
                                                <div className="flex gap-2 mt-2 ml-9">
                                                    <button
                                                        onClick={() => toggleItem(item, 'INICIO')}
                                                        className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border ${completedItems.has(`${itemName} - INICIO`)
                                                            ? 'bg-green-600 border-green-600 !text-[#FAFAF7]'
                                                            : 'bg-white border-gray-200 text-gray-400 hover:border-blue-400 hover:text-blue-600'
                                                            }`}
                                                    >
                                                        {completedItems.has(`${itemName} - INICIO`) ? 'Iniciado' : 'Marcar Inicio'}
                                                    </button>
                                                    <button
                                                        onClick={() => toggleItem(item, 'FIN')}
                                                        className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border ${completedItems.has(`${itemName} - FIN`)
                                                            ? 'bg-green-600 border-green-600 !text-[#FAFAF7]'
                                                            : 'bg-white border-gray-200 text-gray-400 hover:border-blue-400 hover:text-blue-600'
                                                            }`}
                                                    >
                                                        {completedItems.has(`${itemName} - FIN`) ? 'Finalizado' : 'Marcar Fin'}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-8 bg-gray-50 rounded-[12px] border border-dashed border-gray-200">
                            <ListTodo size={32} className="mx-auto text-gray-300 mb-2" />
                            <p className="text-sm text-gray-500 font-medium">No hay tareas específicas configuradas.</p>
                            <p className="text-sm text-gray-400">Todo el registro será manual.</p>
                        </div>
                    )}
                </div>

                <div className="pt-4 border-t border-gray-100 flex gap-3 flex-shrink-0">
                    <button
                        onClick={onClose}
                        className="flex-1 bg-white border border-gray-200 text-gray-500 font-bold py-3 rounded-[12px] hover:bg-gray-50 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="flex-[2] bg-blue-600 !text-[#FAFAF7] font-bold py-3 rounded-[12px] hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 size={20} className="animate-spin" /> : 'Guardar y Cerrar'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddCareLogModal;
