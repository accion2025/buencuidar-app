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

            try {
                setUser(session?.user ?? null);
                if (session?.user) {
                    setProfileLoading(true);
                    await fetchProfile(session.user.id);
                }
            } finally {
                setProfileLoading(false);
                if (isMounted) setLoading(false);
            }
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
                try {
                    setUser(session?.user ?? null);
                    if (session?.user) {
                        setProfileLoading(true);
                        await fetchProfile(session.user.id);
                    } else {
                        setProfile(null);
                    }
                } finally {
                    setProfileLoading(false);
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
                // BLOCKING POLICY
                if (data.is_banned) {
                    console.warn("Usuario bloqueado intentando acceder. Cerrando sesión...");
                    await supabase.auth.signOut();
                    setUser(null);
                    setProfile(null);
                    window.location.href = '/login?error=banned'; // Force redirect with flag
                    return;
                }

                // caregiver_details puede venir como objeto o array
                if (data.caregiver_details) {
                    const caregiverData = Array.isArray(data.caregiver_details)
                        ? data.caregiver_details[0]
                        : data.caregiver_details;

                    if (caregiverData) {
                        const flattened = {
                            ...data,
                            ...caregiverData,
                            avatar_url: data.avatar_url || caregiverData.avatar_url
                        };
                        delete flattened.caregiver_details;
                        setProfile(flattened);
                    } else {
                        setProfile(data);
                    }
                } else {
                    setProfile(data);
                }

                // --- V1.0.98: Lógica de Expiración Pasiva (Lazy Downgrade) ---
                if (data.subscription_status === 'active' && data.plan_type !== 'basic') {
                    // Buscar la suscripción activa más reciente
                    const { data: subData } = await supabase
                        .from('subscriptions')
                        .select('current_period_end')
                        .eq('user_id', id)
                        .eq('status', 'active')
                        .order('created_at', { ascending: false })
                        .limit(1)
                        .maybeSingle();

                    if (subData?.current_period_end) {
                        const expiryDate = new Date(subData.current_period_end);
                        const now = new Date();

                        if (expiryDate < now) {
                            console.log("Suscripción expirada detectada. Ejecutando downgrade...");

                            // 1. Actualizar tabla subscriptions
                            await supabase
                                .from('subscriptions')
                                .update({ status: 'past_due' })
                                .eq('user_id', id)
                                .eq('status', 'active');

                            // 2. Actualizar perfil
                            const { data: updatedProfile } = await supabase
                                .from('profiles')
                                .update({
                                    plan_type: 'basic',
                                    subscription_status: 'inactive'
                                })
                                .eq('id', id)
                                .select()
                                .single();

                            if (updatedProfile) {
                                // Forzar refresco del estado local del perfil
                                setProfile(prev => ({
                                    ...prev,
                                    plan_type: 'basic',
                                    subscription_status: 'inactive'
                                }));
                            }
                        }
                    }
                }
                // --- Fin V1.0.98 ---
            }
        } catch (error) {
            console.error("Error fetching profile details:", error);
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

    const resendConfirmationEmail = (email, role = null) => {
        const targetRole = role || profile?.role;
        return supabase.auth.resend({
            type: 'signup',
            email: email,
            options: {
                emailRedirectTo: window.location.origin + (targetRole === 'caregiver' ? '/caregiver' : '/dashboard')
            }
        });
    };

    return (
        <AuthContext.Provider value={{ user, profile, setProfile, loading, profileLoading, signUp, signIn, signOut, resetPassword, refreshProfile, resendConfirmationEmail }}>
            {loading ? (
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            ) : children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
