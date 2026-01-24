
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import {
    DollarSign,
    Clock,
    Calendar,
    TrendingUp,
    FileText,
    Download,
    ChevronDown,
    ChevronUp,
    BarChart2,
    Activity
} from 'lucide-react';
// import { Bar, Line, Doughnut } from 'react-chartjs-2'; // Assuming chartjs is installed or we use simple CSS bars if not. 
// Given the complexity of adding chartjs without ensuring it's in package.json, I will build simple CSS charts first to ensure stability.

const CaregiverAnalytics = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalEarnings: 0,
        totalHours: 0,
        avgHourlyRate: 0,
        monthlyEarnings: [],
        monthlyHours: []
    });
    const [payments, setPayments] = useState([]);
    const [timeRange, setTimeRange] = useState('year'); // 'month', 'year', 'all'

    useEffect(() => {
        if (user) fetchAnalytics();
    }, [user, timeRange]);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);

            // Fetch all COMPLETED/PAID appointments
            const { data: apps, error } = await supabase
                .from('appointments')
                .select(`
                    id, 
                    date, 
                    time, 
                    end_time, 
                    status, 
                    payment_status, 
                    payment_amount, 
                    offered_rate,
                    client:client_id (full_name)
                `)
                .eq('caregiver_id', user.id)
                .or('status.eq.completed,status.eq.paid')
                .order('date', { ascending: false });

            if (error) throw error;

            let totalEarn = 0;
            let totalHr = 0;
            const monthsMap = {};

            const processedPayments = (apps || []).map(app => {
                const amount = parseFloat(app.payment_amount || app.offered_rate || 0);

                // Calculate hours
                let hours = 0;
                if (app.time && app.end_time) {
                    const parseTime = (t) => {
                        const [h, m] = t.split(':').map(Number);
                        return h + (m / 60);
                    };
                    const start = parseTime(app.time);
                    const end = parseTime(app.end_time);
                    if (end > start) {
                        hours = end - start;
                    } else {
                        // Handle overnight shift (e.g. 23:00 to 06:00)
                        hours = (24 - start) + end;
                    }
                }

                // Aggregate totals
                totalEarn += amount;
                totalHr += hours;

                // Aggregate Monthly
                const dateObj = new Date(app.date);
                const monthKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM

                if (!monthsMap[monthKey]) {
                    monthsMap[monthKey] = { earnings: 0, hours: 0, count: 0 };
                }
                monthsMap[monthKey].earnings += amount;
                monthsMap[monthKey].hours += hours;
                monthsMap[monthKey].count += 1;

                return {
                    ...app,
                    calculatedAmount: amount,
                    calculatedHours: hours,
                    hourlyRate: hours > 0 ? (amount / hours).toFixed(2) : 0
                };
            });

            // Prepare Chart Data (Last 6 months)
            const sortedKeys = Object.keys(monthsMap).sort();
            const last6Months = sortedKeys.slice(-6);

            setStats({
                totalEarnings: totalEarn,
                totalHours: totalHr,
                avgHourlyRate: totalHr > 0 ? (totalEarn / totalHr).toFixed(2) : 0,
                monthlyEarnings: last6Months.map(k => ({ month: k, value: monthsMap[k].earnings })),
                monthlyHours: last6Months.map(k => ({ month: k, value: monthsMap[k].hours })),
                monthlyEfficiency: last6Months.map(k => ({
                    month: k,
                    value: monthsMap[k].hours > 0 ? (monthsMap[k].earnings / monthsMap[k].hours).toFixed(2) : 0
                }))
            });

            setPayments(processedPayments);

        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const generateReport = () => {
        // Mock PDF Generation
        const reportContent = `
            REPORTE FINANCIERO - BUENCUIDAR
            Cuidador: ${user.email}
            Fecha: ${new Date().toLocaleDateString()}
            -----------------------------------
            Ganancias Totales: $${stats.totalEarnings}
            Horas Totales: ${stats.totalHours.toFixed(1)}h
            Promedio $/Hora: $${stats.avgHourlyRate}
            -----------------------------------
            Detalle de Pagos:
            ${payments.map(p => `${p.date}: $${p.calculatedAmount} (${p.calculatedHours.toFixed(1)}h)`).join('\n')}
        `;

        // Create a blob and download trigger
        const blob = new Blob([reportContent], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Reporte_BuenCuidar_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    // Helper for CSS Chart
    const getMax = (arr) => Math.max(...arr.map(i => i.value), 10);

    return (
        <div className="space-y-8 animate-fade-in pb-12">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                    <TrendingUp className="text-blue-600" />
                    Reportes y Finanzas
                </h1>
                <p className="text-gray-500 mt-2">Analiza tu rendimiento y descarga tus comprobantes.</p>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="bg-green-100 p-3 rounded-xl text-green-600">
                            <DollarSign size={24} />
                        </div>
                    </div>
                    <p className="text-sm text-gray-500 font-medium">Ganancias Totales (Año)</p>
                    <h3 className="text-3xl font-bold text-gray-800">${stats.totalEarnings.toLocaleString()}</h3>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="bg-blue-100 p-3 rounded-xl text-blue-600">
                            <Clock size={24} />
                        </div>
                    </div>
                    <p className="text-sm text-gray-500 font-medium">Horas Trabajadas</p>
                    <h3 className="text-3xl font-bold text-gray-800">{stats.totalHours.toFixed(1)}h</h3>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="bg-purple-100 p-3 rounded-xl text-purple-600">
                            <Activity size={24} />
                        </div>
                    </div>
                    <p className="text-sm text-gray-500 font-medium">Eficiencia (Promedio $/h)</p>
                    <h3 className="text-3xl font-bold text-gray-800">${stats.avgHourlyRate}/h</h3>
                </div>
            </div>

            {/* Charts Section */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-gray-800">Tendencias Mensuales</h3>
                    <div className="flex gap-2">
                        <button className="text-sm bg-gray-100 px-3 py-1 rounded-lg text-gray-600 font-medium">Ganancias</button>
                        <button className="text-sm px-3 py-1 rounded-lg text-gray-400 font-medium hover:bg-gray-50">Horas</button>
                    </div>
                </div>

                {/* Simple CSS Bar Chart for Earnings */}
                <div className="h-64 flex items-end justify-between gap-4 pt-10 px-4">
                    {stats.monthlyEarnings.map((item, idx) => (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                            <div className="text-xs font-bold text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity absolute -mt-6">
                                ${item.value}
                            </div>
                            <div
                                className="w-full bg-blue-500 rounded-t-lg transition-all duration-500 hover:bg-blue-600 relative"
                                style={{ height: `${(item.value / getMax(stats.monthlyEarnings)) * 100}%` }}
                            >
                            </div>
                            <span className="text-xs text-gray-400 font-medium">{item.month.split('-')[1]}</span>
                        </div>
                    ))}
                    {stats.monthlyEarnings.length === 0 && (
                        <div className="w-full text-center text-gray-400 italic">No hay datos suficientes para graficar.</div>
                    )}
                </div>
            </div>

            {/* Detailed Table */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-800">Historial de Pagos</h3>
                    <button
                        onClick={generateReport}
                        className="flex items-center gap-2 text-blue-600 font-bold text-sm bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl transition-colors"
                    >
                        <Download size={18} /> Descargar Reporte
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold">
                            <tr>
                                <th className="px-6 py-4">Fecha</th>
                                <th className="px-6 py-4">Cliente</th>
                                <th className="px-6 py-4">Servicio</th>
                                <th className="px-6 py-4 text-center">Horas</th>
                                <th className="px-6 py-4 text-center">$/Hora</th>
                                <th className="px-6 py-4 text-right">Total</th>
                                <th className="px-6 py-4 text-center">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {payments.map(pay => (
                                <tr key={pay.id} className="hover:bg-blue-50/50 transition-colors text-sm">
                                    <td className="px-6 py-4 font-medium text-gray-800">{pay.date}</td>
                                    <td className="px-6 py-4 text-gray-600">{pay.client?.full_name}</td>
                                    <td className="px-6 py-4 text-gray-500">Acompañamiento</td> {/* Simplification */}
                                    <td className="px-6 py-4 text-center font-mono">{pay.calculatedHours.toFixed(1)}h</td>
                                    <td className="px-6 py-4 text-center font-mono text-gray-400">${pay.hourlyRate}</td>
                                    <td className="px-6 py-4 text-right font-bold text-gray-800">${pay.calculatedAmount}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${pay.payment_status === 'paid'
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-blue-100 text-blue-700'
                                            }`}>
                                            {pay.payment_status === 'paid' ? 'PAGADO' : 'COMPLETADO'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {payments.length === 0 && (
                                <tr>
                                    <td colSpan="7" className="px-6 py-8 text-center text-gray-400 italic">
                                        No hay registros de pagos aún.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default CaregiverAnalytics;
