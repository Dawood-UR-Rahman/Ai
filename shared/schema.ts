import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceNumber: text("invoice_number").notNull().unique(),
  status: text("status").notNull().default("draft"), // draft, sent, paid, overdue
  
  // Company info
  companyName: text("company_name").notNull(),
  companyEmail: text("company_email").notNull(),
  companyPhone: text("company_phone"),
  companyWebsite: text("company_website"),
  companyAddress: text("company_address"),
  companyLogo: text("company_logo"), // base64 encoded image
  
  // Client info
  clientName: text("client_name").notNull(),
  clientEmail: text("client_email").notNull(),
  clientCompany: text("client_company"),
  clientPhone: text("client_phone"),
  clientAddress: text("client_address"),
  
  // Invoice details
  invoiceDate: text("invoice_date").notNull(),
  dueDate: text("due_date"),
  notes: text("notes"),
  textInformation: text("text_information"),
  shippingCode: text("shipping_code"),
  
  // Financial
  currency: text("currency").notNull().default("USD"),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull().default("0"),
  taxPercentage: decimal("tax_percentage", { precision: 5, scale: 2 }).notNull().default("0"),
  tax: decimal("tax", { precision: 10, scale: 2 }).notNull().default("0"),
  shippingCost: decimal("shipping_cost", { precision: 10, scale: 2 }).notNull().default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull().default("0"),
  
  // Template & design
  template: text("template").notNull().default("classic"),
  primaryColor: text("primary_color").notNull().default("#2563eb"),
  secondaryColor: text("secondary_color").notNull().default("#64748b"),
  fontFamily: text("font_family").notNull().default("Inter"),
  
  // Hosting & security
  isHosted: boolean("is_hosted").default(false),
  isPasswordProtected: boolean("is_password_protected").default(false),
  password: text("password"),
  hostedUrl: text("hosted_url"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const lineItems = pgTable("line_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceId: varchar("invoice_id").notNull().references(() => invoices.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  quantity: integer("quantity").notNull().default(1),
  rate: decimal("rate", { precision: 10, scale: 2 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  hostedUrl: true,
});

export const insertLineItemSchema = createInsertSchema(lineItems).omit({
  id: true,
  invoiceId: true,
});

export const updateInvoiceSchema = insertInvoiceSchema.partial().extend({
  hostedUrl: z.string().optional(),
});

// Email schema for sending invoices
export const sendEmailSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1),
  message: z.string().optional(),
  attachPDF: z.boolean().default(true),
});

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type UpdateInvoice = z.infer<typeof updateInvoiceSchema>;
export type LineItem = typeof lineItems.$inferSelect;
export type InsertLineItem = z.infer<typeof insertLineItemSchema>;
export type SendEmail = z.infer<typeof sendEmailSchema>;

// Frontend-specific types
export type InvoiceWithLineItems = Invoice & {
  lineItems: LineItem[];
};

export type CreateInvoiceRequest = {
  invoice: InsertInvoice;
  lineItems: Omit<InsertLineItem, 'invoiceId'>[];
};
