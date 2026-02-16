import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ntxxknufezprbibzpftf.supabase.co';
const supabaseKey = 'sb_publishable_V5D-ZgsTgoDcqQBEbZ4lQA_Dcfz2wY-';
const supabase = createClient(supabaseUrl, supabaseKey);

async function deepInspectService10() {
    console.log("--- INSPECCIÓN PROFUNDA SERVICIO 10 ---");

    // 1. Get Appointment details
    const { data: app, error: appErr } = await supabase
        .from('appointments')
        .select('*')
        .eq('id', '78508922-29fc-4632-9cb1-9759ff539958') // Servicio 10
        .single();

    if (appErr) {
        console.error("Error Appointment:", appErr);
    } else {
        console.log("\n- TÍTULO:", app.title);
        console.log("- TIPO:", app.type);
        console.log("- CARE_AGENDA (Raw):", JSON.stringify(app.care_agenda, null, 2));
        console.log("- DETAILS:", app.details);
    }

    // 2. Get Care Logs for this appointment
    const { data: logs, error: logsErr } = await supabase
        .from('care_logs')
        .select('*')
        .eq('appointment_id', '78508922-29fc-4632-9cb1-9759ff539958')
        .order('created_at', { ascending: true });

    if (logsErr) {
        console.error("Error Logs:", logsErr);
    } else {
        console.log(`\n- LOGS ENCONTRADOS: ${logs.length}`);
        logs.forEach(l => {
            console.log(`  [${l.created_at}] CATEGORY: ${l.category} | ACTION: "${l.action}" | STATUS: ${l.status}`);
        });
    }

    // 3. Inspect care_program_templates for one of the programs found in agenda if possible
    console.log("\n--- ESTRUCTURA DE PLANTILLAS (Muestra) ---");
    const { data: templates, error: tempErr } = await supabase
        .from('care_program_templates')
        .select('*, care_programs(name)')
        .limit(10);

    if (tempErr) {
        console.error("Error Templates:", tempErr);
    } else {
        templates.forEach(t => {
            console.log(`  PROGRAM: ${t.care_programs?.name} | CAT: ${t.category} | ACTIVITY: ${t.activity_name}`);
        });
    }
}

deepInspectService10();
