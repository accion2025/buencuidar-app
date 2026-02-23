
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function listSubColumns() {
    console.log("--- Listando Columnas de 'subscriptions' ---");

    const { data, error } = await supabase.from('subscriptions').select('*').limit(1);

    if (error) {
        console.error("❌ ERROR AL LEER TABLA:", error.message);
        console.error("Detalle:", error.details);
    } else {
        console.log("✅ COLUMNAS ENCONTRADAS:");
        console.log(Object.keys(data[0] || {}));
    }
}

listSubColumns();
