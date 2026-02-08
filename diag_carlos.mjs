
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ntxxknufezprbibzpftf.supabase.co';
const supabaseKey = 'sb_publishable_V5D-ZgsTgoDcqQBEbZ4lQA_Dcfz2wY-';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log("--- DIAGNÓSTICO AUTENTICADO (CARLOS) ---");

    // Login como Carlos Benitez (Visto en el pantallazo)
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: 'carlosbenitez-pro@outlook.com',
        password: 'password123'
    });

    if (authError) {
        console.error("ERROR AUTH:", authError.message);
        return;
    }

    console.log("LOGIN EXITOSO. ID:", authData.user.id);

    // 1. Ver todas las citas sin filtros
    const { data: allJobs, error: allError } = await supabase
        .from('appointments')
        .select('id, title, status, caregiver_id, date');

    if (allError) {
        console.error("ERROR LECTURA GLOBAL:", allError.message);
    } else {
        console.log("CITAS TOTALES EN TABLA:", allJobs?.length || 0);
        if (allJobs?.length > 0) {
            console.log("MUESTRA:", JSON.stringify(allJobs.slice(0, 3), null, 2));
        }
    }

    // 2. Simular filtro de la Bolsa de Trabajo
    const now = new Date();
    const todayStr = now.toLocaleDateString('en-CA');
    const { data: boardJobs, error: boardError } = await supabase
        .from('appointments')
        .select('id, title, status')
        .eq('status', 'pending')
        .is('caregiver_id', null)
        .gte('date', todayStr);

    if (boardError) {
        console.error("ERROR BOLSA:", boardError.message);
    } else {
        console.log("CITAS EN BOLSA (PENDING + UNASSIGNED):", boardJobs?.length || 0);
    }
}

run();
