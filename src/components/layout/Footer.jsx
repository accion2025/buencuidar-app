import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, MapPin } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="bg-[var(--primary-color)] !text-[#FAFAF7] pt-[10px] pb-[52px]">
            <div className="container mx-auto px-4">
                <div className="flex flex-col items-center text-center gap-[10px] mb-8 w-full">

                    {/* Purpose */}
                    <div className="max-w-xl">
                        <p className="text-gray-300 text-sm font-secondary italic leading-relaxed">
                            "BuenCuidar no es solo una plataforma. Es un puente entre tecnología y amor."
                        </p>
                    </div>

                    {/* Contact Info */}
                    <ul className="flex flex-col md:flex-row gap-4 md:gap-8 items-center justify-center text-sm font-secondary">
                        <li className="flex items-center gap-3">
                            <MapPin size={20} strokeWidth={1} className="text-[var(--secondary-color)]" />
                            <span className="text-[#FAFAF7] text-lg tracking-wide">Managua, Nicaragua</span>
                        </li>
                        <li>
                            <a
                                href="https://wa.me/50584234337"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 hover:text-white transition-colors group"
                            >
                                <img
                                    src="/images/klipartz.com (47).png"
                                    alt="WhatsApp"
                                    className="w-6 h-6 object-contain group-hover:scale-110 transition-transform"
                                />
                                <span className="text-[#FAFAF7] text-lg tracking-wide">+505 8423 4337</span>
                            </a>
                        </li>
                        <li>
                            <a
                                href="mailto:soporte@buencuidar.com"
                                className="flex items-center gap-3 hover:text-white transition-colors"
                            >
                                <Mail size={24} strokeWidth={1.5} className="text-[var(--secondary-color)]" />
                                <span className="text-[#FAFAF7] text-lg tracking-wide">soporte@buencuidar.com</span>
                            </a>
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

