import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://ntxxknufezprbibzpftf.supabase.co';
const supabaseKey = 'sb_publishable_V5D-ZgsTgoDcqQBEbZ4lQA_Dcfz2wY-';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    // 1. Encontrar la primera cita del Servicio 10
    const { data: apps, error: appError } = await supabase
        .from('appointments')
        .select('*')
        .ilike('title', '%Servicio 10%')
        .order('date', { ascending: true })
        .order('time', { ascending: true })
        .limit(1);

    if (appError) {
        console.error(appError);
        return;
    }

    if (!apps || apps.length === 0) {
        console.log("No se encontró el Servicio 10");
        return;
    }

    const firstApp = apps[0];
    console.log(`Primera cita encontrada: ${firstApp.date} ${firstApp.time} (ID: ${firstApp.id})`);

    // 2. Obtener los logs de esa cita
    const { data: logs, error: logError } = await supabase
        .from('care_logs')
        .select('*')
        .eq('appointment_id', firstApp.id)
        .order('created_at', { ascending: true });

    if (logError) {
        console.error(logError);
    }

    const result = {
        appointment: firstApp,
        logs: logs || []
    };

    fs.writeFileSync('s10_first_day_full.json', JSON.stringify(result, null, 2));
    console.log("Datos guardados en s10_first_day_full.json");
}

run();
