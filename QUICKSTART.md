# Quick Start Guide

## Run the Application

Open your terminal and run:

```bash
cd /Users/bhupindergarg/Documents/mywork/matchFixingTracker
npm run dev
```

Then open your browser to: **http://localhost:3000**

## First Time Setup

The application will:
1. Automatically create the SQLite database at `data/cricket.db`
2. Initialize all required tables
3. Be ready to use immediately

## Quick Test Walkthrough (2 minutes)

### 1. Create a Team
- On the home page, scroll to **Teams** section
- Enter "India" and click **Add Team**
- Enter "Australia" and click **Add Team**

### 2. Create a Championship
- Scroll to **Championships** section
- Enter "Cricket World Cup" and click **Add Championship**
- Click on the championship card to enter it

### 3. Create a Match
- Click **Add Match** button
- Select India as Team 1
- Select Australia as Team 2
- Set match date/time
- Click **Create Match**

### 4. Add Player Records
- Click **Enter Data** on the match
- Under Batsman section, click **Add Batsman**
- Add: Virat (50 runs off 30 balls)
- Add: Rohit (45 runs off 28 balls)
- Under Bowler section, click **Add Bowler**
- Add: Mitchell (2 wickets, 35 runs conceded)

### 5. Test Review System
- Check the checkbox next to a player record
- It will mark as "Reviewed"

### 6. Test Search
- Click the **Search** tab on home page
- Enter "Virat"
- Select scope (Global/Match/Championship)
- Click **Search** to see results

## Available Scripts

```bash
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Build for production
npm start        # Run production build
npm run lint     # Run ESLint
```

## File Structure

- `src/app/` - Pages and API routes
- `src/components/` - React components
- `src/lib/db.ts` - Database configuration
- `data/cricket.db` - SQLite database (auto-created)

## Need Help?

- Check [README.md](./README.md) for detailed documentation
- Check [SETUP_COMPLETE.md](./SETUP_COMPLETE.md) for full feature list
- Check [Requirement.md](./Requirement.md) for original requirements

## Common Issues

**Port already in use?**
```bash
npm run dev -- -p 3001  # Use port 3001 instead
```

**Database issues?**
```bash
# Delete the database file to reset
rm data/cricket.db
npm run dev  # Will auto-recreate
```

**Dependencies issue?**
```bash
rm -rf node_modules package-lock.json
npm install
```

---

**Enjoy your Cricket Data Manager!** ✨
