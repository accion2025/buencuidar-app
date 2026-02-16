
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ajustar ruta al archivo SQL que está en la raíz de App
const sqlFile = path.resolve(__dirname, '../fix_job_visibility_final.sql');

if (!fs.existsSync(sqlFile)) {
    console.error(`Error: SQL file not found at ${sqlFile}`);
    process.exit(1);
}

const sqlContent = fs.readFileSync(sqlFile, 'utf8');

console.log(`Aplicando correcciones RLS desde ${sqlFile}...`);
console.log('(Esto requiere que la CLI de Supabase esté linkeada y autenticada)');

// Use 'npx' directly to call supabase in the context of the project
const child = spawn('npx', ['supabase', 'db', 'execute'], {
    stdio: ['pipe', 'inherit', 'inherit'],
    shell: true,
    cwd: path.resolve(__dirname, '..') // Run from App root
});

child.stdin.write(sqlContent);
child.stdin.end();

child.on('close', (code) => {
    if (code === 0) {
        console.log('✅ Políticas RLS actualizadas correctamente.');
    } else {
        console.error(`❌ El proceso falló con código ${code}. Verifique que el servicio de base de datos esté accesible.`);
    }
    process.exit(code);
});
