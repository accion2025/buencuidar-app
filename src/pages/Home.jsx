import React, { useState, useEffect } from 'react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { Search, Heart, Shield, Star, CheckCircle, MapPin, Activity, LayoutDashboard, ArrowRight, Download, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Home = () => {
    const navigate = useNavigate();
    const { user, profile } = useAuth();
    const dashboardPath = profile?.role === 'caregiver' ? '/caregiver' : '/dashboard';

    // Install Prompt Logic
    const [installPrompt, setInstallPrompt] = useState(null);
    const [authError, setAuthError] = useState(null);

    useEffect(() => {
        // Only auto-redirect if landing from an auth link (verification/login)
        const hash = window.location.hash;
        if (user && (hash.includes('access_token') || hash.includes('type=signup'))) {
            const role = profile?.role || user?.user_metadata?.role;
            const targetPath = role === 'caregiver' ? '/caregiver' : '/dashboard';
            navigate(targetPath);
        }
    }, [user, profile, navigate]);

    useEffect(() => {
        // Parse Hash errors
        const hash = window.location.hash;
        if (hash) {
            const params = new URLSearchParams(hash.replace('#', '?'));
            const errorCode = params.get('error_code');
            const errorDescription = params.get('error_description');

            if (errorCode === 'otp_expired') {
                setAuthError('El enlace de verificación ha expirado. Por favor, solicita uno nuevo intentando iniciar sesión.');
            } else if (errorCode) {
                setAuthError(errorDescription?.replace(/\+/g, ' ') || 'Ocurrió un error al verificar tu cuenta.');
            }

            // Clean hash
            window.history.replaceState(null, null, window.location.pathname);
        }
    }, []);

    useEffect(() => {
        const handler = (e) => {
            e.preventDefault();
            setInstallPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstallApp = async () => {
        if (!installPrompt) return;
        installPrompt.prompt();
        const { outcome } = await installPrompt.userChoice;
        if (outcome === 'accepted') {
            setInstallPrompt(null);
        }
    };

    return (
        <div className="min-h-screen flex flex-col font-sans">
            <Navbar />

            {authError && (
                <div className="bg-red-50 border-b border-red-100 px-6 py-4">
                    <div className="max-w-7xl mx-auto flex items-center gap-3">
                        <AlertCircle className="text-red-500 shrink-0" size={20} />
                        <p className="text-sm text-red-700 font-medium">{authError}</p>
                        <button
                            onClick={() => setAuthError(null)}
                            className="ml-auto text-red-400 hover:text-red-600 font-bold"
                        >
                            ×
                        </button>
                    </div>
                </div>
            )}

            {/* HERO SECTION */}
            <header className="relative bg-[var(--primary-color)] text-white pt-32 pb-20 px-6 overflow-hidden">
                <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center relative z-10">
                    <div className="space-y-6 animate-fade-in">
                        <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm border border-white/20">
                            <Shield size={16} className="text-green-300" />
                            <span>Cuidadores 100% Verificados</span>
                        </div>
                        <h1 className="text-5xl md:text-6xl font-bold leading-tight tracking-tight">
                            El cuidado que tu familia <span className="text-green-300">merece</span>, la paz que tú necesitas.
                        </h1>
                        <p className="text-xl text-gray-200 max-w-lg">
                            No tienes que hacerlo todo solo. Te conectamos con cuidadores de confianza que cuidan de los tuyos con el mismo amor que tú.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            {!user ? (
                                <>
                                    <button
                                        onClick={() => navigate('/search')}
                                        className="bg-white text-[var(--primary-color)] px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
                                    >
                                        <Search size={20} />
                                        Buscar Cuidador
                                    </button>
                                    <button
                                        onClick={() => navigate('/register-caregiver')}
                                        className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Heart size={20} />
                                        Soy Cuidador
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => navigate(dashboardPath)}
                                    className="bg-white text-[var(--primary-color)] px-10 py-4 rounded-xl font-black text-xl hover:bg-gray-100 transition-all hover:scale-105 shadow-2xl flex items-center justify-center gap-3"
                                >
                                    <LayoutDashboard size={24} />
                                    REGRESAR A MI PANEL
                                    <ArrowRight size={20} />
                                </button>
                            )}

                            {installPrompt && (
                                <button
                                    onClick={handleInstallApp}
                                    className="bg-blue-600 text-white px-8 py-4 rounded-xl font-black text-lg hover:bg-blue-500 transition-all hover:scale-110 shadow-lg flex items-center justify-center gap-2 animate-bounce-slow"
                                >
                                    <Download size={20} />
                                    Instalar App
                                </button>
                            )}

                            <button
                                onClick={() => navigate(user ? '/dashboard/salud' : '/ecosistema-salud')}
                                className="bg-green-400 text-[var(--primary-color)] px-8 py-4 rounded-xl font-black text-lg hover:bg-green-300 transition-all hover:scale-110 shadow-lg flex items-center justify-center gap-2 italic tracking-tighter"
                            >
                                <Activity size={20} className="animate-pulse" />
                                PULSO
                            </button>
                        </div>
                        <p className="text-sm text-gray-100 font-bold italic tracking-wide opacity-90">
                            PULSO: Seguimiento diario del cuidado
                        </p>
                        <p className="text-sm text-gray-300 pt-2 flex items-center gap-2">
                            <CheckCircle size={14} className="text-green-400" /> Sin comisiones ocultas
                            <CheckCircle size={14} className="text-green-400 ml-4" /> Cancelación flexible
                        </p>
                    </div>
                    <div className="relative hidden md:block">
                        <div className="absolute -inset-4 bg-green-400/20 rounded-full blur-3xl"></div>
                        <img
                            src="/images/rebranding/hero_humano.png"
                            alt="Conexión humana en el cuidado"
                            className="relative rounded-3xl shadow-2xl border-4 border-white/10 rotate-2 hover:rotate-0 transition-transform duration-500 max-w-md mx-auto"
                        />
                        {/* Floating Card */}
                        <div className="absolute -bottom-6 -left-6 bg-white text-gray-800 p-4 rounded-xl shadow-xl flex items-center gap-4 animate-bounce hover:pause">
                            <div className="bg-green-100 p-3 rounded-full">
                                <Star className="text-green-600 fill-current" size={24} />
                            </div>
                            <div>
                                <p className="font-bold text-lg">4.9/5</p>
                                <p className="text-xs text-gray-500">Valoración de familias</p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* PULSO BENEFITS SECTION */}
            <section className="py-24 px-6 bg-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-green-50 rounded-full -translate-y-1/2 translate-x-1/2 opacity-50"></div>
                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="flex flex-col lg:flex-row items-center gap-16">
                        <div className="lg:w-1/2 space-y-8">
                            <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-bold uppercase tracking-widest">
                                <Activity size={16} /> Exclusivo para suscriptores
                            </div>
                            <h2 className="text-4xl md:text-5xl font-black text-gray-900 leading-tight">
                                Descubre <span className="text-green-500 italic uppercase italic tracking-tighter">PULSO</span>: El futuro del cuidado familiar
                            </h2>
                            <p className="text-sm font-black text-green-600 uppercase tracking-widest mb-4">Seguimiento diario del cuidado</p>
                            <p className="text-xl text-gray-600 leading-relaxed">
                                Tu suscripción no solo te da acceso a los mejores cuidadores, te abre las puertas a nuestro ecosistema preventivo premium.
                            </p>

                            <div className="space-y-6">
                                {[
                                    { title: "Seguimiento de Bienestar en Tiempo Real", desc: "No más dudas. Mira los indicadores generales de tu familiar en vivo desde cualquier lugar." },
                                    { title: "Bitácora de Cuidado Digital", desc: "Transparencia total. Recibe actualizaciones detalladas de cada comida, paseo y apoyo personal." },
                                    { title: "Sistema de Alerta Familiar Élite", desc: "Un solo botón para activar una comunicación inmediata y coordinada." },
                                ].map((benefit, idx) => (
                                    <div key={idx} className="flex gap-4">
                                        <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-green-500 flex-shrink-0 shadow-sm">
                                            <CheckCircle size={24} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-lg text-gray-900">{benefit.title}</h4>
                                            <p className="text-gray-600">{benefit.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={() => navigate('/register')}
                                className="bg-[var(--primary-color)] text-white px-10 py-4 rounded-xl font-bold text-lg hover:brightness-110 shadow-xl transition-all"
                            >
                                Asegura la paz de tu familia ahora
                            </button>
                        </div>
                        <div className="lg:w-1/2 relative">
                            <div className="bg-gray-100 rounded-[2rem] aspect-square overflow-hidden shadow-2xl rotate-2 relative">
                                <img
                                    src="/images/rebranding/hero_humano.png"
                                    alt="Familia tranquila y conectada"
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                                <div className="absolute bottom-10 left-10 text-white">
                                    <p className="text-3xl font-black italic tracking-tighter">"Dormimos tranquilos por primera vez en años."</p>
                                    <p className="text-sm mt-2 opacity-80">— Familia Martínez</p>
                                </div>
                            </div>
                            {/* Floating Stats */}
                            <div className="absolute -top-8 -right-8 bg-white p-6 rounded-2xl shadow-2xl border border-gray-100 animate-bounce">
                                <p className="text-4xl font-black text-green-500">100%</p>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Tranquilidad Garantizada</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* TESTIMONIALS */}
            <section className="py-20 px-6 bg-white">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">Historias que nos inspiran</h2>
                    <p className="text-gray-600 mb-12 text-center max-w-2xl mx-auto">Lo que dicen las familias que ya transformaron su día a día con nosotros.</p>
                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { text: "Encontrar a María fue una bendición. Mi padre está feliz y nosotros tranquilos.", author: "Lucía M.", role: "Hija de persona acompañada" },
                            { text: "El proceso fue rapidísimo. En 24 horas ya teníamos a un enfermero certificado en casa.", author: "Roberto G.", role: "Usuario Premium" },
                            { text: "Me encanta la transparencia de los perfiles. Sabes exactamente a quién estás contratando.", author: "Ana P.", role: "Madre de familia" }
                        ].map((review, idx) => (
                            <div key={idx} className="bg-gray-50 p-8 rounded-2xl border border-gray-100 relative">
                                <div className="text-[var(--primary-color)] opacity-20 text-6xl font-serif absolute top-4 left-4">"</div>
                                <p className="text-gray-700 italic mb-6 relative z-10 pt-4">{review.text}</p>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center font-bold text-white">
                                        {review.author[0]}
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm">{review.author}</p>
                                        <p className="text-xs text-gray-500">{review.role}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA BANNER */}
            <section className="py-20 px-6">
                <div className="max-w-5xl mx-auto bg-[var(--primary-color)] rounded-3xl p-12 text-center text-white relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                    <div className="relative z-10">
                        <h2 className="text-4xl font-bold mb-6">Regálale a tu familia la paz que se merece</h2>
                        <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
                            No camines este camino solo. Únete a los cientos de hijos y nietos que ya descansan tranquilos sabiendo que sus seres queridos están en las mejores manos.
                        </p>
                        <button
                            onClick={() => navigate(user ? dashboardPath : '/register')}
                            className="bg-white text-[var(--primary-color)] px-10 py-4 rounded-full font-bold text-lg hover:shadow-2xl hover:scale-105 transition-all"
                        >
                            {user ? 'Regresar a mi Panel' : 'Empieza hoy mismo - Es Gratis'}
                        </button>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default Home;
