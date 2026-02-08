
import { createClient } from '@supabase/supabase-js';

// Usamos el proyecto confirmado NTXX
const supabaseUrl = 'https://ntxxknufezprbibzpftf.supabase.co';
const supabaseKey = 'sb_publishable_V5D-ZgsTgoDcqQBEbZ4lQA_Dcfz2wY-';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log("--- DIAGNÓSTICO PROFUNDO: ¿POR QUÉ NO SE VEN? ---");

    // 1. Login como Carlos (Cuidador)
    const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({
        email: 'carlosbenitez-pro@outlook.com',
        password: 'password123'
    });

    if (authErr) {
        console.error("❌ FALLÓ LOGIN:", authErr.message);
        return;
    }
    console.log("✅ Login OK (Yamila ID):", auth.user.id);

    // 2. Buscar las citas PRUEBA sin ningún filtro primero
    const { data: allPruebas, error: searchErr } = await supabase
        .from('appointments')
        .select('id, title, status, caregiver_id, client_id, date, time')
        .ilike('title', '%PRUEBA%');

    if (searchErr) {
        console.error("❌ ERROR BUSCANDO PRUEBAS:", searchErr.message);
        return;
    }

    if (!allPruebas || allPruebas.length === 0) {
        console.error("❌ NO SE ENCONTRARON CITAS 'PRUEBA' EN LA DB (¿Borradas?)");
        return;
    }

    console.log(`\n🔍 ENCONTRADAS ${allPruebas.length} CITAS 'PRUEBA'. ANALIZANDO UNA POR UNA:`);

    for (const job of allPruebas) {
        console.log(`\n---------------------------------------------------`);
        console.log(`CITA: ${job.title} (ID: ${job.id})`);

        // CHECK 1: STATUS
        const statusOk = job.status === 'pending';
        console.log(`[1] Status es 'pending'? ${statusOk ? '✅' : '❌ (' + job.status + ')'}`);

        // CHECK 2: CAREGIVER_ID
        const caregiverOk = job.caregiver_id === null;
        console.log(`[2] Caregiver es NULL? ${caregiverOk ? '✅' : '❌ (Asignado a: ' + job.caregiver_id + ')'}`);

        // CHECK 3: FECHA (Futura?)
        const now = new Date();
        const todayStr = now.toLocaleDateString('en-CA');
        const dateOk = job.date >= todayStr;
        console.log(`[3] Fecha futura/hoy? (${job.date} >= ${todayStr}) ${dateOk ? '✅' : '❌'}`);

        // CHECK 4: DATA DEL CLIENTE (Profile join)
        // Si el usuario no tiene permisos para ver al cliente, la cita desaparece si usamos inner join o select explicito
        let clientOk = false;
        if (job.client_id) {
            const { data: client, error: clientErr } = await supabase
                .from('profiles')
                .select('id, full_name')
                .eq('id', job.client_id)
                .single();

            if (clientErr) {
                console.log(`[4] Acceso a Cliente (Profile): ❌ ERROR: ${clientErr.message}`);
            } else if (!client) {
                console.log(`[4] Acceso a Cliente (Profile): ❌ NO EXISTE (NULL)`);
            } else {
                console.log(`[4] Acceso a Cliente (Profile): ✅ OK (${client.full_name})`);
                clientOk = true;
            }
        } else {
            console.log(`[4] Acceso a Cliente: ❌ SIN CLIENT_ID`);
        }

        // VEREDICTO
        if (statusOk && caregiverOk && dateOk && clientOk) {
            console.log(`\n🎉 VEREDICTO: ESTA CITA DEBERÍA SER VISIBLE.`);
        } else {
            console.log(`\n💀 VEREDICTO: ESTA CITA ESTÁ OCULTA.`);
        }
    }
}

run();
