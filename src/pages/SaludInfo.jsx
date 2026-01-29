import React from 'react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { Activity, Shield, Heart, Zap, Clock, Bell, ArrowRight, CheckCircle, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SaludInfo = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex flex-col font-sans bg-gray-50">
            <Navbar />

            {/* HERO INFOGRAFÍA */}
            <header className="bg-[var(--primary-color)] !text-[#FAFAF7] pt-40 pb-20 px-6 min-h-[50vh] flex items-center justify-center">
                <div className="max-w-[1600px] mx-auto text-center space-y-6">
                    <div className="inline-flex flex-col items-center gap-1">
                        <div className="inline-flex items-center gap-2 bg-green-400 text-[var(--primary-color)] px-4 py-2 rounded-full text-sm font-black uppercase tracking-tighter animate-pulse">
                            <Activity size={18} /> Ecosistema BC PULSO
                        </div>
                        <span className="text-xs font-black text-green-300 uppercase tracking-[0.2em]">Seguimiento diario del cuidado</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-brand font-bold leading-tight tracking-tighter !text-[#FAFAF7] drop-shadow-sm">
                        EL FUTURO DEL CUIDADO <br /> <span className="text-[var(--secondary-color)] uppercase">EN LA PALMA DE TU MANO</span>
                    </h1>
                    <p className="text-xl text-green-50 max-w-3xl mx-auto opacity-90 font-medium">
                        Mucho más que una red de cuidadores. Una plataforma tecnológica diseñada para prevenir, monitorear y actuar ante cualquier situación, garantizando la paz espiritual de toda la familia.
                    </p>
                </div>
            </header>

            {/* LAS 3 COLUMNAS DEL PODER PULSO */}
            <section className="py-20 px-6 max-w-[1600px] mx-auto">
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* COLUMNA 1: MONITOREO */}
                    <div className="bg-white p-10 rounded-[16px] shadow-xl border border-gray-100 hover:scale-105 transition-transform">
                        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-[16px] flex items-center justify-center mb-8">
                            <Zap size={32} />
                        </div>
                        <h3 className="text-2xl font-black mb-4 text-gray-900 tracking-tighter">SEGUIMIENTO DE BIENESTAR VIVO</h3>
                        <p className="text-gray-600 mb-6 leading-relaxed">
                            Integración con dispositivos inteligentes para ver **indicadores de bienestar, señales corporales y nivel de bienestar** en tiempo real desde tu móvil.
                        </p>
                        <ul className="space-y-3">
                            <li className="flex items-center gap-2 text-sm font-bold text-gray-800"><CheckCircle size={16} className="text-green-500" /> Alertas por anomalías</li>
                            <li className="flex items-center gap-2 text-sm font-bold text-gray-800"><CheckCircle size={16} className="text-green-500" /> Histórico semanal</li>
                            <li className="flex items-center gap-2 text-sm font-bold text-gray-800"><CheckCircle size={16} className="text-green-500" /> Reporte familiar</li>
                        </ul>
                    </div>

                    {/* COLUMNA 2: BITÁCORA */}
                    <div className="bg-white p-10 rounded-[16px] shadow-xl border border-gray-100 hover:scale-105 transition-transform border-t-8 border-t-green-400">
                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-[16px] flex items-center justify-center mb-8">
                            <Clock size={32} />
                        </div>
                        <h3 className="text-2xl font-black mb-4 text-gray-900 tracking-tighter uppercase text-green-600">Bitácora de Cuidado Élite</h3>
                        <p className="text-gray-600 mb-6 leading-relaxed">
                            Cada comida, cada rutina personal y cada cambio de humor queda registrado con **evidencia fotográfica y notas del cuidador**.
                        </p>
                        <ul className="space-y-3">
                            <li className="flex items-center gap-2 text-sm font-bold text-gray-800"><CheckCircle size={16} className="text-green-500" /> Seguimiento de rutinas</li>
                            <li className="flex items-center gap-2 text-sm font-bold text-gray-800"><CheckCircle size={16} className="text-green-500" /> Registro de hábitos</li>
                            <li className="flex items-center gap-2 text-sm font-bold text-gray-800"><CheckCircle size={16} className="text-green-500" /> Notificaciones push</li>
                        </ul>
                    </div>

                    {/* COLUMNA 3: EMERGENCIA */}
                    <div className="bg-gray-900 p-10 rounded-[16px] shadow-2xl !text-[#FAFAF7] hover:scale-105 transition-transform rotate-1">
                        <div className="w-16 h-16 bg-red-500 !text-[#FAFAF7] rounded-[16px] flex items-center justify-center mb-8 animate-pulse">
                            <Bell size={32} />
                        </div>
                        <h3 className="text-2xl font-brand font-bold mb-4 tracking-tighter uppercase !text-[#FAFAF7]">Sistema de Alerta Familiar</h3>
                        <p className="text-gray-300 mb-6 leading-relaxed">
                            Activa una **comunicación inmediata**. Notifica a familiares, contactos de confianza y nuestro centro de monitoreo 24/7.
                        </p>
                        <ul className="space-y-3">
                            <li className="flex items-center gap-2 text-sm font-bold text-red-200"><CheckCircle size={16} className="text-red-500" /> Un solo toque activa todo</li>
                            <li className="flex items-center gap-2 text-sm font-bold text-red-200"><CheckCircle size={16} className="text-red-500" /> Geolocalización exacta</li>
                            <li className="flex items-center gap-2 text-sm font-bold text-red-200"><CheckCircle size={16} className="text-red-500" /> Comunicación directa</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* INFOGRAFÍA VISUAL (CONCEPTUAL) */}
            <section className="py-20 bg-white border-y border-gray-100">
                <div className="max-w-[1600px] mx-auto px-6 grid md:grid-cols-3 gap-12 items-center">
                    <div>
                        <h2 className="text-3xl md:text-5xl font-brand font-bold tracking-tighter mb-8 leading-tight !text-[#0F3C4C]">
                            <span className="uppercase">¿POR QUÉ ELEGIR</span> <br />
                            <span className="font-semibold" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                B<span style={{ color: '#2FAE8F' }}>C</span>
                            </span>{' '}
                            <span className="font-bold text-[var(--secondary-color)]" style={{ fontFamily: 'Poppins, sans-serif' }}>PULSO</span>
                        </h2>
                        <div className="space-y-6">
                            {[
                                { title: "Paz Mental para Hijos", text: "Sabes que tu ser querido está seguro sin tener que llamar cada 5 minutos." },
                                { title: "Evidencia de Calidad", text: "Cuidadores que certifican su trabajo con registros digitales inalterables." },
                                { title: "Respuesta en Segundos", text: "En situaciones críticas, cada segundo cuenta. Nuestro protocolo es el más rápido del mercado." }
                            ].map((item, i) => (
                                <div key={i} className="flex gap-4 items-start">
                                    <div className="bg-green-100 p-2 rounded-[16px] text-green-600 mt-1">
                                        <Shield size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-xl !text-[#0F3C4C]">{item.title}</h4>
                                        <p className="text-gray-600 leading-relaxed font-secondary">{item.text}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="relative w-full">
                        <div className="absolute inset-0 bg-green-500/20 blur-[100px] rounded-full"></div>
                        <img
                            src="/images/rebranding/pulso_hogareno.png"
                            alt="Cuidado hogareño y profesional"
                            className="relative rounded-[16px] shadow-2xl border-8 border-gray-50 -rotate-3 w-full object-cover"
                        />
                    </div>

                    <div className="flex flex-col">
                        <h2 className="text-3xl md:text-5xl font-brand font-bold tracking-tighter mb-8 leading-tight !text-[#0F3C4C]">
                            <span className="uppercase">¿QUÉ MÁS OFRECE</span> <br />
                            <span className="not-italic inline-block">
                                <span className="font-semibold" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                    B<span style={{ color: '#2FAE8F' }}>C</span>
                                </span>{' '}
                                <span className="font-bold text-[var(--secondary-color)]" style={{ fontFamily: 'Poppins, sans-serif' }}>PULSO</span>
                            </span>?
                        </h2>
                        <div className="space-y-6">
                            {[
                                { title: "UBICACIÓN EN TIEMPO REAL", text: "Sabes exactamente dónde está tu familiar en cualquier momento del día." },
                                { title: "RED DE APOYO INMEDIATA", text: "Activación inmediata de servicios locales y aviso a toda la red familiar." },
                                { title: "CUIDADO CERTIFICADO", text: "Cuidadores verificados con nuestro sello de calidad y compromiso BuenCuidar." }
                            ].map((item, i) => (
                                <div key={i} className="flex gap-4 items-start group">
                                    <div className="bg-blue-50 p-2.5 rounded-[16px] text-[var(--primary-color)] mt-1 transition-colors group-hover:bg-[var(--secondary-color)] group-hover:text-white">
                                        <CheckCircle size={22} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-xl !text-[#0F3C4C] group-hover:text-[var(--secondary-color)] transition-colors uppercase">{item.title}</h4>
                                        <p className="text-gray-600 leading-relaxed font-secondary">{item.text}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA FINAL */}
            <section className="py-20 px-6 flex justify-center">
                <div className="max-w-4xl w-full bg-[var(--primary-color)] p-12 rounded-[16px] text-center !text-[#FAFAF7] shadow-2xl relative overflow-hidden">
                    <div className="relative z-10 space-y-8">
                        <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase">
                            Únete hoy a la revolución del cuidado
                        </h2>
                        <p className="text-xl text-green-50 font-medium">
                            No esperes a una emergencia para desear haber tenido este sistema. Tu familia merece esta tranquilidad.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                onClick={() => navigate('/dashboard/plans')}
                                className="bg-white text-[var(--primary-color)] px-10 py-5 rounded-[16px] font-black text-xl hover:scale-105 transition-transform flex items-center justify-center gap-3 shadow-xl"
                            >
                                Activar <span className="ml-1 mr-1">B<span style={{ color: '#2FAE8F' }}>C</span> <span className="text-[var(--secondary-color)]">PULSO</span></span> ahora
                                <ArrowRight size={24} />
                            </button>
                            <button
                                onClick={() => navigate('/login')}
                                className="bg-transparent border-2 border-white/30 !text-[#FAFAF7] px-10 py-5 rounded-[16px] font-bold text-xl hover:bg-white/10 transition-colors"
                            >
                                Ya soy usuario
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default SaludInfo;
