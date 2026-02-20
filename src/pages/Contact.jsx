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
                                <div className="w-10 h-10 bg-[var(--primary-light)]/20 text-[var(--primary-color)] rounded-full flex items-center justify-center flex-shrink-0">
                                    <MapPin size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900">Oficinas Centrales</h4>
                                    <p className="text-gray-600">Managua, Nicaragua</p>
                                </div>
                            </div>

                            <a
                                href="https://wa.me/50584234337"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-4 hover:bg-gray-100 p-2 rounded-xl transition-colors"
                            >
                                <div className="w-10 h-10 bg-[var(--primary-light)]/20 text-[var(--primary-color)] rounded-full flex items-center justify-center flex-shrink-0">
                                    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                                        className="flex items-center gap-4 hover:bg-white p-4 rounded-xl transition-all shadow-sm hover:shadow-md border border-transparent hover:border-green-100"
                            >
                                        <div className="w-14 h-14 bg-green-50 text-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                                            <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
                                                <path d="M12.031 6.172c-2.32 0-4.208 1.888-4.208 4.208 0 .744.192 1.456.552 2.08l-.584 2.136 2.184-.576c.6.328 1.288.504 2.056.504 2.32 0 4.208-1.888 4.208-4.208-.008-2.312-1.896-4.208-4.208-4.208zm2.424 5.928c-.104.296-.592.56-1.12.592-.352.024-.808.016-1.288-.144-1.168-.384-1.928-1.552-1.984-1.632-.056-.08-.464-.616-.464-1.176 0-.56.288-.84.4-.952.088-.088.24-.136.376-.136.048 0 .096 0 .136.008.12.008.184.016.264.208.104.248.36.88.392.944.032.064.056.136.016.216-.04.08-.056.144-.12.216-.064.072-.136.16-.192.216-.064.064-.136.136-.056.272.072.136.328.544.704.88.48.424.888.552 1.016.616.128.064.208.056.28-.032.072-.088.32-.376.408-.504.088-.128.176-.104.296-.056.12.048.76.36.888.424.128.064.216.096.248.152.032.056.032.328-.072.624zM12.031 2.131c-5.448 0-9.888 4.44-9.888 9.888 0 1.744.456 3.44 1.32 4.936l-1.4 5.128 5.24-1.376c1.448.792 3.088 1.208 4.728 1.208 5.448 0 9.888-4.44 9.888-9.888-.008-5.448-4.448-9.896-9.888-9.896zm0 18.064c-1.536 0-3.04-.416-4.344-1.192l-.312-.184-3.224.848.864-3.152-.208-.328c-.856-1.36-1.312-2.936-1.312-4.552 0-4.528 3.688-8.216 8.216-8.216 4.528 0 8.216 3.688 8.216 8.216.008 4.52-3.68 8.208-8.192 8.208z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900 text-lg">WhatsApp</h4>
                                            <p className="text-green-700 font-bold text-2xl tracking-tight">+505 8423 4337</p>
                                        </div>
                                    </a>

                                    <a
                                        href="mailto:soporte@buencuidar.com"
                                        className="flex items-center gap-4 hover:bg-gray-100 p-2 rounded-xl transition-colors"
                                    >
                                        <div className="w-10 h-10 bg-[var(--primary-light)]/20 text-[var(--primary-color)] rounded-full flex items-center justify-center flex-shrink-0">
                                            <Mail size={20} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900 text-lg">Email</h4>
                                            <p className="text-gray-800 text-2xl font-bold tracking-tight">soporte@buencuidar.com</p>
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
