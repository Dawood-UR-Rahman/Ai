import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { InvoiceWithLineItems } from "@shared/schema";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PasswordPromptProps {
  onSubmit: (password: string) => void;
  isLoading: boolean;
  error: string | null;
}

function PasswordPrompt({ onSubmit, isLoading, error }: PasswordPromptProps) {
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(password);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            🔒 Password Protected
          </CardTitle>
          <p className="text-gray-600">This invoice is password protected. Please enter the password to continue.</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoFocus
              />
            </div>
            {error && (
              <div className="text-red-500 text-sm">{error}</div>
            )}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Verifying..." : "Access Invoice"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function InvoiceDisplay({ invoice }: { invoice: InvoiceWithLineItems }) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto bg-white shadow-lg print:shadow-none">
        {/* Header */}
        <div className="flex justify-between items-start p-8 border-b-2 border-gray-200">
          <div className="flex-1">
            {invoice.companyLogo && (
              <img src={invoice.companyLogo} alt="Company Logo" className="w-32 h-20 object-contain mb-4" />
            )}
            <div className="text-2xl font-bold text-gray-800">{invoice.companyName}</div>
            <div className="text-gray-600">{invoice.companyEmail}</div>
            {invoice.companyPhone && <div className="text-gray-600">📞 {invoice.companyPhone}</div>}
            {invoice.companyWebsite && <div className="text-gray-600">🌐 {invoice.companyWebsite}</div>}
            {invoice.companyAddress && (
              <div className="text-gray-600 mt-2 whitespace-pre-line">{invoice.companyAddress}</div>
            )}
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-blue-600 mb-2">INVOICE</div>
            <div className="text-xl font-semibold">#{invoice.invoiceNumber}</div>
            <div className="mt-4 space-y-1 text-sm">
              <div><strong>Date:</strong> {new Date(invoice.invoiceDate).toLocaleDateString()}</div>
              {invoice.dueDate && (
                <div><strong>Due:</strong> {new Date(invoice.dueDate).toLocaleDateString()}</div>
              )}
            </div>
          </div>
        </div>

        {/* Bill To */}
        <div className="p-8 bg-gray-50 border-b border-gray-200">
          <div className="font-semibold text-lg mb-2">Bill To:</div>
          <div className="font-bold">{invoice.clientName}</div>
          {invoice.clientCompany && <div>{invoice.clientCompany}</div>}
          <div>{invoice.clientEmail}</div>
          {invoice.clientPhone && <div>📞 {invoice.clientPhone}</div>}
          {invoice.clientAddress && (
            <div className="mt-1 whitespace-pre-line">{invoice.clientAddress}</div>
          )}
        </div>

        {/* Line Items */}
        <div className="p-8">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-blue-600 text-white">
                <th className="text-left p-4 font-semibold">Description</th>
                <th className="text-center p-4 font-semibold">Qty</th>
                <th className="text-right p-4 font-semibold">Rate</th>
                <th className="text-right p-4 font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.lineItems.map((item) => (
                <tr key={item.id} className="border-b border-gray-200">
                  <td className="p-4">{item.description}</td>
                  <td className="text-center p-4">{item.quantity}</td>
                  <td className="text-right p-4">${item.rate}</td>
                  <td className="text-right p-4">${item.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="px-8 pb-8">
          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${invoice.subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax:</span>
                <span>${invoice.tax}</span>
              </div>
              <div className="flex justify-between text-2xl font-bold text-blue-600 pt-2 border-t-2 border-gray-300">
                <span>Total:</span>
                <span>${invoice.total}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="px-8 pb-8 border-t border-gray-200">
            <div className="font-semibold mb-2">Notes:</div>
            <div className="whitespace-pre-line text-gray-700">{invoice.notes}</div>
          </div>
        )}

        {/* Print Button - Hidden when printing */}
        <div className="p-8 text-center print:hidden">
          <Button onClick={handlePrint} className="bg-green-600 hover:bg-green-700">
            🖨️ Print Invoice
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function InvoiceView() {
  const params = useParams();
  const [password, setPassword] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Handle preview route
  if (params.id === "preview") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="text-6xl mb-4">📄</div>
            <CardTitle>Invoice Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <p>This is a preview of how your QR code will work.</p>
            <p className="text-gray-600 mt-2">When you create an invoice and enable hosting, the QR code will link directly to this invoice view.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { data: invoice, isLoading, error } = useQuery<InvoiceWithLineItems>({
    queryKey: ["/api/invoices", params.id],
    retry: false,
  });

  const handlePasswordSubmit = async (inputPassword: string) => {
    if (!invoice) return;
    
    setIsVerifying(true);
    setPasswordError(null);

    // Simple password check - in a real app, this should be done server-side
    if (invoice.isPasswordProtected && inputPassword === invoice.password) {
      setPassword(inputPassword);
    } else if (invoice.isPasswordProtected) {
      setPasswordError("Incorrect password. Please try again.");
    } else {
      setPassword(""); // No password needed
    }
    
    setIsVerifying(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div>Loading invoice...</div>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-red-600">Invoice Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p>The requested invoice could not be found or is no longer available.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show password prompt if needed
  if (invoice.isPasswordProtected && password !== invoice.password) {
    return (
      <PasswordPrompt
        onSubmit={handlePasswordSubmit}
        isLoading={isVerifying}
        error={passwordError}
      />
    );
  }

  return <InvoiceDisplay invoice={invoice} />;
}