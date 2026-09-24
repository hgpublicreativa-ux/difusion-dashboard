-- Merge any existing duplicate ActivityLog rows for the same (userId, date)
-- before enforcing the new unique constraint. Keeps the earliest row per
-- user/day, sums its numeric metrics, and merges the Facebook links arrays.

UPDATE "ActivityLog" a
SET
  "whatsappGroupsReached" = agg.wa_groups,
  "whatsappMessagesPerGroup" = agg.wa_messages,
  "fbOwnPostsCreated" = agg.fb_posts,
  "fbCommentsMade" = agg.fb_comments,
  "fbGroupsShared" = agg.fb_shared,
  "fbNewGroupsJoined" = agg.fb_new,
  "fbOwnPostsLinks" = agg.links
FROM (
  SELECT
    t."userId",
    t.date,
    SUM(t."whatsappGroupsReached") AS wa_groups,
    SUM(t."whatsappMessagesPerGroup") AS wa_messages,
    SUM(t."fbOwnPostsCreated") AS fb_posts,
    SUM(t."fbCommentsMade") AS fb_comments,
    SUM(t."fbGroupsShared") AS fb_shared,
    SUM(t."fbNewGroupsJoined") AS fb_new,
    COALESCE(
      (
        SELECT array_agg(DISTINCT elem)
        FROM "ActivityLog" al2, unnest(al2."fbOwnPostsLinks") AS elem
        WHERE al2."userId" = t."userId" AND al2.date = t.date
      ),
      ARRAY[]::TEXT[]
    ) AS links
  FROM "ActivityLog" t
  GROUP BY t."userId", t.date
) agg
WHERE a."userId" = agg."userId"
  AND a.date = agg.date
  AND a.id = (
    SELECT id FROM "ActivityLog" b
    WHERE b."userId" = a."userId" AND b.date = a.date
    ORDER BY b."createdAt" ASC
    LIMIT 1
  );

-- Remove the now-redundant duplicate rows, keeping only the earliest per user/day
DELETE FROM "ActivityLog" a
WHERE a.id NOT IN (
  SELECT DISTINCT ON ("userId", date) id
  FROM "ActivityLog"
  ORDER BY "userId", date, "createdAt" ASC
);

-- CreateIndex
CREATE UNIQUE INDEX "ActivityLog_userId_date_key" ON "ActivityLog"("userId", "date");
