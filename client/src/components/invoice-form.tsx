import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import LogoUpload from "./logo-upload";
import type { InvoiceFormData, LineItemFormData } from "@/types/invoice";

interface InvoiceFormProps {
  formData: InvoiceFormData;
  lineItems: LineItemFormData[];
  onFormChange: (field: keyof InvoiceFormData, value: any) => void;
  onLineItemsChange: (items: LineItemFormData[]) => void;
}

export default function InvoiceForm({
  formData,
  lineItems,
  onFormChange,
  onLineItemsChange,
}: InvoiceFormProps) {
  
  const handleLineItemChange = (index: number, field: keyof LineItemFormData, value: string | number) => {
    const updatedItems = [...lineItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // Calculate amount when rate or quantity changes
    if (field === 'rate' || field === 'quantity') {
      const rate = field === 'rate' ? parseFloat(value.toString()) : parseFloat(updatedItems[index].rate);
      const quantity = field === 'quantity' ? Number(value) : updatedItems[index].quantity;
      updatedItems[index].amount = ((rate || 0) * (quantity || 0)).toFixed(2);
    }
    
    onLineItemsChange(updatedItems);
  };

  const addLineItem = () => {
    onLineItemsChange([
      ...lineItems,
      { description: "", quantity: 1, rate: "0.00", amount: "0.00" }
    ]);
  };

  const removeLineItem = (index: number) => {
    const updatedItems = lineItems.filter((_, i) => i !== index);
    onLineItemsChange(updatedItems);
  };

  // Initialize with one line item if empty
  useEffect(() => {
    if (lineItems.length === 0) {
      addLineItem();
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Company Information */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <LogoUpload
                onLogoChange={(logo) => onFormChange("companyLogo", logo)}
                currentLogo={formData.companyLogo}
              />
            </div>
            <div>
              <Label htmlFor="companyName">Company Name *</Label>
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e) => onFormChange("companyName", e.target.value)}
                placeholder="Acme Corporation"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="companyEmail">Email Address *</Label>
              <Input
                id="companyEmail"
                type="email"
                value={formData.companyEmail}
                onChange={(e) => onFormChange("companyEmail", e.target.value)}
                placeholder="hello@acmecorp.com"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="companyPhone">Phone Number</Label>
              <Input
                id="companyPhone"
                type="tel"
                value={formData.companyPhone}
                onChange={(e) => onFormChange("companyPhone", e.target.value)}
                placeholder="+1 (555) 123-4567"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="companyWebsite">Website</Label>
              <Input
                id="companyWebsite"
                type="url"
                value={formData.companyWebsite}
                onChange={(e) => onFormChange("companyWebsite", e.target.value)}
                placeholder="www.acmecorp.com"
                className="mt-1"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="companyAddress">Address</Label>
              <Textarea
                id="companyAddress"
                value={formData.companyAddress}
                onChange={(e) => onFormChange("companyAddress", e.target.value)}
                rows={3}
                placeholder="123 Business St, Suite 100&#10;New York, NY 10001"
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Client Information */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Bill To</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="clientName">Client Name *</Label>
              <Input
                id="clientName"
                value={formData.clientName}
                onChange={(e) => onFormChange("clientName", e.target.value)}
                placeholder="John Smith"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="clientEmail">Client Email *</Label>
              <Input
                id="clientEmail"
                type="email"
                value={formData.clientEmail}
                onChange={(e) => onFormChange("clientEmail", e.target.value)}
                placeholder="john@example.com"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="clientCompany">Company</Label>
              <Input
                id="clientCompany"
                value={formData.clientCompany}
                onChange={(e) => onFormChange("clientCompany", e.target.value)}
                placeholder="Client Company Inc"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="clientPhone">Phone</Label>
              <Input
                id="clientPhone"
                type="tel"
                value={formData.clientPhone}
                onChange={(e) => onFormChange("clientPhone", e.target.value)}
                placeholder="+1 (555) 987-6543"
                className="mt-1"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="clientAddress">Billing Address</Label>
              <Textarea
                id="clientAddress"
                value={formData.clientAddress}
                onChange={(e) => onFormChange("clientAddress", e.target.value)}
                rows={3}
                placeholder="456 Client Ave&#10;Los Angeles, CA 90210"
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoice Details */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoice Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="invoiceNumber">Invoice Number *</Label>
              <Input
                id="invoiceNumber"
                value={formData.invoiceNumber}
                onChange={(e) => onFormChange("invoiceNumber", e.target.value)}
                placeholder="INV-001"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="invoiceDate">Invoice Date *</Label>
              <Input
                id="invoiceDate"
                type="date"
                value={formData.invoiceDate}
                onChange={(e) => onFormChange("invoiceDate", e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => onFormChange("dueDate", e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <div className="mt-4">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => onFormChange("notes", e.target.value)}
              rows={3}
              placeholder="Thank you for your business!"
              className="mt-1"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <Label htmlFor="textInformation">Additional Information</Label>
              <Textarea
                id="textInformation"
                value={formData.textInformation}
                onChange={(e) => onFormChange("textInformation", e.target.value)}
                rows={2}
                placeholder="Additional details, terms, or instructions..."
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="shippingCode">Shipping/Tracking Code</Label>
              <Input
                id="shippingCode"
                value={formData.shippingCode}
                onChange={(e) => onFormChange("shippingCode", e.target.value)}
                placeholder="Track-123456"
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Line Items</h3>
            <Button
              type="button"
              onClick={addLineItem}
              className="bg-primary hover:bg-primary-dark"
            >
              <i className="fas fa-plus mr-2"></i>Add Item
            </Button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2 font-medium text-gray-700">Description</th>
                  <th className="text-center py-3 px-2 font-medium text-gray-700 w-20">Qty</th>
                  <th className="text-right py-3 px-2 font-medium text-gray-700 w-24">Rate</th>
                  <th className="text-right py-3 px-2 font-medium text-gray-700 w-24">Amount</th>
                  <th className="w-12"></th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((item, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-3 px-2">
                      <Input
                        value={item.description}
                        onChange={(e) => handleLineItemChange(index, "description", e.target.value)}
                        placeholder="Service description"
                        className="border-gray-300"
                      />
                    </td>
                    <td className="py-3 px-2">
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleLineItemChange(index, "quantity", parseInt(e.target.value) || 1)}
                        className="text-center border-gray-300"
                      />
                    </td>
                    <td className="py-3 px-2">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.rate}
                        onChange={(e) => handleLineItemChange(index, "rate", e.target.value)}
                        className="text-right border-gray-300"
                      />
                    </td>
                    <td className="py-3 px-2 text-right font-medium">
                      ${item.amount}
                    </td>
                    <td className="py-3 px-2 text-center">
                      {lineItems.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeLineItem(index)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <i className="fas fa-trash-alt"></i>
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
