export interface InvoiceTemplate {
  id: string;
  name: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  fontFamily: string;
  preview: string;
}

export const INVOICE_TEMPLATES: InvoiceTemplate[] = [
  {
    id: "classic",
    name: "Classic Blue",
    description: "Professional blue theme with clean lines",
    primaryColor: "#2563eb",
    secondaryColor: "#64748b",
    accentColor: "#3b82f6",
    backgroundColor: "#f8fafc",
    fontFamily: "Inter",
    preview: "🔵 Professional & Clean"
  },
  {
    id: "modern",
    name: "Modern Green",
    description: "Fresh green theme for modern businesses",
    primaryColor: "#059669",
    secondaryColor: "#6b7280",
    accentColor: "#10b981",
    backgroundColor: "#f0fdf4",
    fontFamily: "Inter",
    preview: "🟢 Fresh & Modern"
  },
  {
    id: "elegant",
    name: "Elegant Purple",
    description: "Sophisticated purple theme for premium brands",
    primaryColor: "#7c3aed",
    secondaryColor: "#6b7280",
    accentColor: "#8b5cf6",
    backgroundColor: "#faf5ff",
    fontFamily: "Inter",
    preview: "🟣 Elegant & Premium"
  },
  {
    id: "warm",
    name: "Warm Orange",
    description: "Friendly orange theme for creative businesses",
    primaryColor: "#ea580c",
    secondaryColor: "#6b7280",
    accentColor: "#f97316",
    backgroundColor: "#fff7ed",
    fontFamily: "Inter",
    preview: "🟠 Warm & Creative"
  },
  {
    id: "minimal",
    name: "Minimal Dark",
    description: "Sleek dark theme for tech companies",
    primaryColor: "#1f2937",
    secondaryColor: "#6b7280",
    accentColor: "#374151",
    backgroundColor: "#f9fafb",
    fontFamily: "Inter",
    preview: "⚫ Sleek & Tech"
  }
];

export const CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  { code: "CHF", symbol: "Fr", name: "Swiss Franc" },
  { code: "CNY", symbol: "¥", name: "Chinese Yuan" },
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "BRL", symbol: "R$", name: "Brazilian Real" }
];

export const FONT_FAMILIES = [
  { value: "Inter", label: "Inter (Default)" },
  { value: "Arial", label: "Arial" },
  { value: "Helvetica", label: "Helvetica" },
  { value: "Times New Roman", label: "Times New Roman" },
  { value: "Georgia", label: "Georgia" },
  { value: "Roboto", label: "Roboto" },
  { value: "Open Sans", label: "Open Sans" },
  { value: "Lato", label: "Lato" }
];

export function getCurrencySymbol(currencyCode: string): string {
  const currency = CURRENCIES.find(c => c.code === currencyCode);
  return currency ? currency.symbol : "$";
}

export function getTemplateById(templateId: string): InvoiceTemplate {
  return INVOICE_TEMPLATES.find(t => t.id === templateId) || INVOICE_TEMPLATES[0];
}