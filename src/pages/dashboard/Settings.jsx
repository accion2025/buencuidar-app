import React, { useState, useEffect } from 'react';
import { Bell, Lock, CreditCard, Shield, ChevronRight, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const Settings = () => {
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
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                            <Lock size={20} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800">Seguridad</h3>
                    </div>
                </div>
                <div className="p-6 space-y-4">
                    <button
                        onClick={handlePasswordReset}
                        className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all group"
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
                        className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-red-50 border border-transparent hover:border-red-100 transition-all group mt-2"
                    >
                        <span className="font-medium text-red-600">Eliminar Cuenta</span>
                        <ChevronRight size={18} className="text-red-300 group-hover:text-red-500" />
                    </button>
                </div>
            </div>

            {/* Billing & Pulso Features */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50">
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
                            <CreditCard size={20} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800">Suscripción y Beneficios PULSO</h3>
                    </div>
                </div>
                <div className="p-6 space-y-8">
                    {/* Plan Status */}
                    <div className={`p-6 border rounded-2xl flex flex-col items-center text-center gap-4 ${isPremium ? 'border-blue-100 bg-blue-50/50 shadow-sm shadow-blue-50' : 'border-gray-200 bg-gray-50'}`}>
                        <div className="space-y-1">
                            <h3 className={`text-xl font-black ${isPremium ? 'text-blue-900' : 'text-gray-800 uppercase tracking-tight'}`}>{planName}</h3>
                            <p className={`text-sm max-w-sm mx-auto ${isPremium ? 'text-blue-700' : 'text-gray-500'}`}>
                                {isPremium
                                    ? 'Tu familia cuenta con protección total y alertas en tiempo real activas.'
                                    : 'Acceso básico limitado. Activa PULSO Premium para el máximo nivel de cuidado.'}
                            </p>
                        </div>
                        <span className={`px-4 py-1.5 rounded-full text-xs font-black tracking-widest ${isPremium ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                            {isPremium ? 'ACTIVO' : 'BÁSICO'}
                        </span>
                    </div>

                    {/* Features linked to PULSO */}
                    <div className="space-y-4 pt-6 border-t border-gray-100">
                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <Bell size={16} /> Preferencias de Alerta PULSO
                        </h4>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50/50 border border-gray-100">
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

                            <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50/50 border border-gray-100">
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

                        {!isPremium && (
                            <div className="bg-orange-50 p-6 rounded-2xl flex flex-col items-center text-center gap-4 border border-orange-100 shadow-sm mt-4">
                                <div className="space-y-1">
                                    <h4 className="font-bold text-orange-900 flex items-center justify-center gap-2 text-lg">
                                        <ShieldCheck size={24} className="text-orange-500" />
                                        ¿Quieres tranquilidad total?
                                    </h4>
                                    <p className="text-sm text-orange-700 max-w-md mx-auto">
                                        Solo con el **Plan PULSO Premium** recibirás alertas de emergencia al instante y seguimiento detallado de bitácora.
                                    </p>
                                </div>
                                <button
                                    onClick={() => navigate('/dashboard/plans')}
                                    className="bg-orange-600 text-white px-8 py-3 rounded-xl font-black shadow-lg shadow-orange-200 hover:bg-orange-700 transition-all active:scale-95"
                                >
                                    MEJORAR A PULSO
                                </button>
                            </div>
                        )}
                    </div>

                    {isPremium && (
                        <div className="text-center pt-2">
                            <a href="#" className="text-xs text-gray-400 hover:underline hover:text-gray-600 transition-colors">Gestionar facturación (Stripe Portal)</a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Settings;
