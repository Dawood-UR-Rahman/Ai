import { useMemo, useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { generateQRCode } from "@/lib/qr-generator";
import type { InvoiceFormData, LineItemFormData } from "@/types/invoice";

interface InvoicePreviewProps {
  formData: InvoiceFormData;
  lineItems: LineItemFormData[];
  onFormChange: (field: keyof InvoiceFormData, value: any) => void;
}

export default function InvoicePreview({
  formData,
  lineItems,
  onFormChange,
}: InvoicePreviewProps) {
  const qrCodeUrl = useMemo(() => {
    if (formData.isHosted) {
      // For preview, show a sample URL since we don't have the actual invoice ID yet
      // Use current window location to get the correct domain
      const baseUrl = window.location.origin;
      return `${baseUrl}/view/preview`;
    }
    return null;
  }, [formData.isHosted]);

  const [qrCodeDataURL, setQRCodeDataURL] = useState<string | null>(null);

  useEffect(() => {
    if (qrCodeUrl) {
      generateQRCode(qrCodeUrl)
        .then(setQRCodeDataURL)
        .catch(console.error);
    } else {
      setQRCodeDataURL(null);
    }
  }, [qrCodeUrl]);

  const subtotal = lineItems.reduce((sum, item) => {
    const amount = parseFloat(item.rate || "0") * (item.quantity || 0);
    return sum + amount;
  }, 0);

  const total = subtotal; // No tax calculation for now

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Invoice Preview</h3>
          {/* QR Code positioned top-right */}
          <div className="bg-gray-100 p-2 rounded-lg">
            <div className="w-16 h-16 bg-white border-2 border-dashed border-gray-300 rounded flex items-center justify-center">
              {formData.isHosted ? (
                qrCodeDataURL ? (
                  <img src={qrCodeDataURL} alt="QR Code" className="w-full h-full object-contain" />
                ) : (
                  <div className="text-xs text-center text-gray-500">
                    <i className="fas fa-qrcode text-lg mb-1"></i>
                    <div>QR Code</div>
                  </div>
                )
              ) : (
                <div className="text-xs text-center text-gray-400">
                  <i className="fas fa-qrcode text-lg mb-1"></i>
                  <div>Enable hosting</div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Mini Invoice Preview */}
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 text-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              {formData.companyLogo && (
                <div className="w-12 h-8 bg-gray-300 rounded mb-2">
                  <img 
                    src={formData.companyLogo} 
                    alt="Company logo" 
                    className="w-full h-full object-contain rounded"
                  />
                </div>
              )}
              <p className="font-semibold text-gray-800">
                {formData.companyName || "Company Name"}
              </p>
              <p className="text-gray-600 text-xs">
                {formData.companyEmail || "email@company.com"}
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-gray-800">INVOICE</p>
              <p className="text-xs text-gray-600">
                {formData.invoiceNumber || "#INV-000"}
              </p>
            </div>
          </div>
          
          <div className="border-t border-gray-300 pt-3 mb-3">
            <p className="font-medium text-gray-700 mb-1">Bill To:</p>
            <p className="text-gray-600 text-xs">
              {formData.clientName || "Client Name"}
            </p>
          </div>
          
          <div className="space-y-2 mb-3">
            {lineItems.length > 0 ? (
              lineItems.map((item, index) => (
                <div key={index} className="flex justify-between text-xs">
                  <span>{item.description || "Service"}</span>
                  <span>${item.amount || "0.00"}</span>
                </div>
              ))
            ) : (
              <div className="flex justify-between text-xs text-gray-400">
                <span>No items added</span>
                <span>$0.00</span>
              </div>
            )}
          </div>
          
          <div className="border-t border-gray-300 pt-2">
            <div className="flex justify-between font-semibold text-sm">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Hosting & Security Options */}
        <div className="mt-4 space-y-3">
          <div className="flex items-center space-x-3">
            <Checkbox
              id="hostInvoice"
              checked={formData.isHosted}
              onCheckedChange={(checked) => onFormChange("isHosted", !!checked)}
            />
            <Label htmlFor="hostInvoice" className="text-sm text-gray-700">
              Host online with unique URL
            </Label>
          </div>
          <div className="flex items-center space-x-3">
            <Checkbox
              id="passwordProtect"
              checked={formData.isPasswordProtected}
              onCheckedChange={(checked) => onFormChange("isPasswordProtected", !!checked)}
            />
            <Label htmlFor="passwordProtect" className="text-sm text-gray-700">
              Password protect invoice
            </Label>
          </div>
          {formData.isPasswordProtected && (
            <div className="ml-6">
              <Input
                type="password"
                placeholder="Enter password"
                value={formData.password}
                onChange={(e) => onFormChange("password", e.target.value)}
                className="text-sm"
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
