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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center pt-10 p-4 animate-fade-in overflow-y-auto">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl flex flex-col border border-white/20 overflow-hidden max-h-[90vh]">

                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <div>
                        <h3 className="text-2xl font-black text-gray-800">Configurar Agenda de Cuidado</h3>
                        <p className="text-sm text-gray-500 font-medium mt-1">Selecciona las actividades que el cuidador debe realizar hoy.</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white text-gray-400 rounded-xl hover:bg-gray-100 border border-gray-200 transition-all">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                    {CARE_AGENDA_CATEGORIES.map(cat => {
                        const Icon = IconMap[cat.icon] || Activity;
                        const isOpen = openCategories[cat.id];

                        // Count selected in this category
                        const catActivities = cat.activities || (cat.sections ? cat.sections.flatMap(s => s.activities) : []);
                        const selectedCount = catActivities.filter(a => selectedActivities.has(a)).length;

                        return (
                            <div key={cat.id} className={`border rounded-2xl transition-all duration-300 ${selectedCount > 0 ? 'border-blue-200 bg-blue-50/30' : 'border-gray-200 bg-white'}`}>
                                <button
                                    onClick={() => toggleCategory(cat.id)}
                                    className="w-full flex items-center justify-between p-4 cursor-pointer"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-xl ${selectedCount > 0 ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                                            <Icon size={24} />
                                        </div>
                                        <div className="text-left">
                                            <h4 className={`font-bold text-lg ${selectedCount > 0 ? 'text-blue-800' : 'text-gray-700'}`}>{cat.name}</h4>
                                            <p className="text-xs text-gray-500 font-medium">{cat.description}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        {selectedCount > 0 && (
                                            <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                                                <Check size={12} strokeWidth={3} />
                                                {selectedCount}
                                            </span>
                                        )}
                                        {isOpen ? <ChevronDown size={20} className="text-gray-400" /> : <ChevronRight size={20} className="text-gray-400" />}
                                    </div>
                                </button>

                                {isOpen && (
                                    <div className="px-4 pb-4 animate-slide-down">
                                        <div className="h-px w-full bg-gray-100 mb-4"></div>

                                        {cat.sections ? (
                                            // Handle Nested Sections (Category 8)
                                            <div className="space-y-4">
                                                {cat.sections.map((section, sIdx) => (
                                                    <div key={sIdx}>
                                                        <h5 className="font-bold text-sm text-gray-500 uppercase tracking-wider mb-2">{section.name}</h5>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                            {section.activities.map((act, aIdx) => {
                                                                const isSelected = selectedActivities.has(act);
                                                                return (
                                                                    <div
                                                                        key={aIdx}
                                                                        onClick={() => toggleActivity(act)}
                                                                        className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${isSelected ? 'border-blue-500 bg-white shadow-sm' : 'border-transparent hover:bg-gray-50'}`}
                                                                    >
                                                                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
                                                                            {isSelected && <Check size={12} className="text-white" strokeWidth={4} />}
                                                                        </div>
                                                                        <span className={`text-sm font-medium ${isSelected ? 'text-gray-900 font-bold' : 'text-gray-600'}`}>{act}</span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            // Normal Activities
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                {cat.activities.map((act, idx) => {
                                                    const isSelected = selectedActivities.has(act);
                                                    return (
                                                        <div
                                                            key={idx}
                                                            onClick={() => toggleActivity(act)}
                                                            className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${isSelected ? 'border-blue-500 bg-white shadow-sm' : 'border-transparent hover:bg-gray-50'}`}
                                                        >
                                                            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
                                                                {isSelected && <Check size={12} className="text-white" strokeWidth={4} />}
                                                            </div>
                                                            <span className={`text-sm font-medium ${isSelected ? 'text-gray-900 font-bold' : 'text-gray-600'}`}>{act}</span>
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
                <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-100 bg-white/95 backdrop-blur flex justify-between items-center z-10">
                    <div className="text-sm font-medium text-gray-500">
                        {selectedActivities.size} actividades seleccionadas
                    </div>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-200 transition-colors">
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-xl shadow-slate-200 transition-all active:scale-95 disabled:opacity-70"
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
