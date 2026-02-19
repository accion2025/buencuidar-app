import React from 'react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { UserPlus, Search, MessageCircle, Activity, Heart, ShieldCheck, DoorOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Services = () => {
    const navigate = useNavigate();
    const { profile } = useAuth();
    const isCaregiver = profile?.role === 'caregiver';

    const steps = [
        {
            icon: UserPlus,
            title: '1. Crear una cuenta gratuita',
            desc: 'Cualquier usuario puede registrarse sin costo. No hay tarifas de inscripción ni cargos ocultos. El objetivo es facilitar el acceso y eliminar barreras de entrada.'
        },
        {
            icon: Search,
            title: '2. Crear o explorar perfiles',
            desc: (
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                    <li>Las familias pueden buscar cuidadores según sus necesidades.</li>
                    <li>Los cuidadores pueden crear su perfil profesional, mostrando su experiencia, disponibilidad y vocación.</li>
                </ul>
            )
        },
        {
            icon: MessageCircle,
            title: '3. Conectar directamente',
            desc: 'La plataforma permite que familias y cuidadores se comuniquen entre sí. BC no intermedia pagos ni cobra comisiones por los acuerdos alcanzados entre las partes.'
        },
        {
            icon: Activity,
            title: '4. Acceder a BC Pulso (opcional)',
            desc: 'Servicio complementario bajo suscripción con funciones avanzadas (visibilidad, seguimiento, alertas). Es opcional; el uso esencial de la plataforma es gratuito.'
        }
    ];

    return (
        <div className="min-h-screen flex flex-col font-sans bg-gray-50">
            <Navbar />

            {/* Hero Section */}
            <header className="bg-[var(--primary-color)] text-[#FAFAF7] pt-[100px] pb-[80px] px-8 md:px-16 text-center">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-4xl md:text-5xl font-bold mb-6 text-[#FAFAF7]">Cómo funciona BuenCuidar</h1>

                    <div className="bg-[#0F3C4C]/30 backdrop-blur-sm border border-[#2FAE8F]/30 p-6 rounded-2xl inline-block mt-4">
                        <h2 className="text-xl md:text-2xl font-bold text-[#FAFAF7] mb-2">
                            El acceso es totalmente gratuito.
                        </h2>
                        <p className="text-lg text-gray-100">
                            BuenCuidar conecta a familias y cuidadores de forma directa, segura y sin intermediación.
                        </p>
                    </div>
                </div>
            </header>

            <main className="w-full flex-grow">
                {/* ¿Qué es BuenCuidar? */}
                <section className="py-16 md:py-24 px-8 md:px-16 bg-white">
                    <div className="max-w-6xl mx-auto">
                        <div className="grid md:grid-cols-2 gap-16 items-center">
                            <div className="text-center md:text-left">
                                <h2 className="text-xl md:text-2xl font-bold text-[#FAFAF7] mb-2">¿Qué es BuenCuidar?</h2>
                                <p className="text-lg text-gray-600 leading-relaxed mb-6">
                                    BuenCuidar es una plataforma creada para conectar personas que necesitan cuidados con cuidadores dispuestos a ofrecer su servicio de forma directa, digna y transparente.
                                </p>
                                <div className="hidden md:block h-1 w-24 bg-[var(--secondary-color)] rounded-full"></div>
                            </div>

                            <div className="bg-gray-50 p-8 md:p-12 rounded-[24px] border border-gray-100 shadow-sm">
                                <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                                    <strong>BC no es una agencia ni un intermediario.</strong> Es un espacio de encuentro humano que facilita la conexión, respetando la autonomía de cada persona.
                                </p>
                                <p className="text-lg text-gray-600 leading-relaxed font-medium text-[var(--secondary-color)] flex items-start gap-3">
                                    <span className="text-2xl mt-1">💡</span>
                                    Nuestro propósito es simple: hacer posible que el cuidado llegue a quien lo necesita, y que quien cuida pueda ofrecer su servicio con libertad.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ¿Cómo funciona? (4 Pasos) */}
                <section className="py-16 md:py-24 px-8 md:px-16 bg-gray-50">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center max-w-3xl mx-auto mb-16">
                            <h2 className="text-3xl md:text-4xl font-bold text-[var(--primary-color)] mb-4">¿Cómo funciona BuenCuidar?</h2>
                            <p className="text-lg text-gray-600">
                                Conectamos familias con cuidadores de forma directa. El proceso funciona en cuatro pasos simples:
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8 md:gap-10 mb-16">
                            {steps.map((step, idx) => (
                                <div key={idx} className="bg-white p-8 md:p-10 rounded-[24px] shadow-sm hover:shadow-md transition-all hover:-translate-y-1 border border-gray-100 flex gap-6 group">
                                    <div className="flex-shrink-0">
                                        <div className="w-16 h-16 rounded-2xl bg-[var(--base-bg)] group-hover:bg-[var(--primary-color)] transition-colors flex items-center justify-center text-[var(--primary-color)] group-hover:text-white">
                                            <step.icon size={32} />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-3">{step.title}</h3>
                                        <div className="text-gray-600 leading-relaxed text-lg">{step.desc}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="bg-blue-50 border border-blue-100 p-8 md:p-10 rounded-[24px] max-w-5xl mx-auto text-center relative overflow-hidden">
                            <div className="relative z-10">
                                <h4 className="text-lg font-bold text-[#0F3C4C] mb-2 uppercase tracking-wide">Importante</h4>
                                <p className="text-gray-700 text-lg">
                                    El uso esencial de BuenCuidar —crear cuenta, buscar, conectar y formar parte de la comunidad— es <strong>completamente gratuito</strong>. La suscripción BC Pulso es una opción adicional para quienes desean ampliar sus capacidades.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Nuestro Compromiso */}
                <section className="py-16 md:py-24 px-8 md:px-16 bg-white">
                    <div className="max-w-6xl mx-auto text-center">
                        <Heart className="w-16 h-16 text-[var(--secondary-color)] mx-auto mb-6" />
                        <h2 className="text-3xl md:text-4xl font-bold text-[var(--primary-color)] mb-10">Nuestro compromiso</h2>
                        <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
                            En BC creemos que el cuidado es una de las acciones más importantes que existen. Por eso, nuestra plataforma se basa en tres principios:
                        </p>

                        <div className="grid md:grid-cols-3 gap-8 mb-16">
                            {['Acceso libre y gratuito para todos', 'Respeto por la dignidad de cada persona', 'Conexiones humanas, directas y transparentes'].map((item, i) => (
                                <div key={i} className="bg-gray-50 p-8 rounded-[24px] hover:bg-gray-100 transition-colors">
                                    <p className="font-bold text-xl text-gray-700">{item}</p>
                                </div>
                            ))}
                        </div>

                        <div className="bg-[var(--primary-color)]/5 p-8 rounded-[24px] inline-block">
                            <p className="text-2xl font-bold text-[var(--primary-color)]">
                                Crear una cuenta en BC es completamente gratuito, hoy y siempre.<br />
                                <span className="text-[var(--secondary-color)] font-normal text-xl mt-2 block">Porque el cuidado no debe tener barreras de entrada.</span>
                            </p>
                        </div>
                    </div>
                </section>

                {/* Cierre - Puerta Abierta */}
                <section className="py-20 px-8 md:px-16 bg-[var(--primary-color)] text-white text-center">
                    <div className="max-w-3xl mx-auto">
                        <DoorOpen className="w-16 h-16 text-[var(--secondary-color)] mx-auto mb-6" />
                        <h2 className="text-3xl md:text-4xl font-bold mb-8 text-[#FAFAF7]">BC es una puerta abierta</h2>
                        <div className="space-y-4 text-xl text-gray-200 mb-10">
                            <p>Una puerta para quien necesita apoyo.</p>
                            <p>Una puerta para quien tiene la vocación de cuidar.</p>
                            <p>Una puerta para construir confianza.</p>
                        </div>
                        <p className="text-2xl font-bold text-[var(--secondary-color)] mb-10">
                            BC existe para conectar, facilitar y dignificar el cuidado humano.
                        </p>

                        {!profile && (
                            <button
                                onClick={() => navigate('/register')}
                                className="bg-[var(--secondary-color)] text-[#0F3C4C] hover:bg-white hover:text-[var(--primary-color)] transition-colors py-4 px-10 rounded-[16px] font-bold text-lg uppercase tracking-widest shadow-lg"
                            >
                                Únete Ahora
                            </button>
                        )}
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
};

export default Services;
