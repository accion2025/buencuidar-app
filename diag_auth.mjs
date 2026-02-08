
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ntxxknufezprbibzpftf.supabase.co';
const supabaseKey = 'sb_publishable_V5D-ZgsTgoDcqQBEbZ4lQA_Dcfz2wY-';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log("--- DIAGNÓSTICO AUTENTICADO (Rol: Cuidador) ---");

    // 1. Login como el usuario Carlos Benitez (que vimos en el pantallazo)
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: 'carlosbenitez-pro@outlook.com',
        password: 'password123' // Contraseña estándar usada en pruebas anteriores
    });

    if (authError) {
        console.error("ERROR AUTH:", authError.message);
        return;
    }

    console.log("Login Exitoso. User ID:", authData.user.id);

    // 2. Intentar leer citas
    const { data, error } = await supabase
        .from('appointments')
        .select('id, title, status, date, time')
        .limit(10);

    if (error) {
        console.error("ERROR LECTURA:", error.message);
    } else {
        console.log("CITAS VISIBLES:", data.length);
        console.log(JSON.stringify(data, null, 2));
    }
}

run();
