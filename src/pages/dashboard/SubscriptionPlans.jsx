
import React, { useState } from 'react';
import { Check, CreditCard, Shield, Star, Zap } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const PlanCard = ({ title, price, features, recommended, onSelect, loading }) => (
    <div className={`relative bg-white rounded-2xl p-8 transition-all duration-300 ${recommended
        ? 'border-2 border-blue-500 shadow-xl scale-105 z-10'
        : 'border border-gray-100 shadow-sm hover:shadow-md'
        }`}>
        {recommended && (
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                Más Popular
            </div>
        )}
        <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
        <div className="flex items-baseline mb-6">
            <span className="text-4xl font-black text-gray-900">${price}</span>
            <span className="text-gray-500 ml-2">/mes</span>
        </div>
        <ul className="space-y-4 mb-8">
            {features.map((feature, idx) => (
                <li key={idx} className="flex items-center gap-3 text-sm text-gray-600">
                    <Check size={18} className="text-green-500 flex-shrink-0" />
                    {feature}
                </li>
            ))}
        </ul>
        <button
            onClick={onSelect}
            disabled={loading}
            className={`w-full py-3 rounded-xl font-bold transition-all ${recommended
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200'
                : 'bg-gray-50 text-gray-800 hover:bg-gray-100'
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
        <div className="container mx-auto px-4 py-16 max-w-7xl">
            {/* Header Section */}
            <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
                <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">
                    Planes diseñados para tu tranquilidad
                </h1>
                <p className="text-gray-500 text-xl leading-relaxed">
                    Elige el nivel de cuidado y soporte que tu familia necesita.
                    <span className="block text-sm font-medium text-gray-400 mt-2 italic">Cancela en cualquier momento sin compromisos.</span>
                </p>
            </div>

            {/* Grid Plans */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto items-stretch">
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

            {/* Checkout Trust Section */}
            <div className="mt-24 max-w-5xl mx-auto">
                <div className="bg-blue-50/50 rounded-2xl p-8 flex flex-col md:flex-row items-center gap-8 border border-blue-100/50 backdrop-blur-sm shadow-sm transition-all hover:shadow-md">
                    <div className="bg-white p-5 rounded-3xl shadow-sm text-blue-600 border border-blue-50">
                        <Shield size={32} />
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <h3 className="font-black text-xl text-gray-900 mb-1">Pagos Seguros vía Stripe</h3>
                        <p className="text-sm text-blue-800/60 font-medium">
                            Tus datos bancarios nunca tocan nuestros servidores. Procesamiento encriptado de nivel bancario.
                        </p>
                    </div>
                    <div className="flex items-center gap-6 opacity-40 grayscale filter hover:grayscale-0 transition-all duration-500">
                        <span className="font-black text-2xl italic tracking-tighter text-gray-900">VISA</span>
                        <div className="h-6 w-px bg-gray-300"></div>
                        <span className="font-black text-xl italic text-gray-900">Mastercard</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SubscriptionPlans;
