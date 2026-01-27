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
    const { signUp, user, profile } = useAuth();

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

    const generateCaregiverCode = () => {
        return 'CUID-' + Math.floor(100000 + Math.random() * 900000);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const finalCode = generateCaregiverCode();

        try {
            let authData;

            if (user) {
                // UPDATE/UPGRADE EXISTING USER
                const { error: updateError } = await supabase
                    .from('profiles')
                    .update({
                        role: 'caregiver',
                        phone: formData.phone,
                        full_name: formData.fullName
                    })
                    .eq('id', user.id);

                if (updateError) throw updateError;

                // Manually upsert details with generated code
                const { error: detailsError } = await supabase
                    .from('caregiver_details')
                    .upsert({
                        id: user.id,
                        bio: formData.bio,
                        specialization: formData.specialization,
                        experience: formData.experience,
                        caregiver_code: finalCode
                    }, { onConflict: 'id' });

                if (detailsError) throw detailsError;

                authData = { user, session: true };
            } else {
                // NEW USER REGISTRATION
                const { data, error: signUpError } = await signUp(formData.email, formData.password, {
                    full_name: formData.fullName,
                    phone: formData.phone,
                    role: 'caregiver',
                    bio: formData.bio,
                    specialization: formData.specialization,
                    experience: formData.experience
                });

                if (signUpError) throw new Error(`Error de Autenticación: ${signUpError.message}`);
                authData = data;

                // 3. OPTIONAL FAILSAFE: Manual insert (Client-side)
                // Now that we have a robust Server-Side Trigger, this is just a backup.
                // If it fails (e.g. due to RLS/Permissions), we ignore it and trust the server.
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
                            experience: formData.experience,
                            caregiver_code: finalCode
                        }, { onConflict: 'id' });

                    if (newDetailsError) {
                        console.warn("Manual details creation warning (handled by server trigger):", newDetailsError);
                    }

                    // Force context refresh if session exists
                    await refreshProfile();

                } catch (manualOpsError) {
                    console.warn("Client-side DB operations skipped (Trusting Server Trigger):", manualOpsError);
                }
            }



            // Navigate to success immediately with the code we just generated
            navigate('/registration-success', {
                state: {
                    fullName: formData.fullName,
                    caregiverCode: finalCode,
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
        <div className="min-h-screen bg-[var(--bg-color)] flex flex-col">
            <Navbar />

            <main className="flex-grow container mx-auto px-4 py-12 flex items-center justify-center">
                <div className="card w-full max-w-2xl bg-white p-8 shadow-lg">
                    <div className="text-center mb-8">
                        <span className="bg-[var(--secondary-color)] text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 inline-block">
                            Únete al equipo
                        </span>
                        <h2 className="text-3xl font-bold text-[var(--primary-color)]">
                            Registro de Cuidador Profesional
                        </h2>
                        <p className="text-gray-500 mt-2">
                            Forma parte de la red de cuidadores más confiable
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 animate-shake">
                            <AlertCircle className="text-red-500 shrink-0" size={20} />
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                                    Nombre Completo
                                </label>
                                <input
                                    type="text"
                                    id="fullName"
                                    name="fullName"
                                    autoComplete="name"
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[var(--primary-color)] outline-none"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                />
                            </div>
                            <div>
                                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                                    Teléfono
                                </label>
                                <input
                                    type="tel"
                                    id="phone"
                                    name="phone"
                                    autoComplete="tel"
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[var(--primary-color)] outline-none"
                                    value={formData.phone}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        {!user && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                        Correo Electrónico
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        autoComplete="email"
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[var(--primary-color)] outline-none"
                                        value={formData.email}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                        Contraseña
                                    </label>
                                    <input
                                        type="password"
                                        id="password"
                                        name="password"
                                        autoComplete="new-password"
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[var(--primary-color)] outline-none"
                                        value={formData.password}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        )}

                        {user && (
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Correo Electrónico (Conectado)
                                </label>
                                <input
                                    type="email"
                                    disabled
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500 cursor-not-allowed"
                                    value={formData.email}
                                />
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="experience" className="block text-sm font-medium text-gray-700 mb-1">
                                    Años de Experiencia
                                </label>
                                <input
                                    type="number"
                                    id="experience"
                                    name="experience"
                                    min="0"
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[var(--primary-color)] outline-none"
                                    value={formData.experience}
                                    onChange={handleChange}
                                />
                            </div>
                            <div>
                                <label htmlFor="specialization" className="block text-sm font-medium text-gray-700 mb-1">
                                    Especialización Principal
                                </label>
                                <select
                                    id="specialization"
                                    name="specialization"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[var(--primary-color)] outline-none bg-white"
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
                            <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                                Breve Biografía Profesional
                            </label>
                            <textarea
                                id="bio"
                                name="bio"
                                rows="3"
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[var(--primary-color)] outline-none"
                                placeholder="Cuéntanos sobre tu experiencia y por qué amas tu trabajo..."
                                value={formData.bio}
                                onChange={handleChange}
                            ></textarea>
                        </div>

                        <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
                            <h4 className="text-sm font-bold text-blue-800 mb-2">Requisitos de Verificación</h4>
                            <ul className="list-disc list-inside text-xs text-blue-700 space-y-1">
                                <li>Identificación oficial vigente</li>
                                <li>Certificados de formación comprobables</li>
                                <li>2 Referencias laborales</li>
                                <li>Antecedentes no penales</li>
                            </ul>
                            <p className="text-xs text-blue-600 mt-2 italic">
                                * Podrás subir tus documentos en el siguiente paso.
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-slate-200"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="animate-spin" size={20} />
                                    <span>{user ? 'Completar Perfil' : 'Procesando registro...'}</span>
                                </span>
                            ) : (
                                <span>{user ? 'Completar Registro' : 'Continuar Registro'}</span>
                            )}
                        </button>
                    </form>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default RegisterCaregiver;
