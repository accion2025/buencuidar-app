
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

console.log("--- INICIANDO AUDITORÍA DEL SISTEMA ---");

// 1. Check ENV Variables
const envPath = path.resolve(process.cwd(), '.env');
if (!fs.existsSync(envPath)) {
    console.error("❌ ERROR: No se encuentra el archivo .env");
    process.exit(1);
}
console.log("✅ Archivo .env encontrado.");

let envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) envVars[parts[0].trim()] = parts.slice(1).join('=').trim();
});

const url = envVars['VITE_SUPABASE_URL'];
const key = envVars['VITE_SUPABASE_ANON_KEY'];

if (!url || !key) {
    console.error("❌ ERROR: Faltan variables VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en .env");
} else {
    console.log(`✅ URL configurada: ${url.substring(0, 15)}...`);
    console.log("✅ Key configurada: (Oculta por seguridad)");
}

// 2. Check Supabase Connection
console.log("\n--- PROBANDO CONEXIÓN A SUPABASE ---");
const supabase = createClient(url, key);

async function testConnection() {
    // Test Auth (Public endpoint)
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError) {
        console.error("❌ ERROR Conexión Auth:", authError.message);
    } else {
        console.log("✅ Servicio de Autenticación: CONECTADO");
    }

    // Test Database Access (Profiles)
    // Even if empty, it should not throw a connection error
    const { data, error: dbError } = await supabase.from('profiles').select('count', { count: 'exact', head: true });

    if (dbError) {
        console.error("❌ ERROR Conexión Base de Datos:", dbError.message);
        console.log("   (Esto puede ser normal si la tabla no existe o RLS bloquea lectura anónima)");
    } else {
        console.log("✅ Conexión Base de Datos (Tabla 'profiles'): ACCESIBLE");
    }

    console.log("\n--- AUDITORÍA COMPLETADA ---");
}

testConnection();
