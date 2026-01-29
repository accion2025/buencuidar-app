import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Facebook, Instagram, Linkedin } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="bg-[var(--primary-color)] !text-[#FAFAF7] pt-16 pb-8">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    {/* Brand Column */}
                    <div className="col-span-1 md:col-span-1">
                        <h4 className="text-3xl font-bold mb-4 tracking-tight font-brand">BuenCuidar</h4>
                        <p className="text-gray-300 text-sm leading-relaxed mb-6 font-secondary">
                            Conectando tecnología y amor para brindar tranquilidad real a las familias.
                            Tu ser querido, acompañado con dignidad y confianza.
                        </p>
                        <div className="flex gap-4">
                            <a href="#" className="p-2 bg-white/10 rounded-[16px] hover:bg-[var(--secondary-color)] transition-all">
                                <Facebook size={18} />
                            </a>
                            <a href="#" className="p-2 bg-white/10 rounded-[16px] hover:bg-[var(--secondary-color)] transition-all">
                                <Instagram size={18} />
                            </a>
                            <a href="#" className="p-2 bg-white/10 rounded-[16px] hover:bg-[var(--secondary-color)] transition-all">
                                <Linkedin size={18} />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h5 className="font-brand font-bold uppercase tracking-widest text-xs mb-6 text-[var(--secondary-color)]">Navegación</h5>
                        <ul className="space-y-4 text-sm font-secondary">
                            <li><Link to="/" className="text-gray-300 hover:text-white transition-colors">Inicio</Link></li>
                            <li><Link to="/services" className="text-gray-300 hover:text-white transition-colors">Servicios</Link></li>
                            <li><Link to="/login" className="text-gray-300 hover:text-white transition-colors">Iniciar Sesión</Link></li>
                            <li><Link to="/register" className="text-gray-300 hover:text-white transition-colors">Registrarse</Link></li>
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h5 className="font-brand font-bold uppercase tracking-widest text-xs mb-6 text-[var(--secondary-color)]">Contacto</h5>
                        <ul className="space-y-4 text-sm font-secondary">
                            <li className="flex items-start gap-3">
                                <MapPin size={18} className="text-[var(--secondary-color)] shrink-0" />
                                <span className="text-gray-300">Asunción, Paraguay</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Phone size={18} className="text-[var(--secondary-color)] shrink-0" />
                                <span className="text-gray-300">+595 (900) 000 000</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Mail size={18} className="text-[var(--secondary-color)] shrink-0" />
                                <span className="text-gray-300">hola@buencuidar.com</span>
                            </li>
                        </ul>
                    </div>

                    {/* Newsletter/Value Prop */}
                    <div>
                        <h5 className="font-brand font-bold uppercase tracking-widest text-xs mb-6 text-[var(--secondary-color)]">Propósito</h5>
                        <p className="text-gray-300 text-sm font-secondary italic">
                            "BuenCuidar no es solo una plataforma. Es un puente entre tecnología y amor."
                        </p>
                    </div>
                </div>

                <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-xs text-gray-500 font-secondary">
                        &copy; {new Date().getFullYear()} BuenCuidar. Todos los derechos reservados.
                    </p>
                    <div className="flex gap-6 text-[10px] uppercase tracking-widest font-bold text-gray-500">
                        <a href="#" className="hover:text-white transition-colors">Privacidad</a>
                        <a href="#" className="hover:text-white transition-colors">Términos</a>
                        <a href="#" className="hover:text-white transition-colors">Cookies</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;

