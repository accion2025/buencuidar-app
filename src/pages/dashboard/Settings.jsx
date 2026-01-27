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
        <div className="space-y-6 animate-fade-in max-w-4xl relative">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">Configuración</h2>
                {saving && (
                    <span className="text-xs font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full animate-pulse border border-green-100 italic">
                        Guardando cambios...
                    </span>
                )}
            </div>

            {/* Notifications */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50">
                    <div className="flex items-center gap-3">
                        <div className="bg-orange-100 p-2 rounded-lg text-orange-600">
                            <Bell size={20} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800">Notificaciones</h3>
                    </div>
                </div>
                <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between py-2">
                        <div>
                            <p className="font-semibold text-gray-700">Avisos por Email</p>
                            <p className="text-sm text-gray-500">Recibe confirmaciones de citas y recibos.</p>
                        </div>
                        <button
                            onClick={() => toggle('email')}
                            className={`w-12 h-6 rounded-full transition-colors relative ${notifications.email ? 'bg-[var(--primary-color)]' : 'bg-gray-300'}`}
                        >
                            <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${notifications.email ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                    </div>
                    <div className="flex items-center justify-between py-2">
                        <div>
                            <p className="font-semibold text-gray-700">Mensajes SMS</p>
                            <p className="text-sm text-gray-500">Alertas urgentes directamente a tu celular.</p>
                        </div>
                        <button
                            onClick={() => toggle('sms')}
                            className={`w-12 h-6 rounded-full transition-colors relative ${notifications.sms ? 'bg-[var(--primary-color)]' : 'bg-gray-300'}`}
                        >
                            <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${notifications.sms ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                    </div>
                </div>
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

            {/* Billing */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50">
                    <div className="flex items-center gap-3">
                        <div className="bg-green-100 p-2 rounded-lg text-green-600">
                            <CreditCard size={20} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800">Suscripción: Servicio PULSO</h3>
                    </div>
                </div>
                <div className="p-6 space-y-4">
                    <div className={`p-4 border rounded-lg mb-4 flex justify-between items-center ${isPremium ? 'border-blue-100 bg-blue-50' : 'border-gray-200 bg-gray-50'}`}>
                        <div>
                            <h3 className={`font-bold ${isPremium ? 'text-blue-900' : 'text-gray-800'}`}>{planName}</h3>
                            <p className={`text-sm ${isPremium ? 'text-blue-700' : 'text-gray-600'}`}>
                                {isPremium
                                    ? 'Tu familia cuenta con protección total y alertas en tiempo real.'
                                    : 'Acceso básico a la plataforma. Ideal para seguimiento ocasional.'}
                            </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${isPremium ? 'bg-blue-200 text-blue-800' : 'bg-green-100 text-green-700'}`}>
                            ACTIVO
                        </span>
                    </div>

                    {!isPremium && (
                        <div className="bg-orange-50 p-4 rounded-lg flex items-center justify-between border border-orange-100 shadow-sm">
                            <div className="flex-1 pr-4">
                                <h4 className="font-bold text-orange-900 text-sm flex items-center gap-2">
                                    <Shield size={16} className="text-orange-500" />
                                    ¿Quieres máxima tranquilidad?
                                </h4>
                                <p className="text-xs text-orange-700 mt-1">
                                    Activa el **Servicio PULSO Premium** para recibir alertas de emergencia al instante y seguimiento detallado de bitácora.
                                </p>
                            </div>
                            <a href="/dashboard/plans" className="bg-orange-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-md hover:bg-orange-700 transition-all shrink-0">
                                Ver Planes
                            </a>
                        </div>
                    )}

                    {isPremium && (
                        <div className="text-center pt-2">
                            <a href="#" className="text-sm text-gray-400 hover:underline">Gestionar facturación (Stripe Portal)</a>
                        </div>
                    )}
                </div>
            </div>


        </div>
    );
};

export default Settings;
