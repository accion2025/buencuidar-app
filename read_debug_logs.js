
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkDebugLogs() {
    console.log("--- Consultando Debug Logs ---");

    const { data, error } = await supabase
        .from('debug_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error("❌ ERROR AL LEER LOGS:", error.message);
    } else {
        if (data.length === 0) {
            console.log("No hay logs registrados aún. ¿Has ejecutado el registro?");
        } else {
            data.forEach(log => {
                console.log(`[${log.created_at}] ${log.event_name}:`);
                console.dir(log.payload, { depth: null });
                console.log("-".repeat(40));
            });
        }
    }
}

checkDebugLogs();
