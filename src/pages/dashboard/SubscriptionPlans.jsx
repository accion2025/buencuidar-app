
import React, { useState } from 'react';
import { Check, CreditCard, Shield, Star, Zap, Info, Lightbulb } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const PlanCard = ({ title, price, period, features, recommended, color, onSelect, loading, isCurrent }) => (
    <div className={`relative bg-white rounded-[24px] p-8 transition-all duration-500 flex flex-col h-full ${recommended
        ? `border-2 ${color.border} shadow-2xl scale-105 z-10`
        : 'border border-gray-100 shadow-sm hover:shadow-xl'
        }`}>
        {recommended && (
            <div className={`absolute -top-5 left-1/2 transform -translate-x-1/2 ${color.badge} !text-[#FAFAF7] px-6 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow-lg whitespace-nowrap`}>
                MEJOR VALOR
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
            className={`w-full py-4 rounded-[16px] font-black text-sm transition-all duration-300 transform uppercase tracking-widest ${isCurrent
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : recommended
                    ? `bg-[#2FAE8F] text-white hover:scale-105 shadow-xl shadow-emerald-100`
                    : `bg-slate-800 text-white hover:bg-slate-900 hover:scale-105`
                } ${loading ? 'opacity-50 cursor-wait' : ''}`}
        >
            {loading ? 'Cargando...' : (isCurrent ? 'Plan Actual' : (price === '0' ? 'Empezar Gratis' : 'Activar Plan'))}
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
            title: 'Plan Gratuito — BC Base',
            price: '0',
            period: 'mes',
            description: 'Esenciales para comenzar',
            features: [
                "Búsqueda básica de cuidadores",
                "Mensajes ilimitados",
                "Perfil familiar",
                "Solicitudes simples (por horas/días)",
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
            title: 'Plan Intermedio — BC PULSO',
            price: '9',
            period: 'mes',
            description: 'Seguridad y tranquilidad',
            features: [
                "Todo BC Base",
                "Reportes básicos de cuidado",
                "Check-in diario del cuidador",
                "Alertas simples",
                "Historial semanal",
                "Indicadores de bienestar"
            ],
            color: {
                border: 'border-blue-200',
                bg: 'bg-blue-50',
                text: 'text-blue-600',
                badge: 'bg-blue-600',
                btn: 'bg-blue-600'
            },
            recommended: true
        },
        {
            id: 'plus',
            title: 'Plan Avanzado — BC PULSO',
            price: '25',
            period: 'mes',
            description: 'Gestión integral de salud',
            features: [
                "Todo BC Pulso",
                "Agenda de cuidados personalizada",
                "Planes por motivo",
                "Seguimiento prolongado",
                "Reportes avanzados",
                "Coordinación familiar",
                "Backup de cuidadores",
                "Soporte prioritario"
            ],
            color: {
                border: 'border-indigo-600',
                bg: 'bg-indigo-50',
                text: 'text-indigo-600',
                badge: 'bg-indigo-600',
                btn: 'bg-indigo-600'
            }
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
            <div className="max-w-6xl w-full text-center space-y-4 mb-16">
                <h1 className="text-5xl md:text-6xl font-brand font-bold tracking-tighter leading-tight">
                    Planes <span className="text-[#0F3C4C]">BuenCuidar</span> para la familia
                </h1>
                <p className="text-xl md:text-2xl text-slate-500 font-medium font-secondary italic">Elige el nivel de cuidado ideal para tus seres queridos</p>
            </div>

            {/* Sección en blanco (Espaciador) */}
            <div className="w-full h-12 md:h-20"></div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full mb-32 items-stretch">
                {plans.map((plan) => (
                    <PlanCard
                        key={plan.id}
                        title={plan.title}
                        price={plan.price}
                        period={plan.period}
                        features={plan.features}
                        recommended={plan.recommended}
                        color={plan.color}
                        onSelect={() => handleSubscribe(plan.id)}
                        loading={loading}
                        isCurrent={currentPlan === plan.id}
                    />
                ))}
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
