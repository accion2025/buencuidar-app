
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function listColumns() {
    console.log("--- Listando Columnas de 'profiles' ---");

    const { data, error } = await supabase.from('profiles').select('*').limit(1);

    if (error) {
        console.error("❌ ERROR AL LEER TABLA:", error.message);
        console.error("Detalle:", error.details);
    } else {
        if (data.length === 0) {
            console.log("La tabla está vacía. No se pueden determinar las columnas mediante SELECT *.");
        } else {
            console.log("✅ COLUMNAS ENCONTRADAS:");
            console.log(Object.keys(data[0]));
        }
    }
}

listColumns();
