import React, { useState } from 'react';
import { Check, Shield, Crown, Zap, Info, Lightbulb } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const PlanCard = ({ title, price, period, monthlyPrice, features, savings, recommended, color, onSelect, loading }) => (
    <div className={`relative bg-white rounded-[24px] p-8 transition-all duration-500 flex flex-col h-full ${recommended
        ? `border-2 ${color.border} shadow-2xl scale-105 z-10`
        : 'border border-gray-100 shadow-sm hover:shadow-xl'
        }`}>
        {recommended && (
            <div className={`absolute -top-5 left-1/2 transform -translate-x-1/2 ${color.badge} !text-[#FAFAF7] px-6 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow-lg whitespace-nowrap`}>
                MÁXIMA VISIBILIDAD
            </div>
        )}

        <div className="text-center mb-8">
            <div className={`inline-block px-4 py-1 rounded-full ${color.bg} ${color.text} text-[10px] font-black uppercase tracking-widest mb-4`}>
                {title}
            </div>
            <div className="flex items-center justify-center gap-1 mb-1">
                <span className="text-5xl font-black text-gray-900">${price}</span>
                <span className="text-gray-400 font-bold text-sm mt-3">/ {period}</span>
            </div>
            {monthlyPrice && (
                <p className="text-gray-500 font-bold text-sm">(${monthlyPrice} / mes)</p>
            )}
        </div>

        <div className="flex-grow space-y-4 mb-8">
            {features.map((feature, idx) => (
                <div key={idx} className="flex items-center justify-center gap-2 text-gray-600 text-center">
                    <Check size={16} className={`${color.text} flex-shrink-0`} />
                    <span className="text-sm font-medium leading-tight">{feature}</span>
                </div>
            ))}
        </div>

        <div className={`mt-auto pt-6 border-t border-gray-50 mb-6 text-center`}>
            <span className={`text-[10px] font-black uppercase tracking-widest ${savings ? color.text : 'text-gray-400'}`}>
                {savings ? `👉 Ahorras $${savings}` : '👉 Ahorro: —'}
            </span>
        </div>

        <button
            onClick={onSelect}
            disabled={true}
            className={`w-full py-4 rounded-[16px] font-black text-sm transition-all duration-300 transform uppercase tracking-widest ${recommended
                ? 'bg-gray-300 !text-white cursor-not-allowed shadow-none'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
        >
            PRÓXIMAMENTE
        </button>
    </div>
);

const CaregiverPlans = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);

    const commonFeatures = [
        "Perfil Destacado en búsquedas",
        "Insignia de Verificado PRO",
        "Postulaciones ilimitadas",
        "Estadísticas de perfil",
        "Alertas de empleo inmediatas",
        "Soporte preferencial",
        "Acceso a capacitaciones",
        "Herramientas de gestión"
    ];

    const handleSubscribe = async (planType) => {
        setLoading(true);
        // Logic for pilot phase or future implementation
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-gray-50/50 flex flex-col items-center py-20 px-4">
            {/* Header Block */}
            <div className="max-w-4xl w-full text-center space-y-4 mb-16">
                <h1 className="text-5xl md:text-6xl font-brand font-bold tracking-tighter leading-tight">
                    Membresía <span className="text-[#0F3C4C]">BC</span> <span className="text-[#2FAE8F]">PRO</span>
                </h1>
                <p className="text-xl md:text-2xl text-slate-500 font-medium font-secondary italic">Destaca tu Perfil, Encuentra más Clientes</p>
            </div>

            {/* Common Benefits Summary */}
            <div className="max-w-4xl w-full bg-white rounded-[24px] pt-8 md:pt-12 pb-8 md:pb-12 pl-12 md:pl-20 pr-8 md:pr-12 mb-32 shadow-xl shadow-slate-200/50 border border-slate-100">
                <div className="flex items-center gap-3 mb-8">
                    <div className="bg-emerald-50 p-3 rounded-[16px] text-emerald-600">
                        <Crown size={24} />
                    </div>
                    <h2 className="text-2xl font-brand font-bold text-slate-800">Todos los planes PRO incluyen:</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2.5 gap-x-12">
                    {commonFeatures.map((item, i) => (
                        <div key={i} className="flex items-center gap-3 text-slate-600 font-medium">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                            <span className="leading-snug">{item}</span>
                        </div>
                    ))}
                </div>

                <div className="mt-10 pt-8 border-t border-slate-50 flex items-start gap-4 text-amber-600 bg-amber-50/50 p-6 rounded-[20px]">
                    <Lightbulb className="flex-shrink-0" size={24} />
                    <p className="font-bold text-sm leading-snug">
                        El estatus PRO aumenta tus probabilidades de contratación en un 40%. La única diferencia entre planes es el ahorro por permanencia.
                    </p>
                </div>
            </div>

            {/* Spacer Box */}
            <div className="max-w-4xl w-full h-8 bg-white rounded-[24px] border border-slate-100 shadow-sm mb-16"></div>

            {/* Grid Block */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl w-full mb-32 items-stretch">
                <PlanCard
                    title="BC PRO 1 MES"
                    price="199"
                    period="mes"
                    features={["Visibilidad PRO inmediata", "Insignia Verificado PRO", "Postulaciones ilimitadas"]}
                    color={{
                        border: 'border-emerald-100',
                        bg: 'bg-emerald-50',
                        text: 'text-emerald-600',
                        badge: 'bg-emerald-600',
                        btn: 'bg-emerald-600'
                    }}
                    onSelect={() => handleSubscribe('monthly')}
                    loading={loading}
                />

                <PlanCard
                    title="BC PRO 3 MESES"
                    price="499"
                    period="3 meses"
                    monthlyPrice="166"
                    savings="98"
                    features={["Visibilidad PRO inmediata", "Insignia Verificado PRO", "Postulaciones ilimitadas"]}
                    color={{
                        border: 'border-blue-200',
                        bg: 'bg-blue-50',
                        text: 'text-blue-600',
                        badge: 'bg-blue-600',
                        btn: 'bg-blue-600'
                    }}
                    onSelect={() => handleSubscribe('quarterly')}
                    loading={loading}
                />

                <PlanCard
                    title="BC PRO 6 MESES"
                    price="899"
                    period="6 meses"
                    monthlyPrice="149"
                    savings="295"
                    recommended={true}
                    features={["Visibilidad PRO inmediata", "Insignia Verificado PRO", "Postulaciones ilimitadas"]}
                    color={{
                        border: 'border-indigo-600',
                        bg: 'bg-indigo-50',
                        text: 'text-indigo-600',
                        badge: 'bg-indigo-600',
                        btn: 'bg-indigo-600'
                    }}
                    onSelect={() => handleSubscribe('semi-annual')}
                    loading={loading}
                />
            </div>

            {/* Footer Trust */}
            <div className="max-w-4xl w-full pb-20">
                <div className="bg-[#0F3C4C] rounded-[24px] pt-8 md:pt-10 pb-8 md:pb-10 pl-12 md:pl-20 pr-8 md:pr-10 flex flex-col md:flex-row items-center justify-center gap-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--secondary-color)] rounded-full -mr-32 -mt-32 opacity-10"></div>
                    <div className="bg-white/10 p-5 rounded-[20px] text-[var(--secondary-color)] z-10 flex items-center justify-center">
                        <Shield size={32} />
                    </div>
                    <div className="flex-1 text-center md:text-left z-10">
                        <h3 className="font-brand font-bold text-2xl !text-white mb-2">Garantía BuenCuidar</h3>
                        <p className="text-white/60 font-medium">Pagos procesados de forma segura con encriptación de nivel bancario a través de Stripe.</p>
                    </div>
                    <div className="flex items-center gap-6 z-10 opacity-50 grayscale hover:grayscale-0 transition-all">
                        <span className="text-white font-black text-2xl italic">VISA</span>
                        <span className="text-white font-black text-xl italic">Mastercard</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CaregiverPlans;
