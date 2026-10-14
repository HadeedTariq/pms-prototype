import { Card, CardContent } from "@/components/ui/card";

import { Package } from "lucide-react";

export const NoRecordFound = () => (
  <div className="w-full max-w-4xl mx-auto p-6">
    <Card className="border-2 border-dashed border-gray-300">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <Package className="w-16 h-16 text-gray-400 mb-4" />
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
          No Record Found
        </h3>
        <p className="text-gray-500 text-center max-w-md">
          We couldn't find any ownership information for this listing. Please
          check the listing ID and try again.
        </p>
      </CardContent>
    </Card>
  </div>
);
