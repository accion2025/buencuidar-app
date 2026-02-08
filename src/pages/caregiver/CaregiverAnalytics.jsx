
import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import {
    DollarSign,
    Clock,
    Calendar,
    BarChart2,
    Activity,
    Lock,
    ShieldCheck,
    TrendingUp,
    FileText,
    Download
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
// import { Bar, Line, Doughnut } from 'react-chartjs-2'; // Assuming chartjs is installed or we use simple CSS bars if not. 
// Given the complexity of adding chartjs without ensuring it's in package.json, I will build simple CSS charts first to ensure stability.

const CaregiverAnalytics = () => {
    const { user, profile, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('year'); // 'month', 'year', 'all'
    const [stats, setStats] = useState({
        totalEarnings: 0,
        totalHours: 0,
        avgHourlyRate: 0,
        monthlyEarnings: [],
        monthlyHours: []
    });
    const [payments, setPayments] = useState([]);

    // Protection: Only Premium users can access Analytics
    const isPremium = profile?.plan_type === 'premium' || profile?.plan_type === 'professional_pro';

    useEffect(() => {
        if (user && isPremium) fetchAnalytics();
        else if (user && !isPremium) setLoading(false);
    }, [user, timeRange, isPremium]);

    if (authLoading) return null;

    if (!isPremium) {
        return (
            <div className="flex-grow flex items-center justify-center py-20 px-4">
                <div className="max-w-3xl w-full card !p-0 overflow-hidden shadow-2xl border-none animate-fade-in-up">
                    <div className="bg-[var(--primary-color)] p-12 text-center relative flex flex-col items-center justify-center">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--secondary-color)] rounded-full -translate-y-1/2 translate-x-1/2 blur-[100px] opacity-20"></div>
                        <div className="bg-white/10 w-24 h-24 rounded-[16px] flex items-center justify-center backdrop-blur-md border border-white/20 mb-8 shadow-2xl">
                            <Lock size={48} className="text-[var(--accent-color)]" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-brand font-bold !text-white tracking-tight mb-4 drop-shadow-sm">Acceso Restringido a BC PRO</h1>
                        <p className="text-[var(--accent-color)] text-lg leading-relaxed max-w-xl mx-auto opacity-90 font-secondary text-center">
                            La sección de análisis avanzado y reportes financieros es una función exclusiva para profesionales con una suscripción <span
                                onClick={() => navigate('/caregiver/plans')}
                                className="text-white font-black cursor-pointer hover:underline decoration-2 underline-offset-4 transition-all"
                            >BC PRO Premium</span> activa.
                        </p>
                    </div>

                    <div className="p-12 bg-white flex flex-col items-center text-center">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10 w-full max-w-lg mx-auto">
                            {[
                                { icon: FileText, text: "Reportes PDF" },
                                { icon: Activity, text: "Eficiencia $/h" }
                            ].map((item, i) => (
                                <div key={i} className="flex flex-col items-center gap-2">
                                    <div className="w-12 h-12 rounded-[16px] bg-[var(--base-bg)] text-[var(--secondary-color)] flex items-center justify-center shadow-inner">
                                        <item.icon size={24} />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-[var(--primary-color)]">{item.text}</span>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={() => navigate('/caregiver/plans')}
                            className="btn btn-secondary px-12 py-6 text-xl shadow-2xl shadow-green-100 uppercase tracking-widest"
                        >
                            ACTIVA BC PRO AHORA
                        </button>

                        <p className="text-xs text-[var(--text-light)] mt-8 font-secondary">
                            ¿Ya crees que tienes el nivel PRO? Contacta a soporte si crees que esto es un error.
                        </p>
                    </div>
                </div>
            </div>
        );
    }
    // fetchAnalytics called via consolidated useEffect above

    const fetchAnalytics = async () => {
        try {
            setLoading(true);

            // Fetch all COMPLETED/PAID appointments
            const { data: apps, error } = await supabase
                .from('appointments')
                .select(`
                    payment_amount, 
                    offered_rate,
                    address,
                    client:client_id (full_name),
                    patient:patient_id (full_name)
                `)
                .eq('caregiver_id', user.id)
                .or('status.eq.completed,status.eq.paid')
                .order('date', { ascending: false });

            if (error) throw error;

            let totalEarn = 0;
            let totalHr = 0;
            const monthsMap = {};

            const processedPayments = (apps || []).map(app => {
                // Logic: STRICTLY use payment_amount ONLY if status is 'paid'.
                // If not paid, earnings are 0 (do not use offered_rate).
                const amount = app.payment_status === 'paid' && app.payment_amount
                    ? parseFloat(app.payment_amount)
                    : 0;

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
        const doc = new jsPDF();

        // Header
        doc.setFontSize(22);
        doc.setTextColor(15, 60, 76); // #0F3C4C
        doc.text("BuenCuidar - Reporte de Ingresos", 14, 22);

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Cuidador: ${profile?.full_name || user?.email}`, 14, 30);
        doc.text(`Fecha de emisión: ${new Date().toLocaleDateString()}`, 14, 35);

        // Stats Box
        doc.setDrawColor(240);
        doc.setFillColor(249, 250, 251);
        doc.roundedRect(14, 45, 182, 25, 3, 3, 'FD');

        doc.setFontSize(11);
        doc.setTextColor(15, 60, 76);
        doc.text("Resumen de Actividad", 20, 52);

        doc.setFontSize(9);
        doc.setTextColor(80);
        doc.text(`Ganancias Totales: $${stats.totalEarnings.toLocaleString()}`, 20, 60);
        doc.text(`Total Horas: ${stats.totalHours.toFixed(1)}h`, 80, 60);
        doc.text(`Promedio $/hora: $${stats.avgHourlyRate}/h`, 140, 60);

        // Table
        const tableData = payments.map(p => [
            p.date,
            p.client?.full_name || 'N/A',
            p.patient?.full_name || 'N/A',
            p.address || 'N/A',
            `${p.calculatedHours.toFixed(1)}h`,
            `$${p.calculatedAmount}`,
            p.payment_status === 'paid' ? 'PAGADO' : 'COMPLETADO'
        ]);

        autoTable(doc, {
            startY: 80,
            head: [['Fecha', 'Cliente', 'Familiar', 'Dirección', 'Horas', 'Total', 'Estado']],
            body: tableData,
            headStyles: { fillColor: [15, 60, 76], textColor: [250, 250, 247] }, // FAFAF7
            alternateRowStyles: { fillColor: [249, 250, 251] },
            margin: { top: 80 },
            styles: { font: "helvetica", fontSize: 8 }, // Smaller font to fit more columns
            columnStyles: {
                3: { cellWidth: 40 } // Give more width to Address
            }
        });

        // Footer
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(
                `Documento generado automáticamente por la plataforma BuenCuidar - Página ${i} de ${pageCount}`,
                doc.internal.pageSize.getWidth() / 2,
                doc.internal.pageSize.getHeight() - 10,
                { align: "center" }
            );
        }

        doc.save(`Reporte_BuenCuidar_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    // Helper for CSS Chart
    const getMax = (arr) => Math.max(...arr.map(i => i.value), 10);

    return (
        <div className="space-y-8 animate-fade-in pb-12">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-brand font-bold !text-[#0F3C4C] flex items-center gap-4">
                    <span className="p-3 bg-blue-50 text-[var(--primary-color)] rounded-[16px] shadow-inner"><TrendingUp size={32} /></span>
                    Reportes y Finanzas
                </h1>
                <p className="text-gray-500 font-secondary mt-3">Analiza tu rendimiento profesional y descarga comprobantes.</p>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-8 rounded-[16px] border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl transition-all group overflow-hidden relative">
                    <div className="flex justify-between items-start mb-6">
                        <div className="bg-[var(--secondary-color)] !text-[#FAFAF7] p-4 rounded-[16px] shadow-lg shadow-green-900/20 group-hover:scale-110 transition-transform">
                            <DollarSign size={28} />
                        </div>
                    </div>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mb-2">Ganancias Totales (Año)</p>
                    <h3 className="text-4xl font-brand font-bold text-[#0F3C4C] tracking-tight">${stats.totalEarnings.toLocaleString()}</h3>
                    <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-[var(--secondary-color)] rounded-full opacity-[0.03] group-hover:scale-150 transition-transform"></div>
                </div>

                <div className="bg-white p-8 rounded-[16px] border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl transition-all group overflow-hidden relative">
                    <div className="flex justify-between items-start mb-6">
                        <div className="bg-[var(--primary-color)] !text-[#FAFAF7] p-4 rounded-[16px] shadow-lg shadow-blue-900/20 group-hover:scale-110 transition-transform">
                            <Clock size={28} />
                        </div>
                    </div>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mb-2">Horas Trabajadas</p>
                    <h3 className="text-4xl font-brand font-bold text-[#0F3C4C] tracking-tight">{stats.totalHours.toFixed(1)}h</h3>
                    <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-[var(--primary-color)] rounded-full opacity-[0.03] group-hover:scale-150 transition-transform"></div>
                </div>

                <div className="bg-white p-8 rounded-[16px] border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl transition-all group overflow-hidden relative">
                    <div className="flex justify-between items-start mb-6">
                        <div className="bg-purple-600 !text-[#FAFAF7] p-4 rounded-[16px] shadow-lg shadow-purple-900/20 group-hover:scale-110 transition-transform">
                            <Activity size={28} />
                        </div>
                    </div>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mb-2">Eficiencia (Promedio $/h)</p>
                    <h3 className="text-4xl font-brand font-bold text-[#0F3C4C] tracking-tight">${stats.avgHourlyRate}/h</h3>
                    <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-purple-600 rounded-full opacity-[0.03] group-hover:scale-150 transition-transform"></div>
                </div>
            </div>



            {/* Detailed Table */}
            <div className="bg-white rounded-[16px] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
                <div className="p-8 border-b border-gray-50 flex justify-between items-center">
                    <h3 className="text-xl font-brand font-bold !text-[#0F3C4C]">Historial de Pagos</h3>
                    <button
                        onClick={generateReport}
                        className="flex items-center gap-2 bg-[var(--primary-color)] !text-[#FAFAF7] font-black text-[10px] uppercase tracking-widest px-6 py-3 rounded-[16px] hover:bg-[#1a5a70] transition-all shadow-xl shadow-blue-900/20"
                    >
                        <Download size={18} /> Descargar Reporte
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-gray-400 text-[10px] uppercase font-black tracking-widest">
                            <tr>
                                <th className="px-8 py-5">Fecha</th>
                                <th className="px-8 py-5">Cliente</th>
                                <th className="px-8 py-5">Familiar</th>
                                <th className="px-8 py-5 text-center">Horas</th>
                                <th className="px-8 py-5 text-center">$/Hora</th>
                                <th className="px-8 py-5 text-right">Total</th>
                                <th className="px-8 py-5 text-center">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {payments.map(pay => (
                                <tr key={pay.id} className="hover:bg-blue-50/50 transition-colors text-sm">
                                    <td className="px-6 py-4 font-medium text-gray-800">{pay.date}</td>
                                    <td className="px-6 py-4 text-gray-600">{pay.client?.full_name}</td>
                                    <td className="px-6 py-4 text-gray-500 font-bold">{pay.patient?.full_name || 'N/A'}</td>
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
