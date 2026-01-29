import React, { useState, useEffect } from 'react';
import { Bell, Shield, MapPin, Sliders } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

const CaregiverSettings = () => {
    const { user, resetPassword } = useAuth();
    const [preferences, setPreferences] = useState({
        urgentCalls: false,
        weekendWork: false,
        radius: 10,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (user) {
            fetchSettings();
        }
    }, [user]);

    const fetchSettings = async () => {
        try {
            const { data, error } = await supabase
                .from('caregiver_details')
                .select('urgent_calls, work_radius')
                .eq('id', user.id)
                .single();

            if (error) throw error;

            if (data) {
                setPreferences({
                    urgentCalls: data.urgent_calls || false,
                    weekendWork: false, // Not in DB yet
                    radius: data.work_radius || 10,
                });
            }
        } catch (error) {
            console.error("Error fetching settings:", error);
        } finally {
            setLoading(false);
        }
    };

    const updateSetting = async (key, value) => {
        setSaving(true);
        try {
            const payload = {};
            if (key === 'urgentCalls') payload.urgent_calls = value;
            if (key === 'radius') payload.work_radius = parseInt(value);

            const { error } = await supabase
                .from('caregiver_details')
                .update(payload)
                .eq('id', user.id);

            if (error) throw error;
        } catch (error) {
            console.error("Error saving setting:", error);
            alert("No se pudo guardar la configuración. " + error.message);
        } finally {
            setSaving(false);
        }
    };

    const handlePasswordReset = async () => {
        if (!user?.email) return;
        if (confirm(`¿Enviar correo de restablecimiento de contraseña a ${user.email}?`)) {
            const { error } = await resetPassword(user.email);
            if (error) {
                alert("Error al enviar correo: " + error.message);
            } else {
                alert("Correo enviado. Revisa tu bandeja de entrada.");
            }
        }
    };

    return (
        <div className="space-y-10 animate-fade-in max-w-3xl">
            <h1 className="text-3xl font-brand font-bold !text-[#0F3C4C]">Configuración de la App</h1>

            {/* Work Preferences */}
            <div className="bg-white rounded-[16px] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                <div className="p-8 border-b border-gray-50 bg-slate-50/50">
                    <div className="flex items-center gap-4">
                        <div className="bg-purple-100 p-3 rounded-[16px] text-purple-600 shadow-inner">
                            <Sliders size={24} />
                        </div>
                        <h3 className="text-xl font-brand font-bold !text-[#0F3C4C]">Preferencias de Trabajo</h3>
                        {saving && <span className="text-[10px] font-black uppercase tracking-widest text-[#0F3C4C]/40 animate-pulse ml-auto">Guardando...</span>}
                    </div>
                </div>
                <div className="p-8 space-y-8 text-left">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-brand font-bold text-[#0F3C4C] text-lg">Llamadas de Urgencia</p>
                            <p className="text-sm text-gray-500 font-secondary mt-1">Recibir ofertas de último minuto con tarifa premium (1.5x).</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={preferences.urgentCalls}
                                onChange={(e) => {
                                    const newVal = e.target.checked;
                                    setPreferences({ ...preferences, urgentCalls: newVal });
                                    updateSetting('urgentCalls', newVal);
                                }}
                                className="sr-only peer"
                            />
                            <div className="w-14 h-8 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:start-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[var(--secondary-color)]"></div>
                        </label>
                    </div>

                    <div className="border-t border-gray-50 pt-8">
                        <div className="flex justify-between items-end mb-4">
                            <p className="font-brand font-bold text-[#0F3C4C] text-lg text-left">Radio de Cobertura</p>
                            <span className="text-[10px] font-black bg-[var(--primary-color)] !text-[#FAFAF7] px-4 py-1.5 rounded-full uppercase tracking-widest">{preferences.radius} KM</span>
                        </div>
                        <input
                            type="range"
                            min="1"
                            max="50"
                            value={preferences.radius}
                            onChange={(e) => setPreferences({ ...preferences, radius: e.target.value })}
                            onMouseUp={(e) => updateSetting('radius', e.target.value)}
                            onTouchEnd={(e) => updateSetting('radius', e.target.value)}
                            className="w-full h-3 bg-slate-100 rounded-full appearance-none cursor-pointer accent-[var(--secondary-color)]"
                        />
                        <div className="flex justify-between text-[10px] text-gray-400 font-black uppercase tracking-widest mt-4">
                            <span>1 km</span>
                            <span className="text-slate-200">25 km</span>
                            <span>50 km</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* General Settings */}
            <div className="bg-white rounded-[16px] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                <div className="p-8 border-b border-gray-50 bg-slate-50/50">
                    <div className="flex items-center gap-4">
                        <div className="bg-slate-100 p-3 rounded-[16px] text-[#0F3C4C] shadow-inner">
                            <Shield size={24} />
                        </div>
                        <h3 className="text-xl font-brand font-bold !text-[#0F3C4C]">Cuenta y Seguridad</h3>
                    </div>
                </div>
                <div className="divide-y divide-gray-50 text-left">
                    <button onClick={handlePasswordReset} className="w-full p-8 hover:bg-slate-50/50 transition-all font-brand font-bold text-[#0F3C4C] text-lg flex justify-between items-center group">
                        Cambiar Contraseña
                        <div className="w-10 h-10 rounded-[16px] bg-gray-50 flex items-center justify-center group-hover:bg-white group-hover:shadow-lg transition-all">
                            <Shield size={18} className="text-gray-300 group-hover:text-[var(--primary-color)] transition-colors" />
                        </div>
                    </button>

                    <button
                        onClick={() => {
                            if (confirm("¿Estás seguro de que deseas eliminar tu cuenta? Esta acción es irreversible.")) {
                                alert("Por favor contacta a soporte para proceder con la baja definitiva.");
                            }
                        }}
                        className="w-full p-8 hover:bg-red-50 transition-all font-brand font-bold text-red-500 text-lg flex justify-between items-center group"
                    >
                        Eliminar Cuenta
                        <div className="w-10 h-10 rounded-[16px] bg-red-50/50 flex items-center justify-center group-hover:bg-white group-hover:shadow-lg transition-all">
                            <Shield size={18} className="text-red-300" />
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CaregiverSettings;
