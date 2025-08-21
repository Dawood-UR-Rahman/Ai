import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertInvoiceSchema, insertLineItemSchema, updateInvoiceSchema, sendEmailSchema, type CreateInvoiceRequest } from "@shared/schema";
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
  host: 'mail.jetourmultan.com',
  port: 465,
  secure: true,
  auth: {
    user: 'accounts@jetourmultan.com',
    pass: 'Dawood@1',
  },
});

const createInvoiceRequestSchema = z.object({
  invoice: insertInvoiceSchema,
  lineItems: z.array(insertLineItemSchema),
});

export async function registerRoutes(app: Express): Promise<Server> {
  console.log('Registering routes...');
  
  // Simple test route to verify routing works
  app.get("/api/test", (req, res) => {
    console.log('Test route accessed');
    res.json({ message: "Routes are working!", timestamp: new Date().toISOString() });
  });
  
  console.log('All API routes registered successfully');
  
  // Add a catch-all route for debugging (this should only catch non-API routes)
  app.use('*', (req, res, next) => {
    if (req.originalUrl.startsWith('/api/')) {
      console.log('API route not matched:', req.method, req.originalUrl);
    }
    console.log('Unmatched route:', req.method, req.originalUrl);
    next();
  });
  
  console.log('Setting up /api/invoices route...');
  // Get all invoices
  app.get("/api/invoices", async (req, res) => {
    console.log('GET /api/invoices route hit!');
    try {
      const invoices = await storage.getAllInvoices();
      console.log('Total invoices in storage:', invoices.length);
      res.json(invoices);
    } catch (error) {
      console.error('Error in /api/invoices:', error);
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

      const invoiceViewUrl = invoice.hostedUrl || `https://workspace-1755760863815.replit.app/view/${invoice.id}`;
      
      const mailOptions = {
        from: 'accounts@jetourmultan.com',
        to: validatedData.to,
        subject: validatedData.subject || `Invoice ${invoice.invoiceNumber}`,
        text: validatedData.message || `Please find your invoice details below.\n\nView Online: ${invoiceViewUrl}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h2 style="color: #333; margin: 0;">Invoice ${invoice.invoiceNumber}</h2>
              <p style="color: #666; margin: 5px 0 0 0;">from ${invoice.companyName}</p>
            </div>
            
            <p>Dear ${invoice.clientName},</p>
            <p>${validatedData.message || 'Please find your invoice details below.'}</p>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0;">
              <h3 style="color: #333; margin-top: 0;">Invoice Details:</h3>
              <ul style="list-style: none; padding: 0; margin: 0;">
                <li style="padding: 8px 0; border-bottom: 1px solid #e0e0e0;"><strong>Invoice Number:</strong> ${invoice.invoiceNumber}</li>
                <li style="padding: 8px 0; border-bottom: 1px solid #e0e0e0;"><strong>Date:</strong> ${new Date(invoice.invoiceDate).toLocaleDateString()}</li>
                <li style="padding: 8px 0; border-bottom: 1px solid #e0e0e0;"><strong>Total Amount:</strong> <span style="color: #28a745; font-size: 1.2em;">$${invoice.total}</span></li>
                ${invoice.dueDate ? `<li style="padding: 8px 0;"><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}</li>` : ''}
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${invoiceViewUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">📄 View Invoice Online</a>
            </div>
            
            <p style="font-size: 14px; color: #666; margin-top: 30px;">You can view and download your invoice anytime by clicking the link above.</p>
            
            <hr style="border: none; height: 1px; background-color: #e0e0e0; margin: 30px 0;">
            
            <p>Thank you for your business!</p>
            <p style="margin: 0;">Best regards,<br><strong>${invoice.companyName}</strong></p>
            ${invoice.companyEmail ? `<p style="margin: 5px 0 0 0; color: #666;">📧 ${invoice.companyEmail}</p>` : ''}
            ${invoice.companyPhone ? `<p style="margin: 5px 0 0 0; color: #666;">📞 ${invoice.companyPhone}</p>` : ''}
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      
      // Update invoice status to sent and ensure hosted URL is set if hosting enabled
      const updateData: any = { status: "sent" };
      if (invoice.isHosted && !invoice.hostedUrl) {
        updateData.hostedUrl = `https://workspace-1755760863815.replit.app/view/${invoice.id}`;
      }
      await storage.updateInvoice(req.params.id, updateData);
      
      res.json({ message: "Email sent successfully" });
    } catch (error) {
      console.error('Email sending failed:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to send email" });
    }
  });

  // Public invoice routes are now handled by the frontend at /view/:id

  const httpServer = createServer(app);
  return httpServer;
}
