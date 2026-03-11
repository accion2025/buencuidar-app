
import React, { useState, useEffect } from 'react';
import { Users, CreditCard, Activity, CalendarCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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
        totalFamilies: 0,
        visibleFamilies: 0,
        totalCaregivers: 0,
        visibleCaregivers: 0,
        totalAppointments: 0,
        activeSubs: 0,
        activeSubsFamilies: 0,
        activeSubsCaregivers: 0
    });
    const [activityData, setActivityData] = useState([]);
    const [timeRange, setTimeRange] = useState('7d'); // ['7d', '14d', '28d', '3m']
    const [chartType, setChartType] = useState('bar'); // ['bar', 'line']
    
    // Estados para Gráfica de Interactividad
    const [interactionData, setInteractionData] = useState([]);
    const [interactionTimeRange, setInteractionTimeRange] = useState('7d');
    const [interactionChartType, setInteractionChartType] = useState('bar');
    
    const [loading, setLoading] = useState(true);
    const [loadingInteraction, setLoadingInteraction] = useState(true);

    useEffect(() => {
        fetchStats();
    }, [timeRange]); // Re-fetch cuando cambie el selector de tiempo

    useEffect(() => {
        fetchInteractionStats();
    }, [interactionTimeRange]);

    const fetchStats = async () => {
        try {
            // 1. Total and Visible Families
            const { count: totalFamilies } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'family');

            const { count: visibleFamilies } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'family')
                .eq('is_active', true);

            // 2. Total and Visible Caregivers
            const { count: totalCaregivers } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'caregiver');

            const { count: visibleCaregivers } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'caregiver')
                .eq('is_active', true);

            // 3. Active Appointments (Confirmed)
            const { count: apptCount } = await supabase
                .from('appointments')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'confirmed');

            // 4. Active Subs
            const { count: subCount } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('subscription_status', 'active');

            const { count: activeSubsFamilies } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('subscription_status', 'active')
                .eq('role', 'family');

            const { count: activeSubsCaregivers } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('subscription_status', 'active')
                .eq('role', 'caregiver');


            // 5. Activity Chart Data (Usuarios nuevos por periodo seleccionado)
            const dateRange = new Date();
            let grouping = 'day'; // 'day' o 'month'

            switch (timeRange) {
                case '14d':
                    dateRange.setDate(dateRange.getDate() - 13);
                    break;
                case '28d':
                    dateRange.setDate(dateRange.getDate() - 27);
                    break;
                case '3m':
                    dateRange.setMonth(dateRange.getMonth() - 2);
                    dateRange.setDate(1); // Principio del mes para gráfica mensual
                    grouping = 'month';
                    break;
                case '7d':
                default:
                    dateRange.setDate(dateRange.getDate() - 6);
                    break;
            }
            dateRange.setHours(0, 0, 0, 0);

            const { data: recentProfiles, error: recentError } = await supabase
                .from('profiles')
                .select('created_at, role')
                .gte('created_at', dateRange.toISOString())
                .order('created_at', { ascending: true });

            // Procesar datos para el gráfico
            const chartMap = {};

            // Inicializar el mapa dependiendo de la agrupación (Día o Mes)
            if (grouping === 'day') {
                const daysToGenerate = timeRange === '28d' ? 27 : timeRange === '14d' ? 13 : 6;
                for (let i = daysToGenerate; i >= 0; i--) {
                    const d = new Date();
                    d.setDate(d.getDate() - i);
                    const dateKey = d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
                    chartMap[dateKey] = { name: dateKey, Cuidadores: 0, Familias: 0 };
                }
            } else {
                // Generar meses hacia atrás
                const monthsToGenerate = 3; // Solo permitimos 3m en meses
                for (let i = monthsToGenerate - 1; i >= 0; i--) {
                    const d = new Date();
                    d.setMonth(d.getMonth() - i);
                    const monthKey = d.toLocaleDateString('es-ES', { month: 'long' });
                    // Capitalizar primera letra del mes
                    const cleanKey = monthKey.charAt(0).toUpperCase() + monthKey.slice(1);
                    chartMap[cleanKey] = { name: cleanKey, Cuidadores: 0, Familias: 0 };
                }
            }

            if (recentProfiles) {
                recentProfiles.forEach(profile => {
                    const pDate = new Date(profile.created_at);
                    let dateKey;

                    if (grouping === 'day') {
                        dateKey = pDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
                    } else {
                        const monthKey = pDate.toLocaleDateString('es-ES', { month: 'long' });
                        dateKey = monthKey.charAt(0).toUpperCase() + monthKey.slice(1);
                    }

                    // A veces puede haber descuadre de zona horaria si cae en día previo al límite.
                    // Si el contenedor no existe en chartMap, lo ignoramos o lo añadimos (lo ignoramos por pulcritud de UI).
                    if (chartMap[dateKey]) {
                        if (profile.role === 'caregiver') chartMap[dateKey].Cuidadores += 1;
                        if (profile.role === 'family') chartMap[dateKey].Familias += 1;
                    }
                });
            }

            setActivityData(Object.values(chartMap));

            setStats({
                totalFamilies: totalFamilies || 0,
                visibleFamilies: visibleFamilies || 0,
                totalCaregivers: totalCaregivers || 0,
                visibleCaregivers: visibleCaregivers || 0,
                totalAppointments: apptCount || 0,
                activeSubs: subCount || 0,
                activeSubsFamilies: activeSubsFamilies || 0,
                activeSubsCaregivers: activeSubsCaregivers || 0
            });
        } catch (error) {
            console.error("Error fetching admin stats:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchInteractionStats = async () => {
        setLoadingInteraction(true);
        try {
            const dateRange = new Date();
            let grouping = 'day';

            switch (interactionTimeRange) {
                case '14d':
                    dateRange.setDate(dateRange.getDate() - 13);
                    break;
                case '28d':
                    dateRange.setDate(dateRange.getDate() - 27);
                    break;
                case '3m':
                    dateRange.setMonth(dateRange.getMonth() - 2);
                    dateRange.setDate(1); 
                    grouping = 'month';
                    break;
                case '7d':
                default:
                    dateRange.setDate(dateRange.getDate() - 6);
                    break;
            }
            dateRange.setHours(0, 0, 0, 0);

            // Fetch Citas Agendadas
            const { data: appointmentsRow } = await supabase
                .from('appointments')
                .select('created_at')
                .gte('created_at', dateRange.toISOString());

            // Fetch Mensajes Escritos
            const { data: messagesRow } = await supabase
                .from('messages')
                .select('created_at')
                .gte('created_at', dateRange.toISOString());

            // Procesar datos
            const chartMap = {};

            if (grouping === 'day') {
                const daysToGenerate = interactionTimeRange === '28d' ? 27 : interactionTimeRange === '14d' ? 13 : 6;
                for (let i = daysToGenerate; i >= 0; i--) {
                    const d = new Date();
                    d.setDate(d.getDate() - i);
                    const dateKey = d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
                    chartMap[dateKey] = { name: dateKey, Mensajes: 0, Citas: 0 };
                }
            } else {
                const monthsToGenerate = 3;
                for (let i = monthsToGenerate - 1; i >= 0; i--) {
                    const d = new Date();
                    d.setMonth(d.getMonth() - i);
                    const monthKey = d.toLocaleDateString('es-ES', { month: 'long' });
                    const dateKey = monthKey.charAt(0).toUpperCase() + monthKey.slice(1);
                    chartMap[dateKey] = { name: dateKey, Mensajes: 0, Citas: 0 };
                }
            }

            const processRows = (rows, entityKey) => {
                if (!rows) return;
                rows.forEach(row => {
                    const rDate = new Date(row.created_at);
                    let dateKey;
                    if (grouping === 'day') {
                        dateKey = rDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
                    } else {
                        const monthKey = rDate.toLocaleDateString('es-ES', { month: 'long' });
                        dateKey = monthKey.charAt(0).toUpperCase() + monthKey.slice(1);
                    }

                    if (chartMap[dateKey]) {
                        chartMap[dateKey][entityKey] += 1;
                    }
                });
            };

            processRows(messagesRow, 'Mensajes');
            processRows(appointmentsRow, 'Citas');

            setInteractionData(Object.values(chartMap));
        } catch (error) {
            console.error("Error fetching interaction stats:", error);
        } finally {
            setLoadingInteraction(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <StatCard
                    title="Cuidadores Visibles"
                    value={stats.visibleCaregivers}
                    subtext={`De un total de ${stats.totalCaregivers} registros`}
                    icon={Users}
                    color="text-blue-600 bg-blue-100"
                />
                <StatCard
                    title="Familias Visibles"
                    value={stats.visibleFamilies}
                    subtext={`De un total de ${stats.totalFamilies} registros`}
                    icon={Users}
                    color="text-orange-600 bg-orange-100"
                />
                <StatCard
                    title="Suscripciones"
                    value={stats.activeSubs}
                    subtext={`${stats.activeSubsCaregivers} Cuidadores / ${stats.activeSubsFamilies} Familias`}
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
                    title="Total de Usuarios"
                    value={stats.totalCaregivers + stats.totalFamilies}
                    subtext="Registrados globalmente"
                    icon={Activity}
                    color="text-pink-600 bg-pink-100"
                />
            </div>

            {/* Quick Actions / Recent */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-6 rounded-[16px] shadow-sm border border-gray-100 flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-lg text-gray-800">Crecimiento de Plataforma</h3>
                        <div className="flex items-center space-x-3">
                            <div className="hidden sm:flex bg-gray-100 p-1 rounded-lg">
                                <button
                                    onClick={() => setChartType('bar')}
                                    className={`px-3 py-1.5 text-xs rounded-md transition-colors ${chartType === 'bar' ? 'bg-white shadow-sm text-gray-800 font-bold' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Barras
                                </button>
                                <button
                                    onClick={() => setChartType('line')}
                                    className={`px-3 py-1.5 text-xs rounded-md transition-colors ${chartType === 'line' ? 'bg-white shadow-sm text-gray-800 font-bold' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Líneas
                                </button>
                            </div>
                            <select
                                value={timeRange}
                                onChange={(e) => setTimeRange(e.target.value)}
                                className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 cursor-pointer outline-none"
                                disabled={loading}
                            >
                                <option value="7d">Últimos 7 días</option>
                                <option value="14d">Últimos 14 días</option>
                                <option value="28d">Últimos 28 días</option>
                                <option value="3m">Últimos 3 meses</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex-1 min-h-[250px] w-full">
                        {loading ? (
                            <div className="flex h-full items-center justify-center">
                                <span className="loader"></span>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                {chartType === 'bar' ? (
                                    <BarChart
                                        data={activityData}
                                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} allowDecimals={false} />
                                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                        <Legend iconType="circle" wrapperStyle={{ fontSize: '13px' }} />
                                        <Bar dataKey="Familias" stackId="a" fill="#1e3a8a" radius={[0, 0, 4, 4]} />
                                        <Bar dataKey="Cuidadores" stackId="a" fill="#ea580c" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                ) : (
                                    <LineChart
                                        data={activityData}
                                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} allowDecimals={false} />
                                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                        <Legend iconType="circle" wrapperStyle={{ fontSize: '13px' }} />
                                        <Line type="monotone" dataKey="Familias" stroke="#1e3a8a" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                        <Line type="monotone" dataKey="Cuidadores" stroke="#ea580c" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                    </LineChart>
                                )}
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Interactividad Chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-[16px] shadow-sm border border-gray-100 flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-lg text-gray-800">Interactividad: Mensajes vs Citas</h3>
                        <div className="flex items-center space-x-3">
                            <div className="hidden sm:flex bg-gray-100 p-1 rounded-lg">
                                <button
                                    onClick={() => setInteractionChartType('bar')}
                                    className={`px-3 py-1.5 text-xs rounded-md transition-colors ${interactionChartType === 'bar' ? 'bg-white shadow-sm text-gray-800 font-bold' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Barras
                                </button>
                                <button
                                    onClick={() => setInteractionChartType('line')}
                                    className={`px-3 py-1.5 text-xs rounded-md transition-colors ${interactionChartType === 'line' ? 'bg-white shadow-sm text-gray-800 font-bold' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Líneas
                                </button>
                            </div>
                            <select
                                value={interactionTimeRange}
                                onChange={(e) => setInteractionTimeRange(e.target.value)}
                                className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 cursor-pointer outline-none"
                                disabled={loadingInteraction}
                            >
                                <option value="7d">Últimos 7 días</option>
                                <option value="14d">Últimos 14 días</option>
                                <option value="28d">Últimos 28 días</option>
                                <option value="3m">Últimos 3 meses</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex-1 min-h-[250px] w-full">
                        {loadingInteraction ? (
                            <div className="flex h-full items-center justify-center">
                                <span className="loader"></span>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                {interactionChartType === 'bar' ? (
                                    <BarChart
                                        data={interactionData}
                                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} allowDecimals={false} />
                                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                        <Legend iconType="circle" wrapperStyle={{ fontSize: '13px' }} />
                                        <Bar dataKey="Mensajes" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} />
                                        <Bar dataKey="Citas" stackId="a" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                ) : (
                                    <LineChart
                                        data={interactionData}
                                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} allowDecimals={false} />
                                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                        <Legend iconType="circle" wrapperStyle={{ fontSize: '13px' }} />
                                        <Line type="monotone" dataKey="Mensajes" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                        <Line type="monotone" dataKey="Citas" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                    </LineChart>
                                )}
                            </ResponsiveContainer>
                        )}
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
