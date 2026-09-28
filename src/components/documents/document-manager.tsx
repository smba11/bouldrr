import { FileText, Trash2, Upload } from "lucide-react";
import { deleteDocumentAction, uploadDocumentAction } from "@/lib/actions/documents";
import { documentTypes } from "@/lib/constants";
import type { DocumentRecord } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type DocumentManagerProps = {
  projectId: string;
  documents: DocumentRecord[];
};

export function DocumentManager({ projectId, documents }: DocumentManagerProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="space-y-3">
        {documents.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex min-h-48 flex-col items-center justify-center gap-3 text-center">
              <FileText className="size-8 text-muted-foreground" />
              <div>
                <p className="font-medium">No documents yet</p>
                <p className="text-sm text-muted-foreground">
                  Upload surveys, plans, permits, contracts, estimates, and official source files.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          documents.map((document) => (
            <Card className="shadow-sm" key={document.id}>
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate font-medium">{document.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {document.document_type} · {new Date(document.created_at).toLocaleDateString()}
                  </p>
                </div>
                <form action={deleteDocumentAction}>
                  <input name="projectId" type="hidden" value={projectId} />
                  <input name="documentId" type="hidden" value={document.id} />
                  <input name="storagePath" type="hidden" value={document.storage_path} />
                  <Button size="sm" type="submit" variant="destructive">
                    <Trash2 className="size-4" />
                    Delete
                  </Button>
                </form>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      <Card className="h-fit shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Upload document</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={uploadDocumentAction} className="space-y-4">
            <input name="projectId" type="hidden" value={projectId} />
            <div className="space-y-2">
              <Label htmlFor="documentType">Document type</Label>
              <select
                className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
                id="documentType"
                name="documentType"
              >
                {documentTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="file">File</Label>
              <Input id="file" name="file" required type="file" />
            </div>
            <Button className="w-full" type="submit">
              <Upload className="size-4" />
              Upload
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
