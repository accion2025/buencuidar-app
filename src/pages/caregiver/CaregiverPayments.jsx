import React from 'react';
import { CheckCircle, Crown, Shield, CreditCard, Download } from 'lucide-react';

const CaregiverPayments = () => {
    return (
        <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
            <header className="text-center md:text-left">
                <h1 className="text-2xl font-bold text-gray-800">Mi Suscripción Profesional</h1>
                <p className="text-gray-500">Gestiona tu plan para destacar ante las familias.</p>
            </header>

            {/* Current Plan Card */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg p-8 text-white relative overflow-hidden shadow-xl">
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="bg-yellow-500/20 p-2 rounded-lg text-yellow-400">
                                <Crown size={24} />
                            </div>
                            <span className="font-bold text-yellow-400 uppercase tracking-wider text-sm">Plan Activo</span>
                        </div>
                        <h2 className="text-3xl font-bold mb-2">Membresía Visibilidad PRO</h2>
                        <p className="text-slate-300 max-w-lg">
                            Tu perfil aparece destacado en las búsquedas y tienes acceso ilimitado a la bolsa de trabajo.
                        </p>
                    </div>
                    <div className="text-center md:text-right">
                        <p className="text-sm text-slate-400">Próxima renovación</p>
                        <p className="text-xl font-bold mb-4">15 Feb, 2026</p>
                        <button className="bg-white text-slate-900 px-6 py-2 rounded-lg font-bold hover:bg-gray-100 transition-colors">
                            Administrar
                        </button>
                    </div>
                </div>
                {/* Background Decoration */}
                <div className="absolute -right-10 -bottom-10 opacity-10">
                    <Crown size={200} />
                </div>
            </div>

            {/* Benefits Grid */}
            <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Shield className="text-blue-600" size={20} />
                        Beneficios de tu Plan
                    </h3>
                    <ul className="space-y-3">
                        {[
                            'Posicionamiento priorizado en búsquedas',
                            'Insignia de "Verificado" en tu perfil',
                            'Acceso a ofertas laborales exclusivas',
                            'Soporte técnico preferencial 24/7'
                        ].map((benefit, idx) => (
                            <li key={idx} className="flex items-center gap-3 text-sm text-gray-600">
                                <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                                {benefit}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <CreditCard className="text-purple-600" size={20} />
                        Método de Pago
                    </h3>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg mb-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-white p-2 rounded border border-gray-200">
                                <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-6" />
                            </div>
                            <div>
                                <p className="font-bold text-gray-800">Mastercard •••• 8892</p>
                                <p className="text-xs text-gray-500">Expira 12/28</p>
                            </div>
                        </div>
                        <button className="text-blue-600 text-sm font-medium hover:underline">Cambiar</button>
                    </div>
                    <p className="text-xs text-gray-500 text-center">
                        Se realizará un cargo automático de <span className="font-bold text-gray-700">$199 MXN</span> mensual.
                    </p>
                </div>
            </div>

            {/* Invoice History */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                    <h3 className="font-bold text-gray-800">Historial de Facturación</h3>
                </div>
                <div className="divide-y divide-gray-100">
                    {[
                        { date: "15 Ene, 2026", concept: "Suscripción Mensual - Enero", amount: "$199.00", status: "Pagado" },
                        { date: "15 Dic, 2025", concept: "Suscripción Mensual - Diciembre", amount: "$199.00", status: "Pagado" },
                        { date: "15 Nov, 2025", concept: "Suscripción Mensual - Noviembre", amount: "$199.00", status: "Pagado" },
                    ].map((inv, idx) => (
                        <div key={idx} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                            <div>
                                <p className="font-medium text-gray-800">{inv.concept}</p>
                                <p className="text-xs text-gray-500">{inv.date}</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-bold">{inv.status}</span>
                                <span className="font-bold text-gray-700">{inv.amount}</span>
                                <button className="text-gray-400 hover:text-blue-600">
                                    <Download size={18} />
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
