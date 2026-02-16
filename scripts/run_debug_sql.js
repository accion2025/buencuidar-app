
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sqlFile = path.resolve(__dirname, '../debug_pruebas.sql');

if (!fs.existsSync(sqlFile)) {
    console.error(`Error: SQL file not found at ${sqlFile}`);
    process.exit(1);
}

const sqlContent = fs.readFileSync(sqlFile, 'utf8');

console.log(`Ejecutando SQL Debugging desde ${sqlFile}...`);

const child = spawn('npx', ['supabase', 'db', 'execute'], {
    stdio: ['pipe', 'inherit', 'inherit'],
    shell: true,
    cwd: path.resolve(__dirname, '..')
});

child.stdin.write(sqlContent);
child.stdin.end();

child.on('close', (code) => {
    process.exit(code);
});
