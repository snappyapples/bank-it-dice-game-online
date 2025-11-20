# Deployment Guide

Your Bank It game is now ready for production! Follow these steps to deploy.

## ✅ Completed Steps

- ✅ Installed Supabase client library
- ✅ Created database schema (`supabase/schema.sql`)
- ✅ Updated all code to use Supabase instead of in-memory storage
- ✅ Created environment variables template (`.env.local.example`)
- ✅ Initialized git repository and created initial commit
- ✅ Created comprehensive README.md

## 📋 Next Steps

### 1. Set Up Supabase Database

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Once the project is ready, go to the **SQL Editor**
4. Copy and paste the contents of `supabase/schema.sql`
5. Run the SQL script to create your tables
6. Go to **Settings > API** to get your credentials

### 2. Create Local Environment File

1. Create a `.env.local` file in the project root (already in .gitignore)
2. Add your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

### 3. Test Locally

```bash
# Make sure dev server is running
npm run dev

# Visit http://localhost:3000
# Create a game, join from another browser/incognito window
# Test the full game flow
```

### 4. Create GitHub Repository

#### Option A: Via GitHub Website
1. Go to [github.com/new](https://github.com/new)
2. Repository name: `BankItDiceGame` (or your preferred name)
3. Make it Public or Private
4. **Do NOT** initialize with README, .gitignore, or license (we already have these)
5. Click "Create repository"

#### Option B: Via GitHub CLI
```bash
# Install gh CLI if you haven't: https://cli.github.com/
gh repo create BankItDiceGame --public --source=. --remote=origin
```

### 5. Update Git Config (Important!)

Before pushing, update your git user information:

```bash
# Set your actual GitHub email and name
git config user.email "your-github-email@example.com"
git config user.name "Your GitHub Username"

# Amend the commit with correct authorship
git commit --amend --reset-author --no-edit
```

### 6. Push to GitHub

```bash
# Add GitHub as remote (if not done via gh CLI)
git remote add origin https://github.com/YOUR_USERNAME/BankItDiceGame.git

# Push to GitHub
git push -u origin main
```

### 7. Deploy to Vercel

#### Option A: Via Vercel Dashboard (Recommended)
1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "Add New..." > "Project"
4. Import your `BankItDiceGame` repository
5. Configure:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (default)
   - **Environment Variables**: Click "Add"
     - Add `NEXT_PUBLIC_SUPABASE_URL`
     - Add `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. Click "Deploy"

#### Option B: Via Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Add environment variables when prompted:
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY

# For production deployment
vercel --prod
```

### 8. Test Production Deployment

Once Vercel finishes deploying:
1. Visit your deployment URL (e.g., `bankitdicegame.vercel.app`)
2. Create a game
3. Share the room code with friends or test in incognito
4. Play a full game to ensure everything works!

## 🎉 You're Done!

Your game is now live and ready to share!

### Optional: Custom Domain

To add a custom domain:
1. Go to your Vercel project dashboard
2. Click "Settings" > "Domains"
3. Add your domain and follow DNS configuration instructions

## 🔧 Troubleshooting

### Environment Variables Not Working
- Make sure you added them in Vercel dashboard under Settings > Environment Variables
- Redeploy after adding environment variables

### Database Connection Issues
- Verify your Supabase URL and key are correct
- Check that the schema.sql was executed successfully
- Ensure Row Level Security policies allow access (see schema.sql)

### Git User Configuration
If you see git identity errors:
```bash
git config user.email "your-email@example.com"
git config user.name "Your Name"
```

## 📝 Notes

- The `.env.local` file is already in `.gitignore` - it won't be committed
- Always add environment variables in Vercel dashboard for production
- Supabase has a generous free tier perfect for this project
- Consider setting up a cleanup cron job for old rooms (function is in schema.sql)

## 🆘 Need Help?

- Check the README.md for general info
- Review CLAUDE.md for architecture details
- Supabase docs: https://supabase.com/docs
- Vercel docs: https://vercel.com/docs
- Next.js docs: https://nextjs.org/docs
