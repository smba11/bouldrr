import { updateSettingsAction } from "@/lib/actions/settings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type SettingsFormProps = {
  fullName?: string | null;
  preferredLanguage?: string | null;
};

export function SettingsForm({
  fullName,
  preferredLanguage = "en",
}: SettingsFormProps) {
  return (
    <Card className="max-w-2xl shadow-sm">
      <CardHeader>
        <CardTitle>Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={updateSettingsAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full name</Label>
            <Input id="fullName" name="fullName" defaultValue={fullName ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="preferredLanguage">Preferred language</Label>
            <select
              className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
              defaultValue={preferredLanguage ?? "en"}
              id="preferredLanguage"
              name="preferredLanguage"
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
            </select>
          </div>
          <Button type="submit">Save settings</Button>
        </form>
      </CardContent>
    </Card>
  );
}
