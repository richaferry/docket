ALTER TABLE `settings` ADD `email_provider` text DEFAULT 'smtp' NOT NULL;--> statement-breakpoint
ALTER TABLE `settings` ADD `mailanvil_api_key` text;