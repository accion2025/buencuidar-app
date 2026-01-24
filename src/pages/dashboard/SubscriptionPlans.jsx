
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
        // TODO: Replace with real Stripe integration
        // For MVP/Demo purposes, we will simulate a "Checkout" redirect or success
        // In real Stripe: 
        // 1. Call backend to create Checkout Session
        // 2. stripe.redirectToCheckout({ sessionId })

        console.log(`Iniciando suscripción a plan: ${planType}`);

        // SIMULATION: Direct success
        try {
            // Create a "pending/active" subscription in DB
            const { error } = await supabase.from('subscriptions').insert({
                user_id: user.id,
                plan_type: planType,
                status: 'active', // Simulating instant approval for demo
                stripe_customer_id: 'cus_demo_123',
                stripe_subscription_id: 'sub_demo_456',
                current_period_end: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString()
            });

            if (error) throw error;

            alert("¡Suscripción Simulada Exitosa! (En prod iría a Stripe)");
            window.location.href = '/dashboard/settings'; // Redirect to settings
        } catch (err) {
            console.error(err);
            alert("Error simulando suscripción");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-12">
            <div className="text-center max-w-2xl mx-auto mb-12">
                <h1 className="text-3xl font-black text-gray-800 mb-4">Planes diseñados para tu tranquilidad</h1>
                <p className="text-gray-500 text-lg">
                    Elige el nivel de cuidado y soporte que tu familia necesita. Cancela en cualquier momento.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
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

            <div className="mt-16 bg-blue-50 rounded-2xl p-8 flex flex-col md:flex-row items-center gap-8 border border-blue-100">
                <div className="bg-white p-4 rounded-full shadow-sm text-blue-500">
                    <Shield size={32} />
                </div>
                <div className="flex-1 text-center md:text-left">
                    <h3 className="font-bold text-lg text-gray-800 mb-2">Pagos Seguros vía Stripe</h3>
                    <p className="text-sm text-gray-600">
                        Tus datos bancarios nunca tocan nuestros servidores. Procesamiento encriptado de nivel bancario.
                    </p>
                </div>
                <div className="flex gap-4 opacity-50 grayscale">
                    {/* Placeholders for Visa/Mastercard icons text */}
                    <span className="font-bold text-xl italic">VISA</span>
                    <span className="font-bold text-xl italic">Mastercard</span>
                </div>
            </div>
        </div>
    );
};

export default SubscriptionPlans;
