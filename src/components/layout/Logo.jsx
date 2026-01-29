import React from 'react';
import { ShieldCheck } from 'lucide-react';

const Logo = () => {
    return (
        <div className="flex items-center gap-3 ml-[-5px]">
            {/* Logo Icon - Scaled to 65px as requested */}
            <img
                src="/images/rebranding/official_logo_final.png"
                alt="BuenCuidar Logo"
                className="h-[65px] w-auto object-contain"
            />

            {/* Text and Badge Container */}
            <div className="flex flex-col justify-center leading-none">
                {/* Brand Name - Scaled proportionally */}
                <div className="flex items-center tracking-tight mb-1">
                    <span className="font-brand text-3xl text-[#0F3C4C] font-bold">Buen</span>
                    <span className="font-brand text-3xl font-bold" style={{ color: '#2FAE8F' }}>Cuidar</span>
                </div>

                {/* Verification Badge - Scaled proportionally */}
                <div className="flex items-center gap-1.5 bg-[#E0F7FA] px-2.5 py-1 rounded-full w-fit">
                    <ShieldCheck size={14} className="text-[#2FAE8F]" strokeWidth={3} />
                    <span className="text-[10px] font-bold text-[#0F3C4C] tracking-wide uppercase">
                        CUIDADORES 100% VERIFICADOS
                    </span>
                </div>
            </div>
        </div>
    );
};

export default Logo;
