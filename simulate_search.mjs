
import { createClient } from '@supabase/supabase-js';

const url = 'https://ntxxknufezprbibzpftf.supabase.co';
const key = 'sb_publishable_V5D-ZgsTgoDcqQBEbZ4lQA_Dcfz2wY-';
const supabase = createClient(url, key);

async function run() {
    console.log("--- SIMULACIÓN DE BOLSA DE TRABAJO (ANON KEY) ---");

    const today = new Date().toLocaleDateString('en-CA');
    console.log("📅 Fecha de hoy:", today);

    // Intentamos la consulta EXACTA de JobBoard.jsx
    // Nota: Como es anon key, si RLS requiere auth, esto devolverá 0.
    // Pero nos sirve para ver si hay error de conexión.
    const { data: jobs, error } = await supabase
        .from('appointments')
        .select('id, title, date, status, caregiver_id')
        .eq('status', 'pending')
        .is('caregiver_id', null)
        .gte('date', today);

    if (error) {
        console.error("❌ ERROR QUERY:", error.message);
    } else {
        console.log(`✅ QUERY OK. Encontrados: ${jobs?.length || 0}`);
        if (jobs && jobs.length > 0) {
            console.log(JSON.stringify(jobs, null, 2));
        } else {
            console.log("⚠️ 0 resultados. Posibles causas:");
            console.log("   1. RLS bloquea acceso anónimo (Correcto, se necesita login).");
            console.log("   2. No hay citas 'pending' sin cuidador desde hoy.");
        }
    }
}
run();
