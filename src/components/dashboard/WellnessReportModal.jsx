import React, { useState } from 'react';
import { X, Heart, Activity, Wind, Save, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const WellnessReportModal = ({ isOpen, onClose, appointmentId, caregiverId, onSaved }) => {
    const [loading, setLoading] = useState(false);
    const [fetchingInitial, setFetchingInitial] = useState(true);
    const [generalState, setGeneralState] = useState('Estable');
    const [energyLevel, setEnergyLevel] = useState('Adecuado');
    const [mood, setMood] = useState('Tranquilo');

    const options = {
        general: ['Estable', 'Decaído', 'Inquieto', 'Requiere Atención'],
        energy: ['Alto', 'Adecuado', 'Bajo', 'Agotado'],
        mood: ['Feliz', 'Tranquilo', 'Agitado', 'Triste']
    };

    // Fetch last recorded values on open
    React.useEffect(() => {
        const fetchLastWellness = async () => {
            if (!isOpen || !appointmentId) return;

            try {
                setFetchingInitial(true);
                const { data, error } = await supabase
                    .from('care_logs')
                    .select('action, detail')
                    .eq('appointment_id', appointmentId)
                    .eq('category', 'Wellness')
                    .order('created_at', { ascending: false });

                if (error) throw error;

                if (data && data.length > 0) {
                    // Because we want the latest for each action type
                    const latestGeneral = data.find(l => l.action === 'Estado General');
                    const latestEnergy = data.find(l => l.action === 'Nivel de Energía');
                    const latestMood = data.find(l => l.action === 'Bienestar Hoy');

                    if (latestGeneral) setGeneralState(latestGeneral.detail);
                    if (latestEnergy) setEnergyLevel(latestEnergy.detail);
                    if (latestMood) setMood(latestMood.detail);
                }
            } catch (err) {
                console.error("Error fetching last wellness values:", err);
            } finally {
                setFetchingInitial(false);
            }
        };

        fetchLastWellness();
    }, [isOpen, appointmentId]);

    const handleSave = async () => {
        if (!appointmentId || !caregiverId) return;
        setLoading(true);

        try {
            // Prepare logs
            const logs = [
                {
                    appointment_id: appointmentId,
                    caregiver_id: caregiverId,
                    category: 'Wellness',
                    action: 'Estado General',
                    detail: generalState
                },
                {
                    appointment_id: appointmentId,
                    caregiver_id: caregiverId,
                    category: 'Wellness',
                    action: 'Nivel de Energía',
                    detail: energyLevel
                },
                {
                    appointment_id: appointmentId,
                    caregiver_id: caregiverId,
                    category: 'Wellness',
                    action: 'Bienestar Hoy',
                    detail: mood
                }
            ];

            const { error } = await supabase
                .from('care_logs')
                .insert(logs);

            if (error) throw error;

            if (onSaved) onSaved();
            onClose();
            alert("Reporte de bienestar guardado con éxito.");

        } catch (error) {
            console.error("Error saving wellness report:", error);
            alert("Error al guardar el reporte.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm pt-5 px-6 pb-6 animate-fade-in overflow-y-auto">
            <div className="bg-white rounded-[16px] w-full max-w-sm shadow-2xl p-6 relative overflow-hidden">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <X size={20} />
                </button>

                <h2 className="text-xl font-bold text-gray-800 mb-1">Reporte de Bienestar</h2>
                <p className="text-sm text-gray-500 mb-6">Indica cómo se encuentra el paciente ahora.</p>

                <div className="space-y-6">
                    {fetchingInitial ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-4">
                            <Loader2 size={32} className="animate-spin text-indigo-500" />
                            <p className="text-xs font-black uppercase tracking-widest text-gray-400">Recuperando último historial...</p>
                        </div>
                    ) : (
                        <>
                            {/* General State */}
                            <div>
                                <label className="text-sm font-bold text-gray-400 uppercase mb-2 flex items-center gap-1">
                                    <Heart size={12} /> Estado General
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {options.general.map(opt => (
                                        <button
                                            key={opt}
                                            onClick={() => setGeneralState(opt)}
                                            className={`py-2 px-1 text-sm font-bold rounded-[16px] border transition-all ${generalState === opt
                                                ? 'bg-green-100 text-green-700 border-green-200 shadow-sm'
                                                : 'bg-white text-gray-600 border-gray-100 hover:bg-gray-50'
                                                }`}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Energy Level */}
                            <div>
                                <label className="text-sm font-bold text-gray-400 uppercase mb-2 flex items-center gap-1">
                                    <Activity size={12} /> Nivel de Energía
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {options.energy.map(opt => (
                                        <button
                                            key={opt}
                                            onClick={() => setEnergyLevel(opt)}
                                            className={`py-2 px-1 text-sm font-bold rounded-[16px] border transition-all ${energyLevel === opt
                                                ? 'bg-blue-100 text-blue-700 border-blue-200 shadow-sm'
                                                : 'bg-white text-gray-600 border-gray-100 hover:bg-gray-50'
                                                }`}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Mood */}
                            <div>
                                <label className="text-sm font-bold text-gray-400 uppercase mb-2 flex items-center gap-1">
                                    <Wind size={12} /> Ánimo / Bienestar
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {options.mood.map(opt => (
                                        <button
                                            key={opt}
                                            onClick={() => setMood(opt)}
                                            className={`py-2 px-1 text-sm font-bold rounded-[16px] border transition-all ${mood === opt
                                                ? 'bg-indigo-100 text-indigo-700 border-indigo-200 shadow-sm'
                                                : 'bg-white text-gray-600 border-gray-100 hover:bg-gray-50'
                                                }`}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="mt-8 pt-4 border-t border-gray-100 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 bg-white border border-gray-200 text-gray-500 font-bold py-3 rounded-[16px] hover:bg-gray-50 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="flex-[2] bg-slate-900 !text-[#FAFAF7] font-bold py-3 rounded-[16px] hover:bg-slate-800 transition-colors shadow-lg flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 size={18} className="animate-spin" /> : <><Save size={18} /> Guardar</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WellnessReportModal;
