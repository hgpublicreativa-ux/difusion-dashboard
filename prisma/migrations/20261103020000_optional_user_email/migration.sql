-- Members can be created before their email is known. Existing emails stay.
ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL;
