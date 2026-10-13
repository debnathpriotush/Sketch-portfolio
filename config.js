// Settings for the like buttons.
//
// After you create your free Supabase project (see SETUP-GUIDE.md, Part 5),
// replace the two PASTE_... values below with your own, keeping the quotes.
//
// Until then the site works normally. Likes just only count on each
// visitor's own device instead of being shared between everyone.
//
// The "public" key is meant to be visible in website code: it can only read
// the like counts and add or remove one like. NEVER paste a "secret" or
// "service_role" key here.

window.SITE_CONFIG = {
  supabaseUrl: "PASTE_YOUR_SUPABASE_PROJECT_URL_HERE",
  supabaseKey: "PASTE_YOUR_SUPABASE_PUBLIC_KEY_HERE"
};
