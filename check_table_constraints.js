
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkConstraints() {
    console.log("--- Inspeccionando Restricciones de 'profiles' ---");

    const sql = `
    SELECT 
        column_name, 
        is_nullable, 
        column_default, 
        data_type 
    FROM information_schema.columns 
    WHERE table_name = 'profiles';
    `;

    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
        // Si no hay rpc, usamos una alternativa: intentar insertar una fila vacía y ver qué se queja.
        console.log("RPC exec_sql no disponible. Intentando inserción de prueba para provocar error de nulidad...");

        const { error: insertError } = await supabase.from('profiles').insert({});
        if (insertError) {
            console.log("Respuesta de la DB:", insertError.message);
            console.log("Código:", insertError.code);
            console.log("Detalle:", insertError.details);
        }
    } else {
        console.table(data);
    }
}

checkConstraints();
