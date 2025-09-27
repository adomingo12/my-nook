// Configuration template file for local development
//
// SETUP INSTRUCTIONS:
// 1. Copy this file to config.js
// 2. Update with your actual secure credentials
// 3. config.js is automatically gitignored for security
//
// NOTE:
// - config.js (this file) = Local development (private, secure credentials)
// - config.production.js = GitHub Pages deployment (public, demo credentials)
// - The app will use local storage if Supabase config is not provided

const CONFIG = {
    // Supabase configuration (optional - leave as placeholders to use local storage only)
    SUPABASE_URL: 'YOUR_SUPABASE_URL_HERE',
    SUPABASE_KEY: 'YOUR_SUPABASE_ANON_KEY_HERE',

    // Authentication credentials for add/edit book functionality
    // For GitHub Pages: Use demo credentials (they will be publicly visible!)
    // For private deployment: Use secure passwords
    AUTH_CREDENTIALS: [
        { username: 'demo', password: 'demo123' },
        { username: 'guest', password: 'guest' }
    ]
};

// Make CONFIG available globally
window.CONFIG = CONFIG;
