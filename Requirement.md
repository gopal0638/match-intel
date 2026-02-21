# Cricket Data Management System - Project Requirements

## 1. Project Overview

A web-based cricket data management platform to store, organize, and search cricket match records. The system enables users to manage teams, championships, matches, and player performance data with review tracking capabilities.

**Tech Stack:** Next.js (Node.js backend) + React (frontend)

---

## 2. Core Data Entities

### 2.1 Teams
- Team name
- Team members/players list

### 2.2 Players
- Player name
- Associated team
- **Player Type** (batsman, bowler, all rounder, extra player, impact player)
- Player records across matches

### 2.3 Championships
- Championship name
- Matches associated with championship

### 2.4 Matches
- Match ID
- Championship association
- Match date
- Teams playing
- Players statistics (batsman, bowler)

### 2.5 Players / Match Records
- **Batsman Data**
  - Name
  - Runs scored
  - Balls faced

- **Bowler Data**
  - Name
  - Wickets taken
  - Runs conceded

---

## 3. Key Features

### 3.1 Data Management
- Add new teams, championships, and matches
- **Add and manage team players** with player type selection:
  - 🏏 Batsman - Specialist batsmen
  - 🎯 Bowler - Specialist bowlers
  - ⭐ All Rounder - Can bat and bowl
  - 👤 Extra Player - Reserve/backup player
  - 💥 Impact Player - Dynamic match-changing player
- Add match records (batsman & bowler statistics) when entering a match
- Update existing records for teams, championships, and match data
- Delete records (if needed)

### 3.2 Review System
- Input box to add review/comments for each match record
- Checkbox to mark a record as "reviewed" when a comment is added
- Track review status per entry

### 3.3 Search Functionality
- Search match records by player name
- **Search Scope:**
  - By matches (search within a specific match)
  - By championship (search across all matches in a championship)

---

## 4. User Workflows

### 4.1 Create Tournament Structure
1. Create a championship
2. Add teams to the championship
3. **Add players to teams** (optional but recommended)
4. Create matches within the championship

### 4.2 Manage Team Players
1. Click on a team to expand it
2. Add player names with their player type (required field)
3. Select player type from dropdown:
   - Batsman (specialist batsmen)
   - Bowler (specialist bowlers)
   - All Rounder (can perform both batting and bowling)
   - Extra Player (reserve/backup players)
   - Impact Player (match-changing players)
4. View all team members with their types
5. Remove players as needed

### 4.3 Enter Match Data
1. Select/create a match
2. Add batsman records (name, runs, balls)
3. Add bowler records (name, wickets, runs conceded)
4. Submit match data

### 4.4 Review & Update
1. View all records for a match/championship
2. Add review comments via input box
3. Mark record as reviewed via checkbox
4. Update any field as needed

### 4.5 Search & Filter
1. Search for a player by name
2. Scope search to: single match or entire championship
3. View all records matching the search criteria

---

## 5. Non-Functional Requirements
- Responsive design for desktop and tablet
- Data persistence (database storage)
- User-friendly interface with expandable team sections
- Fast search performance
- Team-player relationship with cascade delete support
- Prevent duplicate players within the same team

---

## 7. UI/UX Improvements (Implemented)

### 7.1 Visual Enhancements
- **Gradient Backgrounds**: Modern gradient color schemes on headers and sections (blue, amber, green, purple themes)
- **Emoji Icons**: Added contextual emojis for better visual communication:
  - 🏏 Cricket bat for batting/batsmen sections
  - 🏆 Trophy for championships
  - 👥 People for teams section
  - 🎯 Target for bowlers/targeting
  - 🔍 Magnifying glass for search
  - 📊 Chart for dashboard tab
  - 🏟️ Stadium for match venues
  - 🎯 More specific icons for different sections

### 7.2 Card & Section Styling
- **Rounded Borders**: `rounded-xl` for modern appearance
- **Shadows**: Enhanced box shadows (`shadow-lg`) for depth and hierarchy
- **Border Treatments**: Subtle gray borders (1px solid) for visual separation
- **Hover Effects**:
  - Scale transforms (`hover:scale-105`) for interactive feedback
  - Gradient backgrounds on hover
  - Smooth transitions (200ms default)
- **Padding & Spacing**: Increased padding (`p-8`) and spacing (`space-y-8`) for better readability

### 7.3 Color Coding
- **Green Theme**: Batsmen records, player records (growth/positive metrics)
- **Purple Theme**: Bowler records, technical metrics
- **Blue Theme**: Dashboard, primary actions, general sections
- **Amber/Orange Theme**: Championships, tournaments
- **Red Theme**: Delete actions, warnings

