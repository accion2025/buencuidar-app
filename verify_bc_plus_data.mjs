import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function verify() {
    console.log('Verifying BC Cuidado Plus data...');

    const { data: programs, error: pError } = await supabase
        .from('care_programs')
        .select('name');

    if (pError) {
        console.error('Error fetching programs:', pError);
        return;
    }

    console.log(`Found ${programs.length} programs:`, programs.map(p => p.name).join(', '));

    const { data: templates, error: tError } = await supabase
        .from('care_program_templates')
        .select('count', { count: 'exact', head: true });

    if (tError) {
        console.error('Error fetching templates:', tError);
        return;
    }

    console.log(`Found ${templates[0]?.count || 0} activity templates.`);
}

verify();
