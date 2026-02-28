Overview:
my website is a sports match intelligence web application that lets users explore championships, view detailed match pages, inspect ball-by-ball events and match records, browse teams and players, and search across the dataset. It provides authenticated access for actions that require login and exposes backend endpoints to support the frontend.

Primary features:

Browse Championships: view a list of championships and open a championship to see its matches.
Match Details: view a match summary (teams, score, date, venue, status) and key metadata.
Ball-by-Ball Events: sequential playback/listing of every recorded event in a match (overs, balls, event type, descriptions, participants).
Match Records: view structured records/statistics tied to a match (e.g., high scores, milestones).
Teams & Players: list teams and view individual team rosters and player details.
Search: query matches, teams, players, and championships via a single search endpoint.
Authentication: simple login and logout to enable session-protected interactions.
Developer-friendly API: REST-like endpoints backing the UI for matches, events, records, championships, teams, players, and search.

Core data entities (conceptual):

Championship: container for matches and seasons.
Match: belongs to a championship; includes teams, score/status, datetime, venue, summary stats.
Event: chronological item within a match (over, ball, type, description, participants).
Record: match-linked statistic or notable entry (type, value, description).
Team: collection of players and team metadata.
Player: individual participant with role and statistics.
Auth session: represents an authenticated user session.