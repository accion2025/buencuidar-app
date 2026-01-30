import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Facebook, Instagram, Linkedin } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="bg-[var(--primary-color)] !text-[#FAFAF7] pt-[10px] pb-8">
            <div className="container mx-auto px-4">
                <div className="flex flex-col items-center text-center gap-[10px] mb-8 w-full">
                    {/* Socials */}
                    <div className="flex gap-4 justify-center">
                        <a href="#" className="p-2 bg-white/10 rounded-full hover:bg-[var(--secondary-color)] transition-all">
                            <Facebook size={16} />
                        </a>
                        <a href="#" className="p-2 bg-white/10 rounded-full hover:bg-[var(--secondary-color)] transition-all">
                            <Instagram size={16} />
                        </a>
                        <a href="#" className="p-2 bg-white/10 rounded-full hover:bg-[var(--secondary-color)] transition-all">
                            <Linkedin size={16} />
                        </a>
                    </div>

                    {/* Purpose */}
                    <div className="max-w-xl">
                        <p className="text-gray-300 text-sm font-secondary italic leading-relaxed">
                            "BuenCuidar no es solo una plataforma. Es un puente entre tecnología y amor."
                        </p>
                    </div>

                    {/* Contact Info */}
                    <ul className="flex flex-col md:flex-row gap-4 md:gap-6 items-center justify-center text-xs font-secondary">
                        <li className="flex items-center gap-2">
                            <MapPin size={14} className="text-[var(--secondary-color)]" />
                            <span className="text-gray-300">Asunción, Paraguay</span>
                        </li>
                        <li className="flex items-center gap-2">
                            <Phone size={14} className="text-[var(--secondary-color)]" />
                            <span className="text-gray-300">+595 (900) 000 000</span>
                        </li>
                        <li className="flex items-center gap-2">
                            <Mail size={14} className="text-[var(--secondary-color)]" />
                            <span className="text-gray-300">hola@buencuidar.com</span>
                        </li>
                    </ul>
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
        </footer >
    );
};

export default Footer;

