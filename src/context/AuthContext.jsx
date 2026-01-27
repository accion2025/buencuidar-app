import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true); // Initial app load
    const [profileLoading, setProfileLoading] = useState(false); // Subsequent profile updates

    useEffect(() => {
        let isMounted = true;
        let initialized = false;

        const initialize = async (session) => {
            if (!isMounted || initialized) return;
            initialized = true;

            setUser(session?.user ?? null);
            if (session?.user) {
                setProfileLoading(true);
                await fetchProfile(session.user.id);
                setProfileLoading(false);
            }
            if (isMounted) setLoading(false);
        };

        // 1. Check current session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (isMounted && !initialized) initialize(session);
        });

        // 2. Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (!initialized) {
                initialize(session);
            } else {
                setUser(session?.user ?? null);
                if (session?.user) {
                    setProfileLoading(true);
                    await fetchProfile(session.user.id);
                    setProfileLoading(false);
                } else {
                    setProfile(null);
                }
            }
        });

        // 3. Fail-safe timeout (5 seconds)
        const timeout = setTimeout(() => {
            if (isMounted && !initialized) {
                setLoading(false);
                initialized = true;
            }
        }, 5000);

        return () => {
            isMounted = false;
            subscription.unsubscribe();
            clearTimeout(timeout);
        };
    }, []);

    const fetchProfile = async (id) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select(`
                    *,
                    caregiver_details (*)
                `)
                .eq('id', id)
                .single();

            if (error) throw error;

            console.log("Datos del perfil recibidos:", data);

            if (data) {
                // caregiver_details puede venir como objeto o array
                if (data.caregiver_details) {
                    const caregiverData = Array.isArray(data.caregiver_details)
                        ? data.caregiver_details[0]
                        : data.caregiver_details;

                    if (caregiverData) {
                        const flattened = { ...data, ...caregiverData };
                        delete flattened.caregiver_details;
                        console.log("Perfil aplanado:", flattened);
                        setProfile(flattened);
                    } else {
                        setProfile(data);
                    }
                } else {
                    setProfile(data);
                }
            }
        } catch (error) {
            console.error("Error fetching profile details:", error);
            // Si el error es 'Anonymous logins are disabled', puede ser que el usuario no esté aún authed
            if (error.message?.includes('anonymous')) {
                console.warn("Intento de acceso anónimo detectado. Esperando a autenticación completa.");
            }
        }
    };

    const signUp = async (email, password, metadata, redirectTo = null) => {
        console.log("Iniciando signUp para:", email, "con metadatos:", metadata);
        const options = {
            data: metadata
        };
        if (redirectTo) {
            options.emailRedirectTo = redirectTo;
        }

        const response = await supabase.auth.signUp({
            email,
            password,
            options
        });
        if (response.error) {
            console.error("Error en supabase.auth.signUp:", response.error);
        }
        return response;
    };

    const signIn = (email, password) => {
        return supabase.auth.signInWithPassword({ email, password });
    };

    const signOut = () => {
        return supabase.auth.signOut();
    };

    const refreshProfile = async () => {
        if (user) {
            await fetchProfile(user.id);
        }
    };

    const resetPassword = (email) => {
        return supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/update-password',
        });
    };

    const resendConfirmationEmail = (email) => {
        return supabase.auth.resend({
            type: 'signup',
            email: email,
            options: {
                emailRedirectTo: window.location.origin + (profile?.role === 'caregiver' ? '/caregiver' : '/dashboard')
            }
        });
    };

    return (
        <AuthContext.Provider value={{ user, profile, loading, profileLoading, signUp, signIn, signOut, resetPassword, refreshProfile, resendConfirmationEmail }}>
            {loading ? (
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            ) : children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
