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

  const taxAmount = (subtotal * parseFloat(formData.taxPercentage || "0")) / 100;
  const shippingAmount = parseFloat(formData.shippingCost || "0");
  const total = subtotal + taxAmount + shippingAmount;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
          <h3 className="text-lg font-semibold text-gray-900">Invoice Preview</h3>
          {/* QR Code positioned top-right */}
          <div className="bg-gray-100 p-2 rounded-lg self-start sm:self-auto">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white border-2 border-dashed border-gray-300 rounded flex items-center justify-center">
              {formData.isHosted ? (
                qrCodeDataURL ? (
                  <img src={qrCodeDataURL} alt="QR Code" className="w-full h-full object-contain" />
                ) : (
                  <div className="text-xs text-center text-gray-500">
                    <i className="fas fa-qrcode text-sm sm:text-lg mb-1"></i>
                    <div className="text-xs">QR Code</div>
                  </div>
                )
              ) : (
                <div className="text-xs text-center text-gray-400">
                  <i className="fas fa-qrcode text-sm sm:text-lg mb-1"></i>
                  <div className="text-xs">Enable hosting</div>
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
          
          <div className="border-t border-gray-300 pt-2 space-y-1">
            <div className="flex justify-between text-xs">
              <span>Subtotal:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            {parseFloat(formData.taxPercentage || "0") > 0 && (
              <div className="flex justify-between text-xs">
                <span>Tax ({formData.taxPercentage}%):</span>
                <span>${taxAmount.toFixed(2)}</span>
              </div>
            )}
            {shippingAmount > 0 && (
              <div className="flex justify-between text-xs">
                <span>Shipping:</span>
                <span>${shippingAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-sm border-t border-gray-200 pt-1">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Hosting & Security Options */}
        <div className="mt-4 space-y-4 p-3 bg-gray-50 rounded-lg border">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="hostInvoice"
              checked={formData.isHosted}
              onCheckedChange={(checked) => onFormChange("isHosted", !!checked)}
              className="mt-0.5 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
            />
            <div className="flex-1">
              <Label htmlFor="hostInvoice" className="text-sm font-medium text-gray-800 cursor-pointer leading-relaxed">
                Host online with unique URL
              </Label>
              <p className="text-xs text-gray-500 mt-1">Allow clients to view and pay online</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <Checkbox
              id="passwordProtect"
              checked={formData.isPasswordProtected}
              onCheckedChange={(checked) => onFormChange("isPasswordProtected", !!checked)}
              className="mt-0.5 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
            />
            <div className="flex-1">
              <Label htmlFor="passwordProtect" className="text-sm font-medium text-gray-800 cursor-pointer leading-relaxed">
                Password protect invoice
              </Label>
              <p className="text-xs text-gray-500 mt-1">Require password to view invoice</p>
            </div>
          </div>
          {formData.isPasswordProtected && (
            <div className="ml-7 pt-2">
              <Input
                type="password"
                placeholder="Enter password"
                value={formData.password}
                onChange={(e) => onFormChange("password", e.target.value)}
                className="text-sm w-full"
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
