import React from 'react';
import { CheckCircle, Crown, Shield, CreditCard, Download, Zap, Star } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const SubscriptionManagement = () => {
    const { profile } = useAuth();
    const navigate = useNavigate();

    const isPremium = profile?.subscription_status === 'active';
    const planName = isPremium ? 'Plan Premium PULSO' : 'Plan Básico';
    const renewalDate = "15 Feb, 2026"; // Mocked for now

    const benefits = [
        'El estado general de bienestar',
        'Las rutinas diarias',
        'La actividad del cuidador',
        'Los registros básicos de atención',
        'La evolución del cuidado en el tiempo'
    ];

    return (
        <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
            <header className="text-center md:text-left pt-4">
                <h1 className="text-3xl font-brand font-bold !text-[#0F3C4C]">Mi Suscripción Familiar</h1>
                <p className="text-gray-500 font-secondary mt-2">Gestiona tu acceso a los servicios de seguimiento y bienestar.</p>
            </header>

            {/* Current Plan Card */}
            <div className={`rounded-[16px] p-10 !text-[#FAFAF7] relative overflow-hidden shadow-2xl border border-white/5 ${isPremium ? 'bg-[#0F3C4C]' : 'bg-slate-700'}`}>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="text-center md:text-left">
                        <div className="flex items-center justify-center md:justify-start gap-2 mb-4">
                            <div className={`${isPremium ? 'bg-[var(--secondary-color)]/20 text-[var(--secondary-color)]' : 'bg-gray-500/30 text-gray-300'} p-2 rounded-[16px]`}>
                                {isPremium ? <Crown size={24} /> : <Zap size={24} />}
                            </div>
                            <span className={`font-black uppercase tracking-widest text-[10px] ${isPremium ? 'text-[var(--secondary-color)]' : 'text-gray-300'}`}>
                                {isPremium ? 'Plan Activo' : 'Versión Gratuita'}
                            </span>
                        </div>
                        <h2 className="text-4xl font-brand font-bold mb-4 tracking-tight !text-[#FAFAF7]">{planName}</h2>
                        <p className="opacity-70 max-w-lg font-secondary text-base leading-relaxed !text-[#FAFAF7]">
                            {isPremium
                                ? 'Disfrutas de acceso total a BC PULSO y todas las herramientas avanzadas de seguimiento de bienestar para tu familia.'
                                : 'Tienes acceso a las funciones básicas de búsqueda y gestión. Cambia a PULSO para monitorear el bienestar en tiempo real.'}
                        </p>
                    </div>
                    <div className="text-center md:text-right bg-white/5 p-8 rounded-[24px] backdrop-blur-md border border-white/10 w-full md:w-auto min-w-[200px]">
                        {isPremium ? (
                            <>
                                <p className="text-[10px] font-black uppercase tracking-widest !text-[#FAFAF7]/50 mb-1">Próxima renovación</p>
                                <p className="text-2xl font-brand font-bold mb-6 !text-[#FAFAF7]">{renewalDate}</p>
                            </>
                        ) : (
                            <>
                                <p className="text-[10px] font-black uppercase tracking-widest !text-[#FAFAF7]/50 mb-1">Costo Mensual</p>
                                <p className="text-2xl font-brand font-bold mb-6 !text-[#FAFAF7]">$0.00</p>
                            </>
                        )
                        }
                        <button
                            onClick={() => navigate('/dashboard/plans')}
                            className="bg-[var(--secondary-color)] !text-[#FAFAF7] px-8 py-3 rounded-[16px] font-black uppercase tracking-widest text-[10px] hover:bg-emerald-600 transition-all shadow-xl shadow-green-900/40 border-none w-full"
                        >
                            {isPremium ? 'Administrar' : 'Actualizar a PULSO'}
                        </button>
                    </div>
                </div>
                {/* Background Decoration */}
                <div className="absolute -right-20 -bottom-20 opacity-5 !text-[#FAFAF7] pointer-events-none">
                    {isPremium ? <Crown size={300} /> : <Star size={300} />}
                </div>
            </div>

            {/* Benefits Grid */}
            <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white p-8 rounded-[16px] border border-slate-100 shadow-xl shadow-slate-200/50">
                    <h3 className="font-brand font-bold text-xl !text-[#0F3C4C] mb-6 flex items-center gap-3">
                        <div className="bg-blue-50 p-2 rounded-[16px] text-[var(--primary-color)]"><Shield size={20} /></div>
                        Beneficios {isPremium ? 'Actuales' : 'de PULSO'}
                    </h3>
                    <p className="text-sm font-bold text-[#0F3C4C] mb-4">Permite supervisar:</p>
                    <ul className="space-y-4">
                        {benefits.map((benefit, idx) => (
                            <li key={idx} className="flex items-center gap-3 text-sm text-[#07212e] font-medium">
                                <CheckCircle size={18} className="text-[var(--secondary-color)] flex-shrink-0" />
                                {benefit}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="bg-white p-8 rounded-[16px] border border-slate-100 shadow-xl shadow-slate-200/50">
                    <h3 className="font-brand font-bold text-xl !text-[#0F3C4C] mb-6 flex items-center gap-3">
                        <div className="bg-purple-50 p-2 rounded-[16px] text-purple-600"><CreditCard size={20} /></div>
                        Método de Pago
                    </h3>
                    {isPremium ? (
                        <>
                            <div className="flex items-center justify-between p-6 bg-slate-50 rounded-[24px] border border-slate-100 mb-6 font-primary text-[#0F3C4C]">
                                <div className="flex items-center gap-4">
                                    <div className="bg-white p-3 rounded-[16px] border border-slate-100 shadow-sm">
                                        <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-6" />
                                    </div>
                                    <div>
                                        <p className="font-bold">Mastercard ••• 4412</p>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Expira 08/27</p>
                                    </div>
                                </div>
                                <button className="text-[var(--primary-color)] text-xs font-black uppercase tracking-widest hover:underline border-none bg-transparent">Cambiar</button>
                            </div>
                            <p className="text-[10px] text-gray-400 font-medium text-center uppercase tracking-tighter">
                                Cargo automático de <span className="font-black text-[#0F3C4C]">$29.00 USD</span> mensual.
                            </p>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-[24px] border border-dashed border-slate-200 text-center h-[calc(100%-80px)]">
                            <p className="text-sm text-gray-500 mb-4">No tienes un método de pago registrado.</p>
                            <button
                                onClick={() => navigate('/dashboard/plans')}
                                className="text-[var(--primary-color)] text-xs font-black uppercase tracking-widest hover:scale-105 transition-transform border-none bg-transparent"
                            >
                                Vincular Tarjeta
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Invoice History - Always visible title, empty if not premium */}
            <div className="bg-white rounded-[16px] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
                <div className="p-8 border-b border-gray-50 bg-slate-50/50">
                    <h3 className="font-brand font-bold text-xl !text-[#0F3C4C]">Historial de Facturación</h3>
                </div>
                <div className="divide-y divide-gray-50">
                    {isPremium ? (
                        [
                            { date: "15 Ene, 2026", concept: "Suscripción Mensual PULSO - Enero", amount: "$29.00", status: "Pagado" },
                            { date: "15 Dic, 2025", concept: "Suscripción Mensual PULSO - Diciembre", amount: "$29.00", status: "Pagado" },
                        ].map((inv, idx) => (
                            <div key={idx} className="p-8 flex items-center justify-between hover:bg-slate-50/50 transition-all border-l-4 border-transparent hover:border-l-[var(--secondary-color)] group">
                                <div>
                                    <p className="font-brand font-bold text-[#0F3C4C] text-lg">{inv.concept}</p>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">{inv.date}</p>
                                </div>
                                <div className="flex items-center gap-8">
                                    <span className="bg-[var(--secondary-color)]/10 text-[var(--secondary-color)] px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">{inv.status}</span>
                                    <span className="font-brand font-bold text-[#0F3C4C] text-lg">{inv.amount}</span>
                                    <button className="p-3 bg-slate-50 text-gray-400 hover:text-[var(--primary-color)] hover:bg-white hover:shadow-lg rounded-[16px] transition-all border-none">
                                        <Download size={20} />
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-12 text-center text-gray-400 font-secondary italic bg-white w-full flex flex-col items-center">
                            <Download size={40} className="mb-4 opacity-20" />
                            No tienes facturas generadas.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SubscriptionManagement;
