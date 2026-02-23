
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkSubConstraints() {
    console.log("--- Inspeccionando Restricciones de 'subscriptions' ---");

    // Intentamos provocar el error directamente insertando un plan inválido
    const { error: insertError } = await supabase.from('subscriptions').insert({
        user_id: '00000000-0000-0000-0000-000000000000',
        status: 'active',
        plan_type: 'pulso' // El que sospechamos que falla
    });

    if (insertError) {
        console.error("❌ ERROR AL INSERTAR:");
        console.error("Mensaje:", insertError.message);
        console.error("Detalle:", insertError.details);
        console.error("Código:", insertError.code);
    } else {
        console.log("✅ Inserción en subscriptions permitida (el plan 'pulso' es válido).");
        await supabase.from('subscriptions').delete().eq('plan_type', 'pulso');
    }
}

checkSubConstraints();
