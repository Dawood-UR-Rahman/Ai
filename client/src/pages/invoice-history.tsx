import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import InvoiceCard from "@/components/invoice-card";
import { useInvoiceStorage } from "@/hooks/use-invoice-storage";
import type { InvoiceWithLineItems } from "@shared/schema";

export default function InvoiceHistory() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { drafts } = useInvoiceStorage();
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch all invoices
  const { data: invoices = [], isLoading, error } = useQuery<InvoiceWithLineItems[]>({
    queryKey: ["/api/invoices"],
  });

  // Delete invoice mutation
  const deleteInvoiceMutation = useMutation({
    mutationFn: async (invoiceId: string) => {
      await apiRequest("DELETE", `/api/invoices/${invoiceId}`);
    },
    onSuccess: () => {
      toast({
        title: "Invoice deleted",
        description: "The invoice has been successfully deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete invoice",
        description: error.message || "An error occurred while deleting the invoice.",
        variant: "destructive",
      });
    },
  });

  // Combine server invoices with local drafts
  const allInvoices = [...invoices, ...drafts];

  // Filter invoices based on search term
  const filteredInvoices = allInvoices.filter((invoice) =>
    invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.companyName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleView = (invoice: InvoiceWithLineItems) => {
    // For now, redirect to edit page for viewing
    if (invoice.id.startsWith('draft-')) {
      // Handle draft viewing differently if needed
      setLocation(`/edit/${invoice.id}`);
    } else {
      setLocation(`/edit/${invoice.id}`);
    }
  };

  const handleEdit = (invoice: InvoiceWithLineItems) => {
    setLocation(`/edit/${invoice.id}`);
  };

  const handleDelete = (invoice: InvoiceWithLineItems) => {
    if (window.confirm(`Are you sure you want to delete invoice ${invoice.invoiceNumber}?`)) {
      if (invoice.id.startsWith('draft-')) {
        // Handle draft deletion locally
        toast({
          title: "Draft deleted",
          description: "The draft has been removed from local storage.",
        });
      } else {
        deleteInvoiceMutation.mutate(invoice.id);
      }
    }
  };

  const handleNewInvoice = () => {
    setLocation("/create");
  };

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 mb-4">
          <i className="fas fa-exclamation-triangle text-4xl"></i>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Invoices</h3>
        <p className="text-gray-600">Failed to load invoices. Please try again.</p>
        <Button 
          onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/invoices"] })} 
          className="mt-4"
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">Invoice History</h2>
              <p className="text-gray-600 mt-1">Manage and view all your created invoices</p>
            </div>
            <div className="flex items-center space-x-3">
              <Input
                type="search"
                placeholder="Search invoices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
              <Button onClick={handleNewInvoice} className="bg-primary hover:bg-primary-dark">
                <i className="fas fa-plus mr-2"></i>New Invoice
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <i className="fas fa-spinner fa-spin text-2xl text-primary"></i>
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <i className="fas fa-file-invoice text-6xl"></i>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {searchTerm ? "No invoices found" : "No invoices yet"}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm 
              ? "Try adjusting your search terms" 
              : "Get started by creating your first professional invoice"
            }
          </p>
          {!searchTerm && (
            <Button onClick={handleNewInvoice} className="bg-primary hover:bg-primary-dark">
              <i className="fas fa-plus mr-2"></i>Create Your First Invoice
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredInvoices.map((invoice) => (
            <InvoiceCard
              key={invoice.id}
              invoice={invoice}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}

          {/* Add New Invoice Card */}
          <Card 
            className="bg-gray-50 border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors cursor-pointer"
            onClick={handleNewInvoice}
          >
            <CardContent className="p-6 text-center">
              <div className="mx-auto w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                <i className="fas fa-plus text-xl text-gray-500"></i>
              </div>
              <h3 className="font-medium text-gray-900 mb-2">Create New Invoice</h3>
              <p className="text-sm text-gray-600">Start building a new professional invoice</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