### 7.4 Form Improvements
- **Input Styling**: Larger inputs with `py-3` padding and focus ring styling
- **Labels**: Semibold labels with improved spacing
- **Placeholder Text**: Descriptive placeholders for better UX
- **Button States**:
  - Primary buttons with color gradients
  - Disabled states with reduced opacity
  - Hover effects with scale transform
  - Loading states with animated text (🔄, ✅)

### 7.5 Badge & Counter Elements
- **Section Counters**: Colored badges showing item counts (e.g., "5" teams, "3" matches)
- **Review Status**: Color-coded indicators:
  - Blue for "✅ Reviewed"
  - Yellow for "⏳ Not Reviewed"
- **Status Pills**: Rounded pill-shaped badges for status information

### 7.6 Typography
- **Header Sizes**: Larger, bolder headers (`text-3xl`, `text-4xl`) for hierarchy
- **Font Weights**: Strategic use of semibold and bold for emphasis
- **Text Colors**: Improved contrast and semantic color usage

### 7.7 Component-Specific Improvements

#### Page.tsx (Dashboard)
- Gradient header from blue-600 to blue-900
- Cricket bat emoji (🏏) in header
- Tab navigation with emojis (📊 Dashboard, 🔍 Search)
- Active tab styling with scale transform
- Fade-in animation for content

#### TeamsSection.tsx
- Team count badge in blue color scheme
- Stadium emoji for each team
- Expandable team cards with gradient hover effects
- Improved form styling for team creation

#### ChampionshipsSection.tsx
- Trophy emoji header (🏆)
- Amber color scheme (amber-600/700)
- Tournament count badge
- Target emoji (🎯) for championship cards
- Gradient link backgrounds with hover scale transforms

#### SearchSection.tsx
- Magnifying glass emoji header (🔍)
- Separate sections for batsman and bowler results
- Green backgrounds for batsman cards
- Purple backgrounds for bowler cards
- Strike rate and economy metrics displayed prominently
- Result count badges for each category
- Enhanced search form with proper labels and spacing

#### MatchDetails.tsx
- Separate sections for batsmen (🏏) and bowlers (🎯)
- Green cards for batsman records
- Purple cards for bowler records
- Expanded metrics display (runs, balls, strike rate for batsmen; wickets, runs, economy for bowlers)
- Large counters for key statistics
- Review checkboxes with custom styling
- Comment display with visual styling

#### MatchesSection.tsx
- Stadium emoji (🏟️) with match count badge
- Team names displayed prominently with 🏏 cricket emoji
- Match date with 📅 calendar emoji
- Gradient hover effects on match cards
- "Enter Data" button styling

#### Championship[id]/page.tsx
- Amber gradient header (amber-600 to amber-800)
- Trophy emoji in header
- Consistent styling with championship theme

#### TeamPlayers.tsx (Updated)
- **Player Type Selection**: Dropdown menu with 5 player type options
- **Type Emoji Indicators**:
  - 🏏 Batsman
  - 🎯 Bowler
  - ⭐ All Rounder
  - 👤 Extra Player
  - 💥 Impact Player
- Player count badge showing total players in team
- Improved form with labels for player name and type
- Better card styling with player type displayed prominently
- Enhanced visual hierarchy with gradients and hover effects

#### Championship[id]/page.tsx
- Amber gradient header (amber-600 to amber-800)
- Trophy emoji in header
- Consistent styling with championship theme

#### Matches[id]/page.tsx
- Blue gradient header (blue-600 to blue-900)
- Target emoji in header
- Consistent styling with match theme

### 7.8 Responsive Design
- Mobile-first design approach
- Grid layouts that adapt (grid-cols-1 for mobile, responsive for desktop)
- Touch-friendly button sizes and spacing
- Readable text on all screen sizes

---

## 8. Player Type System

### 8.1 Player Types
The system supports five distinct player types for team roster management:

1. **🏏 Batsman** - Specialist batsmen focused on scoring runs
2. **🎯 Bowler** - Specialist bowlers focused on taking wickets
3. **⭐ All Rounder** - Versatile players skilled in both batting and bowling
4. **👤 Extra Player** - Reserve or backup players not in the primary 11
5. **💥 Impact Player** - Dynamic players who can change the course of a match

### 8.2 Player Type Usage
- Player type is displayed on team roster cards with corresponding emoji
- Helps in understanding team composition and strategy
- Useful for match planning and player selection
- Can be used for future analytics and statistics filtering
- Default type is "All Rounder" for new players

---

## 9. Future UI Enhancements (Optional)
- Dark mode toggle
- Custom color themes for different championship types
- Animated transitions between pages
- Progress bars for match data completion
- Charts and graphs for statistics
- Mobile app version with touch optimizations
- Accessibility improvements (ARIA labels, keyboard navigation)
- Player statistics filtering by player type
- Team composition analysis reports
```