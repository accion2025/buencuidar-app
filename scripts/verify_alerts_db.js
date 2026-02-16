
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function verify() {
    console.log("Verificando tabla emergency_alerts...");
    const { data, error, count } = await supabase
        .from('emergency_alerts')
        .select('*', { count: 'exact', head: true });

    if (error) {
        if (error.code === '42P01') {
            console.error("ERROR: La tabla 'emergency_alerts' NO existe.");
        } else {
            console.error("ERROR:", error.message);
        }
    } else {
        console.log("SUCESO: La tabla existe.");
        console.log("Total de registros:", count);
    }
}

verify();
