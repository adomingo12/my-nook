# 🚀 GitHub Pages Deployment Guide

## 📋 Prerequisites

1. **Supabase Account**: You need a Supabase project with the `reading_nook` table
2. **GitHub Repository**: Your code should be in a GitHub repository
3. **Supabase Anon Key**: You'll need your project's anon (public) key

## 🔑 Getting Your Supabase Anon Key

1. **Go to Supabase Dashboard**: Visit [supabase.com](https://supabase.com)
2. **Select Your Project**: Choose your reading nook project
3. **Navigate to Settings**: Click on "Settings" in the left sidebar
4. **Go to API Section**: Click on "API" in the settings menu
5. **Copy Anon Key**: Under "Project API keys", copy the `anon` `public` key (NOT the service_role key)

## 📝 Deployment Steps

### Step 1: Update Production Configuration

1. **Open `config.production.js`** in your project
2. **Replace the placeholder** with your actual anon key:

```javascript
const CONFIG = {
    SUPABASE_URL: 'https://bsnirvyfiyofgakmxfyn.supabase.co',
    SUPABASE_KEY: 'your_actual_anon_key_here' // Replace this!
};
```

### Step 2: Commit and Push

```bash
git add config.production.js
git commit -m "Add production configuration for GitHub Pages"
git push origin main
```

### Step 3: Enable GitHub Pages

1. **Go to Repository Settings**: Navigate to your GitHub repository
2. **Scroll to Pages Section**: Find "Pages" in the left sidebar
3. **Select Source**: Choose "Deploy from a branch"
4. **Select Branch**: Choose `main` (or your default branch)
5. **Select Folder**: Choose `/ (root)`
6. **Save**: Click "Save"

### Step 4: Wait for Deployment

- GitHub will build and deploy your site
- You'll get a URL like: `https://yourusername.github.io/repository-name`
- It may take a few minutes for the site to be available

## 🔒 Security Notes

### ✅ Safe for Client-Side (Anon Key):
- The anon key is designed to be used in client-side applications
- It has limited permissions based on your Row Level Security (RLS) policies
- It's safe to include in your deployed code

### ❌ Never Use Service Role Key:
- The service_role key has full database access
- It should NEVER be used in client-side code
- Keep it secret and only use it in server-side applications

## 🛠️ Troubleshooting

### Database Connection Issues:

1. **Check Browser Console**: Look for error messages
2. **Verify Anon Key**: Make sure you copied the correct key
3. **Check Supabase Status**: Ensure your project is active
4. **Test Locally**: Verify the app works locally first

### GitHub Pages Not Loading:

1. **Check Repository Settings**: Ensure Pages is enabled
2. **Verify Branch**: Make sure you're deploying from the correct branch
3. **Check File Names**: Ensure all files are committed and pushed
4. **Wait**: GitHub Pages can take up to 10 minutes to update

### App Using Local Storage:

1. **Check Console**: Look for configuration error messages
2. **Verify Config File**: Ensure `config.production.js` is in the repository
3. **Check Anon Key**: Make sure it's not the placeholder value
4. **Test Database**: Verify your Supabase project is accessible

## 📁 File Structure for Deployment

```
repository/
├── index.html
├── styles.css
├── script.js
├── config.production.js     # ✅ Included in deployment
├── config.js               # ❌ Excluded by .gitignore
├── book_image.png
└── *.sql
```

## 🎯 Expected Behavior

### ✅ Successful Deployment:
- App loads without errors
- Books can be added, edited, and deleted
- Data persists between sessions
- Google Books API lookup works
- All features function normally

### ⚠️ Fallback Mode:
- If database connection fails, app uses local storage
- You'll see a warning notification
- Data won't sync between devices
- All other features still work

## 🔄 Updating Your Deployment

1. **Make Changes Locally**: Edit your files
2. **Test Locally**: Ensure everything works
3. **Commit Changes**: `git add . && git commit -m "Update"`
4. **Push to GitHub**: `git push origin main`
5. **Wait for Deployment**: GitHub Pages will automatically update

## 📞 Support

If you encounter issues:

1. **Check Console**: Browser developer tools console
2. **Verify Configuration**: Ensure anon key is correct
3. **Test Locally**: Make sure local version works
4. **Check Supabase**: Verify project status and RLS policies

Happy deploying! 🎉
