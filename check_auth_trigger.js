
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkTriggerExists() {
    console.log("--- Verificando Trigger en auth.users ---");

    const sql = `
    SELECT trigger_name, event_manipulation, event_object_table, action_statement
    FROM information_schema.triggers
    WHERE event_object_schema = 'auth' AND event_object_table = 'users';
    `;

    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
        console.log("No se pudo verificar vía exec_sql. Intentando alternativa...");
        // Si no hay RPC, probamos a ver si podemos leer los logs de nuevo quitando el RAISE en el SQL
    } else {
        console.table(data);
    }
}

checkTriggerExists();
