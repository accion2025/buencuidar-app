import React from 'react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { Mail, MapPin, Send } from 'lucide-react';

const Contact = () => {
    return (
        <div className="min-h-screen flex flex-col font-sans">
            <Navbar />

            <header className="bg-[var(--primary-color)] !text-[#FAFAF7] py-20 px-6 text-center">
                <h1 className="text-4xl md:text-5xl font-bold mb-4">Contáctanos</h1>
                <p className="text-xl text-green-100 max-w-2xl mx-auto">
                    Estamos aquí para resolver tus dudas y ayudarte a encontrar el cuidado ideal.
                </p>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-16 w-full">
                <div className="grid md:grid-cols-2 gap-12 bg-white rounded-[16px] shadow-lg overflow-hidden border border-gray-100">

                    {/* Contact Info */}
                    <div className="bg-gray-50 p-10 flex flex-col justify-center space-y-8">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Información de Contacto</h2>
                            <p className="text-gray-600 mb-8">
                                Puedes visitarnos en nuestras oficinas, llamarnos o escribirnos. Respondemos en menos de 24 horas.
                            </p>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="w-14 h-14 bg-[var(--primary-light)]/20 text-[var(--primary-color)] rounded-full flex items-center justify-center flex-shrink-0">
                                    <MapPin size={26} strokeWidth={1.5} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900">Oficinas Centrales</h4>
                                    <p className="text-gray-600 text-lg">Managua, Nicaragua</p>
                                </div>
                            </div>

                            <a
                                href="https://wa.me/50584234337"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-4 hover:bg-white p-4 rounded-xl transition-all shadow-sm hover:shadow-md border border-transparent hover:border-green-100"
                            >
                                <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                                    <svg
                                        viewBox="0 0 24 24"
                                        width="32"
                                        height="32"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.6-7.6 8.38 8.38 0 0 1 3.8.9L21 7.5z" />
                                        <path d="M16 11.5l-2.5 2.5-1.5-1.5" strokeWidth="1" />
                                    </svg>
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900 text-lg">WhatsApp</h4>
                                    <p className="text-green-700 text-2xl tracking-tight">+505 8423 4337</p>
                                </div>
                            </a>

                            <a
                                href="mailto:soporte@buencuidar.com"
                                className="flex items-center gap-4 hover:bg-white p-4 rounded-xl transition-all shadow-sm hover:shadow-md border border-transparent hover:border-blue-100"
                            >
                                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                                    <Mail size={32} strokeWidth={1.5} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900 text-lg">Email</h4>
                                    <p className="text-gray-800 text-2xl tracking-tight">soporte@buencuidar.com</p>
                                </div>
                            </a>
                        </div>

                        {/* Map Placeholder */}
                        <div className="w-full h-48 bg-gray-200 rounded-[16px] mt-6 relative overflow-hidden group">
                            <img
                                src="https://images.unsplash.com/photo-1524813686514-a57563d77965?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
                                alt="Mapa"
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                                <span className="bg-white px-4 py-2 rounded-[16px] text-xs font-bold shadow-md">Ver en Google Maps</span>
                            </div>
                        </div>
                    </div>

                    {/* Form */}
                    <div className="p-10">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Envíanos un Mensaje</h2>
                        <form className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 rounded-[16px] border border-gray-200 focus:border-[var(--primary-color)] focus:ring-0 transition-colors bg-gray-50 focus:bg-white"
                                        placeholder="Tu nombre"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 rounded-[16px] border border-gray-200 focus:border-[var(--primary-color)] focus:ring-0 transition-colors bg-gray-50 focus:bg-white"
                                        placeholder="Tu apellido"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    className="w-full px-4 py-3 rounded-[16px] border border-gray-200 focus:border-[var(--primary-color)] focus:ring-0 transition-colors bg-gray-50 focus:bg-white"
                                    placeholder="ejemplo@correo.com"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mensaje</label>
                                <textarea
                                    rows="4"
                                    className="w-full px-4 py-3 rounded-[16px] border border-gray-200 focus:border-[var(--primary-color)] focus:ring-0 transition-colors bg-gray-50 focus:bg-white"
                                    placeholder="¿En qué podemos ayudarte?"
                                ></textarea>
                            </div>

                            <button
                                type="button"
                                className="w-full bg-[var(--primary-color)] !text-[#FAFAF7] py-4 rounded-[16px] font-bold hover:brightness-90 transition-all flex items-center justify-center gap-2"
                            >
                                <Send size={18} />
                                Enviar Mensaje
                            </button>
                        </form>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default Contact;
