import React, { useState, useEffect } from 'react';
import { Bell, Lock, CreditCard, Shield, ChevronRight, Plus, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import OneSignal from 'react-onesignal';

const Settings = () => {
    const navigate = useNavigate();
    const { user, profile, resetPassword, refreshProfile } = useAuth();
    const [notifications, setNotifications] = useState({
        email: true,
        sms: false
    });
    const [saving, setSaving] = useState(false);

    // Load preferences from profile
    useEffect(() => {
        if (profile) {
            setNotifications({
                email: profile.email_notifications ?? true,
                sms: profile.sms_notifications ?? false
            });
        }
    }, [profile]);

    const toggle = async (key) => {
        const newValue = !notifications[key];
        const updatedNotifications = { ...notifications, [key]: newValue };

        // Optimistic update
        setNotifications(updatedNotifications);
        setSaving(true);

        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    [`${key}_notifications`]: newValue
                })
                .eq('id', user.id);

            if (error) throw error;

            // Sync with context
            await refreshProfile();

            // Auto-hide saving indicator
            setTimeout(() => setSaving(false), 1000);
        } catch (error) {
            console.error("Error updating notifications:", error);
            // Revert on error
            setNotifications(notifications);
            setSaving(false);
            alert("No se pudo guardar la preferencia. Inténtalo de nuevo.");
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

    // Derived State for Subscription
    const isPremium = profile?.subscription_status === 'active';
    const planName = profile?.plan_type === 'premium' ? 'Plan Familiar Premium' : 'Plan Básico (Gratuito)';

    return (
        <div className="space-y-6 animate-fade-in max-w-4xl mx-auto pb-10">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">Configuración</h2>
                {saving && (
                    <span className="text-xs font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full animate-pulse border border-green-100 italic">
                        Guardando cambios...
                    </span>
                )}
            </div>

            {/* Security */}
            <div className="bg-white rounded-[16px] shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-[16px] text-blue-600">
                            <Lock size={20} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800">Seguridad</h3>
                    </div>
                </div>
                <div className="p-6 space-y-4">
                    <button
                        onClick={handlePasswordReset}
                        className="w-full flex items-center justify-between p-3 rounded-[16px] hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all group"
                    >
                        <span className="font-medium text-gray-700">Cambiar Contraseña</span>
                        <ChevronRight size={18} className="text-gray-400 group-hover:text-gray-600" />
                    </button>
                    <button
                        onClick={() => {
                            if (confirm("¿Estás seguro de que deseas eliminar tu cuenta? Esta acción es irreversible.")) {
                                alert("Por favor contacta a soporte para proceder con la baja definitiva.");
                            }
                        }}
                        className="w-full flex items-center justify-between p-3 rounded-[16px] hover:bg-red-50 border border-transparent hover:border-red-100 transition-all group mt-2"
                    >
                        <span className="font-medium text-red-600">Eliminar Cuenta</span>
                        <ChevronRight size={18} className="text-red-300 group-hover:text-red-500" />
                    </button>
                </div>
            </div>


            {/* PULSO Configuration or Upgrade Banner */}
            <div className="space-y-6">
                {isPremium && (
                    <div className="bg-white p-6 rounded-[16px] border border-gray-100 shadow-sm space-y-6">
                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <Bell size={16} /> Preferencias de Alerta PULSO
                        </h4>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="flex items-center justify-between p-4 rounded-[16px] bg-gray-50/50 border border-gray-100">
                                <div>
                                    <p className="font-bold text-gray-700 text-sm">Avisos por Email</p>
                                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-tight">Reportes Diarios</p>
                                </div>
                                <button
                                    onClick={() => toggle('email')}
                                    className={`w-12 h-6 rounded-full transition-colors relative ${notifications.email ? 'bg-blue-600' : 'bg-gray-300'}`}
                                >
                                    <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${notifications.email ? 'translate-x-6' : 'translate-x-0'}`} />
                                </button>
                            </div>

                            <div className="flex items-center justify-between p-4 rounded-[16px] bg-gray-50/50 border border-gray-100">
                                <div>
                                    <p className="font-bold text-gray-700 text-sm">Mensajes SMS</p>
                                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-tight">Alertas Críticas</p>
                                </div>
                                <button
                                    onClick={() => toggle('sms')}
                                    className={`w-12 h-6 rounded-full transition-colors relative ${notifications.sms ? 'bg-blue-600' : 'bg-gray-300'}`}
                                >
                                    <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${notifications.sms ? 'translate-x-6' : 'translate-x-0'}`} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Manual Push Permission Trigger - Always visible for everyone to listen/test notifications */}
                <div className="bg-white p-6 rounded-[16px] border border-gray-100 shadow-sm space-y-4">
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <Bell size={16} /> Centro de Alertas Audibles
                    </h4>
                    <button
                        onClick={() => OneSignal.Slidedown.promptPush()}
                        className="w-full flex items-center justify-center gap-3 p-4 rounded-[16px] bg-[var(--base-bg)] text-[var(--primary-color)] font-bold text-sm hover:bg-[var(--secondary-color)]/10 transition-all border border-[var(--secondary-color)]/20 shadow-sm"
                    >
                        <Bell size={18} className="text-[var(--secondary-color)]" />
                        Activar Notificaciones en este dispositivo
                    </button>
                    <p className="text-[10px] text-center text-gray-400 mt-1 uppercase tracking-widest font-bold">
                        Haz clic aquí si no escuchas los avisos en tu móvil o PC
                    </p>
                </div>

                {isPremium && (
                    <div className="text-center pt-8 border-t border-gray-50">
                        <a href="#" className="text-xs text-gray-400 hover:underline hover:text-gray-600 transition-colors uppercase tracking-widest font-bold">Gestionar facturación</a>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Settings;
