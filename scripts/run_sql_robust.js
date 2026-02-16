
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sqlFileArg = process.argv[2];
const sqlFile = sqlFileArg ? path.resolve(process.cwd(), sqlFileArg) : path.resolve(__dirname, '../debug_broad.sql');

if (!fs.existsSync(sqlFile)) {
    console.error(`Error: Archivo SQL no encontrado en ${sqlFile}`);
    process.exit(1);
}

const sqlContent = fs.readFileSync(sqlFile, 'utf8');

console.log(`Ejecutando SQL desde ${sqlFile}...`);

// Usar 'npx supabase db execute'
const child = spawn('npx', ['supabase', 'db', 'execute'], {
    shell: true,
    cwd: path.resolve(__dirname, '..')
});

// Escribir SQL en stdin
child.stdin.write(sqlContent);
child.stdin.end();

// Capturar salida
child.stdout.on('data', (data) => {
    console.log(`[STDOUT]:\n${data}`);
});

child.stderr.on('data', (data) => {
    console.error(`[STDERR]:\n${data}`);
});

child.on('close', (code) => {
    console.log(`Proceso terminado con código ${code}`);
    process.exit(code);
});
