
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkConstraints() {
    console.log("--- Inspeccionando Restricciones de 'profiles' ---");

    const sql = `
    SELECT
        conname as constraint_name,
        pg_get_constraintdef(c.oid) as constraint_definition
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    WHERE t.relname = 'profiles';
    `;

    // Intentamos usar el RPC si el usuario lo activó o si ya existía
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
        console.log("No se pudo ejecutar la inspección automática (RPC exec_sql no disponible).");
        console.log("Por favor, ejecuta esta consulta manualmente en el SQL Editor de Supabase y envíame una captura o el texto:");
        console.log(sql);

        // Alternativa desesperada: probar insertar con un plan diferente para ver si falla
        console.log("\nProbando inserción con plan 'pulso' directamente en profiles para confirmar restricción...");
        const { error: testError } = await supabase.from('profiles').insert({
            id: '00000000-0000-0000-0000-000000009999',
            email: 'test_plan@example.com',
            full_name: 'Plan Tester',
            role: 'family',
            plan_type: 'pulso'
        });

        if (testError) {
            console.error("❌ ERROR DETECTADO AL INSERTAR PLAN 'pulso':");
            console.error(testError.message);
            if (testError.message.includes('check constraint')) {
                console.log("¡BINGO! Hay una restricción CHECK en profiles que bloquea 'pulso'.");
            }
        } else {
            console.log("✅ Inserción permitida. El problema no es el CHECK de profiles.");
            await supabase.from('profiles').delete().eq('id', '00000000-0000-0000-0000-000000009999');
        }

    } else {
        console.table(data);
    }
}

checkConstraints();
