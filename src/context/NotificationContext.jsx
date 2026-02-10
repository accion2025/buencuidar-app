import OneSignal from 'react-onesignal';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

const NotificationContext = createContext({});

export const NotificationProvider = ({ children }) => {
    const { user, profile } = useAuth();
    const [initialized, setInitialized] = useState(false);
    const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
    const [notifications, setNotifications] = useState([]);
    const [loadingNotifications, setLoadingNotifications] = useState(true);

    // Fetch and Subscribe to Notifications
    useEffect(() => {
        if (!user) {
            setUnreadNotificationsCount(0);
            setNotifications([]);
            setLoadingNotifications(false);
            return;
        }

        const fetchNotificationsData = async () => {
            console.log("🔄 Cargando notificaciones para el usuario:", user.id);
            try {
                // 1. Fetch unread count
                const { count, error: countError } = await supabase
                    .from('notifications')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', user.id)
                    .eq('is_read', false);

                if (countError) throw countError;
                console.log("✅ Conteo de no leídas:", count || 0);
                setUnreadNotificationsCount(count || 0);

                // 2. Fetch recent notifications feed (last 20)
                const { data, error: feedError } = await supabase
                    .from('notifications')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(20);

                if (feedError) throw feedError;
                console.log("✅ Feed de notificaciones actualizado:", data?.length || 0, "ítems.");
                setNotifications(data || []);
            } catch (err) {
                console.error("❌ Error al obtener notificaciones unificadas:", err);
            } finally {
                setLoadingNotifications(false);
            }
        };

        fetchNotificationsData();

        const channel = supabase
            .channel(`notifications-unified-${user.id}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${user.id}`
            }, (payload) => {
                console.log("🔔 Cambio en tiempo real detectado en 'notifications':", payload);
                fetchNotificationsData();
            })
            .subscribe((status) => {
                console.log(`📡 Estado suscripción Realtime Notificaciones (${user.id}):`, status);
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    const markAsRead = async (id) => {
        try {
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('id', id);

            if (error) throw error;
            // Optimistic updates are handled by the real-time subscription usually, 
            // but we can force a local refresh or just wait for the DB trigger.
            // For better UX, let's update locally immediately:
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            setUnreadNotificationsCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking notification as read in context:', error);
        }
    };

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
        <NotificationContext.Provider value={{
            initialized,
            unreadNotificationsCount,
            notifications,
            loadingNotifications,
            markAsRead
        }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => useContext(NotificationContext);
