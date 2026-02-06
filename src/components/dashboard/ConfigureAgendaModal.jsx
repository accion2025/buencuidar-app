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
                <div className="p-6 sm:p-10 border-b border-gray-100 flex justify-between items-center bg-[var(--base-bg)] shrink-0">
                    <div>
                        <h3 className="text-2xl sm:text-4xl font-brand font-bold text-[var(--primary-color)] tracking-tight">Configurar Agenda de Cuidado</h3>
                        <p className="text-sm sm:text-lg text-[var(--text-light)] font-secondary mt-1 max-w-md">Selecciona las actividades y asigna un horario para hoy.</p>
                    </div>
                    <button onClick={onClose} className="p-2 sm:p-4 bg-white text-gray-400 rounded-[12px] sm:rounded-[20px] hover:bg-gray-50 border border-gray-100 transition-all shadow-sm">
                        <X size={28} />
                    </button>
                </div>

                {/* Content - FLEX-1 OVERFLOW-Y-AUTO */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-10 space-y-5 sm:space-y-8 custom-scrollbar pb-10 sm:pb-10 pb-safe">
                    {CARE_AGENDA_CATEGORIES.map(cat => {
                        const Icon = IconMap[cat.icon] || Activity;
                        const isCatOpen = openCategories[cat.id];

                        // Count selected in this category
                        const catActivities = cat.activities || (cat.sections ? cat.sections.flatMap(s => s.activities) : []);
                        const selectedInCat = catActivities.filter(a => !!selectedActivities[a]);
                        const selectedCount = selectedInCat.length;

                        return (
                            <div key={cat.id} className={`border-[3px] rounded-[24px] sm:rounded-[32px] transition-all duration-300 ${selectedCount > 0 ? 'border-[var(--secondary-color)]/20 bg-[var(--secondary-color)]/5 shadow-inner' : 'border-gray-50 bg-white shadow-md'}`}>
                                <button
                                    onClick={() => toggleCategory(cat.id)}
                                    className="w-full flex items-center justify-between p-5 sm:p-8 cursor-pointer"
                                >
                                    <div className="flex items-center gap-5 sm:gap-8 min-w-0">
                                        <div className={`p-4 sm:p-6 rounded-[16px] sm:rounded-[24px] shrink-0 ${selectedCount > 0 ? 'bg-[var(--secondary-color)] !text-[#FAFAF7] shadow-lg scale-110' : 'bg-slate-50 text-[var(--primary-color)]'}`}>
                                            <Icon size={28} className="sm:w-10 sm:h-10" strokeWidth={selectedCount > 0 ? 2.5 : 2} />
                                        </div>
                                        <div className="text-left min-w-0">
                                            <h4 className={`font-brand font-bold text-lg sm:text-2xl truncate ${selectedCount > 0 ? 'text-[var(--primary-color)]' : 'text-gray-700'}`}>{cat.name}</h4>
                                            <p className="text-xs sm:text-lg text-[var(--text-light)] font-secondary font-medium truncate sm:whitespace-normal leading-tight">{cat.description}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 sm:gap-6 shrink-0 h-full">
                                        {selectedCount > 0 && (
                                            <span className="bg-[var(--secondary-color)] !text-[#FAFAF7] text-[10px] sm:text-base font-black uppercase tracking-widest px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-full flex items-center gap-2 shadow-sm scale-105">
                                                <Check size={14} className="sm:w-5 sm:h-5" strokeWidth={4} />
                                                {selectedCount}
                                            </span>
                                        )}
                                        {isCatOpen ? <ChevronDown size={24} className="text-[var(--text-light)] sm:w-8 sm:h-8" /> : <ChevronRight size={24} className="text-[var(--text-light)] sm:w-8 sm:h-8" />}
                                    </div>
                                </button>

                                {isCatOpen && (
                                    <div className="px-5 sm:px-10 pb-6 sm:pb-10 animate-slide-down">
                                        <div className="h-[2px] w-full bg-gray-100/50 mb-6 sm:mb-10"></div>

                                        {cat.sections ? (
                                            // Handle Nested Sections (Category 8)
                                            <div className="space-y-6 sm:space-y-10">
                                                {cat.sections.map((section, sIdx) => (
                                                    <div key={sIdx}>
                                                        <h5 className="text-[10px] sm:text-sm font-black text-[var(--text-light)] uppercase tracking-[0.2em] mb-4 border-l-4 border-[var(--secondary-color)] pl-4">{section.name}</h5>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
                                                            {section.activities.map((act, aIdx) => {
                                                                const isSelected = !!selectedActivities[act];
                                                                return (
                                                                    <div
                                                                        key={aIdx}
                                                                        onClick={() => toggleActivity(act)}
                                                                        className={`flex flex-col gap-4 p-5 sm:p-7 rounded-[24px] border-2 cursor-pointer transition-all ${isSelected ? 'border-[var(--secondary-color)] bg-white shadow-2xl ring-2 ring-[var(--secondary-color)]/20 scale-[1.02]' : 'border-gray-50 bg-gray-50/20 hover:bg-white hover:border-gray-200'}`}
                                                                    >
                                                                        <div className="flex items-center gap-4 sm:gap-6 min-h-[56px] sm:min-h-[64px]">
                                                                            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-[12px] sm:rounded-[16px] border-[3px] flex items-center justify-center transition-all shrink-0 ${isSelected ? 'bg-[var(--secondary-color)] border-[var(--secondary-color)] scale-110' : 'border-gray-300 bg-white'}`}>
                                                                                {isSelected && <Check size={20} className="!text-[#FAFAF7] sm:w-6 sm:h-6" strokeWidth={4} />}
                                                                            </div>
                                                                            <span className={`text-base sm:text-xl ${isSelected ? 'text-[var(--primary-color)] font-bold' : 'text-[var(--text-main)] font-medium font-secondary'}`}>{act}</span>
                                                                        </div>

                                                                        {isSelected && (
                                                                            <div className="flex items-center gap-4 animate-fade-in bg-slate-50 p-4 sm:p-5 rounded-[18px] border border-gray-100" onClick={e => e.stopPropagation()}>
                                                                                <label className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-gray-400 ml-1 whitespace-nowrap">Hora:</label>
                                                                                <input
                                                                                    type="time"
                                                                                    value={selectedActivities[act]}
                                                                                    onChange={(e) => handleTimeChange(act, e.target.value)}
                                                                                    className="flex-1 bg-white border-2 border-slate-100 px-5 sm:px-6 py-3 sm:py-4 rounded-[14px] text-base sm:text-xl font-bold focus:border-[var(--secondary-color)] outline-none min-h-[50px] sm:min-h-[60px] touch-manipulation shadow-inner"
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
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
                                                {cat.activities.map((act, idx) => {
                                                    const isSelected = !!selectedActivities[act];
                                                    return (
                                                        <div
                                                            key={idx}
                                                            onClick={() => toggleActivity(act)}
                                                            className={`flex flex-col gap-4 p-5 sm:p-7 rounded-[24px] border-2 cursor-pointer transition-all ${isSelected ? 'border-[var(--secondary-color)] bg-white shadow-2xl ring-2 ring-[var(--secondary-color)]/20 scale-[1.02]' : 'border-gray-50 bg-gray-50/20 hover:bg-white hover:border-gray-200'}`}
                                                        >
                                                            <div className="flex items-center gap-4 sm:gap-6 min-h-[56px] sm:min-h-[64px]">
                                                                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-[12px] sm:rounded-[16px] border-[3px] flex items-center justify-center transition-all shrink-0 ${isSelected ? 'bg-[var(--secondary-color)] border-[var(--secondary-color)] scale-110' : 'border-gray-300 bg-white'}`}>
                                                                    {isSelected && <Check size={20} className="!text-[#FAFAF7] sm:w-6 sm:h-6" strokeWidth={4} />}
                                                                </div>
                                                                <span className={`text-base sm:text-xl ${isSelected ? 'text-[var(--primary-color)] font-bold' : 'text-[var(--text-main)] font-medium font-secondary'}`}>{act}</span>
                                                            </div>

                                                            {isSelected && (
                                                                <div className="flex items-center gap-4 animate-fade-in bg-slate-50 p-4 sm:p-5 rounded-[18px] border border-gray-100" onClick={e => e.stopPropagation()}>
                                                                    <label className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-gray-400 ml-1 whitespace-nowrap">Hora:</label>
                                                                    <input
                                                                        type="time"
                                                                        value={selectedActivities[act]}
                                                                        onChange={(e) => handleTimeChange(act, e.target.value)}
                                                                        className="flex-1 bg-white border-2 border-slate-100 px-5 sm:px-6 py-3 sm:py-4 rounded-[14px] text-base sm:text-xl font-bold focus:border-[var(--secondary-color)] outline-none min-h-[50px] sm:min-h-[60px] touch-manipulation shadow-inner"
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

                {/* Footer - FLEX FLOW */}
                <div className="shrink-0 p-6 sm:p-10 border-t border-gray-100 bg-white shadow-inner sm:bg-white/95 sm:backdrop-blur-2xl flex flex-col sm:flex-row justify-between items-center gap-6 z-30 pb-safe">
                    <div className="text-sm sm:text-lg font-black uppercase tracking-[0.1em] text-[var(--text-light)]">
                        {Object.keys(selectedActivities).length} actividades seleccionadas
                    </div>
                    <div className="flex gap-4 w-full sm:w-auto">
                        <button onClick={onClose} className="flex-1 sm:flex-none btn bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 px-10 py-5 text-sm sm:text-lg uppercase tracking-widest rounded-[18px]">
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex-[2] sm:flex-none btn btn-primary px-12 sm:px-16 py-5 shadow-2xl shadow-green-900/20 uppercase tracking-widest text-sm sm:text-lg rounded-[18px]"
                        >
                            {saving ? <Loader2 className="animate-spin" size={28} /> : <><Save size={28} className="sm:w-8 sm:h-8" /> Guardar Agenda</>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfigureAgendaModal;
