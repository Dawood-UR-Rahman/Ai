import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface LogoUploadProps {
  onLogoChange: (logo: string | null) => void;
  currentLogo?: string | null;
}

export default function LogoUpload({ onLogoChange, currentLogo }: LogoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (PNG, JPG, SVG)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 2MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('logo', file);

      const response = await fetch('/api/upload-logo', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const { logo } = await response.json();
      onLogoChange(logo);
      
      toast({
        title: "Logo uploaded",
        description: "Your company logo has been uploaded successfully",
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload logo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveLogo = () => {
    onLogoChange(null);
    toast({
      title: "Logo removed",
      description: "Company logo has been removed",
    });
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">Company Logo</label>
      
      {currentLogo ? (
        <div className="space-y-3">
          <div className="w-32 h-24 border border-gray-300 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
            <img 
              src={currentLogo} 
              alt="Company logo" 
              className="max-w-full max-h-full object-contain"
            />
          </div>
          <div className="flex space-x-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => document.getElementById('logo-upload')?.click()}
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Uploading...
                </>
              ) : (
                <>
                  <i className="fas fa-edit mr-2"></i>
                  Change
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRemoveLogo}
              disabled={isUploading}
            >
              <i className="fas fa-trash mr-2"></i>
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
          onClick={() => document.getElementById('logo-upload')?.click()}
        >
          <i className="fas fa-cloud-upload-alt text-3xl text-gray-400 mb-2"></i>
          <p className="text-gray-600">
            Drop your logo here or{" "}
            <span className="text-primary font-medium">browse files</span>
          </p>
          <p className="text-xs text-gray-500 mt-1">PNG, JPG, SVG up to 2MB</p>
        </div>
      )}

      <input
        id="logo-upload"
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading}
      />
    </div>
  );
}
