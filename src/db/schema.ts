import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  integer,
  doublePrecision,
  boolean,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const tenants = pgTable("tenants", {
  id: text("id").primaryKey(),
  authSecret: text("auth_secret").notNull(),
  adminEmail: text("admin_email").notNull().unique(),
  adminPasswordHash: text("admin_password_hash"),
  emailVerified: boolean("email_verified").notNull().default(false),
  failedLoginAttempts: integer("failed_login_attempts").notNull().default(0),
  loginLockedUntil: timestamp("login_locked_until", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

export const settings = pgTable("settings", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  tenantId: text("tenant_id")
    .notNull()
    .unique()
    .references(() => tenants.id, { onDelete: "cascade" }),

  businessName: text("business_name").notNull().default(""),
  businessEmail: text("business_email").notNull().default(""),
  businessAddress: text("business_address").notNull().default(""),
  businessPhone: text("business_phone").notNull().default(""),
  logoUrl: text("logo_url"),

  paymentInstructions: text("payment_instructions").notNull().default(""),
  taxLabel: text("tax_label").notNull().default("Tax"),
  defaultTaxRate: doublePrecision("default_tax_rate").notNull().default(0),
  invoicePrefix: text("invoice_prefix").notNull().default("INV-"),
  nextInvoiceNumber: integer("next_invoice_number").notNull().default(1),
  currency: text("currency").notNull().default("USD"),
  defaultTerms: text("default_terms").notNull().default("Payment due within 14 days."),
  defaultPaymentTerms: text("default_payment_terms").notNull().default("net_14"),

  emailProvider: text("email_provider", { enum: ["smtp", "mailanvil"] })
    .notNull()
    .default("smtp"),

  smtpHost: text("smtp_host"),
  smtpPort: integer("smtp_port"),
  smtpSecure: boolean("smtp_secure").notNull().default(false),
  smtpUser: text("smtp_user"),
  smtpPass: text("smtp_pass"),
  fromName: text("from_name"),
  fromEmail: text("from_email"),

  mailanvilApiKey: text("mailanvil_api_key"),
});

export const clients = pgTable(
  "clients",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    company: text("company"),
    email: text("email").notNull(),
    phone: text("phone"),
    address: text("address"),
    status: text("status", { enum: ["lead", "active", "archived"] })
      .notNull()
      .default("lead"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => [index("clients_tenant_id_idx").on(t.tenantId)],
);

export const activities = pgTable(
  "activities",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    clientId: text("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    type: text("type", {
      enum: [
        "note",
        "call",
        "email",
        "meeting",
        "invoice_sent",
        "invoice_paid",
        "payment_received",
        "status_change",
      ],
    }).notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => [index("activities_tenant_id_idx").on(t.tenantId)],
);

export const invoices = pgTable(
  "invoices",
  {
    id: text("id").primaryKey(),
    publicId: text("public_id").notNull().unique(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    number: text("number").notNull(),
    clientId: text("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "restrict" }),
    status: text("status", {
      enum: ["draft", "sent", "paid", "overdue", "cancelled"],
    })
      .notNull()
      .default("draft"),
    issueDate: timestamp("issue_date", { withTimezone: true }).notNull(),
    dueDate: timestamp("due_date", { withTimezone: true }).notNull(),
    paymentTerms: text("payment_terms").notNull().default("net_14"),
    currency: text("currency").notNull().default("USD"),
    taxLabel: text("tax_label").notNull().default("Tax"),
    taxRate: doublePrecision("tax_rate").notNull().default(0),
    discount: doublePrecision("discount").notNull().default(0),
    subtotal: doublePrecision("subtotal").notNull().default(0),
    total: doublePrecision("total").notNull().default(0),
    amountPaid: doublePrecision("amount_paid").notNull().default(0),
    notes: text("notes"),
    terms: text("terms"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => [
    uniqueIndex("invoices_tenant_number_unique").on(t.tenantId, t.number),
    index("invoices_tenant_id_idx").on(t.tenantId),
  ],
);

export const payments = pgTable(
  "payments",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    invoiceId: text("invoice_id")
      .notNull()
      .references(() => invoices.id, { onDelete: "cascade" }),
    amount: doublePrecision("amount").notNull(),
    paidAt: timestamp("paid_at", { withTimezone: true }).notNull(),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => [index("payments_tenant_id_idx").on(t.tenantId)],
);

export const invoiceItems = pgTable(
  "invoice_items",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    invoiceId: text("invoice_id")
      .notNull()
      .references(() => invoices.id, { onDelete: "cascade" }),
    description: text("description").notNull(),
    quantity: doublePrecision("quantity").notNull().default(1),
    unitPrice: doublePrecision("unit_price").notNull().default(0),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [index("invoice_items_tenant_id_idx").on(t.tenantId)],
);
