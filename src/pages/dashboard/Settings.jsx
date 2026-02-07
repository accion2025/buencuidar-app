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
    const [diagnostic, setDiagnostic] = useState(null);

    const runDiagnostic = async () => {
        if (typeof OneSignal === 'undefined') {
            setDiagnostic({ error: "OneSignal no está cargado aún o el SDK falló." });
            return;
        }

        try {
            const pushId = await OneSignal.User.PushSubscription.id;
            const permission = await OneSignal.Notifications.permission;
            const tags = await OneSignal.User.getTags();
            const swReg = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration() : null;

            setDiagnostic({
                appId: import.meta.env.VITE_ONESIGNAL_APP_ID || "Faltante en .env",
                origin: window.location.origin,
                pushId: pushId || "No suscrito / Null",
                permission: permission ? "Concedido" : "Denegado",
                tags: JSON.stringify(tags || {}),
                sw: swReg?.active?.scriptURL || "Ninguno activo"
            });
        } catch (e) {
            setDiagnostic({ error: "Fallo durante el diagnóstico: " + e.message });
        }
    };

    const testLocalNotification = () => {
        if (!("Notification" in window)) {
            alert("Este navegador no soporta notificaciones.");
            return;
        }
        if (Notification.permission === "granted") {
            try {
                new Notification("Test Local BuenCuidar", {
                    body: "Si ves esto, tu teléfono SÍ permite mostrar alertas de esta app.",
                    icon: "/images/rebranding/pwa_icon_square.png"
                });
            } catch (e) {
                // Algunos navegadores móviles requieren ServiceWorker para mostrar notificaciones
                navigator.serviceWorker.ready.then(registration => {
                    registration.showNotification("Test Local BuenCuidar", {
                        body: "Si ves esto, tu teléfono SÍ permite mostrar alertas de esta app.",
                        icon: "/images/rebranding/pwa_icon_square.png"
                    });
                });
            }
        } else {
            alert("Permiso denegado. Pulsa 'Activar Notificaciones' arriba.");
        }
    };

    const resetIdentity = async () => {
        if (confirm("¿Resetear identidad? Esto forzará una nueva suscripción y limpiará errores técnicos.")) {
            try {
                await OneSignal.logout();
                await OneSignal.User.PushSubscription.optOut();
                alert("Identidad reseteada. Refresca la app y pulsa Activar.");
            } catch (e) {
                alert("Error al resetear: " + e.message);
            }
        }
    };

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

                {!window.isSecureContext && window.location.hostname !== 'localhost' ? (
                    <div className="p-4 bg-red-50 border border-red-100 rounded-[16px] mb-6">
                        <p className="text-sm text-red-600 font-brand font-bold">
                            ⚠️ Conexión no segura (HTTP)
                        </p>
                        <p className="text-xs text-red-500 font-secondary mt-1">
                            El navegador bloquea las notificaciones en sitios sin candado de seguridad (HTTPS). Contacta a soporte para habilitar el dominio seguro.
                        </p>
                    </div>
                ) : (
                    <button
                        onClick={() => {
                            if (typeof OneSignal !== 'undefined' && OneSignal.Slidedown) {
                                OneSignal.Slidedown.promptPush();
                            } else {
                                alert("El sistema de notificaciones está cargando. Por favor, espera un momento.");
                            }
                        }}
                        className="w-full flex items-center justify-center gap-3 p-5 rounded-[24px] bg-[var(--base-bg)] text-[var(--primary-color)] font-brand font-bold text-lg hover:bg-[var(--secondary-color)]/10 transition-all border-2 border-dashed border-[var(--secondary-color)]/30 group"
                    >
                        <Bell size={24} className="text-[var(--secondary-color)] group-hover:scale-110 transition-transform" />
                        Activar Notificaciones en dispositivo
                    </button>
                )}

                <p className="text-[10px] text-center text-gray-400 mt-6 font-black uppercase tracking-widest leading-relaxed">
                    Haz clic arriba si no recibes avisos.<br />
                    Para alertas audibles: Revisa en Ajustes &gt; Aplicaciones &gt; BuenCuidar &gt; Notificaciones que el sonido esté activo.
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

            {/* Diagnostic Panel para Debugging */}
            <div className="bg-slate-900 rounded-[24px] p-8 text-left shadow-2xl">
                <div className="flex items-center gap-3 mb-6">
                    <ShieldCheck size={20} className="text-green-400" />
                    <h3 className="text-white font-brand font-bold text-lg">Diagnóstico de Alertas</h3>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-6">
                    <button
                        onClick={testLocalNotification}
                        className="text-[9px] font-black uppercase tracking-widest bg-blue-500/10 text-blue-400 rounded-[16px] py-4 hover:bg-blue-500/20 transition-all border border-blue-500/10"
                    >
                        🔔 Test Alerta Local
                    </button>
                    <button
                        onClick={resetIdentity}
                        className="text-[9px] font-black uppercase tracking-widest bg-red-500/10 text-red-400 rounded-[16px] py-4 hover:bg-red-500/20 transition-all border border-red-500/10"
                    >
                        ♻️ Reset Identidad
                    </button>
                </div>

                <button
                    onClick={runDiagnostic}
                    className="w-full text-xs font-black uppercase tracking-widest bg-white/10 text-white rounded-[16px] py-4 hover:bg-white/20 transition-all mb-6 border border-white/5"
                >
                    ⚡ Ejecutar Test de Conexión
                </button>

                {diagnostic && (
                    <div className="space-y-3 bg-black/40 rounded-[16px] p-6 border border-white/5">
                        {diagnostic.error ? (
                            <p className="text-red-400 text-[10px] font-bold uppercase">{diagnostic.error}</p>
                        ) : (
                            <>
                                <div className="flex justify-between border-b border-white/5 pb-2">
                                    <span className="text-[10px] text-slate-500 uppercase font-bold">App ID</span>
                                    <span className="text-[9px] text-slate-300 font-mono text-right ml-4">{diagnostic.appId}</span>
                                </div>
                                <div className="flex justify-between border-b border-white/5 pb-2">
                                    <span className="text-[10px] text-slate-500 uppercase font-bold">Origin (Dominio)</span>
                                    <span className="text-[10px] text-blue-400 font-mono text-right ml-4">{diagnostic.origin}</span>
                                </div>
                                <div className="flex justify-between border-b border-white/5 pb-2">
                                    <span className="text-[10px] text-slate-500 uppercase font-bold">Push ID</span>
                                    <span className="text-[10px] text-green-400 font-mono break-all text-right ml-4">{diagnostic.pushId}</span>
                                </div>
                                <div className="flex justify-between border-b border-white/5 pb-2">
                                    <span className="text-[10px] text-slate-500 uppercase font-bold">Permiso</span>
                                    <span className={`text-[10px] font-bold uppercase ${diagnostic.permission === 'Concedido' ? 'text-green-400' : 'text-orange-400'}`}>
                                        {diagnostic.permission}
                                    </span>
                                </div>
                                <div className="flex justify-between border-b border-white/5 pb-2">
                                    <span className="text-[10px] text-slate-500 uppercase font-bold">Worker</span>
                                    <span className="text-[10px] text-blue-400 font-mono italic">{diagnostic.sw}</span>
                                </div>
                                <div className="pt-2">
                                    <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Tags Activos</span>
                                    <span className="text-[9px] text-slate-400 font-mono block leading-relaxed">{diagnostic.tags}</span>
                                </div>
                            </>
                        )}
                    </div>
                )}

                <p className="text-[9px] text-slate-500 mt-6 leading-relaxed italic">
                    Si el Push ID es "Null", el dispositivo no está registrado en OneSignal. Intenta "Activar Notificaciones" arriba.
                </p>
            </div>
        </div>
    );
};

export default Settings;
