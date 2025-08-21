import { type Invoice, type InsertInvoice, type UpdateInvoice, type LineItem, type InsertLineItem, type InvoiceWithLineItems, type CreateInvoiceRequest } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Invoice operations
  getInvoice(id: string): Promise<InvoiceWithLineItems | undefined>;
  getAllInvoices(): Promise<InvoiceWithLineItems[]>;
  createInvoice(request: CreateInvoiceRequest): Promise<InvoiceWithLineItems>;
  updateInvoice(id: string, invoice: UpdateInvoice): Promise<InvoiceWithLineItems | undefined>;
  deleteInvoice(id: string): Promise<boolean>;
  
  // Line item operations
  getLineItemsByInvoiceId(invoiceId: string): Promise<LineItem[]>;
  addLineItem(lineItem: InsertLineItem): Promise<LineItem>;
  updateLineItem(id: string, lineItem: Partial<LineItem>): Promise<LineItem | undefined>;
  deleteLineItem(id: string): Promise<boolean>;
  
  // Utility
  getInvoiceByNumber(invoiceNumber: string): Promise<InvoiceWithLineItems | undefined>;
}

export class MemStorage implements IStorage {
  private invoices: Map<string, Invoice>;
  private lineItems: Map<string, LineItem>;

  constructor() {
    this.invoices = new Map();
    this.lineItems = new Map();
    
    // Initialize with some demo data for development
    this.initializeDemoData();
  }

  private initializeDemoData() {
    const demoInvoice: Invoice = {
      id: "demo-1",
      invoiceNumber: "INV-001",
      status: "paid",
      companyName: "Acme Corporation",
      companyEmail: "hello@acmecorp.com",
      companyPhone: "+1 (555) 123-4567",
      companyWebsite: "www.acmecorp.com",
      companyAddress: "123 Business St, Suite 100\nNew York, NY 10001",
      companyLogo: null,
      clientName: "John Smith",
      clientEmail: "john@example.com",
      clientCompany: "Client Company Inc",
      clientPhone: "+1 (555) 987-6543",
      clientAddress: "456 Client Ave\nLos Angeles, CA 90210",
      invoiceDate: "2023-12-15",
      dueDate: "2023-12-30",
      notes: "Thank you for your business!",
      subtotal: "350.00",
      tax: "0.00",
      total: "350.00",
      isHosted: false,
      isPasswordProtected: false,
      password: null,
      hostedUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const demoLineItems: LineItem[] = [
      {
        id: "line-1",
        invoiceId: "demo-1",
        description: "Web Design Services",
        quantity: 1,
        rate: "100.00",
        amount: "100.00",
      },
      {
        id: "line-2",
        invoiceId: "demo-1",
        description: "Logo Design",
        quantity: 1,
        rate: "250.00",
        amount: "250.00",
      },
    ];

    this.invoices.set(demoInvoice.id, demoInvoice);
    demoLineItems.forEach(item => this.lineItems.set(item.id, item));
  }

  async getInvoice(id: string): Promise<InvoiceWithLineItems | undefined> {
    const invoice = this.invoices.get(id);
    if (!invoice) return undefined;
    
    const lineItems = await this.getLineItemsByInvoiceId(id);
    return { ...invoice, lineItems };
  }

  async getAllInvoices(): Promise<InvoiceWithLineItems[]> {
    const invoices = Array.from(this.invoices.values());
    const invoicesWithLineItems = await Promise.all(
      invoices.map(async (invoice) => {
        const lineItems = await this.getLineItemsByInvoiceId(invoice.id);
        return { ...invoice, lineItems };
      })
    );
    
    return invoicesWithLineItems.sort((a, b) => 
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  async createInvoice(request: CreateInvoiceRequest): Promise<InvoiceWithLineItems> {
    const id = randomUUID();
    const now = new Date();
    
    // Calculate totals
    const subtotal = request.lineItems.reduce((sum, item) => {
      const amount = parseFloat(item.rate) * (item.quantity || 1);
      return sum + amount;
    }, 0);
    
    const invoice: Invoice = {
      ...request.invoice,
      id,
      status: request.invoice.status || 'draft',
      subtotal: subtotal.toFixed(2),
      total: subtotal.toFixed(2), // For now, no tax calculation
      hostedUrl: request.invoice.isHosted ? `${process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000'}/invoice/${id}` : null,
      createdAt: now,
      updatedAt: now,
    };
    
    this.invoices.set(id, invoice);
    
    // Create line items
    const lineItems: LineItem[] = [];
    for (const item of request.lineItems) {
      const lineItemId = randomUUID();
      const lineItem: LineItem = {
        ...item,
        id: lineItemId,
        invoiceId: id,
        quantity: item.quantity || 1,
        amount: (parseFloat(item.rate) * (item.quantity || 1)).toFixed(2),
      };
      this.lineItems.set(lineItemId, lineItem);
      lineItems.push(lineItem);
    }
    
    return { ...invoice, lineItems };
  }

  async updateInvoice(id: string, updateData: UpdateInvoice): Promise<InvoiceWithLineItems | undefined> {
    const invoice = this.invoices.get(id);
    if (!invoice) return undefined;
    
    const updatedInvoice: Invoice = {
      ...invoice,
      ...updateData,
      updatedAt: new Date(),
    };
    
    this.invoices.set(id, updatedInvoice);
    const lineItems = await this.getLineItemsByInvoiceId(id);
    return { ...updatedInvoice, lineItems };
  }

  async deleteInvoice(id: string): Promise<boolean> {
    // Delete associated line items first
    const lineItems = await this.getLineItemsByInvoiceId(id);
    lineItems.forEach(item => this.lineItems.delete(item.id));
    
    return this.invoices.delete(id);
  }

  async getLineItemsByInvoiceId(invoiceId: string): Promise<LineItem[]> {
    return Array.from(this.lineItems.values()).filter(
      item => item.invoiceId === invoiceId
    );
  }

  async addLineItem(lineItem: InsertLineItem): Promise<LineItem> {
    const id = randomUUID();
    const newLineItem: LineItem = {
      ...lineItem,
      id,
      quantity: lineItem.quantity || 1,
      amount: (parseFloat(lineItem.rate) * (lineItem.quantity || 1)).toFixed(2),
    };
    
    this.lineItems.set(id, newLineItem);
    return newLineItem;
  }

  async updateLineItem(id: string, updateData: Partial<LineItem>): Promise<LineItem | undefined> {
    const lineItem = this.lineItems.get(id);
    if (!lineItem) return undefined;
    
    const updatedLineItem: LineItem = {
      ...lineItem,
      ...updateData,
    };
    
    // Recalculate amount if rate or quantity changed
    if (updateData.rate || updateData.quantity) {
      const rate = updateData.rate || lineItem.rate;
      const quantity = updateData.quantity || lineItem.quantity;
      updatedLineItem.amount = (parseFloat(rate) * quantity).toFixed(2);
    }
    
    this.lineItems.set(id, updatedLineItem);
    return updatedLineItem;
  }

  async deleteLineItem(id: string): Promise<boolean> {
    return this.lineItems.delete(id);
  }

  async getInvoiceByNumber(invoiceNumber: string): Promise<InvoiceWithLineItems | undefined> {
    const invoice = Array.from(this.invoices.values()).find(
      inv => inv.invoiceNumber === invoiceNumber
    );
    
    if (!invoice) return undefined;
    
    const lineItems = await this.getLineItemsByInvoiceId(invoice.id);
    return { ...invoice, lineItems };
  }
}

export const storage = new MemStorage();
