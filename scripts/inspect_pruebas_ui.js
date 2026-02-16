
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env');
let env = {};

try {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
        if (line && !line.startsWith('#')) {
            const [key, ...val] = line.split('=');
            if (key) env[key.trim()] = val.join('=').trim();
        }
    });
} catch (e) {
    console.error("Could not read .env file:", e);
}

const supabaseUrl = env.VITE_SUPABASE_URL;
// Usamos ANON KEY porque no tenemos service role, pero
// para este diagnóstico "privilegiado" usaremos un truco:
// Si falla con anon por RLS, confirmamos que RLS sigue molestando o que no hay datos.
// PERO, para saber si "existen" realmente, necesitaríamos access total.
// Como no lo tengo, voy a intentar hacer una query RPC o 
// asumir que si devuelve vacio es por RLS si estoy seguro que creé datos.
// Espera, el usuario dijo "no parecen las postulaciones enviadas".
// Asumo que existían antes o que él sabe que existen.
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectPruebas() {
    console.log('--- INSPECCIONANDO PRUEBAS 43, 44, 45 ---');

    const titles = ['%PRUEBA 43%', '%PRUEBA 44%', '%prueba 45%'];

    // 1. Buscar los appointments
    for (const titlePattern of titles) {
        const { data: appts, error } = await supabase
            .from('appointments')
            .select('id, title, status, client_id, caregiver_id')
            .ilike('title', titlePattern);

        if (error) {
            console.error(`Error buscando ${titlePattern}:`, error.message);
            continue;
        }

        if (!appts || appts.length === 0) {
            console.log(`No se encontró cita con título: ${titlePattern}`);
            continue;
        }

        console.log(`\nCita encontrada: ${appts[0].title} (ID: ${appts[0].id})`);
        console.log(`Status: ${appts[0].status}, Caregiver: ${appts[0].caregiver_id}`);

        // 2. Buscar postulaciones para esta cita
        // NOTA: Esto fallará o dará [] si RLS bloquea al anonimo.
        // Pero el diagnóstico es para ver qué devuelve.
        const { data: apps, error: appsError, count } = await supabase
            .from('job_applications')
            .select('*', { count: 'exact' })
            .eq('appointment_id', appts[0].id);

        if (appsError) {
            console.error(`  Error buscando apps:`, appsError.message);
        } else {
            console.log(`  Postulaciones encontradas (Vista Anonima): ${apps.length}`);
            if (apps.length > 0) console.table(apps);
            else console.log("  (Si sabes que existen, RLS las está ocultando a la API Anónima)");
        }
    }
}

inspectPruebas();
