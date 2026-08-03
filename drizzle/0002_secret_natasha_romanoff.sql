CREATE TABLE "superadmins" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"failed_login_attempts" integer DEFAULT 0 NOT NULL,
	"login_locked_until" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "superadmins_email_unique" UNIQUE("email")
);
