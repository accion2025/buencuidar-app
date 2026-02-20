
import React, { useState } from 'react';
import { Check, CreditCard, Shield, Star, Zap, Info, Lightbulb } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const PlanCard = ({ title, price, period, description, features, recommended, color, onSelect, loading, isCurrent }) => (
    <div className={`relative bg-white rounded-2xl p-8 transition-all duration-500 flex flex-col h-full ${recommended
        ? `border-2 ${color.border} shadow-2xl scale-105 z-10`
        : 'border border-gray-100 shadow-sm hover:shadow-xl'
        }`}>
        {recommended && (
            <div className={`absolute -top-5 left-1/2 transform -translate-x-1/2 ${color.badge} !text-[#FAFAF7] px-6 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest shadow-lg whitespace-nowrap`}>
                MEJOR VALOR
            </div>
        )}

        <div className="text-center mb-8">
            <div className={`inline-block px-4 py-1 rounded-md ${color.bg} ${color.text} text-[10px] font-black uppercase tracking-widest mb-4`}>
                {title}
            </div>
            <div className="flex flex-col items-center justify-center gap-1 mb-1">
                <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-black text-gray-900">${price}</span>
                    {price !== '0' && <span className="text-gray-400 font-bold text-sm">/ {period}</span>}
                </div>
                {description && <p className="text-gray-500 font-medium text-sm mt-2">{description}</p>}
            </div>
        </div>

        <div className="flex-grow space-y-4 mb-8">
            {features.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-2 text-gray-600">
                    <Check size={16} className={`${color.text} flex-shrink-0 mt-0.5`} />
                    <span className="text-sm font-medium leading-tight">{feature}</span>
                </div>
            ))}
        </div>

        <button
            onClick={onSelect}
            disabled={loading || isCurrent}
            className={`w-full py-4 rounded-xl font-black text-sm transition-all duration-300 transform uppercase tracking-widest ${isCurrent
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : recommended
                    ? `bg-[#2FAE8F] text-white hover:scale-105 shadow-xl shadow-emerald-100`
                    : `bg-[#0F3C4C] text-white hover:scale-105`
                } ${loading ? 'opacity-50 cursor-wait' : ''}`}
        >
            {loading ? 'Cargando...' : (isCurrent ? 'Activado' : (price === '0' ? 'Empezar Gratis' : `Activar por ${period}`))}
        </button>
    </div>
);

const SubscriptionPlans = () => {
    const { user, profile } = useAuth();
    const [loading, setLoading] = useState(false);

    const currentPlan = profile?.plan_type || 'base';

    const plans = [
        {
            id: 'base',
            title: 'GRATUITO',
            price: '0',
            period: 'siempre',
            description: 'Empieza sin costo',
            features: [
                "Búsqueda básica de cuidadores",
                "Mensajes ilimitados",
                "Perfil familiar",
                "Solicitudes simples",
                "Soporte básico"
            ],
            color: {
                border: 'border-emerald-100',
                bg: 'bg-emerald-50',
                text: 'text-emerald-600',
                badge: 'bg-emerald-600',
                btn: 'bg-emerald-600'
            }
        },
        {
            id: 'pulso_1_mes',
            title: 'BC Pulso — 1 mes',
            price: '7',
            period: '1 mes',
            description: 'Acceso completo',
            features: [
                "Contacto directo con cuidadores",
                "Acceso completo a perfiles verificados",
                "Publicar solicitudes activas",
                "Comunicación directa y segura",
                "Activación inmediata"
            ],
            color: {
                border: 'border-blue-200',
                bg: 'bg-blue-50',
                text: 'text-blue-600',
                badge: 'bg-blue-600',
                btn: 'bg-blue-600'
            }
        },
        {
            id: 'pulso_3_meses',
            title: 'BC Pulso — 3 meses ⭐',
            price: '15',
            period: '3 meses',
            description: 'Mejor valor',
            features: [
                "Todo lo anterior, con ahorro del 29%",
                "Ideal si necesitas apoyo continuo",
                "Estás en proceso de recuperación",
                "Acceso activo sin interrupciones",
                "Equivale a solo $5 por mes"
            ],
            color: {
                border: 'border-[#2FAE8F]',
                bg: 'bg-emerald-50',
                text: 'text-[#2FAE8F]',
                badge: 'bg-[#2FAE8F]',
                btn: 'bg-[#2FAE8F]'
            },
            recommended: true
        }
    ];

    const handleSubscribe = async (planType) => {
        if (planType === currentPlan) return;
        setLoading(true);
        try {
            // Actualizar el plan en el perfil directamente para la demo/MVP
            const { error } = await supabase
                .from('profiles')
                .update({
                    plan_type: planType,
                    subscription_status: 'active'
                })
                .eq('id', user.id);

            if (error) throw error;

            // También insertar en la tabla de suscripciones para registro
            await supabase.from('subscriptions').insert({
                user_id: user.id,
                plan_type: planType,
                status: 'active',
                current_period_end: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString()
            });

            alert(`¡Plan ${planType.toUpperCase()} activado correctamente!`);
            window.location.href = '/dashboard';
        } catch (err) {
            console.error(err);
            alert("Error al procesar la suscripción");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50/50 flex flex-col items-center py-20 px-4">
            <div className="max-w-6xl w-full text-center space-y-6 mb-16">
                <h1 className="text-4xl md:text-6xl font-brand font-bold tracking-tighter leading-tight italic text-[#0F3C4C]">
                    ¡Activa BC Pulso y conecta directamente con cuidadores!
                </h1>
                <div className="space-y-2">
                    <p className="text-2xl md:text-3xl font-bold text-[#2FAE8F]">Tu cuenta ya está lista.</p>
                    <p className="text-xl md:text-2xl text-slate-600 font-medium font-secondary max-w-4xl mx-auto leading-relaxed">
                        Ahora puedes activar BC PULSO para contactar, coordinar y recibir apoyo cuando lo necesites.
                    </p>
                    <p className="text-lg text-slate-500 italic font-medium">Activa solo cuando lo necesites. Sin contratos ni compromisos.</p>
                </div>
            </div>

            {/* Sección en blanco (Espaciador) */}
            <div className="w-full h-12 md:h-20"></div>

            <div className="max-w-4xl w-full mb-24">
                <div className="bg-white rounded-2xl p-8 md:p-12 border border-gray-100 shadow-sm text-center">
                    <h3 className="text-2xl md:text-3xl font-bold text-[#0F3C4C] mb-8">¿Qué ocurre si no activas BC Pulso?</h3>
                    <p className="text-lg text-gray-600 mb-8 font-medium">Tu cuenta sigue siendo gratuita y puedes:</p>
                    <div className="grid md:grid-cols-3 gap-6 mb-10">
                        {[
                            'Mantener tu perfil activo',
                            'Explorar la plataforma',
                            'Preparar futuras solicitudes'
                        ].map((item, i) => (
                            <div key={i} className="flex flex-col items-center gap-3">
                                <div className="w-12 h-12 bg-emerald-50 text-[#2FAE8F] rounded-full flex items-center justify-center">
                                    <Check size={24} />
                                </div>
                                <span className="font-bold text-gray-700">{item}</span>
                            </div>
                        ))}
                    </div>
                    <p className="text-[#2FAE8F] font-bold text-xl italic">Puedes activar BC Pulso en cualquier momento.</p>
                </div>
            </div>

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

export default SubscriptionPlans;
