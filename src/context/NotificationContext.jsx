import OneSignal from 'react-onesignal';
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
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

    const fetchNotificationsData = useCallback(async (limit = 20, append = false) => {
        if (!user) return;

        console.log(`🔄 Cargando ${limit} notificaciones para el usuario:`, user.id);
        try {
            const { data, error: feedError } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (feedError) throw feedError;

            const now = Date.now();

            // 1. Process maturation (5 min delay for applications)
            const processed = (data || []).map(notif => {
                const isChat = notif.metadata?.is_chat || notif.metadata?.conversation_id || notif.title?.includes('Mensaje');

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

            // 4. Set Counts (for the global counter, we might need a separate count query for total accuracy, 
            // but for now we use the latest batch)
            setUnreadChatCount(chatItems.filter(n => !n.is_read).length);
            setUnreadNotificationsCount(generalItems.filter(n => !n.is_read).length);

            // 5. Update feed
            if (append) {
                setNotifications(prev => {
                    const existingIds = new Set(prev.map(n => n.id));
                    const newItems = generalItems.filter(n => !existingIds.has(n.id));
                    return [...prev, ...newItems];
                });
            } else {
                setNotifications(generalItems);
            }

            console.log(`✅ Conteo: General=${generalItems.filter(n => !n.is_read).length}, Chat=${chatItems.filter(n => !n.is_read).length}`);
            return data;
        } catch (err) {
            console.error("❌ Error al obtener notificaciones unificadas:", err);
            return [];
        } finally {
            setLoadingNotifications(false);
        }
    }, [user]);

    // Fetch and Subscribe to Notifications
    useEffect(() => {
        if (!user) {
            setUnreadNotificationsCount(0);
            setUnreadChatCount(0);
            setNotifications([]);
            setLoadingNotifications(false);
            return;
        }

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
    }, [user, fetchNotificationsData]);

    const markAsRead = async (id) => {
        try {
            // Immediate local feedback for responsiveness
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            setUnreadNotificationsCount(prev => Math.max(0, prev - 1));

            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('id', id);

            if (error) throw error;
        } catch (error) {
            console.error('Error marking as read:', error);
            // Optional: revert local state on error if needed
        }
    };

    const markAllGeneralAsRead = async () => {
        if (!user) return;

        // 1. Immediate local update
        setUnreadNotificationsCount(0);
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));

        try {
            // 2. Update DB for all non-chat notifications
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('user_id', user.id)
                .is('is_read', false)
                .not('title', 'ilike', '%Mensaje%'); // Simpler exclusion filter

            if (error) throw error;
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    };

    const deleteAllGeneral = async () => {
        if (!user) return;

        // 1. Immediate local update
        setNotifications([]);
        setUnreadNotificationsCount(0);

        try {
            // 2. Delete from DB (non-chat)
            const { error } = await supabase
                .from('notifications')
                .delete()
                .eq('user_id', user.id)
                .not('title', 'ilike', '%Mensaje%');

            if (error) throw error;
        } catch (error) {
            console.error('Error deleting all notifications:', error);
            // Re-fetch on error to restore state if delete failed
            fetchNotificationsData();
        }
    };

    const markAllChatAsRead = async () => {
        if (!user) return;

        // 1. Immediate local update for responsiveness
        setUnreadChatCount(0);

        try {
            // 2. Update DB
            // We mark as read all notifications that appear to be chat messages
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('user_id', user.id)
                .is('is_read', false)
                .or('title.ilike.%Mensaje%,metadata->>is_chat.eq.true,metadata->>conversation_id.neq.null');

            if (error) throw error;
            console.log("✅ Todas las notificaciones de chat marcadas como leídas.");
        } catch (error) {
            console.error('Error marking all chat notifications as read:', error);
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

    // Update App Badge (PWA Icon)
    useEffect(() => {
        const total = unreadNotificationsCount + unreadChatCount;
        if ('setAppBadge' in navigator) {
            if (total > 0) {
                navigator.setAppBadge(total).catch((error) => {
                    console.error("Error setting app badge:", error);
                });
            } else {
                navigator.clearAppBadge().catch((error) => {
                    console.error("Error clearing app badge:", error);
                });
            }
        }
    }, [unreadNotificationsCount, unreadChatCount]);

    return (
        <NotificationContext.Provider value={{
            initialized,
            unreadNotificationsCount,
            unreadChatCount,
            notifications,
            loadingNotifications,
            markAsRead,
            markAllChatAsRead,
            markAllGeneralAsRead,
            deleteAllGeneral,
            refreshNotifications: fetchNotificationsData
        }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => useContext(NotificationContext);
