import { Plus, Trash2, WalletCards } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { createCostAction, deleteCostAction } from "@/lib/actions/projects";
import { costCategories } from "@/lib/constants";
import { getProjectWorkspace } from "@/lib/data/projects";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

export default async function CostsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const user = await requireUser();
  const project = await getProjectWorkspace(projectId, user.id);
  const totals = project.project_costs.reduce(
    (accumulator, cost) => {
      accumulator.estimated += cost.estimated_amount;
      accumulator.quoted += cost.quoted_amount;
      accumulator.committed += cost.committed_amount;
      accumulator.paid += cost.paid_amount;
      accumulator.final += cost.final_amount;
      return accumulator;
    },
    { committed: 0, estimated: 0, final: 0, paid: 0, quoted: 0 },
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Costs</h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          Track estimated, quoted, committed, paid, and final costs across the
          development lifecycle.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        {[
          ["Estimated", totals.estimated],
          ["Quoted", totals.quoted],
          ["Committed", totals.committed],
          ["Paid", totals.paid],
          ["Final", totals.final],
        ].map(([label, value]) => (
          <Card className="shadow-sm" key={label}>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">
                {label}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">
              {formatCurrency(Number(value))}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <WalletCards className="size-5" />
              Cost Register
            </CardTitle>
          </CardHeader>
          <CardContent>
            {project.project_costs.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                No costs are tracked yet. Add land, permit, design,
                construction, financing, and contingency line items.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Estimated</TableHead>
                    <TableHead>Quoted</TableHead>
                    <TableHead>Committed</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Final</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {project.project_costs.map((cost) => (
                    <TableRow key={cost.id}>
                      <TableCell>
                        <div className="max-w-56 whitespace-normal">
                          <p className="font-medium">{cost.item_name}</p>
                          {cost.notes && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              {cost.notes}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{cost.category}</TableCell>
                      <TableCell>{formatCurrency(cost.estimated_amount)}</TableCell>
                      <TableCell>{formatCurrency(cost.quoted_amount)}</TableCell>
                      <TableCell>{formatCurrency(cost.committed_amount)}</TableCell>
                      <TableCell>{formatCurrency(cost.paid_amount)}</TableCell>
                      <TableCell>{formatCurrency(cost.final_amount)}</TableCell>
                      <TableCell>
                        <form action={deleteCostAction}>
                          <input name="projectId" type="hidden" value={project.id} />
                          <input name="costId" type="hidden" value={cost.id} />
                          <Button size="icon-sm" type="submit" variant="destructive">
                            <Trash2 className="size-4" />
                            <span className="sr-only">Delete cost</span>
                          </Button>
                        </form>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="h-fit shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Plus className="size-4" />
              Add Cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createCostAction} className="space-y-4">
              <input name="projectId" type="hidden" value={project.id} />
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <select
                  className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
                  id="category"
                  name="category"
                >
                  {costCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="itemName">Item</Label>
                <Input id="itemName" name="itemName" required />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  ["estimatedAmount", "Estimated"],
                  ["quotedAmount", "Quoted"],
                  ["committedAmount", "Committed"],
                  ["paidAmount", "Paid"],
                  ["finalAmount", "Final"],
                ].map(([name, label]) => (
                  <div className="space-y-2" key={name}>
                    <Label htmlFor={name}>{label}</Label>
                    <Input id={name} min="0" name={name} step="1" type="number" />
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" name="notes" rows={3} />
              </div>
              <Button className="w-full" type="submit">
                Add cost
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
