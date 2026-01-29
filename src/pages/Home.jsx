import React, { useState, useEffect } from 'react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { Search, Heart, Shield, Star, CheckCircle, CircleCheck, MapPin, Activity, LayoutDashboard, ArrowRight, Download, AlertCircle, Users, ClipboardCheck, Send, UserPlus, Eye, Coffee, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Home = () => {
    const navigate = useNavigate();
    const { user, profile } = useAuth();
    const dashboardPath = profile?.role === 'caregiver' ? '/caregiver' : '/dashboard';

    const [activeTab, setActiveTab] = useState('families');

    return (
        <div className="min-h-screen flex flex-col bg-white font-sans overflow-x-hidden">
            <Navbar />

            {/* HERO SECTION - REPLICA IMAGE 2 WITH HERO IMAGE 3 */}
            <section className="relative h-[90vh] min-h-[700px] flex items-center justify-center text-center px-6">
                {/* Background Image - Using Image 3 */}
                <div className="absolute inset-0 z-0">
                    <img
                        src="/images/rebranding/hero_v2.png"
                        alt="Background"
                        className="w-full h-full object-cover"
                    />
                    {/* Slightly lighter overlay to let the image show better, but enough for text contrast */}
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]"></div>
                </div>

                {/* Content Overlay - Centered */}
                <div className="relative z-10 max-w-5xl mx-auto flex flex-col items-center">
                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-brand font-bold text-[#FAFAF7] leading-tight mb-12 drop-shadow-lg">
                        El cuidado que tu familia <span className="text-[#2FAE8F]">merece</span>,<br />
                        la paz que tú necesitas
                    </h1>

                    {/* Stacked Action Buttons */}
                    <div className="w-full max-w-md space-y-4">
                        <button
                            onClick={() => navigate('/search')}
                            className="w-full bg-[#2FAE8F] text-[#FAFAF7] font-bold py-5 rounded-[8px] flex items-center justify-center gap-3 hover:bg-[#258e74] transition-all text-xl shadow-xl border-none"
                        >
                            <Search size={22} strokeWidth={3} />
                            Buscar Cuidador
                        </button>

                        <button
                            onClick={() => navigate('/register-caregiver')}
                            className="w-full bg-white text-[#0F3C4C] font-bold py-5 rounded-[8px] flex items-center justify-center gap-3 hover:bg-gray-50 transition-all text-xl shadow-lg border-none"
                        >
                            <Heart size={22} className="text-[#2FAE8F]" />
                            Soy Cuidador
                        </button>

                        <button
                            onClick={() => navigate(dashboardPath)}
                            className="w-full bg-white text-[#0F3C4C] font-bold py-5 rounded-[8px] flex items-center justify-center gap-3 hover:bg-gray-50 transition-all text-xl shadow-lg border border-gray-100 uppercase tracking-[0.2em] text-xs"
                        >
                            <Activity size={20} className="text-[#2FAE8F]" />
                            PULSO
                        </button>
                    </div>
                </div>
            </section>

            {/* HOW IT WORKS - EQUITABLE DISTRIBUTION */}
            <section className="py-24 px-4 bg-white">
                <div className="w-full max-w-screen-2xl mx-auto">
                    <div className="text-center mb-16">
                        <span className="text-[#2FAE8F] font-black tracking-widest uppercase text-xs">Paso a Paso</span>
                        <h2 className="text-5xl font-brand font-bold text-[#0F3C4C] mt-2 mb-4">¿Cómo Funciona BuenCuidar?</h2>
                        <p className="text-gray-500 max-w-2xl mx-auto text-lg">Hemos simplificado el proceso para que encuentres ayuda o trabajo en tiempo récord.</p>
                    </div>

                    <div className="flex justify-center mb-16">
                        <div className="bg-gray-100 p-1.5 rounded-full flex gap-1 shadow-inner">
                            <button
                                onClick={() => setActiveTab('families')}
                                className={`px-10 py-4 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'families' ? 'bg-white text-[#0F3C4C] shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <Heart size={18} /> Para Familias
                            </button>
                            <button
                                onClick={() => setActiveTab('caregivers')}
                                className={`px-10 py-4 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'caregivers' ? 'bg-white text-[#0F3C4C] shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <Users size={18} /> Para Cuidadores
                            </button>
                        </div>
                    </div>

                    {/* Equitable Grid - Spanning Full Width */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 px-8">
                        {(activeTab === 'families' ? [
                            { n: "1", icon: <UserPlus />, title: "Crear Perfil", desc: "Regístrate gratis y cuéntanos sobre tu familiar.", color: "bg-blue-50 text-blue-600" },
                            { n: "2", icon: <ClipboardCheck />, title: "Definir Ayuda", desc: "Especifica horarios, tareas y necesidades especiales.", color: "bg-purple-50 text-purple-600" },
                            { n: "3", icon: <Search />, title: "Elegir Cuidador", desc: "Explora perfiles verificados y entrevista candidatos.", color: "bg-amber-50 text-amber-600" },
                            { n: "4", icon: <Activity />, title: "Supervisar", desc: "Usa PULSO para seguimiento en tiempo real.", color: "bg-emerald-50 text-emerald-600" }
                        ] : [
                            { n: "1", icon: <UserPlus />, title: "Registro", desc: "Crea tu perfil profesional detallado.", color: "bg-indigo-50 text-indigo-600" },
                            { n: "2", icon: <Shield />, title: "Validación", desc: "Sube tus documentos para verificación de identidad.", color: "bg-rose-50 text-rose-600" },
                            { n: "3", icon: <Eye />, title: "Publicar Perfil", desc: "Tu perfil se vuelve visible para miles de familias.", color: "bg-cyan-50 text-cyan-600" },
                            { n: "4", icon: <Send />, title: "Recibir Solicitudes", desc: "Acepta trabajos que se ajusten a tu agenda.", color: "bg-green-50 text-green-600" }
                        ]).map((step, idx) => (
                            <div key={idx} className="flex flex-col items-center text-center p-10 rounded-[32px] hover:bg-gray-50 transition-all group">
                                <div className={`w-24 h-24 rounded-[28px] ${step.color} flex items-center justify-center mb-8 shadow-lg relative group-hover:scale-110 transition-transform duration-300`}>
                                    {React.cloneElement(step.icon, { size: 40 })}
                                    <div className="absolute -top-3 -right-3 w-8 h-8 bg-white rounded-full border-2 border-gray-100 flex items-center justify-center font-black text-xs text-gray-400 shadow-sm">
                                        {step.n}
                                    </div>
                                </div>
                                <h3 className="text-2xl font-brand font-bold text-[#0F3C4C] mb-4">{step.title}</h3>
                                <p className="text-gray-500 text-base leading-relaxed font-medium">{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* DARK SECTION - EQUITABLE DISTRIBUTION & #FAFAF7 TITLES */}
            <section className="bg-[#0F3C4C] py-28 px-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#2FAE8F] rounded-full mix-blend-multiply filter blur-[150px] opacity-10"></div>

                <div className="w-full max-w-full mx-auto relative z-10 px-4 md:px-12 lg:px-24">
                    {/* Header Removed as requested */}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-16">
                        {[
                            { icon: <Shield size={48} />, title: "Verificación Rigurosa", desc: "Cada cuidador pasa por un proceso de 5 filtros: Identidad, Antecedentes, Referencias, Capacitación y Entrevista." },
                            { icon: <Activity size={48} />, title: "Tecnología PULSO", desc: "Nuestro sistema exclusivo permite monitorear signos vitales y actividades diarias en tiempo real desde tu celular." },
                            { icon: <Heart size={48} />, title: "Garantía de Satisfacción", desc: "Si no haces \"click\" con tu cuidador en las primeras 24 horas, te ayudamos a encontrar un reemplazo sin costo extra." }
                        ].map((item, i) => (
                            <div key={i} className="bg-white/5 backdrop-blur-md p-14 rounded-[40px] border border-white/10 hover:bg-white/10 transition-all flex flex-col items-center text-center group min-h-[450px] justify-center">
                                <div className="text-[#2FAE8F] mb-10 p-8 bg-[#2FAE8F]/10 rounded-full group-hover:scale-110 transition-transform duration-300">
                                    {item.icon}
                                </div>
                                <h3 className="text-3xl font-brand font-bold mb-6 text-[#FAFAF7]">{item.title}</h3>
                                <p className="text-[#FAFAF7]/80 text-xl leading-relaxed font-light">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CALL TO ACTION - PERFECTLY CENTERED */}
            <section className="py-28 px-6 bg-[#FAFAF7] flex justify-center items-center">
                <div className="w-full max-w-5xl bg-white rounded-[48px] shadow-2xl p-16 md:p-32 text-center border border-gray-100 relative overflow-hidden">
                    <div className="relative z-10">
                        <h2 className="text-5xl lg:text-7xl font-brand font-bold text-[#0F3C4C] mb-10 tracking-tight">
                            ¿Listo para transformar <br /> el cuidado en casa?
                        </h2>
                        <p className="text-2xl text-gray-500 max-w-3xl mx-auto mb-16 leading-relaxed">
                            Únete hoy a BuenCuidar. Es gratis registrarse y explorar perfiles. Solo pagas cuando encuentras al cuidador ideal.
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center gap-8">
                            <button
                                onClick={() => navigate('/register')}
                                className="bg-[#2FAE8F] text-white px-14 py-6 rounded-[20px] text-xl font-bold shadow-2xl shadow-emerald-500/20 hover:bg-[#258e74] hover:-translate-y-1 transition-all"
                            >
                                Empezar Ahora
                            </button>
                            <button className="bg-gray-50 text-[#0F3C4C] px-14 py-6 rounded-[20px] text-xl font-bold border border-gray-200 hover:bg-gray-100 transition-all">
                                Ver Precios
                            </button>
                        </div>
                    </div>
                    {/* Subtle decoration */}
                    <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-[#2FAE8F]/5 rounded-full blur-3xl"></div>
                    <div className="absolute -top-24 -left-24 w-64 h-64 bg-[#0F3C4C]/5 rounded-full blur-3xl"></div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default Home;
