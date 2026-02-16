import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase'; // Correct path
import { Loader2, CheckCircle, AlertTriangle } from 'lucide-react';

export default function CleanupData() {
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [total, setTotal] = useState(0);
    const [updated, setUpdated] = useState(0);
    const [logs, setLogs] = useState([]);
    const [finished, setFinished] = useState(false);

    const startCleanup = async () => {
        setLoading(true);
        setLogs(prev => [...prev, 'Starting cleanup...']);

        try {
            // 1. Fetch all appointments for current user (RLS handles filtering)
            const { data: appointments, error } = await supabase
                .from('appointments')
                .select('id, title, time');

            if (error) throw error;

            const toUpdate = appointments.filter(app => {
                // Check if title starts with HH:MM or HH:MM:SS
                return /^\d{2}:\d{2}(:\d{2})?\s*-\s*/.test(app.title);
            });

            setTotal(toUpdate.length);
            setLogs(prev => [...prev, `Found ${appointments.length} appointments, ${toUpdate.length} need repair.`]);

            if (toUpdate.length === 0) {
                setFinished(true);
                setLoading(false);
                return;
            }

            // 2. Update sequentially or in batches
            let count = 0;
            for (const app of toUpdate) {
                const newTitle = app.title.replace(/^\d{2}:\d{2}(:\d{2})?\s*-\s*/, '');

                const { error: updateError } = await supabase
                    .from('appointments')
                    .update({ title: newTitle })
                    .eq('id', app.id);

                if (updateError) {
                    setLogs(prev => [...prev, `Error updating ${app.id}: ${updateError.message}`]);
                } else {
                    count++;
                    setUpdated(count);
                    setProgress(Math.round((count / toUpdate.length) * 100));
                }
            }

            setLogs(prev => [...prev, 'Cleanup finished successfully.']);
            setFinished(true);

        } catch (err) {
            console.error(err);
            setLogs(prev => [...prev, `Critical Error: ${err.message}`]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Reparación de Datos de Calendario</h1>
            <p className="mb-4 text-gray-600">
                Esta herramienta eliminará la hora duplicada de los títulos de las citas existentes
                para corregir la visualización en el calendario.
            </p>

            {!loading && !finished && (
                <button
                    onClick={startCleanup}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition flex items-center gap-2"
                >
                    Iniciar Reparación
                </button>
            )}

            {loading && (
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-blue-600">
                        <Loader2 className="animate-spin" />
                        <span>Procesando... {progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                    </div>
                    <p className="text-sm text-gray-500">Actualizado {updated} de {total}</p>
                </div>
            )}

            {finished && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded text-green-800 flex items-center gap-2">
                    <CheckCircle />
                    <div>
                        <p className="font-bold">Proceso completado</p>
                        <p>Se actualizaron {updated} citas.</p>
                    </div>
                </div>
            )}

            <div className="mt-6 p-4 bg-gray-100 rounded h-64 overflow-y-auto text-xs font-mono">
                {logs.map((log, i) => (
                    <div key={i}>{log}</div>
                ))}
            </div>
        </div>
    );
}
