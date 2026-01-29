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
    const [isLinkInvalid, setIsLinkInvalid] = useState(false);

    useEffect(() => {
        // Parse URL fragments (Supabase uses # for auth callbacks)
        const hash = window.location.hash;
        const params = new URLSearchParams(hash.replace('#', '?'));
        const errorMsg = params.get('error_description');
        const errorCode = params.get('error_code');

        if (errorCode === 'otp_expired' || errorMsg?.includes('expired')) {
            setError('El enlace de recuperación ha expirado. Por favor, solicita uno nuevo.');
            setIsLinkInvalid(true);
        } else if (errorMsg) {
            setError(errorMsg.replace(/\+/g, ' '));
            setIsLinkInvalid(true);
        }

        // Check if we have a session (Supabase should have set it from the link)
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session && !errorCode) {
                // If no session and no explicit error in URL, it might have been lost on refresh
                setError('No se encontró una sesión activa. Asegúrate de usar el enlace enviado a tu correo.');
                setIsLinkInvalid(true);
            }
        };

        checkSession();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { data, error: updateError } = await supabase.auth.updateUser({
                password: password
            });

            if (updateError) {
                if (updateError.message.includes('session missing')) {
                    throw new Error('La sesión ha expirado o es inválida. Por favor, solicita un nuevo enlace.');
                }
                throw updateError;
            }

            setSuccess(true);
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err) {
            console.error('Error updating password:', err);
            setError(err.message || 'No se pudo actualizar la contraseña.');
            if (err.message.includes('solicita un nuevo enlace')) {
                setIsLinkInvalid(true);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--bg-color)] flex flex-col">
            <Navbar />

            <main className="flex-grow container mx-auto px-4 py-20 flex items-center justify-center">
                <div className="card w-full max-w-md bg-white p-8 animate-fade-in shadow-xl rounded-[16px] border border-gray-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>

                    <div className="relative z-10">
                        <h2 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">
                            Nueva Contraseña
                        </h2>
                        <p className="text-gray-500 mb-8">
                            Ingresa tu nueva contraseña para recuperar el acceso a tu cuenta.
                        </p>

                        {success ? (
                            <div className="bg-green-50 border border-green-100 p-6 rounded-[16px] text-center animate-scale-in">
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
                                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-[16px] focus:ring-2 focus:ring-[var(--primary-color)] focus:bg-white focus:border-transparent outline-none transition-all shadow-inner"
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
                                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-[16px] focus:ring-2 focus:ring-[var(--primary-color)] focus:bg-white focus:border-transparent outline-none transition-all shadow-inner"
                                            placeholder="••••••••"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {error && (
                                    <div className="p-4 bg-red-50 border border-red-100 rounded-[16px] flex items-start gap-3 animate-shake">
                                        <AlertCircle className="text-red-500 shrink-0" size={20} />
                                        <p className="text-sm text-red-700 font-medium">{error}</p>
                                    </div>
                                )}

                                {isLinkInvalid ? (
                                    <button
                                        type="button"
                                        onClick={() => navigate('/forgot-password')}
                                        className="w-full bg-indigo-600 !text-[#FAFAF7] py-5 rounded-[16px] font-black text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-3"
                                    >
                                        Solicitar Nuevo Enlace
                                    </button>
                                ) : (
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-slate-900 !text-[#FAFAF7] py-5 rounded-[16px] font-black text-lg hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
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
                                )}
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
