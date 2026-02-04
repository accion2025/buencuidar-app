import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sqlFile = 'restore_caregiver_code.sql';
const sqlContent = fs.readFileSync(path.join(__dirname, sqlFile), 'utf8');

console.log(`Executing SQL from ${sqlFile}...`);

// Use shell: true to resolve 'npx' on Windows
const child = spawn('npx', ['supabase', 'db', 'execute'], {
    stdio: ['pipe', 'inherit', 'inherit'],
    shell: true
});

child.stdin.write(sqlContent);
child.stdin.end();

child.on('close', (code) => {
    console.log(`Child process exited with code ${code}`);
    process.exit(code);
});
