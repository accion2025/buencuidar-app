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

    return (
        <div className="space-y-10 animate-fade-in max-w-3xl text-left">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-brand font-bold !text-[#0F3C4C]">Configuración de la App</h1>
                {saving && (
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#0F3C4C]/40 animate-pulse">
                        Guardando...
                    </span>
                )}
            </div>

            {/* Notification Preferences (PULSO) */}
            {isPremium && (
                <div className="bg-white rounded-[16px] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                    <div className="p-8 border-b border-gray-50 bg-slate-50/50">
                        <div className="flex items-center gap-4">
                            <div className="bg-blue-100 p-3 rounded-[16px] text-blue-600 shadow-inner">
                                <Bell size={24} />
                            </div>
                            <h3 className="text-xl font-brand font-bold !text-[#0F3C4C]">Preferencias de Alerta PULSO</h3>
                        </div>
                    </div>
                    <div className="p-8 space-y-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-brand font-bold text-[#0F3C4C] text-lg">Avisos por Email</p>
                                <p className="text-sm text-gray-500 font-secondary mt-1">Reportes Diarios de bienestar.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={notifications.email}
                                    onChange={() => toggle('email')}
                                    className="sr-only peer"
                                />
                                <div className="w-14 h-8 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:start-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[var(--secondary-color)]"></div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between border-t border-gray-50 pt-8">
                            <div>
                                <p className="font-brand font-bold text-[#0F3C4C] text-lg">Mensajes SMS</p>
                                <p className="text-sm text-gray-500 font-secondary mt-1">Notificaciones críticas a tu móvil.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={notifications.sms}
                                    onChange={() => toggle('sms')}
                                    className="sr-only peer"
                                />
                                <div className="w-14 h-8 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:start-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[var(--secondary-color)]"></div>
                            </label>
                        </div>
                    </div>
                </div>
            )}

            {/* Manual Push Permission Trigger */}
            <div className="bg-white rounded-[16px] shadow-xl shadow-slate-200/50 border border-slate-100 p-8">
                <div className="flex items-center gap-4 mb-6 text-left">
                    <div className="bg-orange-100 p-3 rounded-[16px] text-orange-600 shadow-inner">
                        <Bell size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-brand font-bold !text-[#0F3C4C]">Centro de Alertas Audibles</h3>
                        <p className="text-sm text-gray-500 font-secondary mt-1">Configura las notificaciones en este dispositivo.</p>
                    </div>
                </div>

                <button
                    onClick={() => OneSignal.Slidedown.promptPush()}
                    className="w-full flex items-center justify-center gap-3 p-5 rounded-[24px] bg-[var(--base-bg)] text-[var(--primary-color)] font-brand font-bold text-lg hover:bg-[var(--secondary-color)]/10 transition-all border-2 border-dashed border-[var(--secondary-color)]/30 group"
                >
                    <Bell size={24} className="text-[var(--secondary-color)] group-hover:scale-110 transition-transform" />
                    Activar Notificaciones en dispositivo
                </button>

                <p className="text-[10px] text-center text-gray-400 mt-6 font-black uppercase tracking-widest">
                    Haz clic aquí si no escuchas los avisos en tu móvil o PC
                </p>
            </div>

            {/* Account and Security */}
            <div className="bg-white rounded-[16px] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                <div className="p-8 border-b border-gray-50 bg-slate-50/50">
                    <div className="flex items-center gap-4">
                        <div className="bg-slate-100 p-3 rounded-[16px] text-[#0F3C4C] shadow-inner">
                            <Shield size={24} />
                        </div>
                        <h3 className="text-xl font-brand font-bold !text-[#0F3C4C]">Cuenta y Seguridad</h3>
                    </div>
                </div>
                <div className="divide-y divide-gray-50">
                    <button onClick={handlePasswordReset} className="w-full p-8 hover:bg-slate-50/50 transition-all font-brand font-bold text-[#0F3C4C] text-lg flex justify-between items-center group">
                        Cambiar Contraseña
                        <div className="w-10 h-10 rounded-[16px] bg-gray-50 flex items-center justify-center group-hover:bg-white group-hover:shadow-lg transition-all">
                            <Lock size={18} className="text-gray-300 group-hover:text-[var(--primary-color)] transition-colors" />
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

            {isPremium && (
                <div className="text-center pt-4">
                    <button className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-[var(--primary-color)] transition-colors">
                        Gestionar facturación
                    </button>
                </div>
            )}
        </div>
    );
};

export default Settings;
