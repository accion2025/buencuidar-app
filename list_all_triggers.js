
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function listAllTriggers() {
    console.log("--- Listando Todos los Triggers de la DB ---");

    const sql = `
    SELECT 
        event_object_table as table_name, 
        trigger_name, 
        action_statement as definition,
        event_manipulation as event,
        action_timing as timing
    FROM information_schema.triggers
    WHERE trigger_schema = 'public'
    ORDER BY table_name, trigger_name;
    `;

    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
        console.log("No se pudo listar los triggers vía exec_sql. Intentando búsqueda controlada en archivos locales...");
    } else {
        console.table(data);
    }
}

listAllTriggers();
