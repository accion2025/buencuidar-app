import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

const ForgotPassword = () => {
    const { resetPassword } = useAuth();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            const { error: resetError } = await resetPassword(email);
            if (resetError) throw resetError;

            setMessage('Hemos enviado un enlace de recuperación a tu correo electrónico.');
        } catch (err) {
            console.error('Error in password reset request:', err);
            setError(err.message || 'No se pudo procesar la solicitud. Por favor intenta de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--bg-color)] flex flex-col">
            <Navbar />

            <main className="flex-grow container mx-auto px-4 py-20 flex items-center justify-center">
                <div className="card w-full max-w-md bg-white p-8 animate-fade-in shadow-xl rounded-[16px] border border-gray-100 relative overflow-hidden">
                    {/* Decorative elements */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>

                    <div className="relative z-10">
                        <Link to="/login" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[var(--primary-color)] mb-8 transition-colors group">
                            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                            Regresar al Inicio de Sesión
                        </Link>

                        <h2 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">
                            Recuperar Contraseña
                        </h2>
                        <p className="text-gray-500 mb-8">
                            Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu acceso.
                        </p>

                        {message ? (
                            <div className="bg-green-50 border border-green-100 p-6 rounded-[16px] text-center animate-scale-in">
                                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle size={32} />
                                </div>
                                <h3 className="font-bold text-green-900 mb-2">¡Correo Enviado!</h3>
                                <p className="text-sm text-green-700 leading-relaxed">
                                    {message}
                                </p>
                                <Link
                                    to="/login"
                                    className="mt-6 block w-full bg-green-600 !text-[#FAFAF7] py-3 rounded-[16px] font-bold hover:bg-green-700 transition-all shadow-md"
                                >
                                    Volver al Login
                                </Link>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label htmlFor="email" className="block text-sm font-bold text-gray-700 mb-2 ml-1">
                                        Correo Electrónico
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                        <input
                                            type="email"
                                            id="email"
                                            required
                                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-[16px] focus:ring-2 focus:ring-[var(--primary-color)] focus:bg-white focus:border-transparent outline-none transition-all shadow-inner"
                                            placeholder="ejemplo@correo.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {error && (
                                    <div className="p-4 bg-red-50 border border-red-100 rounded-[16px] flex items-start gap-3 animate-shake">
                                        <AlertCircle className="text-red-500 shrink-0" size={20} />
                                        <p className="text-sm text-red-700 font-medium">{error}</p>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-slate-900 !text-[#FAFAF7] py-5 rounded-[16px] font-black text-lg hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="animate-spin" size={24} />
                                            <span>Enviando...</span>
                                        </>
                                    ) : (
                                        <span>Enviar Enlace</span>
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

export default ForgotPassword;
