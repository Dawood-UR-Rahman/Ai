import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { EmailFormData } from "@/types/invoice";

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceId: string;
  invoiceNumber: string;
  companyName: string;
  clientEmail?: string;
}

export default function EmailModal({
  isOpen,
  onClose,
  invoiceId,
  invoiceNumber,
  companyName,
  clientEmail,
}: EmailModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<EmailFormData>({
    to: clientEmail || "",
    subject: `Invoice ${invoiceNumber} from ${companyName}`,
    message: `Dear Client,\n\nPlease find attached your invoice.\n\nThank you for your business!\n\nBest regards,\n${companyName}`,
    attachPDF: true,
  });

  const sendEmailMutation = useMutation({
    mutationFn: async (data: EmailFormData) => {
      const response = await apiRequest("POST", `/api/invoices/${invoiceId}/send-email`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Email sent successfully!",
        description: "The invoice has been sent to the recipient.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      onClose();
      setFormData({
        to: clientEmail || "",
        subject: `Invoice ${invoiceNumber} from ${companyName}`,
        message: `Dear Client,\n\nPlease find attached your invoice.\n\nThank you for your business!\n\nBest regards,\n${companyName}`,
        attachPDF: true,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send email",
        description: error.message || "An error occurred while sending the email.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.to.trim()) {
      toast({
        title: "Email required",
        description: "Please enter a recipient email address.",
        variant: "destructive",
      });
      return;
    }
    sendEmailMutation.mutate(formData);
  };

  const handleChange = (field: keyof EmailFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <i className="fas fa-envelope mr-2 text-primary"></i>
            Send Invoice
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="to" className="text-sm font-medium text-gray-700">
              To Email Address *
            </Label>
            <Input
              id="to"
              type="email"
              value={formData.to}
              onChange={(e) => handleChange("to", e.target.value)}
              placeholder="client@example.com"
              required
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="subject" className="text-sm font-medium text-gray-700">
              Subject
            </Label>
            <Input
              id="subject"
              type="text"
              value={formData.subject}
              onChange={(e) => handleChange("subject", e.target.value)}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="message" className="text-sm font-medium text-gray-700">
              Message
            </Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => handleChange("message", e.target.value)}
              rows={4}
              className="mt-1"
              placeholder="Enter your message here..."
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="attachPDF"
              checked={formData.attachPDF}
              onCheckedChange={(checked) => handleChange("attachPDF", !!checked)}
            />
            <Label htmlFor="attachPDF" className="text-sm text-gray-700">
              Attach PDF invoice
            </Label>
          </div>
          
          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={sendEmailMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-primary hover:bg-primary-dark"
              disabled={sendEmailMutation.isPending}
            >
              {sendEmailMutation.isPending ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Sending...
                </>
              ) : (
                <>
                  <i className="fas fa-paper-plane mr-2"></i>
                  Send Email
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
