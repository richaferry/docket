import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const clients = sqliteTable("clients", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  company: text("company"),
  email: text("email").notNull(),
  phone: text("phone"),
  address: text("address"),
  status: text("status", { enum: ["lead", "active", "archived"] })
    .notNull()
    .default("lead"),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch('subsec') * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch('subsec') * 1000)`),
});

export const activities = sqliteTable("activities", {
  id: text("id").primaryKey(),
  clientId: text("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  type: text("type", {
    enum: ["note", "call", "email", "meeting", "invoice_sent", "invoice_paid", "status_change"],
  }).notNull(),
  content: text("content").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch('subsec') * 1000)`),
});

export const invoices = sqliteTable("invoices", {
  id: text("id").primaryKey(),
  publicId: text("public_id").notNull().unique(),
  number: text("number").notNull().unique(),
  clientId: text("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "restrict" }),
  status: text("status", {
    enum: ["draft", "sent", "paid", "overdue", "cancelled"],
  })
    .notNull()
    .default("draft"),
  issueDate: integer("issue_date", { mode: "timestamp_ms" }).notNull(),
  dueDate: integer("due_date", { mode: "timestamp_ms" }).notNull(),
  currency: text("currency").notNull().default("USD"),
  taxLabel: text("tax_label").notNull().default("Tax"),
  taxRate: real("tax_rate").notNull().default(0),
  discount: real("discount").notNull().default(0),
  subtotal: real("subtotal").notNull().default(0),
  total: real("total").notNull().default(0),
  notes: text("notes"),
  terms: text("terms"),
  sentAt: integer("sent_at", { mode: "timestamp_ms" }),
  paidAt: integer("paid_at", { mode: "timestamp_ms" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch('subsec') * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch('subsec') * 1000)`),
});

export const invoiceItems = sqliteTable("invoice_items", {
  id: text("id").primaryKey(),
  invoiceId: text("invoice_id")
    .notNull()
    .references(() => invoices.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  quantity: real("quantity").notNull().default(1),
  unitPrice: real("unit_price").notNull().default(0),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const settings = sqliteTable("settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  authSecret: text("auth_secret").notNull(),
  adminEmail: text("admin_email"),
  adminPasswordHash: text("admin_password_hash"),

  businessName: text("business_name").notNull().default(""),
  businessEmail: text("business_email").notNull().default(""),
  businessAddress: text("business_address").notNull().default(""),
  businessPhone: text("business_phone").notNull().default(""),
  logoUrl: text("logo_url"),

  paymentInstructions: text("payment_instructions").notNull().default(""),
  taxLabel: text("tax_label").notNull().default("Tax"),
  defaultTaxRate: real("default_tax_rate").notNull().default(0),
  invoicePrefix: text("invoice_prefix").notNull().default("INV-"),
  nextInvoiceNumber: integer("next_invoice_number").notNull().default(1),
  currency: text("currency").notNull().default("USD"),
  defaultTerms: text("default_terms").notNull().default("Payment due within 14 days."),
  publicUrl: text("public_url"),

  emailProvider: text("email_provider", { enum: ["smtp", "mailanvil"] })
    .notNull()
    .default("smtp"),

  smtpHost: text("smtp_host"),
  smtpPort: integer("smtp_port"),
  smtpSecure: integer("smtp_secure", { mode: "boolean" }).notNull().default(false),
  smtpUser: text("smtp_user"),
  smtpPass: text("smtp_pass"),
  fromName: text("from_name"),
  fromEmail: text("from_email"),

  mailanvilApiKey: text("mailanvil_api_key"),
});
