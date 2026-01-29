
import React, { useState, useEffect } from 'react';
import { Users, CreditCard, Activity, CalendarCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const StatCard = ({ title, value, subtext, icon: Icon, color }) => (
    <div className="bg-white p-6 rounded-[16px] shadow-sm border border-gray-100">
        <div className="flex justify-between items-start mb-4">
            <div>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">{title}</p>
                <h3 className="text-3xl font-black text-gray-800 mt-1">{value}</h3>
            </div>
            <div className={`p-3 rounded-[16px] ${color} bg-opacity-10 text-opacity-100`}>
                <Icon size={24} className={color.replace('bg-', 'text-')} />
            </div>
        </div>
        <p className="text-xs font-medium text-gray-500">
            {subtext}
        </p>
    </div>
);

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeSubs: 0,
        totalAppointments: 0,
        pendingCaregivers: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            // 1. Total Users
            const { count: userCount, error: userError } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true });

            // 2. Active Appointments (Confirmed)
            const { count: apptCount, error: apptError } = await supabase
                .from('appointments')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'confirmed');

            // 3. Active Subs (Mock logic or check subscription_status)
            const { count: subCount, error: subError } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('subscription_status', 'active');

            // 4. Pending Caregivers (Mock or role check) - Assuming 'caregiver' role
            const { count: caregiverCount, error: cgError } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'caregiver');


            setStats({
                totalUsers: userCount || 0,
                activeSubs: subCount || 0,
                totalAppointments: apptCount || 0,
                totalCaregivers: caregiverCount || 0
            });
        } catch (error) {
            console.error("Error fetching admin stats:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Usuarios Totales"
                    value={stats.totalUsers}
                    subtext="Familias y Cuidadores registrados"
                    icon={Users}
                    color="text-blue-600 bg-blue-100"
                />
                <StatCard
                    title="Suscripciones"
                    value={stats.activeSubs}
                    subtext="Planes activos actualmente"
                    icon={CreditCard}
                    color="text-emerald-600 bg-emerald-100"
                />
                <StatCard
                    title="Citas Activas"
                    value={stats.totalAppointments}
                    subtext="Visitas confirmadas en agenda"
                    icon={CalendarCheck}
                    color="text-purple-600 bg-purple-100"
                />
                <StatCard
                    title="Cuidadores"
                    value={stats.totalCaregivers}
                    subtext="Profesionales en la plataforma"
                    icon={Activity}
                    color="text-orange-600 bg-orange-100"
                />
            </div>

            {/* Quick Actions / Recent (Placeholder) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-6 rounded-[16px] shadow-sm border border-gray-100">
                    <h3 className="font-bold text-lg text-gray-800 mb-4">Actividad Reciente</h3>
                    <div className="flex items-center justify-center h-40 bg-gray-50 rounded-[16px] border border-dashed border-gray-200">
                        <p className="text-gray-400 text-sm">Gráfico de actividad próximamente...</p>
                    </div>
                </div>
                <div className="bg-slate-900 !text-[#FAFAF7] p-6 rounded-[16px] shadow-lg shadow-slate-200">
                    <h3 className="font-bold text-lg mb-4">Estado del Sistema</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-400">Base de Datos</span>
                            <span className="text-emerald-400 font-bold">Conectado</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-400">Versión App</span>
                            <span className="!text-[#FAFAF7] font-bold">v1.2.0 (PULSO)</span>
                        </div>
                        <div className="pt-4 border-t border-slate-700">
                            <p className="text-xs text-slate-500 leading-relaxed">
                                El sistema está operando con normalidad. No se detectan anomalías en los triggers de notificación.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
