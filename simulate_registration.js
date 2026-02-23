
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function simulateRegistration() {
    console.log("--- Simulando Registro Real ---");

    const email = `test_${Math.floor(Math.random() * 10000)}@example.com`;
    const password = 'Password123!';

    console.log(`Intentando registrar: ${email}`);

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: 'Test Family User',
                phone: '+505 8888 7777', // Añadido v1.0.115
                role: 'family',
                country: 'nicaragua',
                department: 'Managua',
                municipality: 'Managua',
                trial_expiry_date: '22/03/2026'
            }
        }
    });

    if (error) {
        console.error("❌ ERROR EN SIGNUP:");
        console.error("Mensaje:", error.message);
        console.error("Detalle:", error.details); // Error details sometimes contain Postgres messages
        console.error("Status:", error.status);
    } else {
        console.log("✅ Registro exitoso (esto es inesperado si el usuario ve error).");
        console.log("User ID:", data.user.id);
    }
}

simulateRegistration();
