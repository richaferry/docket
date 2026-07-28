ALTER TABLE `invoices` ADD `payment_terms` text DEFAULT 'net_14' NOT NULL;--> statement-breakpoint
ALTER TABLE `settings` ADD `default_payment_terms` text DEFAULT 'net_14' NOT NULL;