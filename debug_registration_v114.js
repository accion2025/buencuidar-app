
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function debugRegistration() {
    console.log("--- Depurando Registro (Simulación de Inserción en Profiles) ---");

    const testId = '00000000-0000-0000-0000-000000000000'; // ID ficticio para prueba
    const testEmail = 'debug_test@example.com';

    console.log(`Intentando insertar perfil de prueba con ID: ${testId}`);

    const { data, error } = await supabase
        .from('profiles')
        .insert({
            id: testId,
            email: testEmail,
            full_name: 'Debug User',
            role: 'family',
            trial_expiry_date: '22/03/2026' // Valor que sospechamos causa conflicto
        });

    if (error) {
        console.error("❌ ERROR DETECTADO:");
        console.error("Mensaje:", error.message);
        console.error("Detalle:", error.details);
        console.error("Código:", error.code);
        console.error("Hint:", error.hint);
    } else {
        console.log("✅ Inserción exitosa (curiosamente no falló aquí).");

        // Limpiar la prueba
        await supabase.from('profiles').delete().eq('id', testId);
    }
}

debugRegistration();
