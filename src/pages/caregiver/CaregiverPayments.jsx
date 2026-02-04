import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Crown, Shield, CreditCard, Download, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

const CaregiverPayments = () => {
    const { profile } = useAuth();
    const [subDetails, setSubDetails] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSub = async () => {
            if (!profile?.id) return;
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('subscriptions')
                    .select('*')
                    .eq('user_id', profile.id)
                    .single();

                if (data) setSubDetails(data);
            } catch (err) {
                console.error("Error fetching subscription details:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchSub();
    }, [profile?.id]);

    const isActive = profile?.subscription_status === 'active';
    const isPro = profile?.plan_type === 'professional_pro' || profile?.plan_type === 'premium';

    if (loading) {
        return (
            <div className="flex items-center justify-center p-20">
                <Loader2 size={40} className="animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in max-w-4xl mx-auto pb-12">
            <header className="text-center md:text-left">
                <h1 className="text-3xl font-brand font-bold !text-[#0F3C4C]">Mi Suscripción Profesional</h1>
                <p className="text-gray-500 font-secondary mt-2">Gestiona tu plan para destacar ante las familias y acceder a beneficios PRO.</p>
            </header>

            {/* Status Info (If not active) */}
            {!isActive && (
                <div className="bg-amber-50 border border-amber-200 rounded-[16px] p-6 flex items-start gap-4">
                    <AlertCircle className="text-amber-600 mt-1 flex-shrink-0" />
                    <div>
                        <h4 className="font-bold text-amber-900">Tu plan actual es el Básico (Gratis)</h4>
                        <p className="text-amber-800 text-sm mt-1">
                            Tu visibilidad es estándar y no cuentas con la insignia de verificado PRO. ¡Mejora tu plan para destacar hoy mismo!
                        </p>
                    </div>
                </div>
            )}

            {/* Current Plan Card */}
            <div className={`${isActive ? 'bg-[#0F3C4C]' : 'bg-slate-100 border border-slate-200'} rounded-[16px] p-10 relative overflow-hidden shadow-2xl transition-all duration-500`}>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-left">
                    <div className="flex-1">
                        <div className="flex items-center justify-center md:justify-start gap-2 mb-4">
                            <div className={`${isActive ? 'bg-[var(--secondary-color)]/20 text-[var(--secondary-color)]' : 'bg-gray-200 text-gray-500'} p-2 rounded-[16px]`}>
                                {isActive ? <Crown size={24} /> : <Shield size={24} />}
                            </div>
                            <span className={`font-black uppercase tracking-widest text-[10px] ${isActive ? 'text-[var(--secondary-color)]' : 'text-gray-500'}`}>
                                {isActive ? 'Plan Activo' : 'Estatus Estándar'}
                            </span>
                        </div>
                        <h2 className={`text-4xl font-brand font-bold mb-4 tracking-tight ${isActive ? '!text-[#FAFAF7]' : 'text-slate-800'}`}>
                            {isActive ? 'Membresía Visibilidad PRO' : 'Perfil Gratuito'}
                        </h2>
                        <p className={`max-w-lg font-secondary text-base leading-relaxed ${isActive ? '!text-[#FAFAF7]/70' : 'text-slate-600'}`}>
                            {isActive
                                ? 'Tu perfil aparece destacado en las búsquedas y tienes acceso ilimitado a la bolsa de trabajo para postularte a nuevas ofertas.'
                                : 'Tu perfil está visible pero no cuenta con prioridad en los resultados de búsqueda ni insignia de verificación PRO.'
                            }
                        </p>
                    </div>

                    <div className={`w-full md:w-auto p-8 rounded-[16px] backdrop-blur-md border ${isActive ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
                        <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isActive ? '!text-[#FAFAF7]/50' : 'text-gray-400'}`}>
                            {isActive ? 'Próxima renovación' : 'Estado de cuenta'}
                        </p>
                        <p className={`text-2xl font-brand font-bold mb-6 ${isActive ? '!text-[#FAFAF7]' : 'text-slate-800'}`}>
                            {subDetails?.current_period_end
                                ? new Date(subDetails.current_period_end).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
                                : (isActive ? 'Renovación automática' : 'Sin cargos activos')
                            }
                        </p>
                        <Link
                            to="/caregiver/plans"
                            className={`${isActive
                                ? 'bg-[var(--secondary-color)] hover:bg-emerald-600 shadow-green-900/40'
                                : 'bg-[var(--primary-color)] hover:bg-[#1a5a70] shadow-blue-900/20'
                                } !text-[#FAFAF7] px-8 py-3 rounded-[16px] font-black uppercase tracking-widest text-[10px] transition-all shadow-xl border-none w-full inline-block text-center`}
                        >
                            {isActive ? 'Administrar' : 'Mejorar a PRO'}
                        </Link>
                    </div>
                </div>
                {/* Background Decoration */}
                <div className={`absolute -right-20 -bottom-20 opacity-5 pointer-events-none ${isActive ? '!text-[#FAFAF7]' : 'text-slate-300'}`}>
                    <Crown size={300} />
                </div>
            </div>

            {/* Benefits Grid */}
            <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white p-8 rounded-[16px] border border-slate-100 shadow-xl shadow-slate-200/50">
                    <h3 className="font-brand font-bold text-xl !text-[#0F3C4C] mb-6 flex items-center gap-3">
                        <div className="bg-blue-50 p-2 rounded-[16px] text-[var(--primary-color)]"><Shield size={20} /></div>
                        {isActive ? 'Beneficios Visibilidad PRO' : '¿Por qué ser PRO?'}
                    </h3>
                    <ul className="space-y-4">
                        {[
                            'Posicionamiento priorizado en búsquedas',
                            'Insignia de "Verificado" en tu perfil',
                            'Acceso a ofertas laborales exclusivas',
                            'Soporte técnico preferencial 24/7'
                        ].map((benefit, idx) => (
                            <li key={idx} className="flex items-center gap-3 text-sm text-[#07212e] font-medium">
                                <CheckCircle size={18} className={`${isActive ? 'text-[var(--secondary-color)]' : 'text-gray-300'} flex-shrink-0`} />
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
                    {isActive ? (
                        <>
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
                        </>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center py-6 text-center">
                            <div className="bg-slate-50 p-4 rounded-full mb-4">
                                <CreditCard size={32} className="text-slate-300" />
                            </div>
                            <p className="text-gray-500 text-sm font-secondary">No tienes métodos de pago registrados.</p>
                            <Link to="/caregiver/plans" className="text-[var(--primary-color)] text-[10px] font-black uppercase tracking-widest mt-4 hover:underline">
                                Añadir método de pago
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            {/* Invoice History (Only if active or had history) */}
            {isActive && (
                <div className="bg-white rounded-[16px] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
                    <div className="p-8 border-b border-gray-50 bg-slate-50/50">
                        <h3 className="font-brand font-bold text-xl !text-[#0F3C4C]">Historial de Facturación</h3>
                    </div>
                    <div className="divide-y divide-gray-50 text-center py-12 text-gray-400 italic">
                        No se encontraron facturas recientes.
                    </div>
                </div>
            )}
        </div>
    );
};

export default CaregiverPayments;
