# Bank It - Multiplayer Dice Game

An online multiplayer dice game where players roll dice to accumulate points in a shared bank, deciding when to cash in before someone rolls a 7 and busts!

## 🎮 How to Play

- Roll two dice each turn to add points to the shared bank
- **First 3 rolls** are safe - rolling a 7 adds 70 points!
- **After roll 3**, the game gets risky:
  - Rolling a 7 = BUST! Bank empties
  - Rolling doubles = DOUBLES the entire bank
- Bank your points any time to secure them
- Highest score after all rounds wins!

## 🚀 Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel

## 📦 Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/BankItDiceGame.git
cd BankItDiceGame
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to the SQL Editor in your Supabase dashboard
3. Run the schema from `supabase/schema.sql`
4. Get your project URL and anon key from Settings > API

### 4. Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.local.example .env.local
   ```

2. Update `.env.local` with your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to play!

## 🌐 Deploying to Vercel

### Option 1: Deploy via Vercel Dashboard

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository
5. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. Click "Deploy"

### Option 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variables when prompted
# Or add them via the Vercel dashboard
```

## 🎯 Game Rules

### First 3 Rolls (Safe Zone)
- All dice rolls add their face value to the bank
- Rolling a 7 adds **70 points** (special bonus!)
- No risk of busting

### Roll 4+ (Risky Zone)
- Rolling a 7: **BUST** - Bank empties, non-banked players get nothing
- Rolling doubles: **DOUBLES** the entire bank value
- Other rolls add their face value

## 🏗️ Project Structure

```
├── app/
│   ├── api/rooms/          # API routes for game rooms
│   ├── room/[roomId]/      # Game room page
│   └── page.tsx            # Home page
├── components/             # React components
├── lib/
│   ├── gameLogic.ts       # Pure game logic functions
│   ├── gameStore.ts       # Supabase database operations
│   ├── supabase.ts        # Supabase client
│   └── types.ts           # TypeScript types
├── supabase/
│   └── schema.sql         # Database schema
└── CLAUDE.md              # AI development guide
```

## 🛠️ Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

## 📝 License

ISC

## 🤝 Contributing

Feel free to open issues or submit pull requests!

---

Made with ❤️ using Next.js and Supabase
