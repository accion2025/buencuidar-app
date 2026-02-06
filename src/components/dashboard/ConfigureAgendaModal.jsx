import React, { useState, useEffect } from 'react';
import { X, Check, Save, ChevronDown, ChevronRight, Brain, Activity, ClipboardList, ShieldCheck, Heart, Stethoscope, UserCog, Home, Loader2 } from 'lucide-react';
import { CARE_AGENDA_CATEGORIES } from '../../constants/careAgenda';
import { supabase } from '../../lib/supabase';

// Helper to map icon string to component
const IconMap = {
    Brain, Activity, ClipboardList, ShieldCheck, Heart, Stethoscope, UserCog, Home
};

const ConfigureAgendaModal = ({ isOpen, onClose, appointmentId, currentAgenda = [], onSave }) => {
    // State is now an object: { "Activity Name": "HH:MM" }
    const [selectedActivities, setSelectedActivities] = useState({});
    const [openCategories, setOpenCategories] = useState({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // Load existing agenda
            const initialMap = {};
            if (Array.isArray(currentAgenda)) {
                currentAgenda.forEach(item => {
                    if (typeof item === 'string') {
                        initialMap[item] = "00:00"; // Default for legacy strings
                    } else if (item && typeof item === 'object') {
                        initialMap[item.activity] = item.time || "00:00";
                    }
                });
            }
            setSelectedActivities(initialMap);
        }
    }, [isOpen, currentAgenda]);

    const toggleCategory = (id) => {
        setOpenCategories(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const toggleActivity = (activity) => {
        setSelectedActivities(prev => {
            const next = { ...prev };
            if (next[activity]) {
                delete next[activity];
            } else {
                next[activity] = "00:00"; // Default time
            }
            return next;
        });
    };

    const handleTimeChange = (activity, time) => {
        setSelectedActivities(prev => ({
            ...prev,
            [activity]: time
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Convert map to array of objects
            const agendaArray = Object.entries(selectedActivities).map(([activity, time]) => ({
                activity,
                time
            }));

            const { error } = await supabase
                .from('appointments')
                .update({ care_agenda: agendaArray })
                .eq('id', appointmentId);

            if (error) throw error;

            if (onSave) onSave(agendaArray);
            onClose();
        } catch (error) {
            console.error("Error saving agenda:", error);
            alert("Error al guardar la agenda. Por favor intente de nuevo.");
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 animate-fade-in shadow-2xl">
            <div className="bg-white rounded-t-[24px] sm:rounded-[16px] shadow-2xl w-full max-w-4xl h-[90vh] sm:h-auto max-h-[90vh] flex flex-col border border-white/20 overflow-hidden relative">
                {/* Header - SHRINK-0 */}
                <div className="p-6 sm:p-8 border-b border-gray-100 flex justify-between items-center bg-[var(--base-bg)] shrink-0">
                    <div>
                        <h3 className="text-xl sm:text-2xl font-brand font-bold text-[var(--primary-color)]">Configurar Agenda de Cuidado</h3>
                        <p className="text-[10px] sm:text-sm text-[var(--text-light)] font-secondary mt-1 max-w-md">Selecciona las actividades y asigna un horario para hoy.</p>
                    </div>
                    <button onClick={onClose} className="p-2 sm:p-3 bg-white text-gray-400 rounded-[12px] sm:rounded-[16px] hover:bg-gray-50 border border-gray-100 transition-all shadow-sm">
                        <X size={20} />
                    </button>
                </div>

                {/* Content - FLEX-1 OVERFLOW-Y-AUTO */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-3 sm:space-y-6 custom-scrollbar pb-40 sm:pb-32 pb-safe">
                    {CARE_AGENDA_CATEGORIES.map(cat => {
                        const Icon = IconMap[cat.icon] || Activity;
                        const isCatOpen = openCategories[cat.id];

                        // Count selected in this category
                        const catActivities = cat.activities || (cat.sections ? cat.sections.flatMap(s => s.activities) : []);
                        const selectedInCat = catActivities.filter(a => !!selectedActivities[a]);
                        const selectedCount = selectedInCat.length;

                        return (
                            <div key={cat.id} className={`border-[2px] rounded-[18px] sm:rounded-[24px] transition-all duration-300 ${selectedCount > 0 ? 'border-[var(--secondary-color)]/20 bg-[var(--secondary-color)]/5' : 'border-gray-50 bg-white shadow-sm'}`}>
                                <button
                                    onClick={() => toggleCategory(cat.id)}
                                    className="w-full flex items-center justify-between p-3 sm:p-5 cursor-pointer"
                                >
                                    <div className="flex items-center gap-3 sm:gap-5 min-w-0">
                                        <div className={`p-3 sm:p-4 rounded-[12px] sm:rounded-[16px] shrink-0 ${selectedCount > 0 ? 'bg-[var(--secondary-color)] !text-[#FAFAF7] shadow-lg' : 'bg-slate-50 text-[var(--primary-color)]'}`}>
                                            <Icon size={20} className="sm:w-6 sm:h-6" strokeWidth={selectedCount > 0 ? 2.5 : 2} />
                                        </div>
                                        <div className="text-left min-w-0">
                                            <h4 className={`font-brand font-bold text-sm sm:text-lg truncate ${selectedCount > 0 ? 'text-[var(--primary-color)]' : 'text-gray-700'}`}>{cat.name}</h4>
                                            <p className="text-[10px] sm:text-sm text-[var(--text-light)] font-secondary font-medium truncate sm:whitespace-normal">{cat.description}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 sm:gap-4 shrink-0 h-full">
                                        {selectedCount > 0 && (
                                            <span className="bg-[var(--secondary-color)] !text-[#FAFAF7] text-[8px] sm:text-xs font-black uppercase tracking-widest px-2 sm:px-3 py-1 sm:py-1.5 rounded-full flex items-center gap-1 shadow-sm">
                                                <Check size={10} className="sm:w-3 sm:h-3" strokeWidth={4} />
                                                {selectedCount}
                                            </span>
                                        )}
                                        {isCatOpen ? <ChevronDown size={18} className="text-[var(--text-light)] sm:w-5 sm:h-5" /> : <ChevronRight size={18} className="text-[var(--text-light)] sm:w-5 sm:h-5" />}
                                    </div>
                                </button>

                                {isCatOpen && (
                                    <div className="px-3 sm:px-5 pb-4 sm:pb-6 animate-slide-down">
                                        <div className="h-[2px] w-full bg-gray-50/50 mb-4 sm:mb-6"></div>

                                        {cat.sections ? (
                                            // Handle Nested Sections (Category 8)
                                            <div className="space-y-4 sm:space-y-6">
                                                {cat.sections.map((section, sIdx) => (
                                                    <div key={sIdx}>
                                                        <h5 className="text-[10px] font-black text-[var(--text-light)] uppercase tracking-[0.2em] mb-3 border-l-4 border-[var(--secondary-color)] pl-3">{section.name}</h5>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                                                            {section.activities.map((act, aIdx) => {
                                                                const isSelected = !!selectedActivities[act];
                                                                return (
                                                                    <div
                                                                        key={aIdx}
                                                                        onClick={() => toggleActivity(act)}
                                                                        className={`flex flex-col gap-3 p-3 sm:p-4 rounded-[16px] border-2 cursor-pointer transition-all ${isSelected ? 'border-[var(--secondary-color)] bg-white shadow-lg ring-1 ring-[var(--secondary-color)]/20' : 'border-gray-50 bg-gray-50/30 hover:bg-white hover:border-gray-200'}`}
                                                                    >
                                                                        <div className="flex items-center gap-3 sm:gap-4 min-h-[40px] sm:min-h-[48px]">
                                                                            <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-[10px] sm:rounded-[14px] border-2 flex items-center justify-center transition-all shrink-0 ${isSelected ? 'bg-[var(--secondary-color)] border-[var(--secondary-color)] scale-110' : 'border-gray-300 bg-white'}`}>
                                                                                {isSelected && <Check size={14} className="!text-[#FAFAF7] sm:w-4 sm:h-4" strokeWidth={4} />}
                                                                            </div>
                                                                            <span className={`text-xs sm:text-sm ${isSelected ? 'text-[var(--primary-color)] font-bold' : 'text-[var(--text-main)] font-medium font-secondary'}`}>{act}</span>
                                                                        </div>

                                                                        {isSelected && (
                                                                            <div className="flex items-center gap-3 animate-fade-in bg-slate-50 p-2 sm:p-3 rounded-[12px] border border-gray-100" onClick={e => e.stopPropagation()}>
                                                                                <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1 whitespace-nowrap">Hora:</label>
                                                                                <input
                                                                                    type="time"
                                                                                    value={selectedActivities[act]}
                                                                                    onChange={(e) => handleTimeChange(act, e.target.value)}
                                                                                    className="flex-1 bg-white border border-gray-200 px-3 sm:px-4 py-2 sm:py-3 rounded-[10px] sm:rounded-[12px] text-xs sm:text-sm font-bold focus:border-[var(--secondary-color)] outline-none min-h-[38px] sm:min-h-[44px] touch-manipulation"
                                                                                />
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            // Normal Activities
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                                                {cat.activities.map((act, idx) => {
                                                    const isSelected = !!selectedActivities[act];
                                                    return (
                                                        <div
                                                            key={idx}
                                                            onClick={() => toggleActivity(act)}
                                                            className={`flex flex-col gap-3 p-3 sm:p-4 rounded-[16px] border-2 cursor-pointer transition-all ${isSelected ? 'border-[var(--secondary-color)] bg-white shadow-lg ring-1 ring-[var(--secondary-color)]/20' : 'border-gray-50 bg-gray-50/30 hover:bg-white hover:border-gray-200'}`}
                                                        >
                                                            <div className="flex items-center gap-3 sm:gap-4 min-h-[40px] sm:min-h-[48px]">
                                                                <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-[10px] sm:rounded-[14px] border-2 flex items-center justify-center transition-all shrink-0 ${isSelected ? 'bg-[var(--secondary-color)] border-[var(--secondary-color)] scale-110' : 'border-gray-300 bg-white'}`}>
                                                                    {isSelected && <Check size={14} className="!text-[#FAFAF7] sm:w-4 sm:h-4" strokeWidth={4} />}
                                                                </div>
                                                                <span className={`text-xs sm:text-sm ${isSelected ? 'text-[var(--primary-color)] font-bold' : 'text-[var(--text-main)] font-medium font-secondary'}`}>{act}</span>
                                                            </div>

                                                            {isSelected && (
                                                                <div className="flex items-center gap-3 animate-fade-in bg-slate-50 p-2 sm:p-3 rounded-[12px] border border-gray-100" onClick={e => e.stopPropagation()}>
                                                                    <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1 whitespace-nowrap">Hora:</label>
                                                                    <input
                                                                        type="time"
                                                                        value={selectedActivities[act]}
                                                                        onChange={(e) => handleTimeChange(act, e.target.value)}
                                                                        className="flex-1 bg-white border border-gray-200 px-3 sm:px-4 py-2 sm:py-3 rounded-[10px] sm:rounded-[12px] text-xs sm:text-sm font-bold focus:border-[var(--secondary-color)] outline-none min-h-[38px] sm:min-h-[44px] touch-manipulation"
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Footer - ABSOLUTE BOTTOM */}
                <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 border-t border-gray-100 bg-white shadow-[0_-10px_30px_rgba(0,0,0,0.05)] sm:bg-white/95 sm:backdrop-blur-xl flex flex-col sm:flex-row justify-between items-center gap-4 z-20 shrink-0 pb-safe">
                    <div className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-[var(--text-light)]">
                        {Object.keys(selectedActivities).length} actividades seleccionadas
                    </div>
                    <div className="flex gap-3 w-full sm:w-auto">
                        <button onClick={onClose} className="flex-1 sm:flex-none btn bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 px-6 sm:px-8 text-[10px] sm:text-sm uppercase tracking-widest">
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex-2 sm:flex-none btn btn-primary px-8 sm:px-12 shadow-xl shadow-green-100 uppercase tracking-widest text-[10px] sm:text-sm"
                        >
                            {saving ? <Loader2 className="animate-spin" size={20} /> : <><Save size={20} className="sm:w-5 sm:h-5" /> Guardar Agenda</>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfigureAgendaModal;
