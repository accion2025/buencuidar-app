import OneSignal from 'react-onesignal';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

const NotificationContext = createContext({});

export const NotificationProvider = ({ children }) => {
    const { user, profile } = useAuth();
    const [initialized, setInitialized] = useState(false);
    const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
    const [unreadChatCount, setUnreadChatCount] = useState(0);
    const [notifications, setNotifications] = useState([]);
    const [loadingNotifications, setLoadingNotifications] = useState(true);

    // Fetch and Subscribe to Notifications
    useEffect(() => {
        if (!user) {
            setUnreadNotificationsCount(0);
            setUnreadChatCount(0);
            setNotifications([]);
            setLoadingNotifications(false);
            return;
        }

        const fetchNotificationsData = async () => {
            console.log("🔄 Cargando notificaciones para el usuario:", user.id);
            try {
                // Fetch more to allow for filtering
                const { data, error: feedError } = await supabase
                    .from('notifications')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(50);

                if (feedError) throw feedError;

                const now = Date.now();

                // 1. Process maturation (5 min delay for applications)
                const processed = (data || []).map(notif => {
                    const isChat = notif.metadata?.is_chat || notif.metadata?.conversation_id || notif.title?.includes('Mensaje');

                    // Specific logic for New Applications (5 min delay)
                    if (notif.title?.includes('Postulación')) {
                        const createdTime = new Date(notif.created_at).getTime();
                        const isMature = createdTime < (now - 5 * 60 * 1000);
                        return { ...notif, is_hidden_by_delay: !isMature, is_chat: isChat };
                    }

                    return { ...notif, is_hidden_by_delay: false, is_chat: isChat };
                });

                // 2. Separate visible items
                const visible = processed.filter(n => !n.is_hidden_by_delay);

                // 3. Split by category
                const chatItems = visible.filter(n => n.is_chat);
                const generalItems = visible.filter(n => !n.is_chat);

                // 4. Set Counts
                setUnreadChatCount(chatItems.filter(n => !n.is_read).length);
                setUnreadNotificationsCount(generalItems.filter(n => !n.is_read).length);

                // 5. Context only exposes general items in 'notifications' feed 
                // (Chat alerts are now visual-only bubble triggers)
                setNotifications(generalItems);

                console.log(`✅ Conteo: General=${generalItems.filter(n => !n.is_read).length}, Chat=${chatItems.filter(n => !n.is_read).length}`);
            } catch (err) {
                console.error("❌ Error al obtener notificaciones unificadas:", err);
            } finally {
                setLoadingNotifications(false);
            }
        };

        fetchNotificationsData();

        // Periodic refresh (every 1 minute) to "maturate" hidden notifications
        const refreshInterval = setInterval(fetchNotificationsData, 60000);

        const channel = supabase
            .channel(`notifications-unified-${user.id}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${user.id}`
            }, (payload) => {
                console.log("🔔 Cambio en tiempo real detectado:", payload.eventType);
                fetchNotificationsData();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
            clearInterval(refreshInterval);
        };
    }, [user]);

    const markAsRead = async (id) => {
        try {
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('id', id);

            if (error) throw error;
            // Immediate local feedback
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            // Trigger context counters refresh
            // We could recalulate locally, but fetchNotificationsData is safer given the state split
            // For now, let's keep it simple: the next fetch or local state adjustment suffices.
        } catch (error) {
            console.error('Error marking as read:', error);
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
            unreadChatCount,
            notifications,
            loadingNotifications,
            markAsRead
        }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => useContext(NotificationContext);
