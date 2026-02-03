import React from 'react';
import { Shield } from 'lucide-react';

const Logo = ({ className = "h-14", iconClassName = "h-full w-auto", textClassName = "text-3xl" }) => {
    return (
        <div className={`flex items-center gap-3 ${className}`}>
            <img
                src="/images/rebranding/official_logo_final.png"
                alt="BuenCuidar Logo"
                className={`${iconClassName} object-contain h-[70px] mix-blend-multiply`}
            />
            <div className="flex flex-col items-start">
                <span className={`font-brand font-bold text-[#0F3C4C] tracking-tight leading-none ${textClassName}`}>
                    Buen<span className="text-[#2FAE8F]">Cuidar</span>
                </span>
                <div className="flex items-center gap-1 mt-1 px-1">
                    <Shield size={12} className="text-[#2FAE8F] fill-[#2FAE8F]/10" />
                    <span className="text-[10px] font-black tracking-tighter text-[#0F3C4C] uppercase opacity-70">
                        Cuidadores 100% Verificados
                    </span>
                </div>
            </div>
        </div>
    );
};

export default Logo;
