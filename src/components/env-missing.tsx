import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function EnvMissing() {
  return (
    <Alert className="border-amber-200 bg-amber-50 text-amber-950">
      <AlertCircle className="size-4" />
      <AlertTitle>Supabase is not configured locally</AlertTitle>
      <AlertDescription>
        Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
        to your local environment to enable auth, projects, and storage.
      </AlertDescription>
    </Alert>
  );
}
