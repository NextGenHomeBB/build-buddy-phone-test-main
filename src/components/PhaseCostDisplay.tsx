import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Euro, Package, Users, Plus, Trash2 } from 'lucide-react';
import { usePhaseCosts } from '@/services/phaseCosts.service';
import { format } from 'date-fns';

interface PhaseCostDisplayProps {
  phaseId: string;
  onAddMaterialCost: () => void;
  onAddLabourCost: () => void;
}

export function PhaseCostDisplay({ phaseId, onAddMaterialCost, onAddLabourCost }: PhaseCostDisplayProps) {
  const { data: phaseCosts, isLoading } = usePhaseCosts(phaseId);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!phaseCosts) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Cost Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Package className="h-4 w-4 text-primary" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Material Costs</div>
                <div className="text-lg font-semibold">€{phaseCosts.totalMaterial.toLocaleString()}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-lg">
                <Users className="h-4 w-4 text-success" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Labour Costs</div>
                <div className="text-lg font-semibold">€{phaseCosts.totalLabour.toLocaleString()}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning/10 rounded-lg">
                <Euro className="h-4 w-4 text-warning" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Total Costs</div>
                <div className="text-lg font-semibold">€{(phaseCosts.totalMaterial + phaseCosts.totalLabour).toLocaleString()}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Material Costs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Material Costs
            </CardTitle>
            <Button size="sm" onClick={onAddMaterialCost}>
              <Plus className="h-4 w-4 mr-2" />
              Add Material Cost
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {phaseCosts.materialCosts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {phaseCosts.materialCosts.map((cost) => (
                  <TableRow key={cost.id}>
                    <TableCell>
                      <Badge variant="outline">{cost.category}</Badge>
                    </TableCell>
                    <TableCell>{cost.qty}</TableCell>
                    <TableCell>{cost.unit}</TableCell>
                    <TableCell>€{cost.unit_price.toFixed(2)}</TableCell>
                    <TableCell className="font-medium">€{cost.total.toFixed(2)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(cost.created_at), 'MMM dd, yyyy')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No material costs recorded for this phase.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Labour Costs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Labour Costs
            </CardTitle>
            <Button size="sm" onClick={onAddLabourCost}>
              <Plus className="h-4 w-4 mr-2" />
              Add Labour Cost
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {phaseCosts.labourCosts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {phaseCosts.labourCosts.map((cost) => (
                  <TableRow key={cost.id}>
                    <TableCell>{cost.task}</TableCell>
                    <TableCell>{cost.hours}h</TableCell>
                    <TableCell>€{cost.rate.toFixed(2)}/hr</TableCell>
                    <TableCell className="font-medium">€{cost.total.toFixed(2)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(cost.created_at), 'MMM dd, yyyy')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No labour costs recorded for this phase.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}