import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import InvoiceForm from "@/components/invoice-form";
import InvoicePreview from "@/components/invoice-preview";
import EmailModal from "@/components/email-modal";
import { PDFDownloadButton } from "@/lib/pdf-generator";
import { useInvoiceStorage } from "@/hooks/use-invoice-storage";
import { generateQRCode } from "@/lib/qr-generator";
import type { InvoiceFormData, LineItemFormData } from "@/types/invoice";
import type { InvoiceWithLineItems, CreateInvoiceRequest } from "@shared/schema";

const defaultFormData: InvoiceFormData = {
  companyName: "",
  companyEmail: "",
  companyPhone: "",
  companyWebsite: "",
  companyAddress: "",
  companyLogo: null,
  clientName: "",
  clientEmail: "",
  clientCompany: "",
  clientPhone: "",
  clientAddress: "",
  invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
  invoiceDate: new Date().toISOString().split('T')[0],
  dueDate: "",
  notes: "",
  textInformation: "",
  shippingCode: "",
  status: "draft",
  isHosted: false,
  isPasswordProtected: false,
  password: "",
};

export default function CreateInvoice() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { saveDraft } = useInvoiceStorage();
  
  const [formData, setFormData] = useState<InvoiceFormData>(defaultFormData);
  const [lineItems, setLineItems] = useState<LineItemFormData[]>([]);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [qrCodeDataURL, setQRCodeDataURL] = useState<string | null>(null);

  const isEditing = !!params.id;

  // Fetch invoice for editing
  const { data: existingInvoice, isLoading } = useQuery<InvoiceWithLineItems>({
    queryKey: ["/api/invoices", params.id],
    enabled: isEditing,
  });

  // Create invoice mutation
  const createInvoiceMutation = useMutation({
    mutationFn: async (data: CreateInvoiceRequest) => {
      const response = await apiRequest("POST", "/api/invoices", data);
      return response.json();
    },
    onSuccess: (invoice: InvoiceWithLineItems) => {
      toast({
        title: "Invoice created successfully!",
        description: `Invoice ${invoice.invoiceNumber} has been created.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      setLocation("/history");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create invoice",
        description: error.message || "An error occurred while creating the invoice.",
        variant: "destructive",
      });
    },
  });

  // Update invoice mutation
  const updateInvoiceMutation = useMutation({
    mutationFn: async (data: Partial<InvoiceFormData>) => {
      const response = await apiRequest("PATCH", `/api/invoices/${params.id}`, data);
      return response.json();
    },
    onSuccess: (invoice: InvoiceWithLineItems) => {
      toast({
        title: "Invoice updated successfully!",
        description: `Invoice ${invoice.invoiceNumber} has been updated.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      setLocation("/history");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update invoice",
        description: error.message || "An error occurred while updating the invoice.",
        variant: "destructive",
      });
    },
  });

  // Load existing invoice data when editing
  useEffect(() => {
    if (existingInvoice) {
      setFormData({
        companyName: existingInvoice.companyName,
        companyEmail: existingInvoice.companyEmail,
        companyPhone: existingInvoice.companyPhone || "",
        companyWebsite: existingInvoice.companyWebsite || "",
        companyAddress: existingInvoice.companyAddress || "",
        companyLogo: existingInvoice.companyLogo,
        clientName: existingInvoice.clientName,
        clientEmail: existingInvoice.clientEmail,
        clientCompany: existingInvoice.clientCompany || "",
        clientPhone: existingInvoice.clientPhone || "",
        clientAddress: existingInvoice.clientAddress || "",
        invoiceNumber: existingInvoice.invoiceNumber,
        invoiceDate: existingInvoice.invoiceDate,
        dueDate: existingInvoice.dueDate || "",
        notes: existingInvoice.notes || "",
        textInformation: existingInvoice.textInformation || "",
        shippingCode: existingInvoice.shippingCode || "",
        status: existingInvoice.status,
        isHosted: existingInvoice.isHosted || false,
        isPasswordProtected: existingInvoice.isPasswordProtected || false,
        password: existingInvoice.password || "",
      });

      setLineItems(
        existingInvoice.lineItems.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          rate: item.rate,
          amount: item.amount,
        }))
      );
    }
  }, [existingInvoice]);

  // Generate QR code when hosting is enabled
  useEffect(() => {
    if (formData.isHosted && existingInvoice) {
      // Get the correct hosted URL from the API
      fetch(`/api/invoices/${existingInvoice.id}/hosted-url`)
        .then(res => res.json())
        .then(data => {
          if (data.hostedUrl) {
            return generateQRCode(data.hostedUrl);
          }
          throw new Error('No hosted URL received');
        })
        .then(setQRCodeDataURL)
        .catch((error) => {
          console.error('QR Code generation failed:', error);
          setQRCodeDataURL(null);
        });
    } else {
      setQRCodeDataURL(null);
    }
  }, [formData.isHosted, existingInvoice]);

  const handleFormChange = (field: keyof InvoiceFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (!formData.companyName || !formData.companyEmail || !formData.clientName || !formData.clientEmail) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields before saving.",
        variant: "destructive",
      });
      return;
    }

    if (lineItems.length === 0 || !lineItems[0].description) {
      toast({
        title: "No line items",
        description: "Please add at least one line item before saving.",
        variant: "destructive",
      });
      return;
    }

    const invoiceData: CreateInvoiceRequest = {
      invoice: {
        ...formData,
        subtotal: "0", // Will be calculated on backend
        tax: "0",
        total: "0",
      },
      lineItems: lineItems.map(item => ({
        description: item.description,
        quantity: item.quantity,
        rate: item.rate,
        amount: item.amount,
      })),
    };

    if (isEditing) {
      updateInvoiceMutation.mutate(formData);
    } else {
      createInvoiceMutation.mutate(invoiceData);
    }
  };

  const handleSaveDraft = () => {
    const subtotal = lineItems.reduce((sum, item) => {
      const amount = parseFloat(item.rate || "0") * (item.quantity || 0);
      return sum + amount;
    }, 0);

    const draftInvoice: InvoiceWithLineItems = {
      id: `draft-${Date.now()}`,
      ...formData,
      subtotal: subtotal.toFixed(2),
      tax: "0.00",
      total: subtotal.toFixed(2),
      hostedUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      lineItems: lineItems.map((item, index) => ({
        id: `draft-line-${index}`,
        invoiceId: `draft-${Date.now()}`,
        description: item.description,
        quantity: item.quantity,
        rate: item.rate,
        amount: item.amount,
      })),
    };

    saveDraft(draftInvoice);
    toast({
      title: "Draft saved",
      description: "Your invoice has been saved as a draft locally.",
    });
  };

  const getCurrentInvoice = (): InvoiceWithLineItems | null => {
    if (existingInvoice) return existingInvoice;
    
    const subtotal = lineItems.reduce((sum, item) => {
      const amount = parseFloat(item.rate || "0") * (item.quantity || 0);
      return sum + amount;
    }, 0);

    return {
      id: "preview",
      invoiceNumber: formData.invoiceNumber,
      status: formData.status,
      companyName: formData.companyName,
      companyEmail: formData.companyEmail,
      companyPhone: formData.companyPhone || null,
      companyWebsite: formData.companyWebsite || null,
      companyAddress: formData.companyAddress || null,
      companyLogo: formData.companyLogo,
      clientName: formData.clientName,
      clientEmail: formData.clientEmail,
      clientCompany: formData.clientCompany || null,
      clientPhone: formData.clientPhone || null,
      clientAddress: formData.clientAddress || null,
      invoiceDate: formData.invoiceDate,
      dueDate: formData.dueDate || null,
      notes: formData.notes || null,
      textInformation: formData.textInformation || null,
      shippingCode: formData.shippingCode || null,
      subtotal: subtotal.toFixed(2),
      tax: "0.00",
      total: subtotal.toFixed(2),
      isHosted: formData.isHosted || false,
      isPasswordProtected: formData.isPasswordProtected || false,
      password: formData.password || null,
      hostedUrl: null, // Will be set by the server after creation
      createdAt: new Date(),
      updatedAt: new Date(),
      lineItems: lineItems.map((item, index) => ({
        id: `preview-${index}`,
        invoiceId: "preview",
        description: item.description,
        quantity: item.quantity,
        rate: item.rate,
        amount: item.amount,
      })),
    };
  };

  if (isEditing && isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <i className="fas fa-spinner fa-spin text-2xl text-primary"></i>
      </div>
    );
  }

  const currentInvoice = getCurrentInvoice();

  return (
    <div className="space-y-8">
      {/* Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">
                {isEditing ? "Edit Invoice" : "Create New Invoice"}
              </h2>
              <p className="text-gray-600 mt-1">
                {isEditing 
                  ? "Update the details of your invoice" 
                  : "Fill in the details below to generate your professional invoice"
                }
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={handleSaveDraft}
                disabled={createInvoiceMutation.isPending || updateInvoiceMutation.isPending}
              >
                <i className="fas fa-save mr-2"></i>Save Draft
              </Button>
              <Button
                onClick={handleSave}
                disabled={createInvoiceMutation.isPending || updateInvoiceMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                {createInvoiceMutation.isPending || updateInvoiceMutation.isPending ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>Saving...
                  </>
                ) : (
                  <>
                    <i className="fas fa-check mr-2"></i>
                    {isEditing ? "Update Invoice" : "Create Invoice"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Left Column - Form */}
        <div className="lg:col-span-2">
          <InvoiceForm
            formData={formData}
            lineItems={lineItems}
            onFormChange={handleFormChange}
            onLineItemsChange={setLineItems}
          />
        </div>

        {/* Right Column - Preview & Actions */}
        <div className="space-y-6">
          {/* Mobile: Show preview in collapsed state */}
          <div className="lg:hidden">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold text-gray-900">Quick Preview</h3>
                  {formData.isHosted && qrCodeDataURL && (
                    <div className="w-10 h-10 border rounded flex items-center justify-center bg-gray-50">
                      <img src={qrCodeDataURL} alt="QR Code" className="w-8 h-8 object-contain" />
                    </div>
                  )}
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <div><strong>Invoice:</strong> {formData.invoiceNumber || "#INV-000"}</div>
                  <div><strong>Company:</strong> {formData.companyName || "Company Name"}</div>
                  <div><strong>Client:</strong> {formData.clientName || "Client Name"}</div>
                  <div><strong>Total:</strong> ${lineItems.reduce((sum, item) => sum + (parseFloat(item.rate || "0") * (item.quantity || 0)), 0).toFixed(2)}</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Desktop: Full preview */}
          <div className="hidden lg:block">
            <InvoicePreview
              formData={formData}
              lineItems={lineItems}
              onFormChange={handleFormChange}
            />
          </div>

          {/* Action Buttons */}
          <Card>
            <CardContent className="p-4 lg:p-6">
              <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-4">Actions</h3>
              <div className="space-y-3">
                {currentInvoice && (
                  <PDFDownloadButton
                    invoice={currentInvoice}
                    qrCodeDataURL={qrCodeDataURL || undefined}
                    className="w-full bg-primary hover:bg-primary-dark text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center text-sm lg:text-base"
                  >
                    <i className="fas fa-download mr-2"></i>Download PDF
                  </PDFDownloadButton>
                )}
                {isEditing && (
                  <Button
                    onClick={() => setIsEmailModalOpen(true)}
                    className="w-full bg-green-600 hover:bg-green-700 py-3 text-sm lg:text-base"
                  >
                    <i className="fas fa-envelope mr-2"></i>Send Email
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          {lineItems.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">
                      ${lineItems.reduce((sum, item) => sum + parseFloat(item.amount || "0"), 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax (0%):</span>
                    <span className="font-medium">$0.00</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between">
                    <span className="text-lg font-semibold text-gray-900">Total:</span>
                    <span className="text-lg font-bold text-primary">
                      ${lineItems.reduce((sum, item) => sum + parseFloat(item.amount || "0"), 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Email Modal */}
      {isEditing && existingInvoice && (
        <EmailModal
          isOpen={isEmailModalOpen}
          onClose={() => setIsEmailModalOpen(false)}
          invoiceId={existingInvoice.id}
          invoiceNumber={existingInvoice.invoiceNumber}
          companyName={existingInvoice.companyName}
          clientEmail={existingInvoice.clientEmail}
        />
      )}
    </div>
  );
}
