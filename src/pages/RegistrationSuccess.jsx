import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, Copy, ArrowRight, ShieldCheck, Mail, Star } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

const RegistrationSuccess = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { fullName, caregiverCode, email, requiresConfirmation } = location.state || {
        fullName: 'Cuidador',
        caregiverCode: 'BC-XXXX',
        email: 'tu correo',
        requiresConfirmation: false
    };

    const copyToClipboard = () => {
        if (caregiverCode && caregiverCode !== 'PENDIENTE' && caregiverCode !== 'BC-XXXX') {
            navigator.clipboard.writeText(caregiverCode);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            <Navbar />

            <main className="flex-grow flex items-center justify-center px-6 py-24">
                <div className="max-w-3xl w-full bg-white rounded-[3rem] shadow-2xl border border-gray-100 overflow-hidden relative">
                    {/* Elementos decorativos de fondo */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-green-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-50"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 opacity-50"></div>

                    <div className="relative z-10 p-8 md:p-16 text-center">
                        <div className="w-24 h-24 bg-green-100 text-green-600 rounded-3xl flex items-center justify-center mx-auto mb-8 animate-bounce">
                            <CheckCircle size={48} weight="bold" />
                        </div>

                        <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 tracking-tighter italic uppercase">
                            ¡BIENVENIDO A <span className="text-[var(--primary-color)]">BuenCuidar</span>, {fullName}!
                        </h1>

                        <p className="text-xl text-gray-600 mb-12 max-w-xl mx-auto font-medium">
                            {requiresConfirmation
                                ? "Tu registro se ha iniciado correctamente. Para activar tu cuenta y obtener tu código, por favor verifica tu correo."
                                : "Tu registro ha sido exitoso. Ahora eres parte de la red de cuidadores más profesional y tecnológica."}
                        </p>

                        <div className="bg-gray-900 rounded-[2rem] p-10 mb-12 shadow-2xl rotate-1 group hover:rotate-0 transition-transform duration-500">
                            <p className="text-blue-400 text-sm font-black uppercase tracking-[0.2em] mb-4">
                                {requiresConfirmation ? 'Código Pendiente de Verificación' : 'Tu Código de Identificación Único'}
                            </p>
                            <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                                <span className={`text-5xl md:text-7xl font-mono font-black tracking-widest bg-white/5 px-8 py-4 rounded-2xl border border-white/10 ${requiresConfirmation ? 'text-gray-500 blur-sm' : 'text-white'}`}>
                                    {caregiverCode}
                                </span>
                                {!requiresConfirmation && caregiverCode !== 'PENDIENTE' && (
                                    <button
                                        onClick={copyToClipboard}
                                        className="bg-white/10 hover:bg-white/20 text-white p-4 rounded-2xl transition-all active:scale-90"
                                        title="Copiar código"
                                    >
                                        <Copy size={24} />
                                    </button>
                                )}
                            </div>
                            <p className="text-gray-400 text-xs mt-6 italic font-medium">
                                {requiresConfirmation
                                    ? "* El código será visible una vez que confirmes el enlace enviado a tu correo."
                                    : "* Comparte este código con las familias para que puedan contratar tus servicios directamente."}
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6 mb-12 text-left">
                            <div className="bg-blue-50 p-6 rounded-[2rem] border border-blue-100 flex items-start gap-4">
                                <div className="bg-blue-600 text-white p-2 rounded-xl">
                                    <Mail size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900">Verifica tu email</h4>
                                    <p className="text-sm text-gray-600">Hemos enviado las instrucciones iniciales a <strong>{email}</strong>.</p>
                                </div>
                            </div>
                            <div className="bg-purple-50 p-6 rounded-[2rem] border border-purple-100 flex items-start gap-4">
                                <div className="bg-purple-600 text-white p-2 rounded-xl">
                                    <Star size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900">Completa tu perfil</h4>
                                    <p className="text-sm text-gray-600">Sube tus certificaciones para obtener la insignia de Verificado.</p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => navigate('/login')}
                            className="bg-[var(--primary-color)] text-white px-12 py-5 rounded-2xl font-black text-xl hover:scale-105 transition-transform flex items-center justify-center gap-3 mx-auto shadow-xl shadow-blue-200"
                        >
                            INICIAR SESIÓN AHORA
                            <ArrowRight size={24} />
                        </button>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default RegistrationSuccess;
