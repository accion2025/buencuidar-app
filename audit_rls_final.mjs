
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ntxxknufezprbibzpftf.supabase.co';
const supabaseKey = 'sb_publishable_V5D-ZgsTgoDcqQBEbZ4lQA_Dcfz2wY-';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log("--- AUDITORÍA DE POLÍTICAS RLS ---");

    // Consultar las políticas directamente desde pg_policies vía RPC o consulta SQL si es posible
    // Como no tengo RPC, intentaré ver si puedo deducirlo intentando una operación que falle y capture el error detallado
    // O mejor, intentaré leer de la tabla 'profiles' que sabemos que funciona para 'anon' (en teoría)

    const { data: profData, error: profError } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);

    console.log("TEST PROFILES (ANON):", profError ? "FAIL: " + profError.message : "OK");

    const { data: appData, error: appError } = await supabase
        .from('appointments')
        .select('id')
        .limit(1);

    console.log("TEST APPOINTMENTS (ANON):", appError ? "FAIL: " + appError.message : "OK (Size: " + (appData?.length || 0) + ")");
}

run();
