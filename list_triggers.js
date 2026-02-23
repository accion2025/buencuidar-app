
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function listTriggers() {
    console.log("--- Listando Disparadores (Triggers) ---");

    const sql = `
    SELECT 
        event_object_table as table_name,
        trigger_name,
        event_manipulation as event,
        action_statement as definition
    FROM information_schema.triggers
    WHERE event_object_table IN ('profiles', 'users');
    `;

    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
        console.error("Error consultando triggers:", error);
    } else {
        console.table(data);
    }
}

listTriggers();
