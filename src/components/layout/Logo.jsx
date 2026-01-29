import React from 'react';
import { ShieldCheck } from 'lucide-react';

const Logo = () => {
    return (
        <div className="flex items-center gap-2">
            {/* Logo Icon - Using the image but scaling it to fit the 50px navbar (approx 32-36px) */}
            <img
                src="/images/rebranding/official_logo_final.png"
                alt="BuenCuidar Logo"
                className="h-8 w-auto object-contain"
            />

            {/* Text and Badge Container */}
            <div className="flex flex-col justify-center leading-none">
                {/* Brand Name */}
                <div className="flex items-center tracking-tight">
                    <span className="font-brand text-lg text-[#0F3C4C] font-bold">Buen</span>
                    <span className="font-brand text-lg font-bold" style={{ color: '#2FAE8F' }}>Cuidar</span>
                </div>

                {/* Verification Badge */}
                <div className="flex items-center gap-1 bg-[#E0F7FA] px-1.5 py-0.5 rounded-full mt-[1px] w-fit">
                    <ShieldCheck size={10} className="text-[#2FAE8F]" strokeWidth={3} />
                    <span className="text-[8px] font-bold text-[#0F3C4C] tracking-wide uppercase">
                        CUIDADORES 100% VERIFICADOS
                    </span>
                </div>
            </div>
        </div>
    );
};

export default Logo;
