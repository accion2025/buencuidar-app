import React, { useState } from 'react';
import { Check, Shield } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const PlanCard = ({ plan, isCurrent, color, onSelect, loading }) => {
    const { title, subtitle, price, period, description, features, recommended } = plan;

    return (
        <div className={`relative bg-white rounded-2xl p-8 transition-all duration-500 flex flex-col h-full border ${recommended
            ? `${color.border} shadow-2xl scale-105 z-10 border-2`
            : 'border-gray-100 shadow-sm hover:shadow-xl'
            }`}>
            {recommended && (
                <div className={`absolute -top-5 left-1/2 transform -translate-x-1/2 ${color.badge} !text-[#FAFAF7] px-6 py-2 rounded-md text-xs font-black uppercase tracking-widest shadow-lg whitespace-nowrap`}>
                    MEJOR OPCIÓN ⭐
                </div>
            )}

            <div className="text-center mb-8">
                <div className={`inline-block px-4 py-1 rounded-lg ${color.bg} ${color.text} text-[10px] font-black uppercase tracking-widest mb-2`}>
                    {title}
                </div>
                <p className="text-gray-500 text-xs font-bold mb-4 italic">{subtitle}</p>

                <div className="flex items-center justify-center gap-1 mb-1">
                    <span className="text-5xl font-black text-gray-900">${price}</span>
                    {period && <span className="text-gray-400 font-bold text-sm mt-3">/ {period}</span>}
                </div>

                <p className="text-gray-600 text-sm mt-4 leading-relaxed font-medium min-h-[40px]">
                    {description}
                </p>
            </div>

            <div className="flex-grow mb-8 flex flex-col items-center">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2 mb-4 w-full text-center">Incluye:</p>
                <div className="text-left space-y-3 w-fit">
                    {features.map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-gray-600">
                            <Check size={16} className={`${color.text} flex-shrink-0 mt-0.5`} />
                            <span className="text-sm font-medium leading-tight">{feature}</span>
                        </div>
                    ))}
                </div>
            </div>

            {plan.id === 'base' ? (
                <div className="w-full py-4 text-center font-black text-[#2FAE8F] uppercase tracking-widest rounded-xl bg-emerald-50 border border-emerald-100 shadow-sm">
                    ACTIVADO
                </div>
            ) : (
                <button
                    disabled={true}
                    className="w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                >
                    ACTIVAR {title.split(' — ')[0]}
                </button>
            )}
        </div>
    );
};

const CaregiverPlans = () => {
    const { user, profile } = useAuth();
    const [loading, setLoading] = useState(false);

    const currentPlan = profile?.plan_type || 'base';

    const plans = [
        {
            id: 'base',
            title: 'GRATUITO',
            subtitle: 'Forma parte de la comunidad',
            price: '0',
            period: '',
            description: 'Ideal para comenzar.',
            features: [
                "Crear tu perfil profesional",
                "Mostrar tu experiencia y habilidades",
                "Aparecer en la plataforma",
                "Recibir solicitudes básicas",
                "Acceso permanente sin costo"
            ],
            color: {
                border: 'border-emerald-100',
                bg: 'bg-emerald-50',
                text: 'text-emerald-600',
                badge: 'bg-emerald-600'
            }
        },
        {
            id: 'monthly',
            title: 'BC PRO — 1 MES',
            subtitle: 'Aumenta tus oportunidades',
            price: '3',
            period: '1 mes',
            description: 'Puedes activarlo solo cuando lo necesites.',
            features: [
                "Mayor visibilidad dentro de la plataforma",
                "Prioridad en los resultados de búsqueda",
                "Mayor confianza para las familias",
                "Más oportunidades de recibir solicitudes",
                "Perfil destacado como cuidador activo"
            ],
            color: {
                border: 'border-blue-200',
                bg: 'bg-blue-50',
                text: 'text-blue-600',
                badge: 'bg-blue-600'
            }
        },
        {
            id: 'annual',
            title: 'BC PRO — 12 MESES',
            subtitle: 'Presencia sólida y continua',
            price: '15',
            period: '12 meses',
            description: 'Equivale a solo $1.25 por mes.',
            features: [
                "Incluye todos los beneficios de BC PRO",
                "Menor costo posible garantizado",
                "Mantener visibilidad constante",
                "Recibir más solicitudes todo el año",
                "Posicionarte como cuidador confiable"
            ],
            color: {
                border: 'border-[#2FAE8F]',
                bg: 'bg-emerald-50',
                text: 'text-[#2FAE8F]',
                badge: 'bg-[#2FAE8F]'
            },
            recommended: true
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50/10 flex flex-col items-center py-16 px-4">
            {/* Header Block */}
            <div className="max-w-4xl w-full text-center space-y-6 mb-16 px-4">
                <h1 className="text-4xl md:text-5xl font-brand font-bold tracking-tight text-[#0F3C4C]">
                    ¡Haz visible tu vocación de cuidar!
                </h1>
                <div className="space-y-4">
                    <p className="text-2xl font-bold text-[#2FAE8F] italic">Crear tu cuenta es completamente gratuito.</p>
                    <p className="text-xl text-slate-600 leading-relaxed font-medium max-w-2xl mx-auto text-center">
                        Puedes formar parte de la comunidad, crear tu perfil y comenzar a construir tu presencia desde hoy.
                    </p>
                    <p className="text-lg text-slate-400 italic">Si deseas aumentar tu visibilidad y acceder a más oportunidades, puedes activar BC PRO.</p>
                </div>
            </div>

            <div className="w-full h-12"></div>


            {/* Grid de Planes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full mb-24 items-stretch px-4">
                {plans.map((plan) => (
                    <PlanCard
                        key={plan.id}
                        plan={plan}
                        isCurrent={currentPlan === plan.id}
                        color={plan.color}
                        loading={loading}
                    />
                ))}
            </div>

            {/* Sección Simple: Tú decides tu ritmo */}
            <div className="w-full h-12 md:h-20"></div>

            <div className="max-w-2xl w-full mb-24 text-center px-4">
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 font-brand">Tú decides tu ritmo</h3>

                <div className="text-lg text-gray-700 space-y-4 mb-8 font-bold">
                    <p>BuenCuidar no cobra comisiones.</p>
                    <p>No interviene en tus acuerdos.</p>
                    <p>No limita tu crecimiento.</p>
                </div>

                <div className="text-xl font-bold text-gray-800 space-y-2 mb-10 italic">
                    <p>BC PRO solo aumenta tus oportunidades.</p>
                    <p className="text-[#2FAE8F]">Tu vocación hace el resto.</p>
                </div>
            </div>

            {/* Footer Trust */}
            <div className="max-w-4xl w-full pb-20">
                <div className="bg-[#0F3C4C] rounded-[24px] p-8 md:p-10 flex flex-col md:flex-row items-center justify-center gap-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#2FAE8F] rounded-full -mr-32 -mt-32 opacity-10"></div>
                    <div className="bg-white/10 p-5 rounded-2xl text-[#2FAE8F] z-10 font-bold">
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
