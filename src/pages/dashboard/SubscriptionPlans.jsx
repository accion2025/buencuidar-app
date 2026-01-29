
import React, { useState } from 'react';
import { Check, CreditCard, Shield, Star, Zap } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const PlanCard = ({ title, price, features, recommended, onSelect, loading }) => (
    <div className={`relative bg-white rounded-[16px] p-8 transition-all duration-500 flex flex-col ${recommended
        ? 'border-2 border-blue-600 shadow-2xl scale-105 z-10'
        : 'border border-gray-100 shadow-sm hover:shadow-xl'
        }`}>
        {recommended && (
            <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 bg-[var(--secondary-color)] !text-[#FAFAF7] px-6 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow-lg whitespace-nowrap">
                MÁS POPULAR
            </div>
        )}
        <div className="text-center mb-8">
            <h3 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tight">{title}</h3>
            <div className="flex items-center justify-center gap-1">
                <span className="text-5xl font-black text-gray-900">${price}</span>
                <span className="text-gray-400 font-bold text-lg mt-2">/mes</span>
            </div>
        </div>

        <ul className="space-y-4 mb-10 flex-grow">
            {features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-3 text-gray-600 group">
                    <Check size={20} className="text-green-500 flex-shrink-0 mt-0.5 transition-transform group-hover:scale-110" />
                    <span className="text-[15px] font-medium leading-relaxed">{feature}</span>
                </li>
            ))}
        </ul>

        <button
            onClick={onSelect}
            disabled={loading}
            className={`w-full py-5 rounded-[16px] font-black text-lg transition-all duration-300 transform active:scale-95 ${recommended
                ? 'bg-blue-600 !text-[#FAFAF7] hover:bg-blue-700 shadow-xl shadow-blue-200 hover:shadow-2xl'
                : 'bg-gray-50 text-gray-900 hover:bg-gray-100'
                }`}
        >
            {loading ? 'Procesando...' : 'Elegir Plan'}
        </button>
    </div>
);

const SubscriptionPlans = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);

    const handleSubscribe = async (planType) => {
        setLoading(true);
        console.log(`Iniciando suscripción a plan: ${planType}`);

        try {
            const { error } = await supabase.from('subscriptions').insert({
                user_id: user.id,
                plan_type: planType,
                status: 'active',
                stripe_customer_id: 'cus_demo_123',
                stripe_subscription_id: 'sub_demo_456',
                current_period_end: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString()
            });

            if (error) throw error;

            alert("¡Suscripción Simulada Exitosa!");
            window.location.href = '/dashboard/settings';
        } catch (err) {
            console.error(err);
            alert("Error simulando suscripción");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50/30 flex flex-col items-center py-20 px-4 mt-[-40px]">
            {/* Header Block */}
            <div className="max-w-4xl w-full text-center space-y-6 mb-44 group">
                <h1 className="text-5xl md:text-7xl font-brand font-bold !text-[#0F3C4C] tracking-tighter leading-[1.1] animate-fade-in-down">
                    Planes diseñados para tu <span className="text-[var(--secondary-color)]">tranquilidad</span>
                </h1>
            </div>

            {/* Grid Block */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-[1600px] w-full px-4 mb-40 items-stretch">
                <PlanCard
                    title="Básico"
                    price="0"
                    features={[
                        "Búsqueda de cuidadores",
                        "Gestión de citas básica",
                        "Soporte por email"
                    ]}
                    onSelect={() => handleSubscribe('basic')}
                    loading={loading}
                />
                <PlanCard
                    title="Premium"
                    price="29"
                    recommended={true}
                    features={[
                        "Todo lo del Básico",
                        "Reportes de Salud (PULSO)",
                        "Notificaciones en tiempo real",
                        "Cuidadores Verificados (Badge)",
                        "Soporte Prioritario 24/7"
                    ]}
                    onSelect={() => handleSubscribe('premium')}
                    loading={loading}
                />
                <PlanCard
                    title="Empresarial"
                    price="99"
                    features={[
                        "Múltiples pacientes",
                        "API Access",
                        "Account Manager dedicado",
                        "Facturación corporativa"
                    ]}
                    onSelect={() => alert("Contáctanos para planes corporativos")}
                    loading={loading}
                />
            </div>

            {/* Bottom Trust Block */}
            <div className="max-w-4xl w-full mt-60 pb-20">
                <div className="bg-white rounded-[16px] p-8 flex flex-col md:flex-row items-center gap-12 border border-blue-50/50 shadow-xl shadow-blue-50/20 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150"></div>

                    <div className="bg-[var(--secondary-color)] p-6 rounded-[16px] shadow-xl shadow-blue-100 !text-[#FAFAF7] z-10 transition-transform group-hover:rotate-6">
                        <Shield size={44} />
                    </div>

                    <div className="flex-1 text-center md:text-left z-10">
                        <h3 className="font-black text-3xl text-gray-900 mb-2 tracking-tight">Pagos Seguros vía Stripe</h3>
                        <p className="text-lg text-gray-500 font-medium leading-relaxed">
                            Procesamiento encriptado de nivel bancario. Tus datos están protegidos en todo momento.
                        </p>
                    </div>

                    <div className="flex items-center gap-10 opacity-30 group-hover:opacity-60 transition-opacity z-10">
                        <span className="font-black text-4xl italic tracking-tighter text-gray-900">VISA</span>
                        <div className="h-10 w-px bg-gray-200"></div>
                        <span className="font-black text-3xl italic text-gray-900 tracking-tight">Mastercard</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SubscriptionPlans;
