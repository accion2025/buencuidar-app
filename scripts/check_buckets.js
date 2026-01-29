import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Manual env parsing since dotenv is not available
const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim();
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing credentials in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkBuckets() {
    console.log("Checking buckets for:", supabaseUrl);

    const { data: buckets, error } = await supabase.storage.listBuckets();

    if (error) {
        console.error("Error listing buckets:", error);
        return;
    }

    console.log("Existing buckets:", buckets.map(b => b.name));

    const requiredBuckets = ['avatars', 'documents'];
    for (const bucketName of requiredBuckets) {
        if (!buckets.find(b => b.name === bucketName)) {
            console.log(`Bucket "${bucketName}" missing. Creating...`);
            const { error: createError } = await supabase.storage.createBucket(bucketName, {
                public: bucketName === 'avatars',
                allowedMimeTypes: bucketName === 'avatars' ? ['image/*'] : null
            });
            if (createError) {
                console.error(`Error creating ${bucketName}:`, createError);
            } else {
                console.log(`Bucket "${bucketName}" created successfully.`);
            }
        } else {
            console.log(`Bucket "${bucketName}" already exists.`);
        }
    }
}

checkBuckets();
