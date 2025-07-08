import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, CheckSquare, List } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const mockChecklists = [
  {
    id: '1',
    name: 'Foundation Inspection',
    description: 'Comprehensive foundation quality checklist',
    category: 'Structural',
    items: [
      'Verify concrete mix specifications',
      'Check rebar placement and spacing',
      'Inspect formwork alignment',
      'Test concrete slump',
      'Document foundation dimensions'
    ]
  },
  {
    id: '2',
    name: 'Electrical Safety',
    description: 'Electrical work safety and compliance checklist',
    category: 'Electrical',
    items: [
      'Power isolation confirmed',
      'Circuit testing completed',
      'Ground fault protection verified',
      'Panel labeling updated',
      'Safety equipment inspected'
    ]
  },
  {
    id: '3',
    name: 'Final Walkthrough',
    description: 'Pre-delivery quality assurance checklist',
    category: 'Quality',
    items: [
      'All fixtures installed and working',
      'Paint touchups completed',
      'Flooring installation verified',
      'HVAC system tested',
      'Customer documentation prepared'
    ]
  }
];

export default function AdminChecklists() {
  const [checklists, setChecklists] = useState(mockChecklists);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingChecklist, setEditingChecklist] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    items: ['']
  });

  const handleSubmit = () => {
    const newChecklist = {
      id: editingChecklist?.id || Date.now().toString(),
      ...formData,
      items: formData.items.filter(item => item.trim())
    };

    if (editingChecklist) {
      setChecklists(prev => prev.map(c => c.id === editingChecklist.id ? newChecklist : c));
      toast({ title: "Checklist updated successfully" });
    } else {
      setChecklists(prev => [...prev, newChecklist]);
      toast({ title: "Checklist created successfully" });
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', category: '', items: [''] });
    setEditingChecklist(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (checklist: any) => {
    setEditingChecklist(checklist);
    setFormData({
      name: checklist.name,
      description: checklist.description,
      category: checklist.category,
      items: [...checklist.items, '']
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setChecklists(prev => prev.filter(c => c.id !== id));
    toast({ title: "Checklist deleted successfully" });
  };

  const addItem = () => {
    setFormData(prev => ({ ...prev, items: [...prev.items, ''] }));
  };

  const updateItem = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => i === index ? value : item)
    }));
  };

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
              Checklist Templates
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage default checklist templates for projects
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="h-4 w-4 mr-2" />
                New Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingChecklist ? 'Edit Template' : 'Create Template'}
                </DialogTitle>
                <DialogDescription>
                  {editingChecklist ? 'Update the checklist template' : 'Create a new checklist template for projects'}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Template Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter template name"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter template description"
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    placeholder="e.g., Structural, Electrical, Quality"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Checklist Items</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addItem}>
                      <Plus className="h-3 w-3 mr-1" />
                      Add Item
                    </Button>
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {formData.items.map((item, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={item}
                          onChange={(e) => updateItem(index, e.target.value)}
                          placeholder="Enter checklist item"
                        />
                        {formData.items.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(index)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={handleSubmit} className="flex-1">
                    {editingChecklist ? 'Update' : 'Create'} Template
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
                <List className="h-5 w-5" />
                Templates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Name</th>
                      <th className="text-left p-2">Category</th>
                      <th className="text-left p-2">Items</th>
                      <th className="text-left p-2">Description</th>
                      <th className="text-right p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {checklists.map((checklist) => (
                      <tr key={checklist.id} className="border-b">
                        <td className="p-2 font-medium">{checklist.name}</td>
                        <td className="p-2">
                          <Badge variant="outline">{checklist.category}</Badge>
                        </td>
                        <td className="p-2">{checklist.items.length} items</td>
                        <td className="p-2 text-muted-foreground max-w-xs truncate">
                          {checklist.description}
                        </td>
                        <td className="p-2">
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(checklist)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(checklist.id)}
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
          {checklists.map((checklist) => (
            <Card key={checklist.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{checklist.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">{checklist.category}</Badge>
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <CheckSquare className="h-3 w-3" />
                        {checklist.items.length} items
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(checklist)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(checklist.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground">{checklist.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}