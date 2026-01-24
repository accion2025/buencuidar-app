import React, { useState } from 'react';
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

    const { signIn } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

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
        <div className="min-h-screen bg-[var(--bg-color)] flex flex-col">
            <Navbar />

            <main className="flex-grow container mx-auto px-4 py-20 flex items-center justify-center">
                <div className="card w-full max-w-md bg-white p-8 animate-fade-in shadow-lg">
                    <h2 className="text-3xl font-bold text-center mb-4 text-[var(--primary-color)]">
                        Bienvenido de nuevo
                    </h2>

                    {state?.message && (
                        <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm mb-6 text-center border border-green-100">
                            {state.message}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                Correo Electrónico
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[var(--primary-color)] focus:border-transparent outline-none transition-all"
                                placeholder="tu@email.com"
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                    Contraseña
                                </label>
                                <a href="#" className="text-sm text-[var(--primary-light)] hover:underline">
                                    ¿Olvidaste tu contraseña?
                                </a>
                            </div>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[var(--primary-color)] focus:border-transparent outline-none transition-all"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="space-y-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-[var(--primary-color)] text-white py-3 rounded-lg font-bold hover:brightness-90 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? 'Iniciando sesión...' : 'Entrar a mi cuenta'}
                            </button>

                            {error && (
                                <p className="text-red-500 text-sm font-medium text-center animate-shake">
                                    {error}
                                </p>
                            )}
                        </div>
                    </form>

                    <div className="mt-6 text-center text-sm text-gray-600">
                        ¿No tienes una cuenta?{' '}
                        <Link to="/register" className="font-semibold text-[var(--primary-color)] hover:underline">
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
