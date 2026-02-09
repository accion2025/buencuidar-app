import OneSignal from 'react-onesignal';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

const NotificationContext = createContext({});

export const NotificationProvider = ({ children }) => {
    const { user, profile } = useAuth();
    const [initialized, setInitialized] = useState(false);
    const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

    // Fetch and Subscribe to Notifications
    useEffect(() => {
        if (!user) {
            setUnreadNotificationsCount(0);
            return;
        }

        const fetchUnreadCount = async () => {
            try {
                const { count, error } = await supabase
                    .from('notifications')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', user.id)
                    .eq('is_read', false);

                if (error) throw error;
                setUnreadNotificationsCount(count || 0);
            } catch (err) {
                console.error("Error al obtener conteo de notificaciones:", err);
            }
        };

        fetchUnreadCount();

        const channel = supabase
            .channel(`notifications-count-${user.id}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${user.id}`
            }, () => {
                fetchUnreadCount();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    useEffect(() => {
        const initOneSignal = async () => {
            try {
                const isSecure = window.isSecureContext || window.location.hostname === 'localhost';

                if (!isSecure) {
                    console.error("⚠️ OneSignal requiere HTTPS o localhost para funcionar.");
                    return;
                }

                await OneSignal.init({
                    appId: import.meta.env.VITE_ONESIGNAL_APP_ID,
                    safari_web_id: import.meta.env.VITE_ONESIGNAL_SAFARI_ID,
                    notifyButton: {
                        enable: false,
                    },
                    allowLocalhostAsSecureOrigin: true,
                    serviceWorkerPath: '/sw.js',
                    serviceWorkerParam: { scope: '/' }
                });

                // Tags de prioridad para asegurar sonido en móviles
                OneSignal.User.addTags({
                    "priority_alerts": "enabled",
                    "sound_enabled": "true",
                    "device_type": "mobile_alert"
                });

                setInitialized(true);
            } catch (error) {
                console.error("Error al inicializar OneSignal:", error);
            }
        };

        initOneSignal();
    }, []);

    // Sincronizar External ID cuando el usuario se autentica
    useEffect(() => {
        const syncUser = async () => {
            if (initialized && user) {
                console.log("Sincronizando OneSignal External ID:", user.id);
                try {
                    // Evitar el error 409 Conflict si ya hay una identidad vinculada
                    await OneSignal.login(user.id);
                } catch (e) {
                    console.warn("OneSignal Login: Conflicto o ya logueado", e);
                }

                // Debugging subscription status
                const isSubscribed = await OneSignal.Notifications.permission;
                console.log("Estado de permiso OneSignal:", isSubscribed);
                const pushId = await OneSignal.User.PushSubscription.id;
                console.log("Push Subscription ID actual:", pushId);

                // Diagnóstico de Service Worker
                if ('serviceWorker' in navigator) {
                    const reg = await navigator.serviceWorker.getRegistration();
                    console.log("Service Worker Activo:", reg?.active?.scriptURL || "Ninguno");
                }

                // Si es cuidador y no ha dado permiso aún
                if (profile?.role === 'caregiver') {
                    const hasPermission = await OneSignal.Notifications.permission;
                    if (!hasPermission) {
                        setTimeout(() => {
                            OneSignal.Slidedown.promptPush();
                        }, 2000);
                    }
                }
            } else if (initialized && !user) {
                OneSignal.logout();
            }
        };

        syncUser();
    }, [user, initialized, profile]);

    return (
        <NotificationContext.Provider value={{ initialized, unreadNotificationsCount }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => useContext(NotificationContext);
