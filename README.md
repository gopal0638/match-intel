# Cricket Data Management System

A web-based cricket data management platform built with **Next.js** and **React** for storing, organizing, and searching cricket match records.

## Features

- **Team Management**: Create and manage cricket teams with players
- **Team Players**: Add and manage players for each team
- **Championships**: Organize tournaments/championships
- **Match Management**: Create matches between teams with date/time, ground name, and type (Test/One Day/T20)
- **Player Statistics**: Track batsman (runs, balls faced) and bowler (wickets, runs conceded) records
- **Review System**: Add comments and mark records as reviewed
- **Search Functionality**: Search players by name across:
  - Global records
  - Specific matches
  - Entire championships

## Tech Stack

- **Frontend**: React 19.2.3 with TypeScript
- **Backend**: Next.js 16.1.6 (Node.js)
- **Database**: SQLite with better-sqlite3
- **Styling**: Tailwind CSS 4
- **Package Manager**: npm

## Installation & Setup

### Prerequisites

- Node.js (v22+)
- npm (v10+)

### Steps

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Run Development Server**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:3000`

3. **Build for Production**
   ```bash
   npm run build
   npm start
   ```

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── teams/              # Team endpoints
│   │   │   └── [id]/players/   # Team players endpoints
│   │   ├── championships/      # Championship endpoints
│   │   ├── matches/            # Match records endpoints
│   │   └── search/             # Search endpoints
│   ├── championships/[id]/     # Championship detail page
│   ├── matches/[id]/           # Match detail page
│   └── page.tsx                # Home page
├── components/
│   ├── TeamsSection.tsx        # Teams management UI
│   ├── TeamPlayers.tsx         # Team players management UI
│   ├── ChampionshipsSection.tsx # Championships management UI
│   ├── MatchesSection.tsx      # Matches management UI
│   ├── MatchDetails.tsx        # Batsman/Bowler records UI
│   └── SearchSection.tsx       # Search UI
└── lib/
    └── db.ts                   # Database initialization and setup
```

## API Endpoints

### Teams
- `GET /api/teams` - Get all teams
- `POST /api/teams` - Create a new team

### Team Players
- `GET /api/teams/[id]/players` - Get all players in a team
- `POST /api/teams/[id]/players` - Add a player to team
- `DELETE /api/teams/[id]/players/[playerId]` - Remove player from team

### Championships
- `GET /api/championships` - Get all championships
- `POST /api/championships` - Create a new championship

### Matches
- `GET /api/championships/[id]/matches` - Get matches in a championship
- `POST /api/championships/[id]/matches` - Create a match

### Match Records
- `GET /api/matches/[id]/records` - Get batsman and bowler records
- `POST /api/matches/[id]/records` - Add a batsman or bowler record
- `PUT /api/matches/[id]/records/[recordId]` - Update record (review status, comments)
- `DELETE /api/matches/[id]/records/[recordId]` - Delete a record

---

## Password-Protected Access 🔒
This site now requires a password to view any page. Set an environment variable in your development or production environment:

```bash
AUTH_PASSWORD=your_secret_password
```

- A login page (`/login`) will be shown to unauthenticated users.
- Successful login sets a cookie valid for one day; you can adjust the duration in `src/app/api/login/route.ts` or change the middleware logic in `middleware.ts`.
- Use the **Logout** button in the top-right corner of any page to clear the session.



### Search
- `GET /api/search?name={playerName}&scope={global|match|championship}` - Search player records

## Database Schema

### Tables
- **teams**: Store team information
- **players**: Store players and their team associations
- **championships**: Store championship information
- **matches**: Store match information with team associations
- **batsman_records**: Store batsman statistics with review tracking
- **bowler_records**: Store bowler statistics with review tracking

## User Workflows

### 1. Create Tournament Structure
1. Create a championship
2. Create teams
3. Add players to teams (optional but recommended)
4. Create matches within the championship (ground name and match type added to form)

### 2. Enter Match Data
1. Navigate to a match
2. Add batsman records (name, runs, balls)
3. Add bowler records (name, wickets, runs conceded)

### 3. Review & Update
1. View records in a match
2. Check the reviewed checkbox to mark as reviewed
3. Delete records if needed

### 4. Search Players
1. Use the Search tab on the home page
2. Enter player name
3. Choose search scope (global, match, or championship)
4. View all matching records

## Development Notes

- Database file is stored at `data/cricket.db`
- The database is automatically initialized on first run
- All components use client-side rendering (`'use client'`)
- Responsive design works on desktop and tablet

## Future Enhancements

- Export data to CSV/PDF
- Statistics dashboard (average runs, strike rate, economy)
- User authentication and authorization
- Role-based access control
- Multiple user accounts

## What to do now

1. **Install dependencies** (for local development):
   ```bash
   npm install
   ```

2. **Run the development server**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:3000`.

3. **Interact with the database**
   - The project uses SQLite by default; the database file is at `data/cricket.db`.
   - If you prefer Postgres, run a local Postgres instance and set the `DB_*` environment variables before starting the app.

4. **Building for production**:
   ```bash
   npm run build
   npm start
   ```

5. **Next steps**:
   - Add data via the UI.
   - Explore the API endpoints described above.
   - Consider adding migrations/seeding logic for production deployments.

## License

MIT
