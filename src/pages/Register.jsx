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
        <div className="min-h-screen bg-[var(--bg-color)] flex flex-col">
            <Navbar />

            <main className="flex-grow container mx-auto px-4 py-16 flex items-center justify-center">
                <div className="card w-full max-w-lg bg-white p-8 shadow-lg">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold text-[var(--primary-color)]">
                            Crear Cuenta
                        </h2>
                        <p className="text-gray-500 mt-2">
                            Encuentra el cuidado perfecto para tus seres queridos
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 animate-shake">
                            <AlertCircle className="text-red-500 shrink-0" size={20} />
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                                Nombre Completo
                            </label>
                            <input
                                type="text"
                                id="fullName"
                                name="fullName"
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[var(--primary-color)] focus:border-transparent outline-none"
                                placeholder="Juan Pérez"
                                value={formData.fullName}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                Correo Electrónico
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[var(--primary-color)] focus:border-transparent outline-none"
                                placeholder="juan@ejemplo.com"
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                    Contraseña
                                </label>
                                <input
                                    type="password"
                                    id="password"
                                    name="password"
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[var(--primary-color)] focus:border-transparent outline-none"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={handleChange}
                                />
                            </div>
                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                                    Confirmar Contraseña
                                </label>
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[var(--primary-color)] focus:border-transparent outline-none"
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
                                className="h-4 w-4 text-[var(--primary-color)] focus:ring-[var(--primary-color)] border-gray-300 rounded"
                            />
                            <label htmlFor="terms" className="ml-2 block text-sm text-gray-900">
                                Acepto los <a href="#" className="text-[var(--primary-light)] hover:underline">Términos y Condiciones</a>
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-slate-200"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="animate-spin" size={20} />
                                    <span>Registrando...</span>
                                </span>
                            ) : (
                                <span>Registrarse</span>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center border-t pt-6">
                        <p className="text-sm text-gray-600 mb-2">¿Buscas trabajo como cuidador?</p>
                        <Link to="/register-caregiver" className="text-[var(--secondary-color)] font-bold hover:underline">
                            Regístrate como Cuidador
                        </Link>
                    </div>

                    <div className="mt-4 text-center text-sm text-gray-600">
                        ¿Ya tienes cuenta?{' '}
                        <Link to="/login" className="font-semibold text-[var(--primary-color)] hover:underline">
                            Inicia Sesión
                        </Link>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default Register;
