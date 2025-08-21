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

      const invoiceViewUrl = invoice.hostedUrl || `https://workspace-1755760863815.replit.app/invoice/${invoice.id}`;
      
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

  // Preview route for QR code generation
  app.get("/invoice/preview", async (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice Preview</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background-color: #f5f5f5; }
          .container { max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .icon { font-size: 64px; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">📄</div>
          <h1>Invoice Preview</h1>
          <p>This is a preview of how your QR code will work.</p>
          <p>When you create an invoice and enable hosting, the QR code will link directly to the invoice view.</p>
        </div>
      </body>
      </html>
    `);
  });

  // Get invoice by public URL (for hosted invoices)
  app.get("/invoice/:id", async (req, res) => {
    try {
      const invoice = await storage.getInvoice(req.params.id);
      if (!invoice) {
        return res.status(404).send(`
          <!DOCTYPE html>
          <html><head><title>Invoice Not Found</title></head>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h1>Invoice Not Found</h1>
            <p>The requested invoice could not be found.</p>
          </body></html>
        `);
      }

      // Password protection check
      if (invoice.isPasswordProtected && req.query.password !== invoice.password) {
        return res.send(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Password Protected - Invoice ${invoice.invoiceNumber}</title>
            <style>
              body { font-family: Arial, sans-serif; max-width: 400px; margin: 100px auto; padding: 20px; text-align: center; }
              .form-group { margin: 20px 0; }
              input[type="password"] { width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 4px; }
              button { background-color: #007bff; color: white; padding: 12px 24px; border: none; border-radius: 4px; cursor: pointer; }
              button:hover { background-color: #0056b3; }
            </style>
          </head>
          <body>
            <h2>🔒 Password Protected</h2>
            <p>This invoice is password protected. Please enter the password to continue.</p>
            <form method="GET">
              <div class="form-group">
                <input type="password" name="password" placeholder="Enter password" required autofocus>
              </div>
              <button type="submit">Access Invoice</button>
            </form>
          </body>
          </html>
        `);
      }

      // Enhanced HTML template for public invoice view
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Invoice ${invoice.invoiceNumber} - ${invoice.companyName}</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; background-color: #f5f5f5; }
            .container { max-width: 800px; margin: 0 auto; background: white; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
            .header { display: flex; justify-content: space-between; align-items: flex-start; padding: 40px; border-bottom: 2px solid #eee; }
            .company-info { flex: 1; }
            .company-logo { width: 120px; height: 80px; object-fit: contain; margin-bottom: 15px; }
            .company-name { font-size: 24px; font-weight: bold; color: #333; margin-bottom: 5px; }
            .invoice-info { text-align: right; }
            .invoice-title { font-size: 36px; font-weight: bold; color: #007bff; margin-bottom: 10px; }
            .invoice-number { font-size: 18px; color: #666; }
            .bill-to { padding: 30px 40px; background-color: #f8f9fa; }
            .section-title { font-size: 16px; font-weight: bold; color: #333; margin-bottom: 10px; }
            .table-container { padding: 0 40px; }
            table { width: 100%; border-collapse: collapse; margin: 30px 0; }
            th { background-color: #007bff; color: white; padding: 15px; text-align: left; font-weight: bold; }
            td { padding: 15px; border-bottom: 1px solid #eee; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .totals { padding: 20px 40px; text-align: right; border-top: 2px solid #eee; }
            .total-row { display: flex; justify-content: space-between; margin: 10px 0; }
            .grand-total { font-size: 24px; font-weight: bold; color: #007bff; padding-top: 15px; border-top: 2px solid #333; }
            .notes { padding: 30px 40px; background-color: #f8f9fa; }
            .download-btn { display: block; width: fit-content; margin: 20px auto; padding: 15px 30px; background-color: #28a745; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; }
            .download-btn:hover { background-color: #218838; }
            @media print {
              body { background-color: white; }
              .container { box-shadow: none; }
              .download-btn { display: none; }
            }
            @media (max-width: 600px) {
              .header { flex-direction: column; }
              .invoice-info { text-align: left; margin-top: 20px; }
              .container { margin: 0; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="company-info">
                ${invoice.companyLogo ? `<img src="${invoice.companyLogo}" alt="Company Logo" class="company-logo">` : ''}
                <div class="company-name">${invoice.companyName}</div>
                <div>${invoice.companyEmail}</div>
                ${invoice.companyPhone ? `<div>📞 ${invoice.companyPhone}</div>` : ''}
                ${invoice.companyWebsite ? `<div>🌐 ${invoice.companyWebsite}</div>` : ''}
                ${invoice.companyAddress ? `<div style="margin-top: 10px; white-space: pre-line;">${invoice.companyAddress}</div>` : ''}
              </div>
              <div class="invoice-info">
                <div class="invoice-title">INVOICE</div>
                <div class="invoice-number">#${invoice.invoiceNumber}</div>
                <div style="margin-top: 15px;">
                  <div><strong>Date:</strong> ${new Date(invoice.invoiceDate).toLocaleDateString()}</div>
                  ${invoice.dueDate ? `<div><strong>Due:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}</div>` : ''}
                </div>
              </div>
            </div>
            
            <div class="bill-to">
              <div class="section-title">Bill To:</div>
              <div style="font-weight: bold;">${invoice.clientName}</div>
              ${invoice.clientCompany ? `<div>${invoice.clientCompany}</div>` : ''}
              <div>${invoice.clientEmail}</div>
              ${invoice.clientPhone ? `<div>📞 ${invoice.clientPhone}</div>` : ''}
              ${invoice.clientAddress ? `<div style="margin-top: 5px; white-space: pre-line;">${invoice.clientAddress}</div>` : ''}
            </div>
            
            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Description</th>
                    <th class="text-center">Qty</th>
                    <th class="text-right">Rate</th>
                    <th class="text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${invoice.lineItems.map(item => `
                    <tr>
                      <td>${item.description}</td>
                      <td class="text-center">${item.quantity}</td>
                      <td class="text-right">$${item.rate}</td>
                      <td class="text-right">$${item.amount}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
            
            <div class="totals">
              <div class="total-row">
                <span>Subtotal:</span>
                <span>$${invoice.subtotal}</span>
              </div>
              <div class="total-row">
                <span>Tax:</span>
                <span>$${invoice.tax}</span>
              </div>
              <div class="total-row grand-total">
                <span>Total:</span>
                <span>$${invoice.total}</span>
              </div>
            </div>
            
            ${invoice.notes ? `
              <div class="notes">
                <div class="section-title">Notes:</div>
                <div style="white-space: pre-line;">${invoice.notes}</div>
              </div>
            ` : ''}
            
            <a href="javascript:window.print()" class="download-btn">🖨️ Print Invoice</a>
          </div>
        </body>
        </html>
      `;
      
      res.send(html);
    } catch (error) {
      console.error('Error loading public invoice:', error);
      res.status(500).send(`
        <!DOCTYPE html>
        <html><head><title>Error</title></head>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h1>Error Loading Invoice</h1>
          <p>There was an error loading the invoice. Please try again later.</p>
        </body></html>
      `);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
