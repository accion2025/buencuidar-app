import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

const UpdatePassword = () => {
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { error: updateError } = await supabase.auth.updateUser({
                password: password
            });

            if (updateError) throw updateError;

            setSuccess(true);
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err) {
            console.error('Error updating password:', err);
            setError(err.message || 'No se pudo actualizar la contraseña.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--bg-color)] flex flex-col">
            <Navbar />

            <main className="flex-grow container mx-auto px-4 py-20 flex items-center justify-center">
                <div className="card w-full max-w-md bg-white p-8 animate-fade-in shadow-xl rounded-3xl border border-gray-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>

                    <div className="relative z-10">
                        <h2 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">
                            Nueva Contraseña
                        </h2>
                        <p className="text-gray-500 mb-8">
                            Ingresa tu nueva contraseña para recuperar el acceso a tu cuenta.
                        </p>

                        {success ? (
                            <div className="bg-green-50 border border-green-100 p-6 rounded-2xl text-center animate-scale-in">
                                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle size={32} />
                                </div>
                                <h3 className="font-bold text-green-900 mb-2">¡Contraseña Actualizada!</h3>
                                <p className="text-sm text-green-700">
                                    Tu contraseña ha sido cambiada con éxito. Redirigiéndote al inicio de sesión...
                                </p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label htmlFor="password" senior className="block text-sm font-bold text-gray-700 mb-2 ml-1">
                                        Contraseña Nueva
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                        <input
                                            type="password"
                                            id="password"
                                            required
                                            minLength="6"
                                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[var(--primary-color)] focus:bg-white focus:border-transparent outline-none transition-all shadow-inner"
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="confirmPassword" senior className="block text-sm font-bold text-gray-700 mb-2 ml-1">
                                        Confirmar Nueva Contraseña
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                        <input
                                            type="password"
                                            id="confirmPassword"
                                            required
                                            minLength="6"
                                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[var(--primary-color)] focus:bg-white focus:border-transparent outline-none transition-all shadow-inner"
                                            placeholder="••••••••"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {error && (
                                    <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 animate-shake">
                                        <AlertCircle className="text-red-500 shrink-0" size={20} />
                                        <p className="text-sm text-red-700 font-medium">{error}</p>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-lg hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="animate-spin" size={24} />
                                            <span>Actualizando...</span>
                                        </>
                                    ) : (
                                        <span>Cambiar Contraseña</span>
                                    )}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default UpdatePassword;
