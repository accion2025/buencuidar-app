import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { translateSupabaseError } from '../utils/translations';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const { signUp } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }

        setLoading(true);
        setError('');

        const { data, error: signUpError } = await signUp(formData.email, formData.password, {
            full_name: formData.fullName,
            role: 'family'
        });

        if (signUpError) {
            setError(translateSupabaseError(signUpError.message));
            setLoading(false);
            return;
        }

        navigate('/registration-success', {
            state: {
                fullName: formData.fullName,
                email: formData.email,
                requiresConfirmation: true,
                role: 'family'
            }
        });
    };

    return (
        <div className="min-h-screen bg-red-500 flex flex-col">
            <Navbar />

            <main className="flex-grow container mx-auto px-4 py-12 md:py-24 flex items-start md:items-center justify-center relative">
                <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-[var(--secondary-color)] rounded-full blur-[120px] opacity-10 -z-10 animate-pulse"></div>
                <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-[var(--accent-color)] rounded-full blur-[120px] opacity-20 -z-10"></div>

                <div className="card w-full max-w-2xl bg-white p-10 md:p-14 animate-fade-in-up shadow-2xl border-none">
                    <div className="text-center mb-10">
                        <h2 className="text-4xl font-brand font-bold text-[var(--primary-color)] tracking-tight">
                            Crear Cuenta
                        </h2>
                        <p className="text-[var(--text-light)] mt-2 font-secondary">
                            Encuentra el cuidado perfecto para tus seres queridos
                        </p>
                    </div>

                    {error && (
                        <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-[16px] flex items-start gap-3 animate-shake">
                            <AlertCircle className="text-[var(--error-color)] shrink-0" size={20} />
                            <p className="text-xs font-black text-[var(--error-color)] uppercase tracking-widest leading-relaxed">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div>
                            <label htmlFor="fullName" className="block text-xs font-black text-[var(--primary-color)] uppercase tracking-widest mb-3">
                                Nombre Completo
                            </label>
                            <input
                                type="text"
                                id="fullName"
                                name="fullName"
                                required
                                className="w-full px-6 py-4 bg-[var(--base-bg)] border-2 border-transparent rounded-[16px] focus:bg-white focus:border-[var(--secondary-color)] outline-none transition-all font-secondary text-gray-800"
                                placeholder="Juan Pérez"
                                value={formData.fullName}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-xs font-black text-[var(--primary-color)] uppercase tracking-widest mb-3">
                                Correo Electrónico
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                required
                                className="w-full px-6 py-4 bg-[var(--base-bg)] border-2 border-transparent rounded-[16px] focus:bg-white focus:border-[var(--secondary-color)] outline-none transition-all font-secondary text-gray-800"
                                placeholder="juan@ejemplo.com"
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="password" className="block text-xs font-black text-[var(--primary-color)] uppercase tracking-widest mb-3">
                                    Contraseña
                                </label>
                                <input
                                    type="password"
                                    id="password"
                                    name="password"
                                    required
                                    className="w-full px-6 py-4 bg-[var(--base-bg)] border-2 border-transparent rounded-[16px] focus:bg-white focus:border-[var(--secondary-color)] outline-none transition-all font-secondary text-gray-800"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={handleChange}
                                />
                            </div>
                            <div>
                                <label htmlFor="confirmPassword" className="block text-xs font-black text-[var(--primary-color)] uppercase tracking-widest mb-3">
                                    Confirmar Contraseña
                                </label>
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    required
                                    className="w-full px-6 py-4 bg-[var(--base-bg)] border-2 border-transparent rounded-[16px] focus:bg-white focus:border-[var(--secondary-color)] outline-none transition-all font-secondary text-gray-800"
                                    placeholder="••••••••"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="flex items-center">
                            <input
                                id="terms"
                                name="terms"
                                type="checkbox"
                                required
                                className="h-5 w-5 text-[var(--secondary-color)] focus:ring-[var(--secondary-color)] border-gray-300 rounded-[6px] transition-all cursor-pointer"
                            />
                            <label htmlFor="terms" className="ml-3 block text-sm text-[var(--text-main)] font-secondary">
                                Acepto los <a href="#" className="font-bold text-[var(--secondary-color)] hover:underline">Términos y Condiciones</a>
                            </label>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full btn btn-primary py-5 text-lg shadow-xl shadow-green-100 uppercase tracking-widest"
                            >
                                {loading ? (
                                    <span className="flex items-center gap-3">
                                        <Loader2 className="animate-spin" size={24} />
                                        <span>Registrando...</span>
                                    </span>
                                ) : (
                                    <span>Registrarse Now</span>
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="mt-12 text-center space-y-4 border-t border-gray-50 pt-10">
                        <div>
                            <p className="text-xs font-black text-[var(--text-light)] uppercase tracking-widest mb-2">¿Buscas trabajo como cuidador?</p>
                            <Link to="/register-caregiver" className="text-[var(--secondary-color)] font-brand font-bold text-lg hover:underline italic">
                                Regístrate como Cuidador
                            </Link>
                        </div>

                        <div className="pt-4">
                            <p className="text-sm font-secondary text-[var(--text-light)]">
                                ¿Ya tienes cuenta?{' '}
                                <Link to="/login" className="font-black text-[var(--primary-color)] hover:underline uppercase tracking-widest text-xs">
                                    Inicia Sesión
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default Register;
