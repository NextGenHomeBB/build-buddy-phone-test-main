import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Package, 
  Search, 
  Filter, 
  Sparkles, 
  Download,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Heart
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useMaterials } from '@/hooks/useMaterials';
import { useFavorites } from '@/hooks/useFavorites';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';

const defaultCategories = ['Concrete', 'Steel', 'Lumber', 'Electrical', 'Plumbing', 'Roofing', 'Insulation', 'Interior', 'Hardware', 'Tools', 'General'];
const defaultUnits = ['pieces', 'linear feet', 'square feet', 'cubic yards', 'bags', 'sheets', 'rolls', 'board feet', 'kg', 'm', 'litres'];

export default function AdminMaterials() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null);
  const [editingMaterial, setEditingMaterial] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    unit: '',
    price_per_unit: '',
    brand: '',
    ean: '',
    article_nr: '',
    specs: '',
    url: ''
  });

  const {
    materials,
    totalCount,
    totalPages,
    currentPage,
    isLoading,
    filters,
    setFilters,
    setPage,
    createMaterial,
    updateMaterial,
    deleteMaterial,
    enhanceMaterial,
    isCreating,
    isUpdating,
    isDeleting,
    isEnhancing
  } = useMaterials();

  const { toggleFavorite, isFavorite, isToggling } = useFavorites();

  const handleSubmit = () => {
    const materialData = {
      ...formData,
      price_per_unit: parseFloat(formData.price_per_unit) || 0
    };

    if (editingMaterial) {
      updateMaterial({ id: editingMaterial.id, updates: materialData });
    } else {
      createMaterial(materialData);
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: '',
      unit: '',
      price_per_unit: '',
      brand: '',
      ean: '',
      article_nr: '',
      specs: '',
      url: ''
    });
    setEditingMaterial(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (material: any) => {
    setEditingMaterial(material);
    setFormData({
      name: material.name || '',
      description: material.description || '',
      category: material.category || '',
      unit: material.unit || '',
      price_per_unit: material.price_per_unit?.toString() || '',
      brand: material.brand || '',
      ean: material.ean || '',
      article_nr: material.article_nr || '',
      specs: material.specs || '',
      url: material.url || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this material?')) {
      deleteMaterial(id);
    }
  };

  const handleEnhance = (id: string) => {
    enhanceMaterial(id);
  };

  const updateSearchFilter = (search: string) => {
    setFilters({ ...filters, search });
    setPage(1);
  };

  const updateCategoryFilter = (category: string) => {
    setFilters({ ...filters, category: category === 'all' ? '' : category });
    setPage(1);
  };

  const updatePriceRangeFilter = (priceRange: [number, number]) => {
    setFilters({ ...filters, priceRange });
    setPage(1);
  };

  const handleViewDetails = (material: any) => {
    setSelectedMaterial(material);
    setIsDetailDialogOpen(true);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      category: '',
      priceRange: [0, 1000],
      brand: ''
    });
    setPage(1);
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
              Manage materials database ({totalCount.toLocaleString()} items)
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>

            <Button variant="outline">
              <Heart className="h-4 w-4 mr-2" />
              Add to Favorites
            </Button>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => resetForm()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Material
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
                      <Label htmlFor="name">Material Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter material name"
                        required
                      />
                    </div>

                    <div className="col-span-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Enter material description"
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Auto-categorized" />
                        </SelectTrigger>
                        <SelectContent>
                          {defaultCategories.map(category => (
                            <SelectItem key={category} value={category}>{category}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="unit">Unit</Label>
                      <Select value={formData.unit} onValueChange={(value) => setFormData(prev => ({ ...prev, unit: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Auto-detected" />
                        </SelectTrigger>
                        <SelectContent>
                          {defaultUnits.map(unit => (
                            <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="price_per_unit">Price per Unit ($)</Label>
                      <Input
                        id="price_per_unit"
                        type="number"
                        step="0.01"
                        value={formData.price_per_unit}
                        onChange={(e) => setFormData(prev => ({ ...prev, price_per_unit: e.target.value }))}
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <Label htmlFor="brand">Brand</Label>
                      <Input
                        id="brand"
                        value={formData.brand}
                        onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                        placeholder="Auto-detected"
                      />
                    </div>

                    <div>
                      <Label htmlFor="ean">EAN/Barcode</Label>
                      <Input
                        id="ean"
                        value={formData.ean}
                        onChange={(e) => setFormData(prev => ({ ...prev, ean: e.target.value }))}
                        placeholder="Enter EAN/barcode"
                      />
                    </div>

                    <div>
                      <Label htmlFor="article_nr">Article Number</Label>
                      <Input
                        id="article_nr"
                        value={formData.article_nr}
                        onChange={(e) => setFormData(prev => ({ ...prev, article_nr: e.target.value }))}
                        placeholder="Enter article number"
                      />
                    </div>

                    <div className="col-span-2">
                      <Label htmlFor="specs">Specifications</Label>
                      <Textarea
                        id="specs"
                        value={formData.specs}
                        onChange={(e) => setFormData(prev => ({ ...prev, specs: e.target.value }))}
                        placeholder="Enter technical specifications"
                        rows={2}
                      />
                    </div>

                    <div className="col-span-2">
                      <Label htmlFor="url">Product URL</Label>
                      <Input
                        id="url"
                        type="url"
                        value={formData.url}
                        onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                        placeholder="https://..."
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button 
                      onClick={handleSubmit} 
                      className="flex-1"
                      disabled={isCreating || isUpdating || !formData.name}
                    >
                      {(isCreating || isUpdating) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
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
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search materials..."
                      value={filters.search}
                      onChange={(e) => updateSearchFilter(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                {showFilters && (
                  <>
                    <Select value={filters.category || 'all'} onValueChange={updateCategoryFilter}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="All categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All categories</SelectItem>
                        {defaultCategories.map(category => (
                          <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="outline" onClick={clearFilters}>
                      Clear
                    </Button>
                  </>
                )}
              </div>

              {showFilters && (
                <div className="space-y-3">
                  <div>
                    <Label>Price Range: ${filters.priceRange[0]} - ${filters.priceRange[1]}</Label>
                    <Slider
                      value={filters.priceRange}
                      onValueChange={updatePriceRangeFilter}
                      max={1000}
                      min={0}
                      step={10}
                      className="mt-2"
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Materials Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : materials.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No materials found</p>
              {filters.search || filters.category ? (
                <Button variant="outline" onClick={clearFilters} className="mt-2">
                  Clear filters
                </Button>
              ) : null}
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block">
              <Card>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3">Name</th>
                          <th className="text-left p-3">Category</th>
                          <th className="text-left p-3">Brand</th>
                          <th className="text-left p-3">Unit</th>
                          <th className="text-right p-3">Price</th>
                          <th className="text-right p-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {materials.map((material) => (
                          <tr key={material.id} className="border-b hover:bg-muted/50">
                            <td className="p-3">
                              <div>
                                <div 
                                  className="font-medium cursor-pointer hover:text-primary hover:underline"
                                  onClick={() => handleViewDetails(material)}
                                >
                                  {material.name}
                                </div>
                                {material.description && (
                                  <div className="text-sm text-muted-foreground truncate max-w-xs">
                                    {material.description}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="p-3">
                              {material.category ? (
                                <Badge variant="outline">{material.category}</Badge>
                              ) : (
                                <span className="text-muted-foreground text-sm">Uncategorized</span>
                              )}
                            </td>
                            <td className="p-3">
                              {material.brand || <span className="text-muted-foreground text-sm">Unknown</span>}
                            </td>
                            <td className="p-3">{material.unit}</td>
                            <td className="p-3 text-right font-mono">
                              ${material.price_per_unit?.toFixed(2) || '0.00'}
                            </td>
                            <td className="p-3">
                              <div className="flex gap-1 justify-end">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleFavorite(material.id)}
                                  disabled={isToggling}
                                  title={isFavorite(material.id) ? "Remove from favorites" : "Add to favorites"}
                                >
                                  <Heart className={`h-4 w-4 ${isFavorite(material.id) ? 'fill-red-500 text-red-500' : ''}`} />
                                </Button>
                                {(!material.category || !material.brand) && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEnhance(material.id)}
                                    disabled={isEnhancing}
                                    title="Auto-enhance missing data"
                                  >
                                    <Sparkles className="h-4 w-4" />
                                  </Button>
                                )}
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
                                  disabled={isDeleting}
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
                        <CardTitle 
                          className="text-base cursor-pointer hover:text-primary hover:underline"
                          onClick={() => handleViewDetails(material)}
                        >
                          {material.name}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {material.category ? (
                            <Badge variant="outline" className="text-xs">{material.category}</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">Uncategorized</Badge>
                          )}
                          <span className="text-sm text-muted-foreground">
                            ${material.price_per_unit?.toFixed(2) || '0.00'} / {material.unit}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleFavorite(material.id)}
                          disabled={isToggling}
                          title={isFavorite(material.id) ? "Remove from favorites" : "Add to favorites"}
                        >
                          <Heart className={`h-4 w-4 ${isFavorite(material.id) ? 'fill-red-500 text-red-500' : ''}`} />
                        </Button>
                        {(!material.category || !material.brand) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEnhance(material.id)}
                            disabled={isEnhancing}
                          >
                            <Sparkles className="h-4 w-4" />
                          </Button>
                        )}
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
                          disabled={isDeleting}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-2">
                    {material.description && (
                      <p className="text-sm text-muted-foreground">{material.description}</p>
                    )}
                    <div className="text-sm space-y-1">
                      {material.brand && <div><strong>Brand:</strong> {material.brand}</div>}
                      {material.article_nr && <div><strong>Article:</strong> {material.article_nr}</div>}
                      {material.ean && <div><strong>EAN:</strong> {material.ean}</div>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => currentPage > 1 && setPage(currentPage - 1)}
                        className={currentPage <= 1 ? 'pointer-events-none opacity-50' : ''}
                      />
                    </PaginationItem>
                    
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = currentPage <= 3 ? i + 1 : 
                                     currentPage >= totalPages - 2 ? totalPages - 4 + i :
                                     currentPage - 2 + i;
                      
                      if (pageNum > 0 && pageNum <= totalPages) {
                        return (
                          <PaginationItem key={pageNum}>
                            <PaginationLink
                              onClick={() => setPage(pageNum)}
                              isActive={pageNum === currentPage}
                            >
                              {pageNum}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      }
                      return null;
                    })}
                    
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => currentPage < totalPages && setPage(currentPage + 1)}
                        className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : ''}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}

        {/* Material Detail Dialog */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                {selectedMaterial?.name}
              </DialogTitle>
              <DialogDescription>
                Material details and specifications
              </DialogDescription>
            </DialogHeader>
            
            {selectedMaterial && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Category</Label>
                    <p className="text-sm">{selectedMaterial.category || 'Uncategorized'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Brand</Label>
                    <p className="text-sm">{selectedMaterial.brand || 'Unknown'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Unit</Label>
                    <p className="text-sm">{selectedMaterial.unit}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Price per Unit</Label>
                    <p className="text-sm font-mono">${selectedMaterial.price_per_unit?.toFixed(2) || '0.00'}</p>
                  </div>
                  {selectedMaterial.ean && (
                    <div>
                      <Label className="text-sm font-medium">EAN/Barcode</Label>
                      <p className="text-sm font-mono">{selectedMaterial.ean}</p>
                    </div>
                  )}
                  {selectedMaterial.article_nr && (
                    <div>
                      <Label className="text-sm font-medium">Article Number</Label>
                      <p className="text-sm font-mono">{selectedMaterial.article_nr}</p>
                    </div>
                  )}
                </div>
                
                {selectedMaterial.description && (
                  <div>
                    <Label className="text-sm font-medium">Description</Label>
                    <p className="text-sm">{selectedMaterial.description}</p>
                  </div>
                )}
                
                {selectedMaterial.specs && (
                  <div>
                    <Label className="text-sm font-medium">Specifications</Label>
                    <p className="text-sm">{selectedMaterial.specs}</p>
                  </div>
                )}
                
                {selectedMaterial.url && (
                  <div className="pt-4 border-t">
                    <Button 
                      onClick={() => window.open(selectedMaterial.url, '_blank')}
                      className="w-full"
                    >
                      View Product Page
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}