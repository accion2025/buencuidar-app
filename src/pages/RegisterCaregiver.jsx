import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { translateSupabaseError } from '../utils/translations';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

const RegisterCaregiver = () => {
    const navigate = useNavigate();
    const { signUp, user, profile, refreshProfile } = useAuth();

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        phone: '',
        experience: '',
        specialization: 'Acompañamiento Integral',
        bio: ''
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Load saved data from localStorage on mount (if no user data)
    useEffect(() => {
        const savedData = localStorage.getItem('caregiver_registration_temp');
        if (savedData && !user && !profile) { // Only use local data if not logged in (profile takes precedence)
            try {
                const parsed = JSON.parse(savedData);
                setFormData(prev => ({ ...prev, ...parsed }));
            } catch (e) {
                console.error("Error parsing saved form data", e);
            }
        }
    }, [user, profile]);

    // Save data to localStorage on change
    useEffect(() => {
        // Debounce saving slightly or just save on every change (low overhead)
        localStorage.setItem('caregiver_registration_temp', JSON.stringify(formData));
    }, [formData]);

    // Pre-fill data if user is already logged in (takes precedence over localStorage)
    useEffect(() => {
        // Run immediately if user or profile exists
        if (user || profile) {
            setFormData(prev => ({
                ...prev,
                fullName: profile?.full_name || user?.user_metadata?.full_name || prev.fullName,
                email: user?.email || prev.email,
                phone: profile?.phone || prev.phone
            }));
        }
    }, [user, profile]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };



    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const finalCode = generateCaregiverCode();

        try {
            let authData;

            if (user) {
                // UPDATE/UPGRADE EXISTING USER or RESTORE PROFILE
                const { error: updateError } = await supabase
                    .from('profiles')
                    .upsert({
                        id: user.id,
                        email: user.email,
                        role: 'caregiver',
                        phone: formData.phone,
                        full_name: formData.fullName,
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'id' });

                if (updateError) throw updateError;

                // Manually upsert details
                const { error: detailsError } = await supabase
                    .from('caregiver_details')
                    .upsert({
                        id: user.id,
                        bio: formData.bio,
                        specialization: formData.specialization,
                        experience: formData.experience
                    }, { onConflict: 'id' });

                if (detailsError) throw detailsError;

                authData = { user, session: true };
            } else {
                // NEW USER REGISTRATION
                const { data, error: signUpError } = await signUp(
                    formData.email,
                    formData.password,
                    {
                        full_name: formData.fullName,
                        phone: formData.phone,
                        role: 'caregiver',
                        bio: formData.bio,
                        specialization: formData.specialization,
                        experience: formData.experience
                    },
                    window.location.origin + '/caregiver'
                );

                if (signUpError) throw new Error(`Error de Autenticación: ${signUpError.message}`);
                authData = data;

                // 3. OPTIONAL FAILSAFE: Manual insert (Client-side)
                try {
                    const { error: profileError } = await supabase
                        .from('profiles')
                        .upsert({
                            id: data.user.id,
                            email: formData.email,
                            full_name: formData.fullName,
                            phone: formData.phone,
                            role: 'caregiver'
                        }, { onConflict: 'id' });

                    if (profileError) {
                        console.warn("Manual profile creation warning (handled by server trigger):", profileError);
                    }

                    const { error: newDetailsError } = await supabase
                        .from('caregiver_details')
                        .upsert({
                            id: data.user.id,
                            bio: formData.bio,
                            specialization: formData.specialization,
                            experience: formData.experience
                        }, { onConflict: 'id' });

                    if (newDetailsError) {
                        console.warn("Manual details creation warning (handled by server trigger):", newDetailsError);
                    }

                    // Force context refresh if session exists
                    if (refreshProfile) {
                        await refreshProfile();
                    }

                } catch (manualOpsError) {
                    console.warn("Client-side DB operations skipped (Trusting Server Trigger):", manualOpsError);
                }
            }

            // Navigate to success immediately
            navigate('/registration-success', {
                state: {
                    fullName: formData.fullName,
                    email: formData.email,
                    requiresConfirmation: !authData?.session,
                    role: 'caregiver'
                }
            });

        } catch (err) {
            console.error("Registration error:", err);
            setError(translateSupabaseError(err.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--base-bg)] flex flex-col">
            <Navbar />

            <main className="flex-grow container mx-auto px-4 py-24 flex items-center justify-center relative">
                <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-[var(--secondary-color)] rounded-full blur-[120px] opacity-10 -z-10 animate-pulse"></div>
                <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-[var(--accent-color)] rounded-full blur-[120px] opacity-20 -z-10"></div>

                <div className="card w-full max-w-3xl bg-white p-10 md:p-14 animate-fade-in-up shadow-2xl border-none">
                    <div className="text-center mb-10">
                        <span className="bg-[var(--secondary-color)] !text-[#FAFAF7] px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-4 inline-block shadow-lg shadow-green-100">
                            Únete al equipo
                        </span>
                        <h2 className="text-4xl font-brand font-bold text-[var(--primary-color)] tracking-tight">
                            Registro de Cuidador Profesional
                        </h2>
                        <p className="text-[var(--text-light)] mt-3 font-secondary text-lg">
                            Forma parte de la red de cuidadores más confiable
                        </p>
                    </div>

                    {error && (
                        <div className="mb-8 p-5 bg-red-50 border border-red-100 rounded-[16px] flex items-start gap-4 animate-shake">
                            <AlertCircle className="text-[var(--error-color)] shrink-0" size={24} />
                            <p className="text-xs font-black text-[var(--error-color)] uppercase tracking-widest leading-relaxed">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <label htmlFor="fullName" className="block text-xs font-black text-[var(--primary-color)] uppercase tracking-widest mb-3">
                                    Nombre Completo
                                </label>
                                <input
                                    type="text"
                                    id="fullName"
                                    name="fullName"
                                    autoComplete="name"
                                    required
                                    className="w-full px-6 py-4 bg-[var(--base-bg)] border-2 border-transparent rounded-[16px] focus:bg-white focus:border-[var(--secondary-color)] outline-none transition-all font-secondary text-gray-800"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                />
                            </div>
                            <div>
                                <label htmlFor="phone" className="block text-xs font-black text-[var(--primary-color)] uppercase tracking-widest mb-3">
                                    Teléfono
                                </label>
                                <input
                                    type="tel"
                                    id="phone"
                                    name="phone"
                                    autoComplete="tel"
                                    required
                                    className="w-full px-6 py-4 bg-[var(--base-bg)] border-2 border-transparent rounded-[16px] focus:bg-white focus:border-[var(--secondary-color)] outline-none transition-all font-secondary text-gray-800"
                                    value={formData.phone}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        {!user && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <label htmlFor="email" className="block text-xs font-black text-[var(--primary-color)] uppercase tracking-widest mb-3">
                                        Correo Electrónico
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        autoComplete="email"
                                        required
                                        className="w-full px-6 py-4 bg-[var(--base-bg)] border-2 border-transparent rounded-[16px] focus:bg-white focus:border-[var(--secondary-color)] outline-none transition-all font-secondary text-gray-800"
                                        value={formData.email}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="password" className="block text-xs font-black text-[var(--primary-color)] uppercase tracking-widest mb-3">
                                        Contraseña
                                    </label>
                                    <input
                                        type="password"
                                        id="password"
                                        name="password"
                                        autoComplete="new-password"
                                        required
                                        className="w-full px-6 py-4 bg-[var(--base-bg)] border-2 border-transparent rounded-[16px] focus:bg-white focus:border-[var(--secondary-color)] outline-none transition-all font-secondary text-gray-800"
                                        value={formData.password}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        )}

                        {user && (
                            <div className="md:col-span-2">
                                <label className="block text-xs font-black text-[var(--primary-color)] uppercase tracking-widest mb-3">
                                    Correo Electrónico (Conectado)
                                </label>
                                <input
                                    type="email"
                                    disabled
                                    className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-[16px] text-gray-400 cursor-not-allowed font-secondary"
                                    value={formData.email}
                                />
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <label htmlFor="experience" className="block text-xs font-black text-[var(--primary-color)] uppercase tracking-widest mb-3">
                                    Años de Experiencia
                                </label>
                                <input
                                    type="number"
                                    id="experience"
                                    name="experience"
                                    min="0"
                                    required
                                    className="w-full px-6 py-4 bg-[var(--base-bg)] border-2 border-transparent rounded-[16px] focus:bg-white focus:border-[var(--secondary-color)] outline-none transition-all font-secondary text-gray-800"
                                    value={formData.experience}
                                    onChange={handleChange}
                                />
                            </div>
                            <div>
                                <label htmlFor="specialization" className="block text-xs font-black text-[var(--primary-color)] uppercase tracking-widest mb-3">
                                    Especialización Principal
                                </label>
                                <select
                                    id="specialization"
                                    name="specialization"
                                    className="w-full px-6 py-4 bg-[var(--base-bg)] border-2 border-transparent rounded-[16px] focus:bg-white focus:border-[var(--secondary-color)] outline-none transition-all font-secondary text-gray-800 appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGZpbGw9Im5vbmUiIHZpZXdCb3g9IjAgMCAyNCAyNCIgc3Ryb2tlPSJncmF5Ij48cGF0aCBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIHN0cm9rZS13aWR0aD0iMiIgZD0iTTE5IDlsLTcgNy03LTciPjwvcGF0aD48L3N2Zz4=')] bg-no-repeat bg-[right_1.5rem_center] bg-[length:1.2em]"
                                    value={formData.specialization}
                                    onChange={handleChange}
                                >
                                    <option>Acompañamiento Integral</option>
                                    <option>Cuidado Personal Avanzado</option>
                                    <option>Recuperación Funcional</option>
                                    <option>Movimiento y Autonomía</option>
                                    <option>Acompañamiento Compasivo</option>
                                    <option>Compañía Activa</option>
                                    <option>Apoyo en el Hogar</option>
                                    <option>Apoyo en Traslados</option>
                                    <option>Organización Diaria</option>
                                    <option>Apoyo Emocional</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="bio" className="block text-xs font-black text-[var(--primary-color)] uppercase tracking-widest mb-3">
                                Breve Biografía Profesional
                            </label>
                            <textarea
                                id="bio"
                                name="bio"
                                rows="4"
                                className="w-full px-6 py-4 bg-[var(--base-bg)] border-2 border-transparent rounded-[16px] focus:bg-white focus:border-[var(--secondary-color)] outline-none transition-all font-secondary text-gray-800 resize-none"
                                placeholder="Cuéntanos sobre tu experiencia y por qué amas tu trabajo..."
                                value={formData.bio}
                                onChange={handleChange}
                            ></textarea>
                        </div>

                        <div className="bg-gradient-to-br from-[var(--primary-color)] to-[#1a5a70] p-8 rounded-[24px] !text-[#FAFAF7] shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--secondary-color)] rounded-full -translate-y-1/2 translate-x-1/2 blur-[60px] opacity-20"></div>
                            <h4 className="text-xs font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2 opacity-80">
                                <AlertCircle size={14} /> Requisitos de Verificación
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <ul className="space-y-3">
                                    <li className="flex items-center gap-3 text-sm font-secondary">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--secondary-color)]"></div>
                                        Identificación oficial vigente
                                    </li>
                                    <li className="flex items-center gap-3 text-sm font-secondary">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--secondary-color)]"></div>
                                        Certificados de formación
                                    </li>
                                </ul>
                                <ul className="space-y-3">
                                    <li className="flex items-center gap-3 text-sm font-secondary">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--secondary-color)]"></div>
                                        2 Referencias laborales
                                    </li>
                                    <li className="flex items-center gap-3 text-sm font-secondary">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--secondary-color)]"></div>
                                        Antecedentes no penales
                                    </li>
                                </ul>
                            </div>
                            <p className="text-[10px] uppercase font-black tracking-widest mt-6 pt-4 border-t border-white/10 opacity-60 italic text-center">
                                * Podrás subir tus documentos en el siguiente paso.
                            </p>
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full btn btn-primary py-5 text-lg shadow-xl shadow-green-100 uppercase tracking-widest"
                            >
                                {loading ? (
                                    <span className="flex items-center gap-3">
                                        <Loader2 className="animate-spin" size={24} />
                                        <span>{user ? 'Completar Perfil' : 'Procesando registro...'}</span>
                                    </span>
                                ) : (
                                    <span>{user ? 'Completar Registro' : 'Continuar Registro'}</span>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default RegisterCaregiver;
