
import React, { useState } from 'react';
import { Check, CreditCard, Shield, Star, Zap, Info, Lightbulb } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const PlanCard = ({ title, subtitle, price, period, description, features, recommended, color, onSelect, loading, isCurrent }) => (
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
            <div className={`inline-block px-4 py-1 rounded-lg ${color.bg} ${color.text} text-[10px] font-black uppercase tracking-widest mb-2`}>
                {title}
            </div>
            {subtitle && <p className="text-gray-500 text-xs font-bold mb-4 italic">{subtitle}</p>}
            <div className="flex items-center justify-center gap-1 mb-1">
                <span className="text-5xl font-black text-gray-900">${price}</span>
                {period && <span className="text-gray-400 font-bold text-sm mt-3">/ {period}</span>}
            </div>
            {description && <p className="text-gray-600 text-sm mt-4 leading-relaxed font-medium">{description}</p>}
        </div>

        <div className="flex-grow space-y-4 mb-8">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-2">Incluye:</p>
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
                ? 'bg-blue-50 text-blue-600 cursor-not-allowed border-2 border-blue-100'
                : recommended
                    ? `bg-[#2FAE8F] text-white hover:scale-105 shadow-xl shadow-emerald-100`
                    : `bg-slate-800 text-white hover:bg-slate-900 hover:scale-105`
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
            subtitle: 'Empieza sin costo',
            price: '0',
            period: '',
            description: 'Esenciales para comenzar',
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
            id: 'pulso',
            title: 'BC Pulso — 1 mes',
            subtitle: 'Acceso completo',
            price: '7',
            period: '1 mes',
            description: 'Ideal para necesidades puntuales o temporales.',
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
            id: 'plus',
            title: 'BC Pulso — 3 meses ⭐',
            subtitle: 'Mejor valor',
            price: '15',
            period: '3 meses',
            description: 'Mayor tranquilidad con menor costo mensual (Equivale a solo $5 por mes).',
            features: [
                "Todo el acceso anterior",
                "Ahorro del 29% en suscripción",
                "Ideal para apoyo continuo",
                "Ideal para procesos de recuperación",
                "Mantenimiento de acceso activo sin interrupciones"
            ],
            color: {
                border: 'border-indigo-600',
                bg: 'bg-indigo-50',
                text: 'text-indigo-600',
                badge: 'bg-indigo-600',
                btn: 'bg-indigo-600'
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
            <div className="max-w-4xl w-full text-center space-y-6 mb-16">
                <h1 className="text-4xl md:text-5xl font-brand font-bold tracking-tight text-[#0F3C4C]">
                    ¡Activa BC Pulso y conecta directamente con cuidadores!
                </h1>
                <div className="space-y-4">
                    <p className="text-2xl font-bold text-[var(--secondary-color)] italic">Tu cuenta ya está lista.</p>
                    <p className="text-xl text-slate-600 leading-relaxed font-medium">
                        Ahora puedes activar BC PULSO para contactar, coordinar y recibir apoyo cuando lo necesites.
                    </p>
                    <p className="text-lg text-slate-400 italic">Activa solo cuando lo necesites. Sin contratos ni compromisos.</p>
                </div>
            </div>

            {/* Sección en blanco (Espaciador) */}
            <div className="w-full h-12 md:h-20"></div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full mb-32 items-stretch">
                {plans.map((plan) => (
                    <PlanCard
                        key={plan.id}
                        title={plan.title}
                        subtitle={plan.subtitle}
                        price={plan.price}
                        period={plan.period}
                        description={plan.description}
                        features={plan.features}
                        recommended={plan.recommended}
                        color={plan.color}
                        onSelect={() => handleSubscribe(plan.id)}
                        loading={loading}
                        isCurrent={currentPlan === plan.id}
                    />
                ))}
            </div>

            {/* Nueva sección: ¿Qué ocurre si no activas BC Pulso? */}
            <div className="max-w-4xl w-full mb-20 bg-white border border-gray-100 rounded-2xl p-8 md:p-12 shadow-sm text-center">
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">¿Qué ocurre si no activas BC Pulso?</h3>
                <p className="text-lg text-gray-600 mb-8">Tu cuenta sigue siendo gratuita y puedes:</p>
                <ul className="grid md:grid-cols-3 gap-6 mb-10">
                    <li className="flex flex-col items-center gap-3 p-4 bg-gray-50 rounded-xl">
                        <span className="text-2xl">👤</span>
                        <span className="font-bold text-gray-700">Mantener tu perfil activo</span>
                    </li>
                    <li className="flex flex-col items-center gap-3 p-4 bg-gray-50 rounded-xl">
                        <span className="text-2xl">🔍</span>
                        <span className="font-bold text-gray-700">Explorar la plataforma</span>
                    </li>
                    <li className="flex flex-col items-center gap-3 p-4 bg-gray-50 rounded-xl">
                        <span className="text-2xl">📝</span>
                        <span className="font-bold text-gray-700">Preparar futuras solicitudes</span>
                    </li>
                </ul>
                <p className="text-xl font-bold text-[var(--secondary-color)] italic">Puedes activar BC Pulso en cualquier momento.</p>
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
