
import React, { useState } from 'react';
import { Check, Shield, Star, Info } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const PlanCard = ({ plan, isCurrent, onSelect, loading }) => {
    const { title, subtitle, price, period, description, features, recommended, color } = plan;

    return (
        <div className={`relative bg-white rounded-2xl p-8 transition-all duration-500 flex flex-col h-full border ${recommended
            ? `${color.border} shadow-2xl scale-105 z-10 border-2`
            : 'border-gray-100 shadow-sm hover:shadow-xl'
            }`}>
            {recommended && (
                <div className={`absolute -top-5 left-1/2 transform -translate-x-1/2 ${color.badge} !text-[#FAFAF7] px-6 py-2 rounded-md text-xs font-black uppercase tracking-widest shadow-lg whitespace-nowrap`}>
                    MEJOR VALOR ⭐
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

            {isCurrent ? (
                <div className="w-full py-4 text-center font-black text-[#2FAE8F] uppercase tracking-widest rounded-xl bg-emerald-50 border border-emerald-100 shadow-sm">
                    ACTIVADO
                </div>
            ) : (
                <button
                    onClick={() => onSelect(plan.id)}
                    disabled={loading || plan.id === 'plus'}
                    className={`w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all ${loading || plan.id === 'plus'
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                        : 'bg-[#0F3C4C] text-white hover:bg-[#0a2a36] shadow-lg shadow-blue-100 active:scale-95'
                        }`}
                >
                    {loading ? 'Procesando...' : (plan.id === 'base' ? 'ACTIVAR GRATUITO' : 'ACTIVAR BC PULSO')}
                </button>
            )}
        </div>
    );
};

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
            description: 'Esenciales para comenzar a explorar la plataforma.',
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
                badge: 'bg-emerald-600'
            }
        },
        {
            id: 'pulso',
            title: 'BC PULSO — 1 mes',
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
                badge: 'bg-blue-600'
            }
        },
        {
            id: 'plus',
            title: 'BC PULSO — 3 meses ⭐',
            subtitle: 'Mejor valor',
            price: '15',
            period: '3 meses',
            description: 'Ahorro del 29%. Equivale a solo $5 por mes.',
            features: [
                "Todo el acceso anterior",
                "Ideal si necesitas apoyo continuo",
                "Ideal si estás en proceso de recuperación",
                "Mantenimiento de acceso activo sin interrupciones",
                "Mayor tranquilidad con menor costo"
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

    const handleSubscribe = async (planType) => {
        if (planType === currentPlan) return;
        setLoading(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    plan_type: planType,
                    subscription_status: 'active'
                })
                .eq('id', user.id);

            if (error) throw error;

            const { error: subError } = await supabase.from('subscriptions').insert({
                user_id: user.id,
                plan_type: planType,
                status: 'active',
                current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            });

            if (subError) throw subError;

            alert(`¡Plan BC PULSO activado correctamente!`);
            window.location.href = '/dashboard';
        } catch (err) {
            console.error(err);
            alert("Error al procesar la activación");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50/10 flex flex-col items-center py-16 px-4">
            {/* Encabezado */}
            <div className="max-w-4xl w-full text-center space-y-6 mb-16">
                <h1 className="text-4xl md:text-5xl font-brand font-bold tracking-tight text-[#0F3C4C]">
                    ¡Activa BC PULSO y conecta directamente con cuidadores!
                </h1>
                <div className="space-y-4">
                    <p className="text-2xl font-bold text-[#2FAE8F] italic">Tu cuenta ya está lista.</p>
                    <p className="text-xl text-slate-600 leading-relaxed font-medium text-center">
                        Ahora puedes activar BC PULSO para contactar, coordinar y recibir apoyo cuando lo necesites.
                    </p>
                    <p className="text-lg text-slate-400 italic">Activa solo cuando lo necesites. Sin contratos ni compromisos.</p>
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
                        onSelect={handleSubscribe}
                        loading={loading}
                    />
                ))}
            </div>

            {/* Sección en blanco (Espaciador) */}
            <div className="w-full h-12 md:h-20"></div>

            {/* Nueva sección: ¿Qué ocurre si no activas BC PULSO? (Estructura Simple) */}
            <div className="max-w-2xl w-full mb-24 text-center">
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 font-brand">¿Qué ocurre si no activas BC PULSO?</h3>
                <p className="text-lg text-gray-600 mb-6 font-medium">Tu cuenta sigue siendo gratuita y puedes:</p>

                <div className="flex justify-center w-full mb-8">
                    <div className="text-left text-lg font-bold text-gray-700 space-y-4">
                        <div className="flex items-center gap-3">
                            <Check size={20} className="text-[#2FAE8F] flex-shrink-0" />
                            <span>Mantener tu perfil activo</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Check size={20} className="text-[#2FAE8F] flex-shrink-0" />
                            <span>Explorar la plataforma</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Check size={20} className="text-[#2FAE8F] flex-shrink-0" />
                            <span>Preparar futuras solicitudes</span>
                        </div>
                    </div>
                </div>

                <p className="text-xl font-bold text-[#2FAE8F] italic">Puedes activar BC PULSO en cualquier momento.</p>
            </div>

            {/* Garantía */}
            <div className="max-w-4xl w-full pb-20">
                <div className="bg-[#0F3C4C] rounded-[24px] p-8 md:p-10 flex flex-col md:flex-row items-center justify-center gap-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#2FAE8F] rounded-full -mr-32 -mt-32 opacity-10"></div>
                    <div className="bg-white/10 p-5 rounded-2xl text-[#2FAE8F] z-10">
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
