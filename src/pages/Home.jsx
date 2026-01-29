import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import InstallPrompt from '../components/InstallPrompt';

const Home = () => {
    const navigate = useNavigate();

    return (
        <div className="w-full bg-[var(--base-bg)]">
            <Navbar />

            <main>
                {/* Hero Section */}
                <section className="hero-bg min-h-screen relative overflow-hidden">
                    {/* Text Container - Top Left (50px top, 40px left) */}
                    <div className="absolute top-[50px] left-[40px] z-10 text-left max-w-4xl">
                        <h1 style={{ color: '#FAFAF7' }} className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight drop-shadow-xl">
                            El cuidado que tu <br />
                            <span className="text-[var(--secondary-color)]">familia merece,</span> <br />
                            la paz que tú necesitas
                        </h1>
                    </div>

                    {/* Buttons Container - Bottom Center (100px from bottom) */}
                    <div className="absolute bottom-[100px] left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-[30px] w-full z-10 px-4">
                        <button
                            onClick={() => navigate('/search')}
                            className="btn btn-primary animate-pulse-soft text-lg md:text-xl py-6 px-12 rounded-[20px] uppercase tracking-widest font-black w-full max-w-sm"
                        >
                            Buscar Cuidador
                        </button>

                        <button
                            onClick={() => navigate('/services')}
                            className="btn btn-secondary text-lg md:text-xl py-6 px-12 rounded-[20px] uppercase tracking-widest font-black w-full max-w-sm bg-[var(--primary-color)] text-white hover:bg-[var(--primary-hover)] transition-all"
                        >
                            Servicios
                        </button>

                        <button
                            onClick={() => navigate('/ecosistema-salud')}
                            className="btn btn-outline text-lg md:text-xl py-6 px-12 rounded-[20px] uppercase tracking-widest font-black w-full max-w-sm border-2 border-white hover:bg-white/10 transition-all backdrop-blur-sm"
                            style={{ color: '#FAFAF7', fontFamily: 'Poppins, sans-serif' }}
                        >
                            BC PULSO
                        </button>

                        {/* Install Prompt - Positioned below buttons */}
                        <InstallPrompt className="w-full max-w-sm mt-4 animate-slide-up" />
                    </div>
                </section>

                {/* Content Sections that justify the scroll */}
                <section id="features" className="py-24 bg-white relative z-20 shadow-2xl">
                    <div className="w-full px-8 md:px-16">
                        {/* Header and subtext aligned strictly over the center column (Monitoreo Salud) */}
                        <div className="grid md:grid-cols-3 gap-10 mb-20">
                            <div className="hidden md:block"></div>
                            <div className="text-center">
                                <h2 className="text-4xl md:text-5xl font-bold text-[var(--primary-color)] mb-8">
                                    Seguridad y Confianza en cada paso
                                </h2>
                                <p className="text-xl text-gray-500">
                                    Nuestra plataforma no solo conecta servicios, construye puentes de tranquilidad para lo más valioso: tus seres queridos.
                                </p>
                            </div>
                            <div className="hidden md:block"></div>
                        </div>

                        <div className="grid md:grid-cols-3 gap-10">
                            <div className="card p-10 border-none bg-[var(--base-bg)]">
                                <h3 className="text-2xl font-bold mb-4 text-[var(--primary-color)]">Verificación Total</h3>
                                <p className="text-gray-600">Proceso exhaustivo de validación de antecedentes y experiencia.</p>
                            </div>
                            <div className="card p-10 border-none bg-white shadow-xl">
                                <h3 className="text-2xl font-bold mb-4 text-[var(--secondary-color)]">Monitoreo Salud</h3>
                                <p className="text-gray-600">Registro diario de bienestar y alertas para mayor tranquilidad.</p>
                            </div>
                            <div className="card p-10 border-none bg-[var(--base-bg)]">
                                <h3 className="text-2xl font-bold mb-4 text-[var(--primary-color)]">Soporte Humano</h3>
                                <p className="text-gray-600">Estamos aquí para ayudarte en cada etapa del proceso.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Historias Section */}
                <section className="py-24 bg-gray-50">
                    <div className="w-full px-8 md:px-16">
                        {/* Header aligned strictly under the center column (Monitoreo Salud) */}
                        <div className="grid md:grid-cols-3 gap-8 mb-16">
                            <div className="hidden md:block"></div>
                            <div className="text-center">
                                <h2 className="text-4xl md:text-5xl font-bold mb-4 text-[#0F3C4C]">Historias que nos inspiran</h2>
                                <p className="text-xl text-gray-600">
                                    Lo que dicen las familias que ya transformaron su día a día con nosotros.
                                </p>
                            </div>
                            <div className="hidden md:block"></div>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            {[
                                {
                                    quote: "Encontrar a María fue una bendición. Mi padre está feliz y nosotros tranquilos.",
                                    author: "Lucía M.",
                                    role: "Hija de persona acompañada",
                                    initial: "L",
                                    image: "/images/story_lucia.png"
                                },
                                {
                                    quote: "El proceso fue rapidísimo. En 24 horas ya teníamos a un enfermero certificado en casa.",
                                    author: "Roberto G.",
                                    role: "Usuario Premium",
                                    initial: "R",
                                    image: "/images/story_roberto.png"
                                },
                                {
                                    quote: "Me encanta la transparencia de los perfiles. Sabes exactamente a quién estás contratando.",
                                    author: "Ana P.",
                                    role: "Madre de familia",
                                    initial: "A",
                                    image: "/images/story_ana.png"
                                }
                            ].map((story, idx) => (
                                <div key={idx} className="bg-white p-8 rounded-[16px] shadow-sm border border-gray-100 flex flex-col relative overflow-hidden group hover:shadow-md transition-shadow">
                                    <div className="mx-auto mb-6 relative">
                                        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg">
                                            <img src={story.image} alt={story.author} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                        </div>
                                        <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-[var(--secondary-color)] rounded-full flex items-center justify-center text-[#0F3C4C] font-bold text-xs shadow-sm">
                                            “ ”
                                        </div>
                                    </div>

                                    <p className="text-gray-700 text-lg italic mb-6 flex-grow">
                                        "{story.quote}"
                                    </p>

                                    <div className="mt-auto">
                                        <h4 className="font-bold text-[#0F3C4C]">{story.author}</h4>
                                        <p className="text-sm text-gray-500">{story.role}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* CTA positioned strictly under the center column (Roberto G) */}
                        <div className="grid md:grid-cols-3 gap-8 mt-20">
                            <div className="hidden md:block"></div>
                            <div className="flex flex-col items-center text-center">
                                <h2 className="text-3xl font-bold text-[var(--primary-color)] mb-8">
                                    Únete a la comunidad BuenCuidar
                                </h2>
                                <button
                                    onClick={() => navigate('/register')}
                                    className="btn btn-primary text-xl px-12 py-6 rounded-2xl w-full md:w-auto hover:scale-105 transition-transform"
                                >
                                    Comenzar Ahora
                                </button>
                            </div>
                            <div className="hidden md:block"></div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default Home;
