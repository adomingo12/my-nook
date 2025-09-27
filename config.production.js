// Production configuration for GitHub Pages deployment
// This file contains the anon key which is safe for client-side use

const CONFIG = {
    SUPABASE_URL: 'https://bsnirvyfiyofgakmxfyn.supabase.co',
    // TODO: Replace with your actual anon key from Supabase dashboard
    // Go to: Project Settings > API > Project API keys > anon public
    SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzbmlydnlmaXlvZmdha214ZnluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3NDkyNzksImV4cCI6MjA3NDMyNTI3OX0.OP9A9Qrt2Z3P6c5tplfiGgNRnLYBxiwZyhL8vB_cqPM',

    // Authentication credentials for add/edit book functionality
    // Note: These will be publicly visible on GitHub Pages
    AUTH_CREDENTIALS: [
        { username: 'admin', password: 'bookworm123' },
        { username: 'adomingo', password: 'myNook123!' }
    ]
};

// Make CONFIG available globally
window.CONFIG = CONFIG;
