import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertInvoiceSchema, updateInvoiceSchema, sendEmailSchema, type CreateInvoiceRequest } from "@shared/schema";
import { z } from "zod";
import nodemailer from "nodemailer";
import multer from "multer";

// Configure multer for file uploads
const upload = multer({
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: (req: any, file: any, cb: any) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Configure nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: parseInt(process.env.SMTP_PORT || '587') === 465,
  auth: {
    user: process.env.SMTP_USER || process.env.EMAIL_USER,
    pass: process.env.SMTP_PASS || process.env.EMAIL_PASS,
  },
});

const createInvoiceRequestSchema = z.object({
  invoice: insertInvoiceSchema,
  lineItems: z.array(z.object({
    description: z.string().min(1),
    quantity: z.number().int().min(1),
    rate: z.string().regex(/^\d+(\.\d{1,2})?$/),
    amount: z.string().regex(/^\d+(\.\d{1,2})?$/),
  })),
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Get all invoices
  app.get("/api/invoices", async (req, res) => {
    try {
      const invoices = await storage.getAllInvoices();
      res.json(invoices);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  // Get single invoice
  app.get("/api/invoices/:id", async (req, res) => {
    try {
      const invoice = await storage.getInvoice(req.params.id);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      res.json(invoice);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch invoice" });
    }
  });

  // Create new invoice
  app.post("/api/invoices", async (req, res) => {
    try {
      const validatedData = createInvoiceRequestSchema.parse(req.body);
      const invoice = await storage.createInvoice(validatedData);
      res.status(201).json(invoice);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create invoice" });
    }
  });

  // Update invoice
  app.patch("/api/invoices/:id", async (req, res) => {
    try {
      const validatedData = updateInvoiceSchema.parse(req.body);
      const invoice = await storage.updateInvoice(req.params.id, validatedData);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      res.json(invoice);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update invoice" });
    }
  });

  // Delete invoice
  app.delete("/api/invoices/:id", async (req, res) => {
    try {
      const success = await storage.deleteInvoice(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete invoice" });
    }
  });

  // Upload logo
  app.post("/api/upload-logo", upload.single('logo'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Convert to base64
      const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      
      res.json({ logo: base64 });
    } catch (error) {
      res.status(500).json({ message: "Failed to upload logo" });
    }
  });

  // Send invoice via email
  app.post("/api/invoices/:id/send-email", async (req, res) => {
    try {
      const validatedData = sendEmailSchema.parse(req.body);
      const invoice = await storage.getInvoice(req.params.id);
      
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      const mailOptions = {
        from: process.env.SMTP_USER || process.env.EMAIL_USER,
        to: validatedData.to,
        subject: validatedData.subject || `Invoice ${invoice.invoiceNumber}`,
        text: validatedData.message || `Please find attached invoice ${invoice.invoiceNumber}.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Invoice ${invoice.invoiceNumber}</h2>
            <p>Dear ${invoice.clientName},</p>
            <p>${validatedData.message || 'Please find attached your invoice.'}</p>
            <p>Invoice Details:</p>
            <ul>
              <li>Invoice Number: ${invoice.invoiceNumber}</li>
              <li>Date: ${invoice.invoiceDate}</li>
              <li>Total: $${invoice.total}</li>
            </ul>
            <p>Thank you for your business!</p>
            <p>Best regards,<br>${invoice.companyName}</p>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      
      // Update invoice status to sent
      await storage.updateInvoice(req.params.id, { status: "sent" });
      
      res.json({ message: "Email sent successfully" });
    } catch (error) {
      console.error('Email sending failed:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to send email" });
    }
  });

  // Get invoice by public URL (for hosted invoices)
  app.get("/invoice/:id", async (req, res) => {
    try {
      const invoice = await storage.getInvoice(req.params.id);
      if (!invoice || !invoice.isHosted) {
        return res.status(404).json({ message: "Invoice not found or not publicly accessible" });
      }

      // Simple HTML template for public invoice view
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Invoice ${invoice.invoiceNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
            .total { font-weight: bold; font-size: 1.2em; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>${invoice.companyName}</h1>
              <p>${invoice.companyEmail}</p>
            </div>
            <div>
              <h2>INVOICE</h2>
              <p>${invoice.invoiceNumber}</p>
            </div>
          </div>
          <div>
            <h3>Bill To:</h3>
            <p>${invoice.clientName}</p>
            <p>${invoice.clientEmail}</p>
          </div>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
              <tr style="border-bottom: 1px solid #ddd;">
                <th style="text-align: left; padding: 10px;">Description</th>
                <th style="text-align: center; padding: 10px;">Qty</th>
                <th style="text-align: right; padding: 10px;">Rate</th>
                <th style="text-align: right; padding: 10px;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.lineItems.map(item => `
                <tr style="border-bottom: 1px solid #eee;">
                  <td style="padding: 10px;">${item.description}</td>
                  <td style="text-align: center; padding: 10px;">${item.quantity}</td>
                  <td style="text-align: right; padding: 10px;">$${item.rate}</td>
                  <td style="text-align: right; padding: 10px;">$${item.amount}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div style="text-align: right; margin-top: 20px;">
            <p class="total">Total: $${invoice.total}</p>
          </div>
        </body>
        </html>
      `;
      
      res.send(html);
    } catch (error) {
      res.status(500).json({ message: "Failed to load invoice" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
