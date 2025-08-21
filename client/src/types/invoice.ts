export interface InvoiceFormData {
  // Company info
  companyName: string;
  companyEmail: string;
  companyPhone: string;
  companyWebsite: string;
  companyAddress: string;
  companyLogo: string | null;
  
  // Client info
  clientName: string;
  clientEmail: string;
  clientCompany: string;
  clientPhone: string;
  clientAddress: string;
  
  // Invoice details
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  notes: string;
  textInformation: string;
  shippingCode: string;
  currency: string;
  taxPercentage: string;
  shippingCost: string;
  template: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  status: string;
  
  // Hosting & security
  isHosted: boolean;
  isPasswordProtected: boolean;
  password: string;
}

export interface LineItemFormData {
  description: string;
  quantity: number;
  rate: string;
  amount: string;
}

export interface EmailFormData {
  to: string;
  subject: string;
  message: string;
  attachPDF: boolean;
}
