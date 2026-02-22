const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testLogin() {
    const { data, error } = await supabase.auth.signInWithPassword({
        email: "mentor@mentortrack.test",
        password: "Password123!"
    });

    if (error) {
        console.error("LOGIN ERROR:", error.message, error.status);
        console.error(error);
    } else {
        console.log("LOGIN SUCCESS:", data.user.id);
    }
}

testLogin();
