CREATE TABLE `activities` (
	`id` text PRIMARY KEY NOT NULL,
	`client_id` text NOT NULL,
	`type` text NOT NULL,
	`content` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `clients` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`company` text,
	`email` text NOT NULL,
	`phone` text,
	`address` text,
	`status` text DEFAULT 'lead' NOT NULL,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `invoice_items` (
	`id` text PRIMARY KEY NOT NULL,
	`invoice_id` text NOT NULL,
	`description` text NOT NULL,
	`quantity` real DEFAULT 1 NOT NULL,
	`unit_price` real DEFAULT 0 NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` text PRIMARY KEY NOT NULL,
	`public_id` text NOT NULL,
	`number` text NOT NULL,
	`client_id` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`issue_date` integer NOT NULL,
	`due_date` integer NOT NULL,
	`currency` text DEFAULT 'USD' NOT NULL,
	`tax_label` text DEFAULT 'Tax' NOT NULL,
	`tax_rate` real DEFAULT 0 NOT NULL,
	`discount` real DEFAULT 0 NOT NULL,
	`subtotal` real DEFAULT 0 NOT NULL,
	`total` real DEFAULT 0 NOT NULL,
	`notes` text,
	`terms` text,
	`sent_at` integer,
	`paid_at` integer,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `invoices_public_id_unique` ON `invoices` (`public_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `invoices_number_unique` ON `invoices` (`number`);--> statement-breakpoint
CREATE TABLE `settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`auth_secret` text NOT NULL,
	`admin_email` text,
	`admin_password_hash` text,
	`business_name` text DEFAULT '' NOT NULL,
	`business_email` text DEFAULT '' NOT NULL,
	`business_address` text DEFAULT '' NOT NULL,
	`business_phone` text DEFAULT '' NOT NULL,
	`logo_url` text,
	`payment_instructions` text DEFAULT '' NOT NULL,
	`tax_label` text DEFAULT 'Tax' NOT NULL,
	`default_tax_rate` real DEFAULT 0 NOT NULL,
	`invoice_prefix` text DEFAULT 'INV-' NOT NULL,
	`next_invoice_number` integer DEFAULT 1 NOT NULL,
	`currency` text DEFAULT 'USD' NOT NULL,
	`default_terms` text DEFAULT 'Payment due within 14 days.' NOT NULL,
	`smtp_host` text,
	`smtp_port` integer,
	`smtp_secure` integer DEFAULT false NOT NULL,
	`smtp_user` text,
	`smtp_pass` text,
	`from_name` text,
	`from_email` text
);
