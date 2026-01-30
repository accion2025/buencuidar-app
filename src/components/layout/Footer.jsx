import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Facebook, Instagram, Linkedin } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="bg-[var(--primary-color)] !text-[#FAFAF7] pt-16 pb-8">
            <div className="container mx-auto px-4">
                <div className="flex flex-col items-center text-center gap-12 mb-12 max-w-4xl mx-auto">
                    {/* Brand & Socials */}
                    <div className="flex flex-col items-center gap-6">
                        <h4 className="text-4xl font-bold tracking-tight font-brand">BuenCuidar</h4>
                        <div className="flex gap-4 justify-center">
                            <a href="#" className="p-3 bg-white/10 rounded-full hover:bg-[var(--secondary-color)] transition-all">
                                <Facebook size={20} />
                            </a>
                            <a href="#" className="p-3 bg-white/10 rounded-full hover:bg-[var(--secondary-color)] transition-all">
                                <Instagram size={20} />
                            </a>
                            <a href="#" className="p-3 bg-white/10 rounded-full hover:bg-[var(--secondary-color)] transition-all">
                                <Linkedin size={20} />
                            </a>
                        </div>
                    </div>

                    {/* Purpose */}
                    <div className="max-w-lg">
                        <p className="text-gray-300 text-lg font-secondary italic leading-relaxed">
                            "BuenCuidar no es solo una plataforma. Es un puente entre tecnología y amor."
                        </p>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-4">
                        <h5 className="font-brand font-bold uppercase tracking-widest text-xs text-[var(--secondary-color)]">Contacto</h5>
                        <ul className="flex flex-col md:flex-row gap-6 md:gap-8 items-center justify-center text-sm font-secondary">
                            <li className="flex items-center gap-3">
                                <MapPin size={18} className="text-[var(--secondary-color)]" />
                                <span className="text-gray-300">Asunción, Paraguay</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Phone size={18} className="text-[var(--secondary-color)]" />
                                <span className="text-gray-300">+595 (900) 000 000</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Mail size={18} className="text-[var(--secondary-color)]" />
                                <span className="text-gray-300">hola@buencuidar.com</span>
                            </li>
                        </ul>
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

