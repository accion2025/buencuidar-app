
import { createClient } from '@supabase/supabase-js';

// Config from your existing files
const supabaseUrl = 'https://ntxxknufezprbibzpftf.supabase.co';
// NOTE: For updates we technically need the SERVICE_ROLE key to bypass RLS if RLS is strict,
// but for now we try with the Anon key. If RLS blocks updates, you might need to use the Service Role Key
// from your Supabase Dashboard > Settings > API.
const supabaseKey = 'sb_publishable_V5D-ZgsTgoDcqQBEbZ4lQA_Dcfz2wY-';

const supabase = createClient(supabaseUrl, supabaseKey);

const targetEmail = process.argv[2];
const action = process.argv[3] || 'enable'; // 'enable' or 'disable'

if (!targetEmail) {
    console.error('❌ Por favor proporciona un email.\nUso: node scripts/set_caregiver_premium.mjs <email> [enable/disable]');
    process.exit(1);
}

async function setPremium() {
    console.log(`🔍 Buscando usuario: ${targetEmail}...`);

    // 1. Get the user ID
    const { data: users, error: userError } = await supabase
        .from('profiles')
        .select('id, full_name, plan_type')
        .eq('email', targetEmail)
        .single();

    if (userError || !users) {
        console.error('❌ Error encontrando usuario:', userError?.message || 'Usuario no encontrado');
        return;
    }

    console.log(`✅ Usuario encontrado: ${users.full_name} (${users.id})`);
    console.log(`   Plan actual: ${users.plan_type || 'basic'}`);

    // 2. Update the plan
    const newPlan = action === 'enable' ? 'premium' : 'basic';
    const newStatus = action === 'enable' ? 'active' : 'inactive'; // or whatever default

    console.log(`🔄 Cambiando plan a: ${newPlan.toUpperCase()}...`);

    const { data: updated, error: updateError } = await supabase
        .from('profiles')
        .update({
            plan_type: newPlan,
            subscription_status: newStatus,
            updated_at: new Date().toISOString()
        })
        .eq('id', users.id)
        .select()
        .single();

    if (updateError) {
        console.error('❌ Error actualizando plan:', updateError.message);
        console.log('💡 Consejo: Si falla por permisos (RLS), ejecuta este SQL en tu Dashboard de Supabase:');
        console.log(`\n   UPDATE profiles SET plan_type = '${newPlan}' WHERE email = '${targetEmail}';\n`);
    } else {
        console.log(`🎉 ¡Éxito! El plan de ${updated.full_name} ahora es: ${updated.plan_type.toUpperCase()}`);
    }
}

setPremium();
