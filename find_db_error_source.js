
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function findErrorSource() {
    console.log("--- Buscando 'DATABASE ERROR' en el código de la DB ---");

    const sql = `
    SELECT 
        proname as function_name, 
        prosrc as source_code 
    FROM pg_proc 
    WHERE prosrc ILIKE '%DATABASE ERROR%'
    OR prosrc ILIKE '%SAVING NEW USER%';
    `;

    // Intentamos descubrir si existe un RPC que permita ejecutar SQL de inspección
    // A veces se llama 'exec_sql', 'query', 'run_sql'.
    // Si no, tendremos que pedir al usuario que lo corra.

    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
        console.log("No se pudo ejecutar la búsqueda automática (RPC exec_sql no disponible).");
        console.log("Por favor, ejecuta esta consulta manualmente en el SQL Editor de Supabase:");
        console.log(sql);
    } else {
        if (data && data.length > 0) {
            console.log("✅ RESULTADOS ENCONTRADOS:");
            data.forEach(fn => {
                console.log(`\n--- Función: ${fn.function_name} ---`);
                console.log(fn.source_code);
            });
        } else {
            console.log("No se encontraron funciones con ese texto.");
        }
    }
}

findErrorSource();
