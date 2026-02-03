import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, ArrowRight, TrendingUp, Users, ShieldCheck, Share, X } from 'lucide-react';
import Logo from '../components/layout/Logo';

const Landing = () => {
    const navigate = useNavigate();
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isIOS, setIsIOS] = useState(false);
    const [showInstructions, setShowInstructions] = useState(false);

    useEffect(() => {
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
        if (isStandalone) navigate('/home');

        const userAgent = window.navigator.userAgent;
        const isIosDevice = /iPad|iPhone|iPod/.test(userAgent) ||
            (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);
        setIsIOS(isIosDevice);

        const handler = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, [navigate]);

    const handleInstall = async () => {
        if (isIOS) {
            setShowInstructions(true);
            return;
        }
        if (!deferredPrompt) {
            alert("Usa el menú de tu navegador para 'Agregar a la pantalla de inicio'.");
            return;
        }
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') setDeferredPrompt(null);
    };


    return (
        <div
            className="min-h-screen bg-[#FAFAF8] text-[#4A4F55] font-secondary selection:bg-[var(--secondary-color)] selection:text-white relative flex flex-col items-center"
        >
            {/* Texture and Background Layers */}
            <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.03] select-none"
                style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/handmade-paper.png")' }}></div>

            <div className="absolute inset-0 pointer-events-none -z-10 bg-white">
                <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-[var(--secondary-color)]/10 to-transparent clip-path-header"></div>
                <div className="absolute top-[400px] left-[-10%] w-[120%] h-[700px] bg-[var(--primary-color)]/[0.02] transform rotate-3 rounded-[100%] blur-[100px]"></div>
                <div className="absolute bottom-0 left-0 w-full h-[300px] bg-gradient-to-t from-[var(--secondary-color)]/10 to-transparent"></div>
            </div>

            <style>
                {`
                .clip-path-header { clip-path: ellipse(100% 55% at 50% 0%); }
                .image-mask-brand {
                    border-radius: 40px;
                    box-shadow: 0 40px 100px -20px rgba(0,0,0,0.15);
                }
                `}
            </style>

            {/* Header */}
            <header className="w-full max-w-[1440px] px-6 lg:px-[100px] py-10 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10 border-b border-gray-100/30">
                <Logo className="h-16 md:h-20 w-auto drop-shadow-sm" />
            </header>

            <main className="w-full max-w-[1440px] relative z-10 flex-grow flex flex-col gap-20">
                {/* Hero Section Wrapper */}
                <div className="w-full px-6 lg:px-[100px] py-10 mx-auto">

                    {/* Hero Section: Rebalanced to avoid overlap */}
                    <section className="grid lg:grid-cols-[1fr_auto] gap-6 lg:gap-4 items-center">
                        <div className="space-y-12 order-2 lg:order-1 text-center lg:text-left">
                            <div className="space-y-6">
                                <h1 className="text-4xl md:text-6xl font-primary font-bold text-[var(--primary-color)] leading-tight transform -translate-x-1">
                                    Centroamérica Envejece
                                </h1>
                                <div className="space-y-6 text-gray-700 leading-relaxed text-lg md:text-xl font-medium max-w-2xl mx-auto lg:mx-0">
                                    <p>
                                        Centroamérica vive un proceso silencioso pero profundo: cada año aumenta el número de adultos mayores y disminuye el apoyo familiar disponible. La migración, el trabajo informal y los cambios en la estructura familiar han reducido el tiempo y los recursos para el cuidado.
                                    </p>
                                    <p>
                                        Muchas personas envejecen hoy con limitadas redes de apoyo, sin acceso constante a servicios especializados y con familias que, aunque desean ayudar, no siempre saben cómo hacerlo.
                                    </p>
                                    <p className="font-bold text-[var(--primary-color)]">
                                        Este nuevo escenario exige soluciones humanas, tecnológicas y confiables que acompañen el envejecimiento con dignidad, seguridad y respeto.
                                    </p>
                                </div>
                            </div>

                            {/* Stats - Single Line Horizontal aligned with text width */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8 items-start justify-between lg:justify-start border-t border-gray-100/50 max-w-2xl lg:mx-0 mx-auto">
                                <div className="flex flex-col gap-1">
                                    <span className="text-3xl font-black text-[var(--secondary-color)]">25%</span>
                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-tight">Pob. mayor <br /> en 10 años</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-3xl font-black text-[var(--primary-color)]">+5 M</span>
                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-tight">Adultos <br /> mayores hoy</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-3xl font-black text-[var(--primary-color)]">1%</span>
                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-tight">Apoyo <br /> profesional</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-3xl font-black text-[var(--secondary-color)]">100%</span>
                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-tight">Cuidadores <br /> verificados</span>
                                </div>
                            </div>
                        </div>

                        {/* Image Area - High contrast and visibility */}
                        <div className="order-1 lg:order-2 flex justify-center lg:justify-start">
                            <div className="relative w-full max-w-[440px]">
                                {/* Decorative background for the image to ensure it pops */}
                                <div className="absolute inset-0 bg-[var(--secondary-color)]/5 -m-6 rounded-[50px] blur-3xl opacity-70"></div>
                                <div className="relative z-10 p-4 bg-white image-mask-brand border-4 border-white/50">
                                    <div className="w-full aspect-[4/5] overflow-hidden rounded-[32px]">
                                        <img
                                            src="/images/landing/familia_hero.png"
                                            alt="Familia BuenCuidar"
                                            className="w-full h-full object-cover"
                                            loading="eager"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>


                {/* Section: Explanation - True Full Width Background */}
                <section className="w-full flex flex-col py-28 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-[600px] bg-[var(--secondary-color)]/5 blur-[120px] -z-10"></div>

                    {/* Contenedor del Título: Centrado en la sección */}
                    <div className="w-full px-6 lg:px-[100px] mb-12 flex justify-center">
                        <h2 className="text-4xl md:text-7xl font-primary font-bold text-[var(--primary-color)] tracking-tight text-center">
                            ¿Qué es Buen<span className="text-[var(--secondary-color)]">Cuidar</span>?
                        </h2>
                    </div>

                    {/* Contenedor de la Descripción: Centrado en la pantalla */}
                    <div className="w-full flex flex-col items-center justify-center px-6">
                        <p className="text-xl md:text-4xl text-gray-700 max-w-5xl leading-relaxed font-medium text-center mx-auto !text-center">
                            <span className="font-bold text-[var(--primary-color)]">Buen<span className="text-[var(--secondary-color)]">Cuidar</span></span> es una plataforma digital que conecta a familias con cuidadores verificados en Centroamérica.
                        </p>
                    </div>
                </section>

                <div className="w-full px-6 lg:px-[100px] mx-auto">

                    {/* Pillars Grid */}
                    <section className="grid md:grid-cols-2 gap-16">
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <h3 className="text-2xl font-bold text-[var(--primary-color)]">¿Por qué surge?</h3>
                            </div>
                            <p className="text-lg text-gray-700 font-medium italic border-l-4 border-[var(--secondary-color)]/20 pl-6 leading-relaxed">
                                BC surge ante la creciente necesidad de cuidado digno y cercano para nuestros adultos mayores, en un contexto donde el apoyo profesional es escaso y costoso.
                            </p>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <h3 className="text-2xl font-bold text-[var(--primary-color)]">¿Cuál es su objetivo fundamental?</h3>
                            </div>
                            <p className="text-lg text-gray-700 font-medium italic border-l-4 border-[var(--secondary-color)]/20 pl-6 leading-relaxed">
                                Nuestro objetivo es mejorar la calidad de vida de los adultos mayores y la familia en general facilitando una red de cuidadores verificados y una plataforma de apoyo flexible, segura y accesible para todos.
                            </p>
                        </div>
                    </section>
                    <div className="h-10"></div>
                    {/* Action Buttons */}
                    <section className="flex flex-col sm:flex-row items-center justify-center gap-8 md:gap-12 pb-32">
                        <button
                            onClick={() => navigate('/home')}
                            className="w-full sm:w-[320px] h-[75px] bg-[var(--secondary-color)] text-white rounded-[20px] font-black uppercase tracking-widest text-lg shadow-xl shadow-[#2FAE8F]/30 hover:shadow-[#2FAE8F]/50 hover:-translate-y-1 transition-all flex items-center justify-center gap-3 border-none group px-6"
                        >
                            Ir a la aplicación
                            <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
                        </button>

                        <button
                            onClick={handleInstall}
                            className="w-full sm:w-[320px] h-[75px] bg-[var(--primary-color)] text-white rounded-[20px] font-black uppercase tracking-widest text-lg shadow-xl shadow-[#0F3C4C]/30 hover:shadow-[#0F3C4C]/50 hover:-translate-y-1 transition-all flex items-center justify-center gap-3 border-none group px-6"
                        >
                            Instalar Aplicación
                            <Download size={24} className="group-hover:translate-y-1 transition-transform" />
                        </button>
                    </section>
                </div>
            </main >

            {/* Footer */}
            < footer className="w-full py-20 bg-white border-t border-gray-100 flex flex-col items-center gap-6" >
                <Logo className="h-12 md:h-16 grayscale opacity-30 hover:opacity-100 transition-opacity" />
                <div className="text-center space-y-1">
                    <p className="text-[10px] md:text-[12px] font-bold uppercase tracking-[0.6em] text-gray-500">Tecnología con corazón.</p>
                </div>
            </footer >

            {/* IOS Modal */}
            {
                showInstructions && (
                    <div className="fixed inset-0 z-[100] bg-[var(--primary-color)]/95 backdrop-blur-xl flex items-center justify-center p-6 px-4">
                        <div className="bg-white p-12 rounded-[50px] max-w-sm w-full relative text-center shadow-2xl">
                            <button onClick={() => setShowInstructions(false)} className="absolute top-8 right-8 text-gray-500"><X size={28} /></button>
                            <div className="w-16 h-16 bg-[#E6F4F1] rounded-3xl flex items-center justify-center mx-auto mb-8 text-[var(--secondary-color)]">
                                <Share size={32} />
                            </div>
                            <h4 className="text-2xl font-bold text-[var(--primary-color)] mb-10 tracking-tight">Lleva BuenCuidar contigo</h4>
                            <div className="space-y-6 text-left text-gray-800 font-medium px-2">
                                <div className="flex gap-6 items-center">
                                    <div className="w-10 h-10 rounded-2xl bg-[var(--secondary-color)] text-white flex items-center justify-center font-black text-xl shadow-lg shadow-[#2FAE8F]/30">1</div>
                                    <p className="text-lg">Toca 'Compartir' <Share size={18} className="inline mx-1 text-[var(--secondary-color)]" /></p>
                                </div>
                                <div className="flex gap-6 items-center">
                                    <div className="w-10 h-10 rounded-2xl bg-[var(--primary-color)] text-white flex items-center justify-center font-black text-xl shadow-lg shadow-[#0F3C4C]/30">2</div>
                                    <p className="text-lg">Busca 'Agregar a inicio'</p>
                                </div>
                            </div>
                            <button onClick={() => setShowInstructions(false)} className="w-full mt-12 bg-[var(--primary-color)] text-white py-6 rounded-full font-black uppercase tracking-widest text-xs">Entendido</button>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default Landing;
