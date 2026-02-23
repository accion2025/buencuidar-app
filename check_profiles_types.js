
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkTypes() {
    console.log("--- Inspeccionando Tipos de Datos de 'profiles' ---");

    const sql = `
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns 
    WHERE table_name = 'profiles'
    ORDER BY column_name;
    `;

    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
        console.log("RPC exec_sql no disponible.");
    } else {
        console.table(data);
    }
}

checkTypes();
