
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkColumnDetails() {
    console.log("--- Verificando Detalles de Columnas en 'profiles' ---");

    const sql = `
    SELECT 
        column_name, 
        is_nullable, 
        column_default,
        data_type
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles';
    `;

    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
        console.error("Error consultando esquema:", error);
    } else {
        console.table(data);
    }
}

checkColumnDetails();
