
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ntxxknufezprbibzpftf.supabase.co';
const supabaseAnonKey = 'sb_publishable_V5D-ZgsTgoDcqQBEbZ4lQA_Dcfz2wY-';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyAddressColumn() {
    console.log("Verificando columna 'address' en appointments...");

    // Intentamos seleccionar la columna address
    const { data, error } = await supabase
        .from('appointments')
        .select('address')
        .limit(1);

    if (error) {
        console.error("❌ Error: La columna 'address' no parece existir.");
        console.error("Detalle:", error.message);
        console.log("\n⚠️  IMPORTANTE: Ejecuta el script 'add_address_to_appointments.sql' en Supabase.");
    } else {
        console.log("✅ Éxito: La columna 'address' existe.");
    }
}

verifyAddressColumn();
