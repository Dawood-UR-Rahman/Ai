import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { InvoiceWithLineItems } from "@shared/schema";

interface InvoiceCardProps {
  invoice: InvoiceWithLineItems;
  onView: (invoice: InvoiceWithLineItems) => void;
  onEdit: (invoice: InvoiceWithLineItems) => void;
  onDelete: (invoice: InvoiceWithLineItems) => void;
}

export default function InvoiceCard({ invoice, onView, onEdit, onDelete }: InvoiceCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "sent":
        return "bg-yellow-100 text-yellow-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-semibold text-lg text-gray-900">
              #{invoice.invoiceNumber}
            </h3>
            <p className="text-sm text-gray-600">{invoice.clientName}</p>
          </div>
          <Badge className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${getStatusColor(invoice.status)}`}>
            {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
          </Badge>
        </div>
        
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Date:</span>
            <span className="font-medium">{formatDate(invoice.invoiceDate)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Amount:</span>
            <span className="font-bold text-primary">${invoice.total}</span>
          </div>
          {invoice.dueDate && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Due:</span>
              <span className="font-medium">{formatDate(invoice.dueDate)}</span>
            </div>
          )}
        </div>

        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onView(invoice)}
            className="flex-1"
          >
            <i className="fas fa-eye mr-1"></i>View
          </Button>
          <Button
            size="sm"
            onClick={() => onEdit(invoice)}
            className="flex-1 bg-primary hover:bg-primary-dark"
          >
            <i className="fas fa-edit mr-1"></i>Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(invoice)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <i className="fas fa-trash"></i>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
