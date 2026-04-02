
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ntxxknufezprbibzpftf.supabase.co';
const supabaseAnonKey = 'sb_publishable_V5D-ZgsTgoDcqQBEbZ4lQA_Dcfz2wY-';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
    console.log("--- TEST DE CREACIÓN DE CITA SIN EMAIL CONFIRMADO ---");
    
    // 1. Buscar un usuario familia con email_confirmed = false
    const { data: unconfirmedUsers, error: fetchError } = await supabase
        .from('profiles')
        .select('id, email, email_confirmed, role')
        .eq('role', 'family')
        .eq('email_confirmed', false)
        .limit(1);

    if (fetchError) {
        console.error("Error al buscar usuario no confirmado:", fetchError);
        return;
    }

    if (!unconfirmedUsers || unconfirmedUsers.length === 0) {
        console.log("No se encontró ningún usuario familia con email no confirmado para la prueba.");
        return;
    }

    const testUser = unconfirmedUsers[0];
    console.log(`Usuario de prueba: ${testUser.email} (ID: ${testUser.id}, Confirmado: ${testUser.email_confirmed})`);

    // 2. Intentar insertar una cita a nombre de ese usuario
    // Nota: Estamos usando la anon key, por lo que la RLS actuará si detecta que no hay sesión o si la política falla.
    // Pero para ser realistas, deberíamos intentar actuar "como" ese usuario.
    // Como no tenemos su contraseña, solo podemos ver la política desde fuera o intentar una inserción directa.
    
    console.log("Intentando insertar cita...");
    const { data: insertData, error: insertError } = await supabase
        .from('appointments')
        .insert({
            client_id: testUser.id,
            caregiver_id: '8fdad4c-0000-0000-0000-000000000000', // Un ID dummy para probar
            service_type: 'Prueba RLS',
            status: 'pending',
            start_time: new Date().toISOString(),
            end_time: new Date().toISOString()
        });

    if (insertError) {
        console.log("Resultado: BLOQUEADO");
        console.log("Error de Supabase:", insertError.message);
        if (insertError.code === '42501') {
            console.log("Confirmado: La política RLS denegó el permiso.");
        }
    } else {
        console.log("Resultado: PERMITIDO (Ojo: Esto podría significar que la RLS no está filtrando por email_confirmed)");
    }
}

test();
