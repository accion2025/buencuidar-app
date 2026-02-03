import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { translateSupabaseError } from '../utils/translations';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

const Login = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const { state } = useLocation(); // To pick up success messages from registration

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const { user, profile, signIn } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Auto-redirect if already logged in
    useEffect(() => {
        if (user) {
            const role = profile?.role || user?.user_metadata?.role;
            if (role === 'caregiver') {
                navigate('/caregiver');
            } else if (role === 'admin') {
                navigate('/admin');
            } else {
                navigate('/dashboard');
            }
        }
    }, [user, profile, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const { data, error: authError } = await signIn(formData.email, formData.password);

        if (authError) {
            setError(translateSupabaseError(authError.message));
            setLoading(false);
            return;
        }

        // Redirect based on metadata role (much faster and avoids secondary race)
        const role = data.user?.user_metadata?.role;

        if (role === 'caregiver') {
            navigate('/caregiver');
        } else if (role === 'admin') {
            navigate('/admin');
        } else {
            navigate('/dashboard');
        }
        setLoading(false);
    };

    // Keep the simulation buttons for now but hide behind a conditional if you want
    const simulateLogin = (path) => navigate(path);

    return (
        <div className="min-h-screen bg-[var(--base-bg)] flex flex-col overflow-hidden">
            <Navbar />

            <main className="flex-grow container mx-auto px-4 md:px-12 py-28 md:py-24 flex items-start justify-start md:justify-center relative">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--secondary-color)] rounded-full blur-[120px] opacity-10 -z-10 animate-pulse hidden md:block"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[var(--accent-color)] rounded-full blur-[120px] opacity-20 -z-10 hidden md:block"></div>

                <div className="card w-full max-w-lg bg-white p-10 md:p-14 animate-fade-in-up shadow-2xl border-none">
                    <div className="text-center mb-10">
                        <h2 className="text-4xl font-brand font-bold text-[var(--primary-color)] tracking-tight">
                            Bienvenido de nuevo
                        </h2>
                        <p className="text-[var(--text-light)] mt-2 font-secondary">Tu tranquilidad comienza con un clic.</p>
                    </div>

                    {state?.message && (
                        <div className="bg-green-50 text-green-700 p-4 rounded-[16px] text-sm mb-8 text-center border border-green-100 font-bold">
                            {state.message}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-8">
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
                                placeholder="tu@email.com"
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-3">
                                <label htmlFor="password" className="block text-xs font-black text-[var(--primary-color)] uppercase tracking-widest">
                                    Contraseña
                                </label>
                                <Link to="/forgot-password" senior className="text-xs font-bold text-[var(--secondary-color)] hover:underline">
                                    ¿Olvidaste tu contraseña?
                                </Link>
                            </div>
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

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full btn btn-primary py-5 text-lg shadow-xl shadow-green-100 uppercase tracking-widest"
                            >
                                {loading ? 'Iniciando sesión...' : 'Entrar a mi cuenta'}
                            </button>

                            {error && (
                                <p className="text-[var(--error-color)] text-xs font-black text-center mt-6 animate-shake uppercase tracking-widest">
                                    {error}
                                </p>
                            )}
                        </div>
                    </form>

                    <div className="mt-12 text-center text-sm font-secondary text-[var(--text-light)] border-t border-gray-50 pt-8">
                        ¿No tienes una cuenta?{' '}
                        <Link to="/register" className="font-black text-[var(--secondary-color)] hover:underline">
                            Regístrate
                        </Link>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default Login;
