DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'RegistrationStatus'
  ) THEN
    CREATE TYPE "RegistrationStatus" AS ENUM ('UNREGISTERED', 'REGISTERED');
  END IF;
END $$;

ALTER TABLE "Employee"
ALTER COLUMN "email" DROP NOT NULL;

ALTER TABLE "Employee"
ADD COLUMN IF NOT EXISTS "registrationStatus" "RegistrationStatus" NOT NULL DEFAULT 'UNREGISTERED';

UPDATE "Employee"
SET "registrationStatus" = 'REGISTERED'
WHERE EXISTS (
  SELECT 1
  FROM "DeviceInfo"
  WHERE "DeviceInfo"."employeeId" = "Employee"."id"
);
