import OneSignal from 'react-onesignal';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

const NotificationContext = createContext({});

export const NotificationProvider = ({ children }) => {
    const { user, profile } = useAuth();
    const [initialized, setInitialized] = useState(false);

    useEffect(() => {
        const initOneSignal = async () => {
            try {
                await OneSignal.init({
                    appId: import.meta.env.VITE_ONESIGNAL_APP_ID || "YOUR_ONESIGNAL_APP_ID", // Prioritize .env
                    safari_web_id: import.meta.env.VITE_ONESIGNAL_SAFARI_ID || "YOUR_SAFARI_WEB_ID",
                    notifyButton: {
                        enable: false, // Cleaner UI, we use slidedown
                    },
                    allowLocalhostAsSecureOrigin: true,
                });

                // High Importance Channel for Android (Audible & Vibration)
                // This is a hint for OneSignal to use a high priority channel
                OneSignal.User.addTag("priority_alerts", "enabled");

                setInitialized(true);
            } catch (error) {
                console.error("Error al inicializar OneSignal:", error);
            }
        };

        initOneSignal();
    }, []);

    // Sincronizar External ID cuando el usuario se autentica
    useEffect(() => {
        if (initialized && user) {
            console.log("Sincronizando OneSignal External ID:", user.id);
            OneSignal.login(user.id);

            // Si es cuidador, podemos ser más proactivos pidiendo permiso
            if (profile?.role === 'caregiver') {
                OneSignal.Slidedown.promptPush();
            }
        } else if (initialized && !user) {
            OneSignal.logout();
        }
    }, [user, initialized, profile]);

    return (
        <NotificationContext.Provider value={{ initialized }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => useContext(NotificationContext);
