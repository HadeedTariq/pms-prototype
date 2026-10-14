import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
export const ErrorDisplay = ({ error }: any) => {
  const errorMessage =
    error?.response?.data?.message ||
    error?.message ||
    "An unexpected error occurred while fetching the ownership status.";

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <Alert className="border-red-200 bg-red-50">
        <AlertCircle className="h-5 w-5 text-red-600" />
        <AlertDescription className="ml-2 text-red-800">
          <div className="font-semibold mb-1">
            Error Loading Ownership Status
          </div>
          <p className="text-sm">{errorMessage}</p>
        </AlertDescription>
      </Alert>
    </div>
  );
};
