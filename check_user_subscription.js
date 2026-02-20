import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkUser(email) {
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserByEmail(email);
    if (authError) {
        console.error("Auth Error:", authError);
        return;
    }

    const { data: profile, error: profError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.user.id)
        .single();

    console.log("Profile Data:", {
        id: profile.id,
        role: profile.role,
        plan_type: profile.plan_type,
        subscription_status: profile.subscription_status
    });
}

// User email should be provided or found from context
// Since I can't easily get it, I'll check if there's any active session.
