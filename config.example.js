// Example configuration file for environment variables
// Copy this file to config.js and update with your actual values
// This file should be added to .gitignore to keep credentials secure

const CONFIG = {
    // Supabase configuration
    SUPABASE_URL: 'https://your-project-id.supabase.co',
    SUPABASE_KEY: 'your_supabase_service_role_key_here',
    
    // Authentication credentials for add/edit book functionality
    // Customize these username/password combinations as needed
    AUTH_CREDENTIALS: [
        { username: 'admin', password: 'your_admin_password' },
        { username: 'your_name', password: 'your_password' },
        { username: 'user', password: 'another_password' }
    ]
};

// Make CONFIG available globally
window.CONFIG = CONFIG;
