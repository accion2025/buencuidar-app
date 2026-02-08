
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ntxxknufezprbibzpftf.supabase.co';
const supabaseKey = 'sb_publishable_V5D-ZgsTgoDcqQBEbZ4lQA_Dcfz2wY-';
const supabase = createClient(supabaseUrl, supabaseKey);

async function runDiagnostic() {
    console.log("--- INICIANDO DIAGNÓSTICO QUIRÚRGICO (PRUEBA 24) ---");

    // 1. Verificar estado del registro (Sin Joins para aislar)
    console.log("\n1. Verificando Registro 'PRUEBA 24' (Naked Query):");
    const { data: nakedData, error: nakedError } = await supabase
        .from('appointments')
        .select('id, title, status, caregiver_id, date, time, client_id, patient_id')
        .ilike('title', '%PRUEBA 24%');

    if (nakedError) {
        console.error("Error en consulta simple:", nakedError.message);
    } else {
        console.log("Datos encontrados:", JSON.stringify(nakedData, null, 2));
    }

    // 2. Verificar existencia de tablas unidas
    console.log("\n2. Verificando visualización de Tablas Unidas (Joins):");
    if (nakedData && nakedData.length > 0) {
        const appointment = nakedData[0];
        const { data: clientData, error: clientError } = await supabase.from('profiles').select('id, full_name').eq('id', appointment.client_id).single();
        const { data: patientData, error: patientError } = await supabase.from('patients').select('id, full_name').eq('id', appointment.patient_id).single();

        console.log("- Acceso a Perfil Cliente:", clientError ? `FALLO (${clientError.message})` : "OK");
        console.log("- Acceso a Datos Paciente:", patientError ? `FALLO (${patientError.message})` : "OK");
    }

    // 3. Listar Políticas RLS (Desde metadatos de usuario si es posible o vía consulta directa)
    console.log("\n3. Políticas RLS (Intentando listar vía SQL):");
    const { data: policies, error: polError } = await supabase.rpc('get_policies'); // Si existe
    if (polError) {
        console.log("Nota: No se pueden listar políticas vía API sin permisos de admin. Pero la falla en Joins nos dará la pista.");
    }
}

runDiagnostic();
