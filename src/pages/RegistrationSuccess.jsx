import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CheckCircle, Copy, ArrowRight, ShieldCheck, Mail, Star } from 'lucide-react';
import { translateSupabaseError } from '../utils/translations';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

const RegistrationSuccess = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { resendConfirmationEmail } = useAuth();
    const { fullName, caregiverCode, email, requiresConfirmation, role } = location.state || {
        fullName: 'Usuario',
        caregiverCode: null,
        email: 'tu correo',
        requiresConfirmation: false,
        role: 'family'
    };

    const copyToClipboard = () => {
        if (caregiverCode && caregiverCode !== 'PENDIENTE' && caregiverCode !== 'BC-XXXX') {
            navigator.clipboard.writeText(caregiverCode);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--base-bg)] flex flex-col">
            <Navbar />

            <main className="flex-grow flex items-center justify-center px-6 py-24 relative overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-[var(--secondary-color)] rounded-full blur-[150px] opacity-10 -z-10 animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-[var(--accent-color)] rounded-full blur-[150px] opacity-20 -z-10"></div>

                <div className="max-w-4xl w-full bg-white rounded-[48px] shadow-2xl border-none overflow-hidden relative">
                    <div className="relative z-10 p-10 md:p-20 text-center">
                        <div className="w-28 h-28 bg-[var(--secondary-color)]/10 text-[var(--secondary-color)] rounded-[16px] flex items-center justify-center mx-auto mb-10 animate-bounce shadow-lg shadow-green-100">
                            <CheckCircle size={56} strokeWidth={2.5} />
                        </div>

                        <h1 className="text-4xl md:text-6xl font-brand font-bold text-[var(--primary-color)] mb-6 tracking-tight">
                            ¡BIENVENIDO A <span className="text-[var(--secondary-color)] italic">BuenCuidar</span>, {fullName}!
                        </h1>

                        <p className="text-xl text-[var(--text-light)] mb-14 max-w-2xl mx-auto font-secondary leading-relaxed">
                            {requiresConfirmation
                                ? `Tu registro se ha iniciado correctamente. Por favor verifica tu correo para activar tu cuenta.`
                                : role === 'caregiver'
                                    ? "Tu registro ha sido exitoso. Ahora eres parte de la red de cuidadores más profesional y tecnológica."
                                    : "Tu registro ha sido exitoso. Bienvenido a la comunidad de familias que buscan el mejor cuidado."}
                        </p>

                        <div className="flex flex-col gap-8 mb-14 text-left">
                            <div className="bg-[var(--base-bg)] p-10 rounded-[16px] border border-gray-100 flex flex-col md:flex-row items-center gap-8 transform hover:scale-[1.01] transition-all">
                                <div className="bg-[var(--primary-color)] !text-[#FAFAF7] p-5 rounded-[22px] flex-shrink-0 shadow-lg shadow-blue-900/10">
                                    <Mail size={36} />
                                </div>
                                <div className="flex-grow">
                                    <h4 className="text-2xl font-brand font-bold text-[var(--primary-color)] mb-2">Verifica tu email</h4>
                                    <p className="text-[var(--text-light)] font-secondary leading-relaxed mb-6">Hemos enviado las instrucciones a <strong className="text-[var(--primary-color)]">{email}</strong>. Revisa tu bandeja de entrada y spam.</p>

                                    {requiresConfirmation && (
                                        <button
                                            onClick={async () => {
                                                const btn = document.getElementById('resend-btn');
                                                if (btn) btn.disabled = true;
                                                const { error } = await resendConfirmationEmail(email, role);
                                                if (error) {
                                                    alert(translateSupabaseError(error.message));
                                                    if (btn) btn.disabled = false;
                                                } else {
                                                    alert("Enlace reenviado. Revisa nuevamente.");
                                                    if (btn) btn.innerText = "Reenviado ✅";
                                                }
                                            }}
                                            id="resend-btn"
                                            className="btn btn-primary py-3 px-8 text-xs shadow-md shadow-green-100 uppercase tracking-widest inline-flex"
                                        >
                                            <Mail size={16} /> Reenviar enlace
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {role === 'caregiver' ? (
                                    <div className="bg-purple-50 p-8 rounded-[16px] border border-purple-100 flex items-start gap-5">
                                        <div className="bg-purple-600 !text-[#FAFAF7] p-3 rounded-[16px] shadow-lg shadow-purple-200">
                                            <Star size={24} />
                                        </div>
                                        <div>
                                            <h4 className="font-brand font-bold text-gray-900 text-lg">Completa tu perfil</h4>
                                            <p className="text-sm text-gray-600 font-secondary mt-1">Sube tus certificaciones para obtener la insignia de Verificado.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-orange-50 p-8 rounded-[16px] border border-orange-100 flex items-start gap-5">
                                        <div className="bg-orange-600 !text-[#FAFAF7] p-3 rounded-[16px] shadow-lg shadow-orange-200">
                                            <ShieldCheck size={24} />
                                        </div>
                                        <div>
                                            <h4 className="font-brand font-bold text-gray-900 text-lg">Seguridad Garantizada</h4>
                                            <p className="text-sm text-gray-600 font-secondary mt-1">Todos nuestros cuidadores pasan por un riguroso proceso de validación.</p>
                                        </div>
                                    </div>
                                )}

                                <div className="bg-[var(--secondary-color)]/5 p-8 rounded-[16px] border border-[var(--secondary-color)]/20 flex items-start gap-5">
                                    <div className="bg-[var(--secondary-color)] !text-[#FAFAF7] p-3 rounded-[16px] shadow-lg shadow-green-200">
                                        <ArrowRight size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-brand font-bold text-gray-900 text-lg">¿Siguiente Paso?</h4>
                                        <p className="text-sm text-gray-600 font-secondary mt-1">Inicia sesión y descubre todo lo que BuenCuidar tiene para ti.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                onClick={() => navigate('/login')}
                                className="btn btn-primary w-full md:w-auto px-16 py-5 text-lg uppercase tracking-[0.2em]"
                            >
                                Ir al Inicio de Sesión
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default RegistrationSuccess;
