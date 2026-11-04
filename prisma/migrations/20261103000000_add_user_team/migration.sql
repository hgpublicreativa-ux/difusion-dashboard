-- Teams: every existing user stays in TEAM1, nothing else changes
CREATE TYPE "Team" AS ENUM ('TEAM1', 'TEAM2');

ALTER TABLE "User" ADD COLUMN "team" "Team" NOT NULL DEFAULT 'TEAM1';

CREATE INDEX "User_team_idx" ON "User"("team");
