import React from 'react';
import { Shield } from 'lucide-react';

const Logo = ({ className = "h-14", iconClassName = "h-full w-auto", textClassName = "text-3xl" }) => {
    return (
        <div className={`flex items-center gap-3 ${className}`}>
            <img
                src="/images/rebranding/official_logo_final.png"
                alt="BuenCuidar Logo"
                className={`${iconClassName} object-contain h-[70px]`}
            />
            <div className="flex flex-col items-start">
                <span className={`font-brand font-bold text-[#0F3C4C] tracking-tight leading-none ${textClassName}`}>
                    BuenCuidar
                </span>
                <div className="flex items-center gap-1 mt-1 border border-[#2FAE8F]/30 bg-[#2FAE8F]/5 px-2 py-0.5 rounded-md">
                    <Shield size={12} className="text-[#2FAE8F] fill-[#2FAE8F]/10" />
                    <span className="text-[10px] font-black tracking-tighter text-[#0F3C4C] uppercase">
                        Cuidadores 100% Verificados
                    </span>
                </div>
            </div>
        </div>
    );
};

export default Logo;
