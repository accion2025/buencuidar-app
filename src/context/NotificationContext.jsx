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
                    appId: "YOUR_ONESIGNAL_APP_ID", // TODO: Reemplazar con ID real de Ivan
                    safari_web_id: "YOUR_SAFARI_WEB_ID",
                    notifyButton: {
                        enable: true,
                    },
                    allowLocalhostAsSecureOrigin: true,
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
