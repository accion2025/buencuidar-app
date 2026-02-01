import React, { useState, useEffect } from 'react';
import { X, Check, Save, ChevronDown, ChevronRight, Brain, Activity, ClipboardList, ShieldCheck, Heart, Stethoscope, UserCog, Home, Loader2 } from 'lucide-react';
import { CARE_AGENDA_CATEGORIES } from '../../constants/careAgenda';
import { supabase } from '../../lib/supabase';

// Helper to map icon string to component
const IconMap = {
    Brain, Activity, ClipboardList, ShieldCheck, Heart, Stethoscope, UserCog, Home
};

const ConfigureAgendaModal = ({ isOpen, onClose, appointmentId, currentAgenda = [], onSave }) => {
    const [selectedActivities, setSelectedActivities] = useState(new Set());
    const [openCategories, setOpenCategories] = useState({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // Load existing agenda
            const initialSet = new Set();
            if (Array.isArray(currentAgenda)) {
                currentAgenda.forEach(item => initialSet.add(item));
            }
            setSelectedActivities(initialSet);
        }
    }, [isOpen, currentAgenda]);

    const toggleCategory = (id) => {
        setOpenCategories(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const toggleActivity = (activity) => {
        const newSet = new Set(selectedActivities);
        if (newSet.has(activity)) {
            newSet.delete(activity);
        } else {
            newSet.add(activity);
        }
        setSelectedActivities(newSet);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const agendaArray = Array.from(selectedActivities);

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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center pt-10 p-6 animate-fade-in overflow-y-auto">
            <div className="bg-white rounded-[16px] shadow-2xl w-full max-w-3xl flex flex-col border border-white/20 overflow-hidden max-h-[90vh] relative">
                {/* Header */}
                <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-[var(--base-bg)]">
                    <div>
                        <h3 className="text-2xl font-brand font-bold text-[var(--primary-color)]">Configurar Agenda de Cuidado</h3>
                        <p className="text-sm text-[var(--text-light)] font-secondary mt-1">Selecciona las actividades que el cuidador debe realizar hoy.</p>
                    </div>
                    <button onClick={onClose} className="p-3 bg-white text-gray-400 rounded-[16px] hover:bg-gray-50 border border-gray-100 transition-all shadow-sm">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar pb-32">
                    {CARE_AGENDA_CATEGORIES.map(cat => {
                        const Icon = IconMap[cat.icon] || Activity;
                        const isOpen = openCategories[cat.id];

                        // Count selected in this category
                        const catActivities = cat.activities || (cat.sections ? cat.sections.flatMap(s => s.activities) : []);
                        const selectedCount = catActivities.filter(a => selectedActivities.has(a)).length;

                        return (
                            <div key={cat.id} className={`border-[2px] rounded-[24px] transition-all duration-300 ${selectedCount > 0 ? 'border-[var(--secondary-color)]/20 bg-[var(--secondary-color)]/5' : 'border-gray-100 bg-white'}`}>
                                <button
                                    onClick={() => toggleCategory(cat.id)}
                                    className="w-full flex items-center justify-between p-5 cursor-pointer"
                                >
                                    <div className="flex items-center gap-5">
                                        <div className={`p-4 rounded-[16px] ${selectedCount > 0 ? 'bg-[var(--secondary-color)] !text-[#FAFAF7] shadow-lg' : 'bg-[var(--base-bg)] text-[var(--primary-color)]'}`}>
                                            <Icon size={24} strokeWidth={selectedCount > 0 ? 2.5 : 2} />
                                        </div>
                                        <div className="text-left">
                                            <h4 className={`font-brand font-bold text-lg ${selectedCount > 0 ? 'text-[var(--primary-color)]' : 'text-gray-700'}`}>{cat.name}</h4>
                                            <p className="text-sm text-[var(--text-light)] font-secondary font-medium">{cat.description}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        {selectedCount > 0 && (
                                            <span className="bg-[var(--secondary-color)] !text-[#FAFAF7] text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                                                <Check size={12} strokeWidth={4} />
                                                {selectedCount}
                                            </span>
                                        )}
                                        {isOpen ? <ChevronDown size={20} className="text-[var(--text-light)]" /> : <ChevronRight size={20} className="text-[var(--text-light)]" />}
                                    </div>
                                </button>

                                {isOpen && (
                                    <div className="px-5 pb-6 animate-slide-down">
                                        <div className="h-[2px] w-full bg-gray-50 mb-6"></div>

                                        {cat.sections ? (
                                            // Handle Nested Sections (Category 8)
                                            <div className="space-y-6">
                                                {cat.sections.map((section, sIdx) => (
                                                    <div key={sIdx}>
                                                        <h5 className="text-xs font-black text-[var(--text-light)] uppercase tracking-[0.2em] mb-4 border-l-4 border-[var(--secondary-color)] pl-3">{section.name}</h5>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                            {section.activities.map((act, aIdx) => {
                                                                const isSelected = selectedActivities.has(act);
                                                                return (
                                                                    <div
                                                                        key={aIdx}
                                                                        onClick={() => toggleActivity(act)}
                                                                        className={`flex items-center gap-4 p-4 rounded-[16px] border-2 cursor-pointer transition-all ${isSelected ? 'border-[var(--secondary-color)] bg-white shadow-lg ring-1 ring-[var(--secondary-color)]/20' : 'border-gray-50 bg-gray-50/30 hover:bg-white hover:border-gray-200'}`}
                                                                    >
                                                                        <div className={`w-6 h-6 rounded-[16px] border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-[var(--secondary-color)] border-[var(--secondary-color)] scale-110' : 'border-gray-300 bg-white'}`}>
                                                                            {isSelected && <Check size={14} className="!text-[#FAFAF7]" strokeWidth={4} />}
                                                                        </div>
                                                                        <span className={`text-sm ${isSelected ? 'text-[var(--primary-color)] font-bold' : 'text-[var(--text-main)] font-medium font-secondary'}`}>{act}</span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            // Normal Activities
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {cat.activities.map((act, idx) => {
                                                    const isSelected = selectedActivities.has(act);
                                                    return (
                                                        <div
                                                            key={idx}
                                                            onClick={() => toggleActivity(act)}
                                                            className={`flex items-center gap-4 p-4 rounded-[16px] border-2 cursor-pointer transition-all ${isSelected ? 'border-[var(--secondary-color)] bg-white shadow-lg ring-1 ring-[var(--secondary-color)]/20' : 'border-gray-50 bg-gray-50/30 hover:bg-white hover:border-gray-200'}`}
                                                        >
                                                            <div className={`w-6 h-6 rounded-[16px] border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-[var(--secondary-color)] border-[var(--secondary-color)] scale-110' : 'border-gray-300 bg-white'}`}>
                                                                {isSelected && <Check size={14} className="!text-[#FAFAF7]" strokeWidth={4} />}
                                                            </div>
                                                            <span className={`text-sm ${isSelected ? 'text-[var(--primary-color)] font-bold' : 'text-[var(--text-main)] font-medium font-secondary'}`}>{act}</span>
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

                {/* Footer */}
                <div className="absolute bottom-0 left-0 right-0 p-8 border-t border-gray-100 bg-white/95 backdrop-blur-xl flex justify-between items-center z-10">
                    <div className="text-xs font-black uppercase tracking-widest text-[var(--text-light)]">
                        {selectedActivities.size} actividades seleccionadas
                    </div>
                    <div className="flex gap-4">
                        <button onClick={onClose} className="btn bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 px-8">
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="btn btn-primary px-10 shadow-xl shadow-green-100 uppercase tracking-widest"
                        >
                            {saving ? <Loader2 className="animate-spin" size={20} /> : <><Save size={20} /> Guardar Agenda</>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfigureAgendaModal;
