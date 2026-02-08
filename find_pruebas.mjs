
import { createClient } from '@supabase/supabase-js';

const url = 'https://ntxxknufezprbibzpftf.supabase.co';
const key = 'sb_publishable_V5D-ZgsTgoDcqQBEbZ4lQA_Dcfz2wY-';
const supabase = createClient(url, key);

async function run() {
    console.log("--- BÚSQUEDA ESPECÍFICA 'PRUEBA' (ANON KEY) ---");

    // Buscamos cualquier cosa que diga PRUEBA, sin importar fecha
    const { data: jobs, error } = await supabase
        .from('appointments')
        .select('id, title, date, status, caregiver_id')
        .ilike('title', '%PRUEBA%');

    if (error) {
        console.error("❌ ERROR QUERY:", error.message);
    } else {
        console.log(`✅ QUERY OK. Encontrados: ${jobs?.length || 0}`);
        if (jobs && jobs.length > 0) {
            console.log(JSON.stringify(jobs, null, 2));
        } else {
            console.log("⚠️ 0 resultados. Esto confirma que RLS está activo y bloquea acceso anónimo.");
            console.log("   (O bien, no existen citas con 'PRUEBA' en la DB 'ntxx')");
        }
    }
}
run();
