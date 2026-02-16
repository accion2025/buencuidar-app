import React, { useState, useEffect } from 'react';
import {
    X,
    ChevronRight,
    ChevronLeft,
    Calendar as CalendarIcon,
    Stethoscope,
    ClipboardList,
    CheckCircle2,
    Activity,
    Clock,
    Heart,
    ShieldCheck,
    Plus,
    Dumbbell,
    HeartPulse,
    Accessibility,
    HandHeart,
    Coffee,
    MapPin,
    Search
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

// Icon mapping based on init_bc_cuidado_plus.sql
const ICON_MAP = {
    'Activity': Activity,
    'Heart': Heart,
    'ShieldCheck': ShieldCheck,
    'Dumbbell': Dumbbell,
    'HeartPulse': HeartPulse,
    'Accessibility': Accessibility,
    'HandHeart': HandHeart,
    'Coffee': Coffee
};

const CreateServiceWizard = ({ isOpen, onClose, onComplete, patients, initialData, isSaving, isRestricted, initialStep = 1 }) => {
    const { user, profile } = useAuth();
    const [step, setStep] = useState(initialStep);
    const [programs, setPrograms] = useState([]);
    const [loading, setLoading] = useState(false);
    const [programsLoading, setProgramsLoading] = useState(false);
    const [fetchError, setFetchError] = useState(null);

    // Form State
    const [selection, setSelection] = useState({
        customTitle: '', // Paso 1: Título manual
        startDate: '',
        endDate: '',
        startTime: '08:00',
        endTime: '16:00',
        patient_id: patients[0]?.id || '',
        address: profile?.address || '',
        selectedPrograms: [],
        agendaItems: [],
        originalProgramIds: [], // Track programs from initial contract
        service_group_id: null // Track if editing existing group
    });

    useEffect(() => {
        if (isOpen) {
            // Reset or Set Step based on prop
            if (!initialData && !isRestricted) {
                setStep(initialStep);
            }

            if (initialData) {
                console.log("Cargando datos para edición:", initialData);

                const loadRestricted = async () => {
                    // Always hydrate to ensure all templates are available for selection, 
                    // even if not restricted (e.g. full package edit).
                    // This allows users to add activities that were not previously selected.
                    await hydrateRestrictedAgenda(initialData.selectedPrograms, initialData.agendaItems || []);

                    setSelection(prev => ({
                        ...prev,
                        customTitle: initialData.customTitle || '',
                        startDate: initialData.startDate || '',
                        endDate: initialData.endDate || '',
                        startTime: initialData.startTime || '08:00',
                        endTime: initialData.endTime || '16:00',
                        patient_id: initialData.patient_id || patients[0]?.id || '',
                        address: initialData.address || profile?.address || '',
                        selectedPrograms: initialData.selectedPrograms || [],
                        originalProgramIds: (initialData.selectedPrograms || []).map(p => p.id),
                        // agendaItems is set inside hydrateRestrictedAgenda
                        service_group_id: initialData.service_group_id || null
                    }));

                    let targetStep = initialStep;
                    if (initialData && targetStep === 1) targetStep = 2;

                    // BC Cuidado Plus: If only one program exists, Step 2 is redundant (User said: "ira directamente a la agenda")
                    if (targetStep === 2 && initialData.selectedPrograms?.length === 1) {
                        targetStep = 3;
                    }

                    setStep(targetStep);
                };
                loadRestricted();

            } else if (!initialData) {
                // ... reset logic ...
                setSelection({
                    customTitle: '',
                    startDate: '',
                    endDate: '',
                    startTime: '08:00',
                    endTime: '16:00',
                    patient_id: patients[0]?.id || '',
                    address: profile?.address || '',
                    selectedPrograms: [],
                    agendaItems: [],
                    service_group_id: null
                });
                setStep(initialStep);
            }
        }
    }, [isOpen, initialData, isRestricted, initialStep, patients, profile]);

    const hydrateRestrictedAgenda = async (selectedPrograms, existingAgenda) => {
        if (!selectedPrograms || selectedPrograms.length === 0) return;

        try {
            setLoading(true);
            const programIds = selectedPrograms.map(p => p.id);
            const { data: templates, error } = await supabase
                .from('care_program_templates')
                .select('*')
                .in('program_id', programIds);

            if (error) throw error;

            // Merge existing agenda with full template list
            const mergedAgenda = (templates || []).map(t => {
                // Find if this template is already in the existing agenda
                const programName = selectedPrograms.find(p => p.id === t.program_id)?.name;
                const existingItem = existingAgenda.find(item =>
                    item.name === t.activity_name && item.program_name === programName
                );

                if (existingItem) {
                    return existingItem; // Keep existing configuration
                } else {
                    return {
                        id: Math.random().toString(36).substr(2, 9),
                        name: t.activity_name,
                        category: t.category,
                        cycles: [{ startTime: '', endTime: '' }],
                        completed: false,
                        is_suggested: true,
                        selected: false,
                        program_name: programName || ''
                    };
                }
            });

            // Also keep any custom items in existingAgenda that might not match a template
            const customItems = existingAgenda.filter(item =>
                !mergedAgenda.some(m => m.name === item.name && m.program_name === item.program_name) &&
                !mergedAgenda.some(m => m.id === item.id)
            );

            setSelection(prev => ({ ...prev, agendaItems: [...mergedAgenda, ...customItems] }));

        } catch (error) {
            console.error("Error hydrating agenda:", error);
            setSelection(prev => ({ ...prev, agendaItems: existingAgenda || [] }));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && programs.length === 0) {
            fetchPrograms();
        }
    }, [isOpen, programs.length]);

    const fetchPrograms = async () => {
        try {
            setProgramsLoading(true);
            setFetchError(null);
            const { data, error } = await supabase
                .from('care_programs')
                .select('*')
                .order('name');
            if (error) throw error;
            setPrograms(data || []);
        } catch (error) {
            console.error("Error fetching programs:", error);
            setFetchError("No se pudieron cargar los programas. Por favor, intenta de nuevo.");
        } finally {
            setProgramsLoading(false);
        }
    };

    if (!isOpen) return null;

    const nextStep = async () => {
        try {
            if (step === 1) {
                if (!selection.patient_id) {
                    alert("Por favor, selecciona a quién cuidaremos.");
                    return;
                }
                // Validación de mínimo 3 días
                if (!selection.startDate || !selection.endDate) return;
                const start = new Date(selection.startDate);
                const end = new Date(selection.endDate);
                const diffTime = Math.abs(end - start);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

                if (diffDays < 3) {
                    alert("El mínimo de días para crear un servicio Cuidado+ es de 3 días.");
                    return;
                }
                if (!selection.customTitle.trim()) {
                    alert("Por favor, introduce un título para el servicio.");
                    return;
                }

                // OPTIMIZATION: If editing a package with only 1 program, skip Step 2 (Programs)
                // as the user cannot add new ones anyway per policy.
                if (initialData && selection.selectedPrograms.length === 1) {
                    await generateAgenda();
                    setStep(3);
                    return;
                }
            }
            if (step === 2) {
                if (selection.selectedPrograms.length === 0) {
                    alert("Debes seleccionar al menos un programa de cuidado.");
                    return;
                }
                await generateAgenda();
            }
            if (step === 3) {
                const activeActivities = selection.agendaItems.filter(i => i.selected);
                if (activeActivities.length === 0) {
                    alert("Debes seleccionar al menos una actividad para el plan de cuidado.");
                    return;
                }

                // BC Cuidado Plus: Política de Ciclos Cerrados y Validación de Tiempos
                for (const item of activeActivities) {
                    for (const cycle of item.cycles) {
                        if (!cycle.startTime || !cycle.endTime) {
                            alert(`Por favor, define el ciclo completo (inicio y fin) para la actividad: ${item.name}`);
                            return;
                        }

                        // Comparación de tiempos (en formato HH:mm)
                        if (cycle.endTime < cycle.startTime) {
                            alert(`Error en "${item.name}": La hora de finalización (${cycle.endTime}) no puede ser anterior a la de inicio (${cycle.startTime}).`);
                            return;
                        }

                        // Límite del turno
                        if (cycle.endTime > selection.endTime) {
                            alert(`Error en "${item.name}": La hora de finalización del ciclo (${cycle.endTime}) no puede exceder la hora de término del turno (${selection.endTime}).`);
                            return;
                        }
                    }
                }
            }
            setStep(prev => Math.min(prev + 1, 4));
        } catch (error) {
            console.error("Error avanzando paso:", error);
            if (step === 2) {
                alert("Hubo un error al generar la agenda. Por favor intenta de nuevo.");
            }
        }
    };

    const generateAgenda = async () => {
        try {
            setLoading(true);
            const programIds = selection.selectedPrograms.map(p => p.id);

            const { data, error } = await supabase
                .from('care_program_templates')
                .select('*')
                .in('program_id', programIds);

            if (error) throw error;

            // Merge Logic (Same as hydrateRestrictedAgenda but using current state)
            const currentAgenda = selection.agendaItems;

            const newAgenda = (data || []).map(t => {
                const programName = selection.selectedPrograms.find(p => p.id === t.program_id)?.name;

                // Try to find matching item in current selection
                // Logic: Match by name AND program_name
                const existingItem = currentAgenda.find(item =>
                    item.name === t.activity_name &&
                    item.program_name === programName
                );

                if (existingItem) {
                    return existingItem;
                }

                return {
                    id: Math.random().toString(36).substr(2, 9),
                    name: t.activity_name,
                    category: t.category,
                    cycles: [{ startTime: '', endTime: '' }],
                    completed: false,
                    is_suggested: true,
                    selected: false,
                    program_name: programName || ''
                };
            });

            // Preserve Custom Items (items not in templates)
            // Filter out items that are NOT in the new template list (by name+program)
            // BUT wait, if a user deselects a program in Step 2, we SHOULD remove its activities in Step 3?
            // Yes, duplicate logic above suggests we rebuild from templates.
            // But we should keep "Personalized" activities (category='personalizado').

            const customItems = currentAgenda.filter(item => item.category === 'personalizado');

            // What about items from a program that is STILL selected but somehow not in templates? Unlikely.
            // The main use case to preserve is: User selected Program A, configured Activity A1. 
            // User goes back, adds Program B. Next.
            // Activity A1 should be preserved.

            // My merge logic above handles A1 because it finds it in `currentAgenda`.
            // But `newAgenda` only iterates over `data` (templates of selected programs).
            // So if Program A is still selected, its templates are in `data`, so A1 is found and preserved.
            // If Program A is DESELECTED, its templates are NOT in `data`. So A1 is NOT in `newAgenda`.
            // This is correct behavior: Deselected program activities should be removed.

            // Only 'personalizado' items should be rigorously kept if they don't depend on a program?
            // Actually personalized items usually have `program_name`. If that program is gone, maybe we remove them too?
            // Or we keep them. Let's keep them for safety.

            setSelection(prev => ({ ...prev, agendaItems: [...newAgenda, ...customItems] }));

        } catch (error) {
            console.error("Error generating agenda:", error);
            throw error;
        } finally {
            setLoading(false);
        }
    };
    const prevStep = () => {
        // OPTIMIZATION: Jump back from Agenda to Dates if there's only 1 program
        if (step === 3 && initialData && selection.selectedPrograms.length === 1 && !isRestricted) {
            setStep(1);
            return;
        }
        setStep(prev => Math.max(prev - 1, 1));
    };

    const renderStepIndicator = () => (
        <div className="flex items-center justify-between mb-10 px-4">
            {[
                { s: 1, label: 'Fechas', icon: CalendarIcon },
                { s: 2, label: 'Programas', icon: Stethoscope },
                { s: 3, label: 'Agenda', icon: ClipboardList },
                { s: 4, label: 'Publicar', icon: CheckCircle2 }
            ].map((item, i) => (
                <div key={item.s} className={`flex items-center flex-1 last:flex-none ${isRestricted && item.s < 3 ? 'opacity-30 pointer-events-none' : ''}`}>
                    <div className="flex flex-col items-center gap-2 relative z-10">
                        <div className={`w-12 h-12 rounded-[12px] flex items-center justify-center transition-all duration-500 border-2 ${step >= item.s
                            ? 'bg-[var(--secondary-color)] border-[var(--secondary-color)] text-white shadow-lg shadow-green-100'
                            : 'bg-white border-gray-100 text-gray-400'
                            }`}>
                            <item.icon size={20} />
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${step >= item.s ? 'text-[var(--secondary-color)]' : 'text-gray-400'
                            }`}>
                            {item.label}
                        </span>
                    </div>
                    {i < 3 && (
                        <div className={`flex-1 h-0.5 mx-4 transition-all duration-700 ${step > item.s ? 'bg-[var(--secondary-color)]' : 'bg-gray-100'
                            } ${isRestricted ? 'opacity-30' : ''}`} />
                    )}
                </div>
            ))}
        </div>
    );

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}></div>

            <div className="bg-white w-full max-w-4xl rounded-[20px] shadow-2xl relative overflow-hidden flex flex-col h-[90vh] md:h-auto max-h-[90vh] animate-scale-up">
                {/* Header */}
                <div className="px-10 py-8 flex justify-between items-center border-b border-gray-50">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-[12px] bg-emerald-50 text-[var(--secondary-color)] flex items-center justify-center">
                            <Activity size={24} className="animate-pulse" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-brand font-bold text-[var(--primary-color)] tracking-tight">
                                {isRestricted ? 'Editar Actividades del Día' : 'Asistente Cuidado+'}
                            </h2>
                            <p className="text-[10px] text-[var(--text-light)] font-black uppercase tracking-widest">
                                {isRestricted ? 'Ajuste rápido de agenda' : `Paso ${step} de 4`}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-3 hover:bg-gray-100 rounded-[12px] transition-colors text-gray-400"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-grow overflow-y-auto px-10 py-12">
                    {renderStepIndicator()}

                    {step === 1 && (
                        <div className="space-y-8 animate-fade-in">
                            <div className="text-center max-w-lg mx-auto mb-10">
                                <h3 className="text-3xl font-brand font-bold text-[var(--primary-color)] mb-3">¿Cuándo necesitas el servicio?</h3>
                                <p className="text-sm text-[var(--text-light)] font-secondary leading-relaxed">
                                    Define el periodo y el turno de atención. Los servicios Cuidado+ están diseñados para planes de mediano y largo plazo.
                                </p>
                            </div>
                            {/* Placeholder for Date Inputs */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-[var(--base-bg)]/50 p-8 rounded-[16px] border border-gray-100">
                                <div className="space-y-3 col-span-full">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--primary-color)] ml-2">Título del Servicio (Manual)</label>
                                    <input
                                        type="text"
                                        placeholder="Ej. Cuidados Post-Operatorios Sr. Juan"
                                        className="w-full bg-white border-2 border-transparent focus:border-[var(--secondary-color)] rounded-[12px] p-5 font-brand font-bold text-lg shadow-sm transition-all outline-none"
                                        value={selection.customTitle}
                                        onChange={(e) => setSelection({ ...selection, customTitle: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-3 col-span-full">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--primary-color)] ml-2">¿A quién cuidaremos?</label>
                                    <select
                                        className="w-full bg-white border-2 border-transparent focus:border-[var(--secondary-color)] rounded-[12px] p-5 font-brand font-bold text-lg shadow-sm transition-all outline-none appearance-none cursor-pointer"
                                        value={selection.patient_id}
                                        onChange={(e) => setSelection({ ...selection, patient_id: e.target.value })}
                                    >
                                        <option value="">Seleccionar familiar...</option>
                                        {patients.map(p => (
                                            <option key={p.id} value={p.id}>{p.full_name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-3 col-span-full">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--primary-color)] ml-2">Dirección del Servicio</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                        <input
                                            type="text"
                                            placeholder="¿Dónde realizaremos el cuidado?"
                                            className="w-full bg-white border-2 border-transparent focus:border-[var(--secondary-color)] rounded-[12px] p-5 pl-14 font-brand font-bold text-lg shadow-sm transition-all outline-none"
                                            value={selection.address}
                                            onChange={(e) => setSelection({ ...selection, address: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--primary-color)] ml-2">Fecha de Inicio</label>
                                    <input
                                        type="date"
                                        className="w-full bg-white border-2 border-transparent focus:border-[var(--secondary-color)] rounded-[12px] p-5 font-brand font-bold text-lg shadow-sm transition-all outline-none"
                                        value={selection.startDate}
                                        onChange={(e) => setSelection({ ...selection, startDate: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--primary-color)] ml-2">Fecha de Fin</label>
                                    <input
                                        type="date"
                                        className="w-full bg-white border-2 border-transparent focus:border-[var(--secondary-color)] rounded-[12px] p-5 font-brand font-bold text-lg shadow-sm transition-all outline-none"
                                        value={selection.endDate}
                                        onChange={(e) => setSelection({ ...selection, endDate: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--primary-color)] ml-2">Hora Entrada</label>
                                    <input
                                        type="time"
                                        className="w-full bg-white border-2 border-transparent focus:border-[var(--secondary-color)] rounded-[12px] p-5 font-brand font-bold text-lg shadow-sm transition-all outline-none"
                                        value={selection.startTime}
                                        onChange={(e) => setSelection({ ...selection, startTime: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--primary-color)] ml-2">Hora Salida</label>
                                    <input
                                        type="time"
                                        className="w-full bg-white border-2 border-transparent focus:border-[var(--secondary-color)] rounded-[12px] p-5 font-brand font-bold text-lg shadow-sm transition-all outline-none"
                                        value={selection.endTime}
                                        onChange={(e) => setSelection({ ...selection, endTime: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-8 animate-fade-in">
                            <div className="text-center max-w-lg mx-auto mb-10">
                                <h3 className="text-3xl font-brand font-bold text-[var(--primary-color)] mb-3">Elige los Programas</h3>
                                <p className="text-sm text-[var(--text-light)] font-secondary">
                                    Selecciona uno o varios motivos para el cuidado. Esto cargará automáticamente las tareas recomendadas.
                                </p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {programsLoading ? (
                                    Array(6).fill(0).map((_, i) => (
                                        <div key={i} className="p-8 rounded-[16px] bg-gray-50 border-2 border-transparent animate-pulse h-[180px]">
                                            <div className="w-14 h-14 rounded-[20px] bg-gray-200 mb-6"></div>
                                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                            <div className="h-3 bg-gray-200 rounded w-full"></div>
                                        </div>
                                    ))
                                ) : fetchError ? (
                                    <div className="col-span-full py-12 text-center bg-red-50 rounded-[16px] border-2 border-red-100">
                                        <p className="text-red-500 font-bold mb-4">{fetchError}</p>
                                        <button
                                            onClick={fetchPrograms}
                                            className="px-6 py-2 bg-red-500 text-white rounded-full font-bold text-sm hover:bg-red-600 transition-colors"
                                        >
                                            REINTENTAR CARGA
                                        </button>
                                    </div>
                                ) : programs.length === 0 ? (
                                    <div className="col-span-full py-12 text-center bg-amber-50 rounded-[16px] border-2 border-amber-100">
                                        <p className="text-amber-600 font-bold">No se encontraron programas disponibles.</p>
                                    </div>
                                ) : (
                                    programs.map((program) => {
                                        const Icon = ICON_MAP[program.icon_name] || Activity;
                                        const isSelected = selection.selectedPrograms.find(p => p.id === program.id);

                                        // Restrict adding NEW programs during edition but allow toggling originals
                                        const isEditing = !!initialData;
                                        const isDisabled = isEditing && !selection.originalProgramIds.includes(program.id);

                                        return (
                                            <div
                                                key={program.id}
                                                onClick={() => {
                                                    if (isDisabled) return;
                                                    const newSelection = isSelected
                                                        ? selection.selectedPrograms.filter(p => p.id !== program.id)
                                                        : [...selection.selectedPrograms, program];
                                                    setSelection({ ...selection, selectedPrograms: newSelection });
                                                }}
                                                className={`p-8 rounded-[16px] border-2 transition-all duration-300 relative group overflow-hidden ${isDisabled
                                                    ? 'bg-gray-50 border-gray-100 opacity-50 cursor-not-allowed grayscale'
                                                    : 'cursor-pointer hover:border-gray-200 hover:bg-white'
                                                    } ${isSelected
                                                        ? 'bg-emerald-50 border-[var(--secondary-color)] shadow-xl !opacity-100 !grayscale-0'
                                                        : !isDisabled ? 'bg-[var(--base-bg)]/30 border-transparent' : ''
                                                    }`}
                                            >
                                                <div className={`w-14 h-14 rounded-[12px] mb-6 flex items-center justify-center transition-all ${isSelected ? 'bg-[var(--secondary-color)] text-white' : 'bg-white text-gray-400 group-hover:text-[var(--secondary-color)] shadow-sm'
                                                    }`}>
                                                    <Icon size={28} />
                                                </div>
                                                <h4 className="font-brand font-bold text-lg text-[var(--primary-color)] mb-2">{program.name}</h4>
                                                <p className="text-xs text-[var(--text-light)] font-secondary leading-relaxed line-clamp-2">{program.description}</p>

                                                {isSelected && (
                                                    <div className="absolute top-4 right-4 text-[var(--secondary-color)]">
                                                        <CheckCircle2 size={24} />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-8 animate-fade-in mb-10">
                            <div className="text-center max-w-lg mx-auto mb-10">
                                <h3 className="text-3xl font-brand font-bold text-[var(--primary-color)] mb-3">Agenda de Cuidado</h3>
                                <p className="text-sm text-[var(--text-light)] font-secondary leading-relaxed">
                                    Configura las actividades diarias para los programas seleccionados. Selecciona las tareas y asigna un horario específico.
                                </p>

                                {/* BC Cuidado Plus: Nota Aclaratoria de Políticas */}
                                <div className="mt-6 p-4 bg-amber-50 border border-amber-100 rounded-[12px] flex items-start gap-3 text-left">
                                    <Info size={18} className="text-amber-600 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-amber-700 mb-1">Políticas de Horarios Cuidado+</p>
                                        <ul className="text-[11px] text-amber-800 space-y-1 font-secondary">
                                            <li>• Toda actividad debe tener un ciclo cerrado (Hora Inicio y Fin).</li>
                                            <li>• La hora de fin puede ser igual a la de inicio, pero nunca menor.</li>
                                            <li>• Los ciclos deben estar dentro del horario del turno ({selection.startTime} - {selection.endTime}).</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                {loading ? (
                                    <div className="flex flex-col items-center py-20 gap-4">
                                        <Activity size={48} className="animate-spin text-[var(--secondary-color)] opacity-20" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Generando protocolos personalizados...</p>
                                    </div>
                                ) : (
                                    selection.selectedPrograms.map((program) => {
                                        const programItems = selection.agendaItems.filter(item => item.program_name === program.name);
                                        const activeInProgram = programItems.filter(i => i.selected).length;

                                        return (
                                            <div key={program.id} className="bg-white border-2 border-slate-100 rounded-[16px] overflow-hidden transition-all hover:border-emerald-100">
                                                {/* Accordion Header */}
                                                <div className="p-6 bg-slate-50/50 flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-[10px] bg-white text-[var(--secondary-color)] flex items-center justify-center shadow-sm">
                                                            {ICON_MAP[program.icon_name] ? React.createElement(ICON_MAP[program.icon_name], { size: 20 }) : <Activity size={20} />}
                                                        </div>
                                                        <div>
                                                            <h4 className="font-brand font-bold text-[var(--primary-color)]">{program.name}</h4>
                                                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{program.description}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${activeInProgram > 0 ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                                                            {activeInProgram} ACTIVIDADES
                                                        </span>
                                                        <ChevronRight size={18} className="text-gray-300" />
                                                    </div>
                                                </div>

                                                {/* Grid of Activities */}
                                                <div className="p-8 flex flex-col gap-6">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        {programItems.map((item) => (
                                                            <div
                                                                key={item.id}
                                                                className={`p-5 rounded-[12px] border-2 transition-all flex flex-col gap-4 ${item.selected ? 'bg-emerald-50/30 border-emerald-100' : 'bg-white border-transparent hover:border-slate-50'}`}
                                                            >
                                                                <div className="flex items-start justify-between">
                                                                    <div className="flex items-center gap-4 w-full">
                                                                        <div
                                                                            onClick={() => {
                                                                                const newAgenda = selection.agendaItems.map(i =>
                                                                                    i.id === item.id ? { ...i, selected: !i.selected } : i
                                                                                );
                                                                                setSelection({ ...selection, agendaItems: newAgenda });
                                                                            }}
                                                                            className={`w-8 h-8 rounded-[10px] flex-shrink-0 flex items-center justify-center cursor-pointer transition-all ${item.selected ? 'bg-[var(--secondary-color)] text-white' : 'bg-slate-100 text-transparent border border-slate-200'}`}
                                                                        >
                                                                            <CheckCircle2 size={16} />
                                                                        </div>
                                                                        {/* Editable Activity Name */}
                                                                        <input
                                                                            type="text"
                                                                            value={item.name}
                                                                            onChange={(e) => {
                                                                                const newAgenda = selection.agendaItems.map(i =>
                                                                                    i.id === item.id ? { ...i, name: e.target.value } : i
                                                                                );
                                                                                setSelection({ ...selection, agendaItems: newAgenda });
                                                                            }}
                                                                            className={`font-brand font-bold text-sm bg-transparent border-b border-transparent focus:border-gray-300 outline-none w-full transition-colors ${item.selected ? 'text-[var(--primary-color)]' : 'text-gray-400'}`}
                                                                        />
                                                                    </div>
                                                                </div>

                                                                {item.selected && (
                                                                    <div className="space-y-4 animate-fade-in border-t border-emerald-100/50 pt-4">
                                                                        {item.cycles.map((cycle, cycleIdx) => (
                                                                            <div key={cycleIdx} className="space-y-3 p-4 bg-white border border-slate-100 rounded-xl relative group/cycle">
                                                                                <div className="flex justify-between items-center mb-1">
                                                                                    <span className="text-[9px] font-black uppercase tracking-widest text-[#0F3C4C]">Ciclo {cycleIdx + 1}</span>
                                                                                    {item.cycles.length > 1 && (
                                                                                        <button
                                                                                            onClick={() => {
                                                                                                const newCycles = item.cycles.filter((_, idx) => idx !== cycleIdx);
                                                                                                const newAgenda = selection.agendaItems.map(i =>
                                                                                                    i.id === item.id ? { ...i, cycles: newCycles } : i
                                                                                                );
                                                                                                setSelection({ ...selection, agendaItems: newAgenda });
                                                                                            }}
                                                                                            className="text-red-400 hover:text-red-600 p-1"
                                                                                        >
                                                                                            <X size={12} />
                                                                                        </button>
                                                                                    )}
                                                                                </div>
                                                                                <div className="grid grid-cols-2 gap-4">
                                                                                    <div className="space-y-1">
                                                                                        <span className="text-[8px] font-black uppercase tracking-widest text-gray-400">INICIO:</span>
                                                                                        <div className="flex items-center justify-between border border-slate-100 bg-slate-50 shadow-sm rounded-lg px-2 py-1.5 transition-all focus-within:border-[var(--secondary-color)]">
                                                                                            <input
                                                                                                type="time"
                                                                                                className="bg-transparent font-brand font-bold text-[var(--primary-color)] outline-none text-[12px] w-full"
                                                                                                value={cycle.startTime}
                                                                                                onChange={(e) => {
                                                                                                    const newCycles = item.cycles.map((c, idx) =>
                                                                                                        idx === cycleIdx ? { ...c, startTime: e.target.value } : c
                                                                                                    );
                                                                                                    const newAgenda = selection.agendaItems.map(i =>
                                                                                                        i.id === item.id ? { ...i, cycles: newCycles } : i
                                                                                                    );
                                                                                                    setSelection({ ...selection, agendaItems: newAgenda });
                                                                                                }}
                                                                                            />
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="space-y-1">
                                                                                        <span className="text-[8px] font-black uppercase tracking-widest text-gray-400">FIN:</span>
                                                                                        <div className="flex items-center justify-between border border-slate-100 bg-slate-50 shadow-sm rounded-lg px-2 py-1.5 transition-all focus-within:border-[var(--secondary-color)]">
                                                                                            <input
                                                                                                type="time"
                                                                                                className="bg-transparent font-brand font-bold text-[var(--primary-color)] outline-none text-[12px] w-full"
                                                                                                value={cycle.endTime}
                                                                                                onChange={(e) => {
                                                                                                    const newCycles = item.cycles.map((c, idx) =>
                                                                                                        idx === cycleIdx ? { ...c, endTime: e.target.value } : c
                                                                                                    );
                                                                                                    const newAgenda = selection.agendaItems.map(i =>
                                                                                                        i.id === item.id ? { ...i, cycles: newCycles } : i
                                                                                                    );
                                                                                                    setSelection({ ...selection, agendaItems: newAgenda });
                                                                                                }}
                                                                                            />
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        ))}

                                                                        <button
                                                                            onClick={() => {
                                                                                const newCycles = [...item.cycles, { startTime: '', endTime: '' }];
                                                                                const newAgenda = selection.agendaItems.map(i =>
                                                                                    i.id === item.id ? { ...i, cycles: newCycles } : i
                                                                                );
                                                                                setSelection({ ...selection, agendaItems: newAgenda });
                                                                            }}
                                                                            className="w-full py-2 border-2 border-dashed border-emerald-100 rounded-xl text-[10px] font-black text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200 transition-all flex items-center justify-center gap-2 uppercase tracking-widest"
                                                                        >
                                                                            <Plus size={14} /> AGREGAR OTRO CICLO
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {/* Add Custom Activity Button */}
                                                    <button
                                                        onClick={() => {
                                                            const newActivity = {
                                                                id: Math.random().toString(36).substr(2, 9),
                                                                name: 'Nueva Actividad',
                                                                category: 'personalizado',
                                                                cycles: [{ startTime: '', endTime: '' }],
                                                                completed: false,
                                                                is_suggested: false,
                                                                selected: true,
                                                                program_name: program.name
                                                            };
                                                            setSelection({ ...selection, agendaItems: [...selection.agendaItems, newActivity] });
                                                        }}
                                                        className="w-full py-4 border-2 border-dashed border-gray-200 rounded-[16px] text-xs font-black text-gray-400 hover:text-[var(--secondary-color)] hover:border-[var(--secondary-color)] hover:bg-emerald-50 transition-all flex items-center justify-center gap-2 uppercase tracking-widest group"
                                                    >
                                                        <Plus size={16} className="group-hover:scale-110 transition-transform" /> AGREGAR ACTIVIDAD PERSONALIZADA AL PROGRAMA {program.name}
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="space-y-10 animate-fade-in mb-10 max-w-2xl mx-auto">
                            <div className="text-center mb-10">
                                <div className="w-20 h-20 bg-emerald-50 text-[var(--secondary-color)] rounded-[16px] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-green-100/50">
                                    <ShieldCheck size={40} />
                                </div>
                                <h3 className="text-3xl font-brand font-bold text-[var(--primary-color)] mb-3">Revisa tu Plan Cuidado+</h3>
                                <p className="text-sm text-[var(--text-light)] font-secondary">Confirma los detalles finales antes de publicar en la bolsa de trabajo.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="p-8 bg-[var(--base-bg)]/50 rounded-[16px] border border-gray-100">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                                        <CalendarIcon size={14} /> Periodo del Servicio
                                    </p>
                                    <div className="space-y-2">
                                        <p className="font-brand font-bold text-[var(--primary-color)] text-xl">
                                            {selection.startDate} <span className="text-gray-300 mx-2">→</span> {selection.endDate}
                                        </p>
                                        <p className="text-sm font-bold text-[var(--secondary-color)]">
                                            Turno: {selection.startTime} - {selection.endTime}
                                        </p>
                                    </div>
                                </div>

                                <div className="p-8 bg-[var(--base-bg)]/50 rounded-[16px] border border-gray-100">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                                        <Stethoscope size={14} /> Programas Activos
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {selection.selectedPrograms.map(p => (
                                            <span key={p.id} className="px-3 py-1 bg-white border border-gray-100 rounded-full text-[10px] font-black text-[var(--primary-color)] uppercase tracking-wider shadow-sm">
                                                {p.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="p-8 bg-[var(--base-bg)]/50 rounded-[16px] border border-gray-100">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                                        <MapPin size={14} /> Dirección del Servicio
                                    </p>
                                    <p className="font-brand font-bold text-[var(--primary-color)] text-lg">
                                        {selection.address || 'Hogar del Cliente'}
                                    </p>
                                </div>
                            </div>

                            <div className="p-8 bg-slate-50 rounded-[16px] border border-slate-200">
                                <p className="text-[10px] font-black uppercase tracking-widest text-[#0F3C4C] mb-6 flex items-center gap-2">
                                    <ClipboardList size={14} /> RESUMEN DEL PLAN DE CUIDADO+
                                </p>
                                <div className="space-y-3">
                                    {selection.agendaItems.filter(i => i.selected).length > 0 ? (
                                        selection.agendaItems.filter(i => i.selected).map(item => (
                                            <div key={item.id} className="flex flex-col gap-3 pb-3 border-b border-slate-100 last:border-0">
                                                <span className="text-sm font-bold text-gray-700">{item.activity_name || item.name}</span>
                                                <div className="flex flex-wrap gap-2">
                                                    {item.cycles.map((cycle, idx) => (
                                                        <span key={idx} className="text-[9px] font-black text-[var(--secondary-color)] uppercase bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100 shadow-sm">
                                                            {cycle.startTime || '--:--'} - {cycle.endTime || '--:--'}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-gray-400 italic text-center py-4">No hay actividades seleccionadas.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="px-10 py-8 border-top border-gray-50 flex justify-between items-center bg-gray-50/50">
                    <button
                        onClick={prevStep}
                        disabled={step === 1 || (isRestricted && step === 2)}
                        className={`flex items-center gap-2 px-6 py-4 rounded-[12px] font-black uppercase tracking-widest text-[10px] transition-all ${step === 1 || (isRestricted && step === 2) ? 'opacity-0 pointer-events-none' : 'text-gray-400 hover:text-[var(--primary-color)] hover:bg-gray-100'
                            }`}
                    >
                        <ChevronLeft size={16} /> Volver
                    </button>

                    {step < 4 ? (
                        <button
                            onClick={nextStep}
                            disabled={(step === 2 && selection.selectedPrograms.length === 0) || loading}
                            className={`btn btn-primary px-10 py-5 flex items-center gap-3 shadow-xl shadow-green-100 uppercase tracking-widest text-[11px] ${loading ? 'opacity-70 cursor-wait' : ''}`}
                        >
                            {loading ? 'PROCESANDO...' : 'SIGUIENTE'} <ChevronRight size={18} className={loading ? 'hidden' : ''} />
                        </button>
                    ) : (
                        <button
                            onClick={() => onComplete(selection)}
                            disabled={isSaving}
                            className={`bg-[var(--primary-color)] !text-[#FAFAF7] px-12 py-5 rounded-[12px] font-black uppercase tracking-[0.2em] shadow-2xl hover:scale-[1.02] transition-all group flex items-center gap-3 text-xs ${isSaving ? 'opacity-70 cursor-wait' : ''}`}
                        >
                            {isSaving ? 'GUARDANDO...' : (isRestricted ? 'GUARDAR CAMBIOS HOY' : 'PUBLICAR SERVICIO')} <CheckCircle2 size={18} className={`transition-transform ${isSaving ? 'hidden' : 'group-hover:rotate-12'}`} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CreateServiceWizard;
