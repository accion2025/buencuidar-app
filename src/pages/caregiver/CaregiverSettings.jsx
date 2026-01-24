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
        <div className="space-y-6 animate-fade-in max-w-3xl">
            <h1 className="text-2xl font-bold text-gray-800">Configuración de la App</h1>

            {/* Work Preferences */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50">
                    <div className="flex items-center gap-3">
                        <div className="bg-purple-100 p-2 rounded-lg text-purple-600">
                            <Sliders size={20} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800">Preferencias de Trabajo</h3>
                        {saving && <span className="text-xs text-gray-400 animate-pulse ml-auto">Guardando...</span>}
                    </div>
                </div>
                <div className="p-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-semibold text-gray-700">Llamadas de Urgencia</p>
                            <p className="text-sm text-gray-500">Recibir ofertas de último minuto (tarifa 1.5x).</p>
                        </div>
                        <input
                            type="checkbox"
                            checked={preferences.urgentCalls}
                            onChange={(e) => {
                                const newVal = e.target.checked;
                                setPreferences({ ...preferences, urgentCalls: newVal });
                                updateSetting('urgentCalls', newVal);
                            }}
                            className="w-6 h-6 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                        />
                    </div>

                    <div className="border-t border-gray-100 pt-4">
                        <p className="font-semibold text-gray-700 mb-2">Radio de Cobertura ({preferences.radius} km)</p>
                        <input
                            type="range"
                            min="1"
                            max="50"
                            value={preferences.radius}
                            onChange={(e) => setPreferences({ ...preferences, radius: e.target.value })}
                            onMouseUp={(e) => updateSetting('radius', e.target.value)} // Save on release
                            onTouchEnd={(e) => updateSetting('radius', e.target.value)}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between text-xs text-gray-400 mt-1">
                            <span>1 km</span>
                            <span>25 km</span>
                            <span>50 km</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* General Settings */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50">
                    <div className="flex items-center gap-3">
                        <div className="bg-gray-100 p-2 rounded-lg text-gray-600">
                            <Shield size={20} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800">Cuenta y Seguridad</h3>
                    </div>
                </div>
                <div className="divide-y divide-gray-100">
                    <button onClick={handlePasswordReset} className="w-full p-4 hover:bg-gray-50 text-left text-gray-700 font-medium">
                        Cambiar Contraseña
                    </button>

                    <button
                        onClick={() => {
                            if (confirm("¿Estás seguro de que deseas eliminar tu cuenta? Esta acción es irreversible.")) {
                                alert("Por favor contacta a soporte para proceder con la baja definitiva.");
                            }
                        }}
                        className="w-full p-4 hover:bg-red-50 text-left text-red-600 font-medium"
                    >
                        Eliminar Cuenta
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CaregiverSettings;
