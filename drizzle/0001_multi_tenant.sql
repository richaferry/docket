CREATE TABLE "tenants" (
	"id" text PRIMARY KEY NOT NULL,
	"auth_secret" text NOT NULL,
	"admin_email" text NOT NULL,
	"admin_password_hash" text,
	"email_verified" boolean DEFAULT false NOT NULL,
	"failed_login_attempts" integer DEFAULT 0 NOT NULL,
	"login_locked_until" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_admin_email_unique" UNIQUE("admin_email");
--> statement-breakpoint
INSERT INTO "tenants" ("id", "auth_secret", "admin_email", "admin_password_hash", "email_verified", "failed_login_attempts", "login_locked_until")
SELECT
	'mt-' || substr(md5(random()::text || clock_timestamp()::text), 1, 24),
	COALESCE(s."auth_secret", 'legacy-' || substr(md5(random()::text || clock_timestamp()::text), 1, 32)),
	COALESCE(s."admin_email", 'legacy-' || substr(md5(random()::text || clock_timestamp()::text), 1, 16) || '@setup.local'),
	s."admin_password_hash",
	true,
	s."failed_login_attempts",
	s."login_locked_until"
FROM "settings" s;
--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "tenant_id" text;
--> statement-breakpoint
UPDATE "settings" SET "tenant_id" = (SELECT t."id" FROM "tenants" t LIMIT 1) WHERE "tenant_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "settings" ALTER COLUMN "tenant_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "settings" ADD CONSTRAINT "settings_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "settings" ADD CONSTRAINT "settings_tenant_id_unique" UNIQUE("tenant_id");
--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "tenant_id" text;
--> statement-breakpoint
UPDATE "clients" SET "tenant_id" = (SELECT t."id" FROM "tenants" t LIMIT 1) WHERE "tenant_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "clients" ALTER COLUMN "tenant_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "clients_tenant_id_idx" ON "clients" USING btree ("tenant_id");
--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "tenant_id" text;
--> statement-breakpoint
UPDATE "activities" SET "tenant_id" = (SELECT t."id" FROM "tenants" t LIMIT 1) WHERE "tenant_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "activities" ALTER COLUMN "tenant_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "activities_tenant_id_idx" ON "activities" USING btree ("tenant_id");
--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "tenant_id" text;
--> statement-breakpoint
UPDATE "invoices" SET "tenant_id" = (SELECT t."id" FROM "tenants" t LIMIT 1) WHERE "tenant_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "invoices" ALTER COLUMN "tenant_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "invoices" DROP CONSTRAINT "invoices_number_unique";
--> statement-breakpoint
CREATE UNIQUE INDEX "invoices_tenant_number_unique" ON "invoices" USING btree ("tenant_id","number");
--> statement-breakpoint
CREATE INDEX "invoices_tenant_id_idx" ON "invoices" USING btree ("tenant_id");
--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "tenant_id" text;
--> statement-breakpoint
UPDATE "payments" SET "tenant_id" = (SELECT t."id" FROM "tenants" t LIMIT 1) WHERE "tenant_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "tenant_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "payments_tenant_id_idx" ON "payments" USING btree ("tenant_id");
--> statement-breakpoint
ALTER TABLE "invoice_items" ADD COLUMN "tenant_id" text;
--> statement-breakpoint
UPDATE "invoice_items" SET "tenant_id" = (SELECT t."id" FROM "tenants" t LIMIT 1) WHERE "tenant_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "invoice_items" ALTER COLUMN "tenant_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "invoice_items_tenant_id_idx" ON "invoice_items" USING btree ("tenant_id");
--> statement-breakpoint
ALTER TABLE "settings" DROP COLUMN "auth_secret";
--> statement-breakpoint
ALTER TABLE "settings" DROP COLUMN "admin_email";
--> statement-breakpoint
ALTER TABLE "settings" DROP COLUMN "admin_password_hash";
--> statement-breakpoint
ALTER TABLE "settings" DROP COLUMN "failed_login_attempts";
--> statement-breakpoint
ALTER TABLE "settings" DROP COLUMN "login_locked_until";
