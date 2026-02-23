
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function searchInFunctions() {
    console.log("--- Buscando 'DATABASE ERROR' en funciones de la DB ---");

    // Intentamos usar una consulta que no necesite exec_sql directamente si podemos
    // Pero en Supabase sin exec_sql es difícil.
    // Vamos a intentar listar las funciones y leerlas una por una si es posible vía RPC genérico.

    const sql = `
    SELECT proname, prosrc 
    FROM pg_proc 
    JOIN pg_namespace n ON n.oid = pronamespace 
    WHERE n.nspname = 'public' 
    AND prosrc ILIKE '%SAVING NEW USER%';
    `;

    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
        console.log("RPC 'exec_sql' no disponible. Probando estrategia de inserción controlada...");

        // Estrategia: Intentar insertar con datos que sabemos que podrían fallar
        const { error: insertError } = await supabase.from('profiles').insert({
            id: '00000000-0000-0000-0000-000000000011',
            email: 'test_error@example.com',
            full_name: 'Trigger Test',
            role: 'family'
            // NO enviamos trial_expiry_date ni phone para ver si el trigger falla con ese mensaje
        });

        if (insertError) {
            console.log("Error interceptado:", insertError.message);
            console.log("Detalle:", insertError.details);
            console.log("Hint:", insertError.hint);
            console.log("Código:", insertError.code);
        } else {
            console.log("Inserción exitosa (el trigger no falló con estos datos).");
            await supabase.from('profiles').delete().eq('email', 'test_error@example.com');
        }
    } else {
        console.log("Funciones encontradas:", data);
    }
}

searchInFunctions();
