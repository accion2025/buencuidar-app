import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkSchema() {
    console.log("--- Consultando columnas de appointments ---");
    // Usamos una consulta vía RPC si existe o inferimos por datos
    const { data: cols, error: colError } = await supabase.from('appointments').select('*').limit(1);

    if (colError) {
        console.error("Error:", colError);
        return;
    }

    console.log("Columnas disponibles:", Object.keys(cols[0]));

    // Si podemos, intentamos ver si el campo se pone en false al actualizar
    console.log("\n--- Probando comportamiento de actualización ---");
    // NO actualizaremos datos reales para no romper nada, pero buscaremos si hay indicios.
}

checkSchema();
