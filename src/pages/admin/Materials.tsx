import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Package } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const mockMaterials = [
  {
    id: '1',
    name: 'Portland Cement',
    description: 'Type I/II Portland cement for general construction',
    category: 'Concrete',
    unit: 'bags',
    cost: 12.50,
    supplier: 'BuildCorp Materials',
    sku: 'PC-TYPE1-50LB'
  },
  {
    id: '2',
    name: 'Steel Rebar #4',
    description: 'Grade 60 deformed steel reinforcement bar',
    category: 'Steel',
    unit: 'linear feet',
    cost: 0.85,
    supplier: 'Metro Steel Supply',
    sku: 'RB-G60-#4-20FT'
  },
  {
    id: '3',
    name: '2x4 Lumber SPF',
    description: 'Spruce-Pine-Fir dimensional lumber',
    category: 'Lumber',
    unit: 'board feet',
    cost: 6.25,
    supplier: 'Forest Products Inc',
    sku: 'LBR-SPF-2X4-8FT'
  },
  {
    id: '4',
    name: 'Drywall 1/2"',
    description: 'Standard gypsum wallboard',
    category: 'Interior',
    unit: 'sheets',
    cost: 15.75,
    supplier: 'Drywall Direct',
    sku: 'DW-STD-0.5-4X8'
  }
];

const categories = ['Concrete', 'Steel', 'Lumber', 'Interior', 'Electrical', 'Plumbing', 'Roofing', 'Insulation'];
const units = ['pieces', 'linear feet', 'square feet', 'cubic yards', 'bags', 'sheets', 'rolls', 'board feet'];

export default function AdminMaterials() {
  const [materials, setMaterials] = useState(mockMaterials);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    unit: '',
    cost: '',
    supplier: '',
    sku: ''
  });

  const handleSubmit = () => {
    const newMaterial = {
      id: editingMaterial?.id || Date.now().toString(),
      ...formData,
      cost: parseFloat(formData.cost) || 0
    };

    if (editingMaterial) {
      setMaterials(prev => prev.map(m => m.id === editingMaterial.id ? newMaterial : m));
      toast({ title: "Material updated successfully" });
    } else {
      setMaterials(prev => [...prev, newMaterial]);
      toast({ title: "Material created successfully" });
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: '',
      unit: '',
      cost: '',
      supplier: '',
      sku: ''
    });
    setEditingMaterial(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (material: any) => {
    setEditingMaterial(material);
    setFormData({
      name: material.name,
      description: material.description,
      category: material.category,
      unit: material.unit,
      cost: material.cost.toString(),
      supplier: material.supplier,
      sku: material.sku
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setMaterials(prev => prev.filter(m => m.id !== id));
    toast({ title: "Material deleted successfully" });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
              Master Materials
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage the master materials database
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Material
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingMaterial ? 'Edit Material' : 'Add Material'}
                </DialogTitle>
                <DialogDescription>
                  {editingMaterial ? 'Update the material information' : 'Add a new material to the master database'}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="name">Material Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter material name"
                    />
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Enter material description"
                    />
                  </div>

                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(category => (
                          <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="unit">Unit</Label>
                    <Select value={formData.unit} onValueChange={(value) => setFormData(prev => ({ ...prev, unit: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {units.map(unit => (
                          <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="cost">Cost per Unit ($)</Label>
                    <Input
                      id="cost"
                      type="number"
                      step="0.01"
                      value={formData.cost}
                      onChange={(e) => setFormData(prev => ({ ...prev, cost: e.target.value }))}
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <Label htmlFor="sku">SKU</Label>
                    <Input
                      id="sku"
                      value={formData.sku}
                      onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                      placeholder="Enter SKU"
                    />
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="supplier">Supplier</Label>
                    <Input
                      id="supplier"
                      value={formData.supplier}
                      onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
                      placeholder="Enter supplier name"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={handleSubmit} className="flex-1">
                    {editingMaterial ? 'Update' : 'Add'} Material
                  </Button>
                  <Button variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Materials Database
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Name</th>
                      <th className="text-left p-2">Category</th>
                      <th className="text-left p-2">Unit</th>
                      <th className="text-right p-2">Cost</th>
                      <th className="text-left p-2">SKU</th>
                      <th className="text-left p-2">Supplier</th>
                      <th className="text-right p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {materials.map((material) => (
                      <tr key={material.id} className="border-b">
                        <td className="p-2">
                          <div>
                            <div className="font-medium">{material.name}</div>
                            <div className="text-sm text-muted-foreground truncate max-w-xs">
                              {material.description}
                            </div>
                          </div>
                        </td>
                        <td className="p-2">
                          <Badge variant="outline">{material.category}</Badge>
                        </td>
                        <td className="p-2">{material.unit}</td>
                        <td className="p-2 text-right font-mono">${material.cost.toFixed(2)}</td>
                        <td className="p-2 font-mono text-sm">{material.sku}</td>
                        <td className="p-2">{material.supplier}</td>
                        <td className="p-2">
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(material)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(material.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-4">
          {materials.map((material) => (
            <Card key={material.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base">{material.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">{material.category}</Badge>
                      <span className="text-sm text-muted-foreground">
                        ${material.cost.toFixed(2)} / {material.unit}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(material)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(material.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                <p className="text-sm text-muted-foreground">{material.description}</p>
                <div className="text-sm">
                  <div><strong>SKU:</strong> {material.sku}</div>
                  <div><strong>Supplier:</strong> {material.supplier}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}