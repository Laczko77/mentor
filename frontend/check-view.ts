import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkView() {
    const { data, error } = await supabase.rpc('get_view_definition', { view_name: 'completed_hours_mentor' });
    console.log("RPC Error:", error);
    console.log("RPC Data:", data);
}

checkView();
