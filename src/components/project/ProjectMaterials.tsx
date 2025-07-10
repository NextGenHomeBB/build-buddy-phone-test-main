import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, Package, Search, Calculator } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRoleAccess } from '@/hooks/useRoleAccess';

interface Material {
  id: string;
  name: string;
  description: string | null;
  unit: string;
  price_per_unit: number;
}

interface ProjectMaterial {
  id: string;
  material_id: string;
  project_id: string;
  quantity_needed: number;
  quantity_used: number;
  cost_per_unit: number;
  total_cost: number;
  material: Material;
}

interface ProjectMaterialsProps {
  projectId: string;
}

export function ProjectMaterials({ projectId }: ProjectMaterialsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<string>('');
  const [quantityNeeded, setQuantityNeeded] = useState<number>(0);
  const [editingMaterial, setEditingMaterial] = useState<ProjectMaterial | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { canManageMaterials } = useRoleAccess();

  // Fetch all available materials
  const { data: availableMaterials = [] } = useQuery({
    queryKey: ['materials'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Material[];
    },
  });

  // Fetch project materials
  const { data: projectMaterials = [], isLoading } = useQuery({
    queryKey: ['project-materials', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_materials')
        .select(`
          *,
          material:materials(*)
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as ProjectMaterial[];
    },
  });

  // Add material to project
  const addMaterialMutation = useMutation({
    mutationFn: async ({ materialId, quantity }: { materialId: string; quantity: number }) => {
      const material = availableMaterials.find(m => m.id === materialId);
      if (!material) throw new Error('Material not found');

      const { data, error } = await supabase
        .from('project_materials')
        .insert({
          project_id: projectId,
          material_id: materialId,
          quantity_needed: quantity,
          quantity_used: 0,
          cost_per_unit: material.price_per_unit,
          total_cost: material.price_per_unit * quantity,
        })
        .select(`
          *,
          material:materials(*)
        `);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-materials', projectId] });
      setIsAddDialogOpen(false);
      setSelectedMaterial('');
      setQuantityNeeded(0);
      toast({
        title: "Material added",
        description: "Material has been added to the project successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add material",
        variant: "destructive",
      });
    },
  });

  // Update material usage
  const updateMaterialMutation = useMutation({
    mutationFn: async ({ id, quantityUsed }: { id: string; quantityUsed: number }) => {
      const projectMaterial = projectMaterials.find(pm => pm.id === id);
      if (!projectMaterial) throw new Error('Project material not found');

      const { data, error } = await supabase
        .from('project_materials')
        .update({
          quantity_used: quantityUsed,
        })
        .eq('id', id)
        .select(`
          *,
          material:materials(*)
        `);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-materials', projectId] });
      setEditingMaterial(null);
      toast({
        title: "Material updated",
        description: "Material usage has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update material",
        variant: "destructive",
      });
    },
  });

  // Remove material from project
  const removeMaterialMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('project_materials')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-materials', projectId] });
      toast({
        title: "Material removed",
        description: "Material has been removed from the project.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove material",
        variant: "destructive",
      });
    },
  });

  const filteredMaterials = projectMaterials.filter(pm =>
    pm.material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pm.material.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalCost = projectMaterials.reduce((sum, pm) => sum + pm.total_cost, 0);
  const totalUsedCost = projectMaterials.reduce((sum, pm) => 
    sum + (pm.cost_per_unit * pm.quantity_used), 0
  );

  const handleAddMaterial = () => {
    if (!selectedMaterial || quantityNeeded <= 0) {
      toast({
        title: "Invalid input",
        description: "Please select a material and enter a valid quantity.",
        variant: "destructive",
      });
      return;
    }
    addMaterialMutation.mutate({ materialId: selectedMaterial, quantity: quantityNeeded });
  };

  const handleUpdateUsage = (material: ProjectMaterial, newQuantityUsed: number) => {
    if (newQuantityUsed < 0 || newQuantityUsed > material.quantity_needed) {
      toast({
        title: "Invalid quantity",
        description: "Quantity used cannot be negative or exceed quantity needed.",
        variant: "destructive",
      });
      return;
    }
    updateMaterialMutation.mutate({ id: material.id, quantityUsed: newQuantityUsed });
  };

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

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Package className="h-4 w-4 text-primary" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Total Materials</div>
                <div className="text-lg font-semibold">{projectMaterials.length}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-lg">
                <Calculator className="h-4 w-4 text-success" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Total Cost</div>
                <div className="text-lg font-semibold">€{totalCost.toLocaleString()}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning/10 rounded-lg">
                <Calculator className="h-4 w-4 text-warning" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Used Cost</div>
                <div className="text-lg font-semibold">€{totalUsedCost.toLocaleString()}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/10 rounded-lg">
                <Calculator className="h-4 w-4 text-accent-foreground" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Efficiency</div>
                <div className="text-lg font-semibold">
                  {totalCost > 0 ? Math.round((totalUsedCost / totalCost) * 100) : 0}%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Materials Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Project Materials
              </CardTitle>
              <CardDescription>
                Manage materials needed for this project
              </CardDescription>
            </div>
            {canManageMaterials() && (
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Material
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Material to Project</DialogTitle>
                    <DialogDescription>
                      Select a material and specify the quantity needed for this project.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="material-select">Material</Label>
                      <Select value={selectedMaterial} onValueChange={setSelectedMaterial}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a material" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableMaterials.map((material) => (
                            <SelectItem key={material.id} value={material.id}>
                              <div className="flex items-center justify-between w-full">
                                <span>{material.name}</span>
                                <span className="text-sm text-muted-foreground ml-2">
                                  ${material.price_per_unit}/{material.unit}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="quantity">Quantity Needed</Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="0"
                        value={quantityNeeded}
                        onChange={(e) => setQuantityNeeded(Number(e.target.value))}
                        placeholder="Enter quantity"
                      />
                    </div>
                    {selectedMaterial && (
                      <div className="p-3 bg-muted rounded-lg">
                        <div className="text-sm">
                          <div className="flex justify-between">
                            <span>Estimated Cost:</span>
                            <span className="font-medium">
                              ${(
                                (availableMaterials.find(m => m.id === selectedMaterial)?.price_per_unit || 0) * quantityNeeded
                              ).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => setIsAddDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleAddMaterial}
                        disabled={addMaterialMutation.isPending}
                      >
                        {addMaterialMutation.isPending ? "Adding..." : "Add Material"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search materials..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Materials Table */}
          {filteredMaterials.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Needed</TableHead>
                  <TableHead>Used</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Cost/Unit</TableHead>
                  <TableHead>Total Cost</TableHead>
                  {canManageMaterials() && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMaterials.map((projectMaterial) => {
                  const usagePercentage = (projectMaterial.quantity_used / projectMaterial.quantity_needed) * 100;
                  
                  return (
                    <TableRow key={projectMaterial.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{projectMaterial.material.name}</div>
                          {projectMaterial.material.description && (
                            <div className="text-sm text-muted-foreground">
                              {projectMaterial.material.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{projectMaterial.material.unit}</TableCell>
                      <TableCell>{projectMaterial.quantity_needed}</TableCell>
                      <TableCell>
                        {editingMaterial?.id === projectMaterial.id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min="0"
                              max={projectMaterial.quantity_needed}
                              defaultValue={projectMaterial.quantity_used}
                              className="w-20"
                              onBlur={(e) => {
                                const newValue = Number(e.target.value);
                                handleUpdateUsage(projectMaterial, newValue);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  const newValue = Number((e.target as HTMLInputElement).value);
                                  handleUpdateUsage(projectMaterial, newValue);
                                }
                              }}
                            />
                          </div>
                        ) : (
                          <span 
                            className="cursor-pointer hover:underline"
                            onClick={() => canManageMaterials() && setEditingMaterial(projectMaterial)}
                          >
                            {projectMaterial.quantity_used}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-muted rounded-full h-2">
                            <div 
                              className="h-2 rounded-full bg-primary"
                              style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                            />
                          </div>
                          <span className="text-sm">{Math.round(usagePercentage)}%</span>
                        </div>
                      </TableCell>
                      <TableCell>${projectMaterial.cost_per_unit}</TableCell>
                      <TableCell>${projectMaterial.total_cost.toLocaleString()}</TableCell>
                      {canManageMaterials() && (
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingMaterial(projectMaterial)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeMaterialMutation.mutate(projectMaterial.id)}
                              disabled={removeMaterialMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? (
                <div>
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No materials found matching "{searchTerm}"</p>
                </div>
              ) : (
                <div>
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No materials added to this project yet</p>
                  {canManageMaterials() && (
                    <Button 
                      className="mt-4" 
                      onClick={() => setIsAddDialogOpen(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Material
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}