import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ntxxknufezprbibzpftf.supabase.co';
const supabaseKey = 'sb_publishable_V5D-ZgsTgoDcqQBEbZ4lQA_Dcfz2wY-';
const supabase = createClient(supabaseUrl, supabaseKey);

const clientId = '6422b856-745b-4da3-ac64-1734ec1d2885';

async function findFirstDay() {
    console.log(`Buscando Servicio 10 para Elena Gracia (${clientId})...`);

    const { data: apps, error: appError } = await supabase
        .from('appointments')
        .select('*')
        .eq('client_id', clientId)
        .ilike('title', '%SERVICIO 10%')
        .order('date', { ascending: true })
        .limit(1);

    if (appError) {
        console.error("Error buscando cita:", appError);
        return;
    }

    if (!apps || apps.length === 0) {
        console.log("No se encontró el Servicio 10 para este usuario.");
        return;
    }

    const firstApp = apps[0];
    console.log(`\nPRIMER DÍA ENCONTRADO: ${firstApp.date}`);
    console.log(`Estado: ${firstApp.status}`);
    console.log(`Agenda definida: ${JSON.stringify(firstApp.care_agenda, null, 2)}`);

    // Buscar logs de ese día
    const { data: logs, error: logError } = await supabase
        .from('care_logs')
        .select('*')
        .eq('appointment_id', firstApp.id)
        .order('created_at', { ascending: true });

    if (logError) {
        console.error("Error buscando logs:", logError);
    } else {
        console.log(`\nREGISTROS DE BITÁCORA (${logs.length}):`);
        logs.forEach(l => {
            console.log(`- [${l.created_at}] ${l.action}: ${l.detail}`);
        });
    }
}

findFirstDay();
