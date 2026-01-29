import React from 'react';
import { CheckCircle, Crown, Shield, CreditCard, Download } from 'lucide-react';

const CaregiverPayments = () => {
    return (
        <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
            <header className="text-center md:text-left">
                <h1 className="text-3xl font-brand font-bold !text-[#0F3C4C]">Mi Suscripción Profesional</h1>
                <p className="text-gray-500 font-secondary mt-2">Gestiona tu plan para destacar ante las familias y acceder a beneficios PRO.</p>
            </header>

            {/* Current Plan Card */}
            <div className="bg-[#0F3C4C] rounded-[16px] p-10 !text-[#FAFAF7] relative overflow-hidden shadow-2xl border border-white/5">
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="text-center md:text-left">
                        <div className="flex items-center justify-center md:justify-start gap-2 mb-4">
                            <div className="bg-[var(--secondary-color)]/20 p-2 rounded-[16px] text-[var(--secondary-color)]">
                                <Crown size={24} />
                            </div>
                            <span className="font-black text-[var(--secondary-color)] uppercase tracking-widest text-[10px]">Plan Activo</span>
                        </div>
                        <h2 className="text-4xl font-brand font-bold mb-4 tracking-tight !text-[#FAFAF7]">Membresía Visibilidad PRO</h2>
                        <p className="opacity-70 max-w-lg font-secondary text-base leading-relaxed !text-[#FAFAF7]">
                            Tu perfil aparece destacado en las búsquedas y tienes acceso ilimitado a la bolsa de trabajo para postularte a nuevas ofertas.
                        </p>
                    </div>
                    <div className="text-center md:text-right bg-white/5 p-8 rounded-[16px] backdrop-blur-md border border-white/10">
                        <p className="text-[10px] font-black uppercase tracking-widest !text-[#FAFAF7]/50 mb-1">Próxima renovación</p>
                        <p className="text-2xl font-brand font-bold mb-6 !text-[#FAFAF7]">15 Feb, 2026</p>
                        <button className="bg-[var(--secondary-color)] !text-[#FAFAF7] px-8 py-3 rounded-[16px] font-black uppercase tracking-widest text-[10px] hover:bg-emerald-600 transition-all shadow-xl shadow-green-900/40 border-none w-full">
                            Administrar
                        </button>
                    </div>
                </div>
                {/* Background Decoration */}
                <div className="absolute -right-20 -bottom-20 opacity-5 !text-[#FAFAF7] pointer-events-none">
                    <Crown size={300} />
                </div>
            </div>

            {/* Benefits Grid */}
            <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white p-8 rounded-[16px] border border-slate-100 shadow-xl shadow-slate-200/50">
                    <h3 className="font-brand font-bold text-xl !text-[#0F3C4C] mb-6 flex items-center gap-3">
                        <div className="bg-blue-50 p-2 rounded-[16px] text-[var(--primary-color)]"><Shield size={20} /></div>
                        Beneficios de tu Plan
                    </h3>
                    <ul className="space-y-4">
                        {[
                            'Posicionamiento priorizado en búsquedas',
                            'Insignia de "Verificado" en tu perfil',
                            'Acceso a ofertas laborales exclusivas',
                            'Soporte técnico preferencial 24/7'
                        ].map((benefit, idx) => (
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
                    <div className="flex items-center justify-between p-6 bg-slate-50 rounded-[24px] border border-slate-100 mb-6">
                        <div className="flex items-center gap-4">
                            <div className="bg-white p-3 rounded-[16px] border border-slate-100 shadow-sm">
                                <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-6" />
                            </div>
                            <div>
                                <p className="font-bold text-[#0F3C4C]">Mastercard ••• 8892</p>
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Expira 12/28</p>
                            </div>
                        </div>
                        <button className="text-[var(--primary-color)] text-xs font-black uppercase tracking-widest hover:underline">Cambiar</button>
                    </div>
                    <p className="text-[10px] text-gray-400 font-medium text-center uppercase tracking-tighter">
                        Cargo automático de <span className="font-black text-[#0F3C4C]">$199 MXN</span> mensual.
                    </p>
                </div>
            </div>

            {/* Invoice History */}
            <div className="bg-white rounded-[16px] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
                <div className="p-8 border-b border-gray-50 bg-slate-50/50">
                    <h3 className="font-brand font-bold text-xl !text-[#0F3C4C]">Historial de Facturación</h3>
                </div>
                <div className="divide-y divide-gray-50">
                    {[
                        { date: "15 Ene, 2026", concept: "Suscripción Mensual - Enero", amount: "$199.00", status: "Pagado" },
                        { date: "15 Dic, 2025", concept: "Suscripción Mensual - Diciembre", amount: "$199.00", status: "Pagado" },
                        { date: "15 Nov, 2025", concept: "Suscripción Mensual - Noviembre", amount: "$199.00", status: "Pagado" },
                    ].map((inv, idx) => (
                        <div key={idx} className="p-8 flex items-center justify-between hover:bg-slate-50/50 transition-all border-l-4 border-transparent hover:border-l-[var(--secondary-color)]">
                            <div>
                                <p className="font-brand font-bold text-[#0F3C4C] text-lg">{inv.concept}</p>
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">{inv.date}</p>
                            </div>
                            <div className="flex items-center gap-8">
                                <span className="bg-[var(--secondary-color)]/10 text-[var(--secondary-color)] px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">{inv.status}</span>
                                <span className="font-brand font-bold text-[#0F3C4C] text-lg">{inv.amount}</span>
                                <button className="p-3 bg-slate-50 text-gray-400 hover:text-[var(--primary-color)] hover:bg-white hover:shadow-lg rounded-[16px] transition-all">
                                    <Download size={20} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CaregiverPayments;
