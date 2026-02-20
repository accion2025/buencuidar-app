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
                        <li className="flex items-center gap-2">
                            <MapPin size={14} className="text-[var(--secondary-color)]" />
                            <span className="text-gray-300">Managua, Nicaragua</span>
                        </li>
                        <li>
                            <a
                                href="https://wa.me/50584234337"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 hover:text-white transition-colors group"
                            >
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" className="text-[var(--secondary-color)] group-hover:scale-110 transition-transform">
                                    <path d="M12.031 6.172c-2.32 0-4.208 1.888-4.208 4.208 0 .744.192 1.456.552 2.08l-.584 2.136 2.184-.576c.6.328 1.288.504 2.056.504 2.32 0 4.208-1.888 4.208-4.208-.008-2.312-1.896-4.208-4.208-4.208zm2.424 5.928c-.104.296-.592.56-1.12.592-.352.024-.808.016-1.288-.144-1.168-.384-1.928-1.552-1.984-1.632-.056-.08-.464-.616-.464-1.176 0-.56.288-.84.4-.952.088-.088.24-.136.376-.136.048 0 .096 0 .136.008.12.008.184.016.264.208.104.248.36.88.392.944.032.064.056.136.016.216-.04.08-.056.144-.12.216-.064.072-.136.16-.192.216-.064.064-.136.136-.056.272.072.136.328.544.704.88.48.424.888.552 1.016.616.128.064.208.056.28-.032.072-.088.32-.376.408-.504.088-.128.176-.104.296-.056.12.048.76.36.888.424.128.064.216.096.248.152.032.056.032.328-.072.624zM12.031 2.131c-5.448 0-9.888 4.44-9.888 9.888 0 1.744.456 3.44 1.32 4.936l-1.4 5.128 5.24-1.376c1.448.792 3.088 1.208 4.728 1.208 5.448 0 9.888-4.44 9.888-9.888-.008-5.448-4.448-9.896-9.888-9.896zm0 18.064c-1.536 0-3.04-.416-4.344-1.192l-.312-.184-3.224.848.864-3.152-.208-.328c-.856-1.36-1.312-2.936-1.312-4.552 0-4.528 3.688-8.216 8.216-8.216 4.528 0 8.216 3.688 8.216 8.216.008 4.52-3.68 8.208-8.192 8.208z" /></svg>
                                <span className="text-[#FAFAF7] font-bold text-sm tracking-wide">+505 8423 4337</span>
                            </a>
                        </li>
                        <li>
                            <a
                                href="mailto:soporte@buencuidar.com"
                                className="flex items-center gap-2 hover:text-white transition-colors"
                            >
                                <Mail size={16} className="text-[var(--secondary-color)]" />
                                <span className="text-[#FAFAF7] font-bold text-sm tracking-wide">soporte@buencuidar.com</span>
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

