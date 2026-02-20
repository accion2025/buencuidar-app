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
            <header className="bg-[var(--primary-color)] text-[#FAFAF7] pt-[100px] pb-[80px] px-8 md:px-[60px] text-center w-full flex flex-col items-center justify-center">
                <h1
                    className="text-4xl md:text-5xl font-bold mb-6 w-full"
                    style={{ color: '#FAFAF7' }}
                >
                    Cómo funciona BuenCuidar
                </h1>

                <div className="bg-[#0F3C4C]/30 backdrop-blur-sm border border-[#2FAE8F]/30 p-6 rounded-xl inline-block mt-4 mx-auto">
                    <h2
                        className="text-xl md:text-2xl font-bold mb-2"
                        style={{ color: '#FAFAF7' }}
                    >
                        El acceso es totalmente gratuito.
                    </h2>
                    <p className="text-lg text-gray-100 italic">
                        BuenCuidar conecta a familias y cuidadores de forma directa, segura y sin intermediación.
                    </p>
                </div>
            </header>

            <main className="w-full flex-grow">
                {/* ¿Qué es BuenCuidar? - Layout Estilo Pulso */}
                <section className="py-16 md:py-24 px-8 md:px-[60px] bg-white w-full">
                    <div className="w-full text-center">
                        <h2 className="text-3xl md:text-5xl font-brand font-bold text-[var(--primary-color)] mb-8 tracking-tighter">¿Qué es BuenCuidar?</h2>
                        <p className="text-xl text-gray-600 mb-12 leading-relaxed w-full font-medium">
                            BuenCuidar (BC) es una plataforma creada para conectar personas que necesitan cuidados con cuidadores dispuestos a ofrecer su servicio de forma directa, digna y transparente.
                        </p>

                        <div className="bg-gray-50 p-8 md:p-12 rounded-xl border border-gray-100 shadow-sm inline-block w-full max-w-5xl text-center mx-auto">
                            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                                <strong>BC no es una agencia ni un intermediario.</strong> Es un espacio de encuentro humano que facilita la conexión, respetando la autonomía de cada persona.
                            </p>
                            <p className="text-xl text-gray-600 leading-relaxed font-medium text-[var(--secondary-color)] flex flex-col md:flex-row items-center justify-center gap-4">
                                <span className="text-3xl">💡</span>
                                <span>Nuestro propósito es simple: hacer posible que el cuidado llegue a quien lo necesita, y que quien cuida pueda ofrecer su servicio con libertad.</span>
                            </p>
                        </div>
                    </div>
                </section>

                {/* ¿Cómo funciona? (4 Pasos) - Layout Estilo Pulso */}
                <section className="py-16 md:py-24 px-8 md:px-[60px] bg-gray-50 w-full">
                    <div className="w-full">
                        <div className="text-center mb-20">
                            <h2 className="text-3xl md:text-5xl font-brand font-bold text-[var(--primary-color)] mb-6 tracking-tighter">¿Cómo funciona BuenCuidar?</h2>
                            <p className="text-xl text-gray-600 font-medium w-full">
                                Conectamos familias con cuidadores de forma directa. El proceso funciona en cuatro pasos simples:
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20 w-full">
                            {steps.map((step, idx) => (
                                <div key={idx} className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-all hover:-translate-y-1 border border-gray-100 flex flex-col items-center gap-6 group text-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-16 h-16 rounded-xl bg-[var(--base-bg)] group-hover:bg-[var(--primary-color)] transition-colors flex items-center justify-center text-[var(--primary-color)] group-hover:text-white">
                                            <step.icon size={32} />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-4">{step.title}</h3>
                                        <div className="text-gray-600 leading-relaxed text-lg">{step.desc}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="py-16 md:py-24 px-8 md:px-[60px] bg-white w-full">
                    <div className="w-full text-center flex flex-col items-center">
                        <div className="bg-blue-50 border border-blue-100 p-8 md:p-12 rounded-xl w-full max-w-5xl text-center relative overflow-hidden mb-16 mx-auto">
                            <div className="relative z-10">
                                <h4 className="text-lg font-bold text-[#0F3C4C] mb-3 uppercase tracking-wide">Importante</h4>
                                <p className="text-gray-700 text-lg leading-relaxed">
                                    El uso esencial de BuenCuidar —crear cuenta, buscar, conectar y formar parte de la comunidad— es <strong>completamente gratuito</strong>. La suscripción BC Pulso es una opción adicional para quienes desean ampliar sus capacidades.
                                </p>
                            </div>
                        </div>

                        <Heart className="w-16 h-16 text-[var(--secondary-color)] mx-auto mb-8 animate-pulse" />
                        <h2 className="text-3xl md:text-5xl font-brand font-bold text-[var(--primary-color)] mb-12 tracking-tighter">Nuestro compromiso</h2>
                        <p className="text-xl text-gray-600 mb-16 w-full font-medium">
                            En BC creemos que el cuidado es una de las acciones más importantes que existen. Por eso, nuestra plataforma se basa en tres principios:
                        </p>

                        <div className="grid md:grid-cols-3 gap-10 mb-20 w-full">
                            {['Acceso libre y gratuito para todos', 'Respeto por la dignidad de cada persona', 'Conexiones humanas, directas y transparentes'].map((item, i) => (
                                <div key={i} className="bg-gray-50 p-8 rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-center min-h-[100px] border border-gray-100 shadow-sm">
                                    <p className="font-bold text-2xl text-gray-700 tracking-tight">{item}</p>
                                </div>
                            ))}
                        </div>

                        <div className="bg-[var(--primary-color)]/5 p-10 rounded-xl inline-block border border-[var(--primary-color)]/10">
                            <p className="text-2xl md:text-3xl font-bold text-[var(--primary-color)] tracking-tight">
                                Crear una cuenta en BC es completamente gratuito, hoy y siempre.<br />
                                <span className="text-[var(--secondary-color)] font-normal text-2xl mt-4 block italic">¡Porque el cuidado no debe tener barreras de entrada!</span>
                            </p>
                        </div>
                    </div>
                </section>

                {/* Cierre - Puerta Abierta - Layout Estilo Pulso */}
                <section className="py-16 px-8 md:px-[60px] bg-[var(--primary-color)] text-white text-center w-full min-h-[40vh] flex items-center justify-center">
                    <div className="max-w-4xl w-full">
                        <DoorOpen className="w-16 h-16 text-[var(--secondary-color)] mx-auto mb-6" />
                        <h2
                            className="text-3xl md:text-4xl font-bold mb-8"
                            style={{ color: '#FAFAF7' }}
                        >
                            BC es una puerta abierta
                        </h2>
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
                                className="bg-[var(--secondary-color)] text-[#0F3C4C] hover:bg-white hover:text-[var(--primary-color)] transition-colors py-4 px-10 rounded-xl font-bold text-lg uppercase tracking-widest shadow-lg"
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
