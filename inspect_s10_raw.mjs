import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ntxxknufezprbibzpftf.supabase.co';
const supabaseKey = 'sb_publishable_V5D-ZgsTgoDcqQBEbZ4lQA_Dcfz2wY-';
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectServicio10Data() {
    console.log("Inspeccionando datos de 'Servicio 10' del 14/02/2026...");

    // 1. Get the appointment
    const { data: appointment, error: appError } = await supabase
        .from('appointments')
        .select('*')
        .eq('title', 'SERVICIO 10')
        .eq('date', '2026-02-14')
        .single();

    if (appError) {
        console.error("Error al buscar la cita:", appError);
        return;
    }

    console.log("\n--- DATOS DE LA CITA ---");
    console.log("ID:", appointment.id);
    console.log("Details:", appointment.details);
    console.log("Care Agenda (Parsed):", JSON.stringify(appointment.care_agenda, null, 2));

    // 2. Get the logs for this appointment
    const { data: logs, error: logsError } = await supabase
        .from('care_logs')
        .select('*')
        .eq('appointment_id', appointment.id);

    if (logsError) {
        console.error("Error al buscar los logs:", logsError);
        return;
    }

    console.log("\n--- REGISTROS EN CARE_LOGS ---");
    logs.forEach(log => {
        console.log(`- Acción: "${log.action}" | Categoría: "${log.category}" | Creado: ${log.created_at}`);
    });
}

inspectServicio10Data();
