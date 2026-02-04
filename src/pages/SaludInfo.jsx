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
            <header className="bg-[var(--primary-color)] !text-[#FAFAF7] !py-[120px] !px-[15px] md:!px-[60px] min-h-[40vh] flex items-center justify-center">
                <div className="w-full text-center space-y-8 flex flex-col items-center justify-center">
                    <div className="inline-flex flex-col items-center gap-1">
                        <div className="inline-flex items-center gap-2 bg-green-400 text-[var(--primary-color)] px-4 py-2 rounded-full text-sm font-black uppercase tracking-tighter animate-pulse">
                            <Activity size={18} /> Ecosistema BC PULSO
                        </div>
                        <span className="text-xs font-black text-green-300 uppercase tracking-[0.2em]">Tu espacio de seguimiento del cuidado y la tranquilidad familiar</span>
                    </div>
                    <h1 className="!text-[40px] md:!text-[66px] font-brand font-bold leading-tight tracking-tighter !text-[#FAFAF7] drop-shadow-sm">
                        B<span className="text-[var(--secondary-color)]">C PULSO</span> es el sistema central de monitoreo <br />
                        y acompañamiento de BuenCuidar.
                    </h1>
                    <p className="text-xl text-green-50 max-w-3xl mx-auto opacity-90 font-medium text-center">
                        Aquí, las familias pueden dar seguimiento continuo al bienestar, las rutinas y la calidad del cuidado que reciben sus adultos mayores, en un entorno digital seguro y confiable.
                    </p>
                </div>
            </header>

            {/* LAS 3 COLUMNAS DEL PODER PULSO */}
            <section className="py-20 !px-[15px] md:!px-[60px] w-full">
                <div className="grid lg:grid-cols-3 gap-16">
                    {/* COLUMNA 1: MONITOREO */}
                    <div className="flex flex-col">
                        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-[16px] flex items-center justify-center mb-8">
                            <Zap size={32} />
                        </div>
                        <h2 className="text-3xl md:text-5xl font-brand font-bold mb-8 tracking-tighter leading-tight !text-[#0F3C4C]">
                            <span className="uppercase">¿QUÉ ES</span> <br />
                            <span className="not-italic inline-block">
                                <span className="font-semibold" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                    B<span style={{ color: '#2FAE8F' }}>C</span>
                                </span>{' '}
                                <span className="font-bold text-[var(--secondary-color)]" style={{ fontFamily: 'Poppins, sans-serif' }}>PULSO</span>
                            </span>?
                        </h2>
                        <p className="text-gray-600 mb-6 leading-relaxed">
                            BC Pulso es una herramienta de gestión, seguimiento y comunicación que conecta a familias, cuidadores y adultos mayores en un solo espacio. Permite supervisar:
                        </p>
                        <ul className="space-y-5">
                            <li className="flex items-center gap-2 text-sm font-bold text-gray-800"><CheckCircle size={16} className="text-blue-500" /> El estado general de bienestar</li>
                            <li className="flex items-center gap-2 text-sm font-bold text-gray-800"><CheckCircle size={16} className="text-blue-500" /> Las rutinas diarias</li>
                            <li className="flex items-center gap-2 text-sm font-bold text-gray-800"><CheckCircle size={16} className="text-blue-500" /> La actividad del cuidador</li>
                            <li className="flex items-center gap-2 text-sm font-bold text-gray-800"><CheckCircle size={16} className="text-blue-500" /> Los registros básicos de atención</li>
                            <li className="flex items-center gap-2 text-sm font-bold text-gray-800"><CheckCircle size={16} className="text-blue-500" /> La evolución del cuidado en el tiempo</li>
                            <li className="flex items-center gap-2 text-sm font-bold text-gray-800"><CheckCircle size={16} className="text-blue-500" /> Todo desde una plataforma clara y fácil de usar.</li>
                        </ul>
                    </div>

                    {/* COLUMNA 2: EMERGENCIA (Ahora al centro - Con recuadro negro) */}
                    <div className="bg-gray-900 p-10 rounded-[16px] shadow-2xl !text-[#FAFAF7] hover:scale-105 transition-transform rotate-1 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-red-500 !text-[#FAFAF7] rounded-[16px] flex items-center justify-center mb-8 animate-pulse mx-auto">
                            <Bell size={32} />
                        </div>
                        <h2 className="text-3xl md:text-5xl font-brand font-bold mb-8 tracking-tighter uppercase !text-[#FAFAF7] w-full leading-tight">
                            Sistema de <br /> Alerta Familiar
                        </h2>
                        <p className="text-gray-300 mb-6 leading-relaxed w-full">
                            Activa una COMUNICACIÓN INMEDIATA. Notifica a familiares, contactos de confianza.
                        </p>
                    </div>

                    {/* COLUMNA 3: BITÁCORA (Ahora a la derecha) */}
                    <div className="flex flex-col">
                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-[16px] flex items-center justify-center mb-8">
                            <Clock size={32} />
                        </div>
                        <h2 className="text-3xl md:text-5xl font-brand font-bold mb-8 tracking-tighter uppercase !text-[#0F3C4C] leading-tight">
                            Bitácora Digital <br /> de Cuidado
                        </h2>
                        <p className="text-gray-600 mb-6 leading-relaxed">
                            Cada acción queda documentada:
                        </p>
                        <ul className="space-y-5 mb-6">
                            <li className="flex items-center gap-2 text-sm font-bold text-gray-800"><CheckCircle size={16} className="text-green-500" /> Rutinas realizadas</li>
                            <li className="flex items-center gap-2 text-sm font-bold text-gray-800"><CheckCircle size={16} className="text-green-500" /> Observaciones</li>
                            <li className="flex items-center gap-2 text-sm font-bold text-gray-800"><CheckCircle size={16} className="text-green-500" /> Cambios de estado</li>
                            <li className="flex items-center gap-2 text-sm font-bold text-gray-800"><CheckCircle size={16} className="text-green-500" /> Reportes del cuidador</li>
                            <li className="flex items-center gap-2 text-sm font-bold text-gray-800"><CheckCircle size={16} className="text-green-500" /> Historial verificable</li>
                        </ul>
                        <p className="text-sm font-medium text-gray-500 italic">
                            Esto genera transparencia, confianza y trazabilidad real del cuidado.
                        </p>
                    </div>
                </div>
            </section>

            {/* INFOGRAFÍA VISUAL (CONCEPTUAL) */}
            <section className="py-20 bg-white border-y border-gray-100">
                <div className="w-full !px-[15px] md:!px-[60px] grid md:grid-cols-3 gap-12 items-center">
                    <div>
                        <h2 className="text-3xl md:text-5xl font-brand font-bold tracking-tighter mb-8 leading-tight !text-[#0F3C4C]">
                            <span className="uppercase">¿POR QUÉ ELEGIR</span> <br />
                            <span className="font-semibold" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                B<span style={{ color: '#2FAE8F' }}>C</span>
                            </span>{' '}
                            <span className="font-bold text-[var(--secondary-color)]" style={{ fontFamily: 'Poppins, sans-serif' }}>PULSO</span>?
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
                            className="relative rounded-[16px] shadow-2xl border-8 border-gray-50 w-full object-cover"
                        />
                    </div>

                    <div className="flex flex-col">
                        <h2 className="text-3xl md:text-5xl font-brand font-bold tracking-tighter mb-8 leading-tight !text-[#0F3C4C]">
                            <span className="uppercase">¿Por qué</span> <br />
                            <span className="not-italic inline-block">
                                <span className="font-semibold" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                    B<span style={{ color: '#2FAE8F' }}>C</span>
                                </span>{' '}
                                <span className="font-bold text-[var(--secondary-color)]" style={{ fontFamily: 'Poppins, sans-serif' }}>PULSO</span>
                            </span> ES DIFERENTE?
                        </h2>
                        <div className="space-y-6">
                            <p className="text-xl text-gray-700 font-medium">Porque no solo conecta cuidadores y familias, sino que:</p>
                            <ul className="space-y-4">
                                {[
                                    "Organiza el cuidado",
                                    "Profesionaliza el seguimiento",
                                    "Digitaliza la confianza",
                                    "Humaniza la tecnología",
                                    "Fortalece el vínculo familiar"
                                ].map((step, i) => (
                                    <li key={i} className="flex items-center gap-3 text-lg font-bold text-[#0F3C4C]">
                                        <div className="bg-green-100 p-1.5 rounded-full text-green-600">
                                            <CheckCircle size={20} />
                                        </div>
                                        {step}
                                    </li>
                                ))}
                            </ul>
                            <p className="text-xl font-black text-[var(--secondary-color)] mt-8 uppercase tracking-tighter">
                                Es tecnología al servicio del bienestar.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA FINAL */}
            <section className="py-24 !px-[15px] md:!px-[60px] flex flex-col items-center justify-center text-center w-full bg-white border-t border-gray-100 min-h-[60vh]">
                <div className="max-w-4xl w-full space-y-10 flex flex-col items-center">
                    <h2 className="text-4xl md:text-5xl font-brand font-bold tracking-tighter uppercase !text-[#0F3C4C]">
                        Únete hoy a la revolución del cuidado
                    </h2>
                    <p className="text-xl text-gray-600 font-medium max-w-2xl">
                        No esperes a una emergencia para desear haber tenido este sistema. Tu familia merece esta tranquilidad.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-6 justify-center w-full max-w-2xl">
                        <button
                            onClick={() => navigate('/dashboard/plans')}
                            className="btn btn-primary text-lg md:text-xl py-6 px-10 rounded-[24px] uppercase tracking-widest font-black w-full flex items-center justify-center gap-3 hover:scale-105 transition-transform"
                        >
                            Activar <span className="ml-1 mr-1">B<span style={{ color: 'var(--primary-color)' }}>C</span> <span className="text-[var(--primary-color)]">PULSO</span></span> ahora
                            <ArrowRight size={24} />
                        </button>
                        <button
                            onClick={() => navigate('/login')}
                            className="btn btn-outline text-lg md:text-xl py-6 px-10 rounded-[24px] uppercase tracking-widest font-black w-full border-2 border-[var(--primary-color)] hover:bg-[var(--primary-color)]/5 transition-all !text-[var(--primary-color)]"
                        >
                            Ya soy usuario
                        </button>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default SaludInfo;
