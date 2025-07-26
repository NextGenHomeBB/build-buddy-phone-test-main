import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Trash2, CheckSquare, List, Layers, Building2, Home } from 'lucide-react';
import { useChecklists, useCreateChecklist, useUpdateChecklist, useDeleteChecklist } from '@/hooks/useChecklists';
import { useDefaultPhases, useUpdateDefaultPhase, DefaultPhase } from '@/hooks/useDefaultPhases';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export default function AdminChecklists() {
  const { data: checklists = [], isLoading } = useChecklists();
  const { data: defaultPhases = [], isLoading: phasesLoading } = useDefaultPhases();
  const createChecklistMutation = useCreateChecklist();
  const updateChecklistMutation = useUpdateChecklist();
  const deleteChecklistMutation = useDeleteChecklist();
  const updateDefaultPhaseMutation = useUpdateDefaultPhase();
  const { toast } = useToast();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingChecklist, setEditingChecklist] = useState<any>(null);
  const [isPhaseDialogOpen, setIsPhaseDialogOpen] = useState(false);
  const [editingPhase, setEditingPhase] = useState<DefaultPhase | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    items: ['']
  });

  const [phaseFormData, setPhaseFormData] = useState({
    name: '',
    items: ['']
  });

  const handleSubmit = () => {
    const checklistItems = formData.items
      .filter(item => item.trim())
      .map((item, index) => ({
        id: `item-${index}`,
        title: item.trim(),
      }));

    const checklistData = {
      name: formData.name,
      description: formData.description,
      items: checklistItems,
    };

    if (editingChecklist) {
      updateChecklistMutation.mutate({
        id: editingChecklist.id,
        updates: checklistData,
      });
    } else {
      createChecklistMutation.mutate(checklistData);
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', items: [''] });
    setEditingChecklist(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (checklist: any) => {
    setEditingChecklist(checklist);
    const items = Array.isArray(checklist.items) 
      ? checklist.items.map((item: any) => typeof item === 'string' ? item : item.title || item.text || '')
      : [];
    setFormData({
      name: checklist.name,
      description: checklist.description || '',
      items: [...items, '']
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteChecklistMutation.mutate(id);
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

  const handleEditPhase = (phase: DefaultPhase) => {
    setEditingPhase(phase);
    setPhaseFormData({
      name: phase.name,
      items: [...phase.checklist, '']
    });
    setIsPhaseDialogOpen(true);
  };

  const handleSubmitPhase = () => {
    if (!editingPhase) return;
    
    const checklistItems = phaseFormData.items
      .filter(item => item.trim())
      .map(item => item.trim());

    updateDefaultPhaseMutation.mutate({
      id: editingPhase.id,
      updates: {
        name: phaseFormData.name,
        checklist: checklistItems,
      }
    });

    resetPhaseForm();
  };

  const resetPhaseForm = () => {
    setPhaseFormData({ name: '', items: [''] });
    setEditingPhase(null);
    setIsPhaseDialogOpen(false);
  };

  const addPhaseItem = () => {
    setPhaseFormData(prev => ({ ...prev, items: [...prev.items, ''] }));
  };

  const updatePhaseItem = (index: number, value: string) => {
    setPhaseFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => i === index ? value : item)
    }));
  };

  const removePhaseItem = (index: number) => {
    setPhaseFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleSeedRenovationChecklists = async () => {
    try {
      // Renovation categories with questions
      const renovationCategories = {
        "Structuur & Indeling": [
          "Moet de huidige indeling van de woning worden aangepast?",
          "Zijn er dragende muren die verwijderd of verplaatst moeten worden?",
          "Wil ik open ruimtes of aparte kamers?",
          "Is de woningstructuur (fundering, dak, muren) in goede staat?",
          "Heb ik voldoende bergruimte of moet ik extra opbergruimte voorzien?",
          "Hoe wordt de looproute in huis het meest logisch en comfortabel?",
          "Moet de woning levensloopbestendig worden gemaakt?",
          "Wordt de zolder of kelder mee gerenoveerd?",
          "Zijn er vergunningen nodig voor de indelingswijziging?",
          "Hoe groot moet elke ruimte ongeveer zijn?"
        ],
        "Stijl & Interieurkeuzes": [
          "Welke woonstijl wil ik (modern, landelijk, industrieel, Scandinavisch, etc.)?",
          "Wat is het kleurenpalet voor wanden, vloeren en meubels?",
          "Welk type vloer komt in elke ruimte (hout, laminaat, tegel, gietvloer)?",
          "Wil ik vloerverwarming of radiatoren?",
          "Moeten alle ruimtes dezelfde stijl uitstralen of mogen ze verschillen?",
          "Welke materialen kies ik voor werkbladen, keukenkasten en badkamermeubels?",
          "Welke kraankleur past bij mijn stijl (chroom, zwart, goud, koper, geborsteld staal)?",
          "Wil ik inbouwkasten of losse meubels?",
          "Welke wandafwerking komt waar (verf, behang, hout, steen)?",
          "Hoe belangrijk is akoestiek in de gekozen materialen?"
        ],
        "Verlichting & Elektriciteit": [
          "Wat is het verlichtingsplan per ruimte (basis, sfeer, taakverlichting)?",
          "Waar moeten lichtpunten, schakelaars en stopcontacten komen?",
          "Wil ik slimme verlichting of traditionele schakelaars?",
          "Hoeveel stopcontacten heb ik nodig per kamer?",
          "Wil ik wandlampen, hanglampen, spots of ledstrips?",
          "Moet de elektrische installatie worden vernieuwd of uitgebreid?",
          "Is er voldoende buitenverlichting gepland?",
          "Wil ik dimmers op bepaalde lampen?",
          "Wil ik USB-stopcontacten of geïntegreerde opladers?",
          "Moeten er voorzieningen komen voor zonnepanelen of een laadpaal?"
        ],
        "Keuken & Badkamer": [
          "Welke indeling is ideaal voor de keuken (kookeiland, L-vorm, U-vorm)?",
          "Welke keukenapparatuur wil ik integreren?",
          "Welke kraan past bij mijn spoelbak (hoog, laag, met uittrekbare slang)?",
          "Kies ik voor een bad, een douche, of beide?",
          "Welke douchekop en mengkraan wil ik?",
          "Welk type wastafel en meubel komt in de badkamer?",
          "Komt er een tweede toilet of gastenbadkamer?",
          "Welke wand- en vloertegels gebruik ik in natte ruimtes?",
          "Moet de ventilatie worden aangepast of verbeterd?",
          "Wil ik ingebouwde of vrijstaande badkamermeubels?"
        ],
        "Techniek & Installaties": [
          "Is het isolatieniveau voldoende (dak, muren, vloer, ramen)?",
          "Moet de verwarming worden vervangen of uitgebreid?",
          "Overweeg ik warmtepomp, zonneboiler of andere duurzame systemen?",
          "Is de waterafvoer en -aanvoer nog up-to-date?",
          "Is de woning voldoende geventileerd volgens de norm?",
          "Zijn er voldoende voorzieningen voor internet, TV en domotica?",
          "Moet er extra geluidsisolatie worden aangebracht (tussen kamers of naar buiten)?",
          "Hoe energiezuinig moet de woning worden (BENG, energielabel A++)?",
          "Is er ruimte voor toekomstige uitbreidingen of aanpassingen?",
          "Wat is het totale renovatiebudget en welke posten hebben prioriteit?"
        ]
      };

      // Create category-specific checklists
      for (const [category, questions] of Object.entries(renovationCategories)) {
        const checklistItems = questions.map((question, index) => ({
          id: `${category.toLowerCase().replace(/\s+/g, '-')}-${index + 1}`,
          title: question,
          description: `Renovatievraag voor ${category}`
        }));

        await supabase
          .from('checklists')
          .insert({
            name: `Renovatie: ${category}`,
            description: `Checklist voor renovatievragen over ${category.toLowerCase()}. Deze template helpt bij het plannen en organiseren van renovatieprojecten.`,
            items: checklistItems,
            is_template: true
          });
      }

      // Create comprehensive checklist
      const allItems = Object.entries(renovationCategories).flatMap(([category, questions]) =>
        questions.map((question, index) => ({
          id: `all-${category.toLowerCase().replace(/\s+/g, '-')}-${index + 1}`,
          title: question,
          description: `${category} - Renovatievraag`
        }))
      );

      await supabase
        .from('checklists')
        .insert({
          name: 'Renovatie: Volledige Checklist',
          description: 'Uitgebreide renovatiechecklist met alle 50 essentiële vragen voor woningrenovatie. Bevat structuur, stijl, techniek, keuken/badkamer en installatievragen.',
          items: allItems,
          is_template: true
        });

      toast({
        title: "Success",
        description: "Renovation checklist templates have been created successfully",
      });
      
      // Refresh the checklists
      window.location.reload();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create renovation templates",
        variant: "destructive",
      });
    }
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
              Manage checklist templates and view default phases
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleSeedRenovationChecklists}
              className="hidden md:flex"
            >
              <Home className="h-4 w-4 mr-2" />
              Add Renovation Templates
            </Button>
            
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
                  <Button 
                    onClick={handleSubmit} 
                    className="flex-1"
                    disabled={createChecklistMutation.isPending || updateChecklistMutation.isPending}
                  >
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

          {/* Phase Edit Dialog */}
          <Dialog open={isPhaseDialogOpen} onOpenChange={setIsPhaseDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Edit Default Phase</DialogTitle>
                <DialogDescription>
                  Edit this default phase. Changes will apply to all future projects.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="phase-name">Phase Name</Label>
                  <Input
                    id="phase-name"
                    value={phaseFormData.name}
                    onChange={(e) => setPhaseFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter phase name"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Checklist Items</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addPhaseItem}>
                      <Plus className="h-3 w-3 mr-1" />
                      Add Item
                    </Button>
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {phaseFormData.items.map((item, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={item}
                          onChange={(e) => updatePhaseItem(index, e.target.value)}
                          placeholder="Enter checklist item"
                        />
                        {phaseFormData.items.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removePhaseItem(index)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={handleSubmitPhase} 
                    className="flex-1"
                    disabled={updateDefaultPhaseMutation.isPending}
                  >
                    Update Phase
                  </Button>
                  <Button variant="outline" onClick={resetPhaseForm}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="templates" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              Custom Templates
            </TabsTrigger>
            <TabsTrigger value="phases" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Default Phases
            </TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="space-y-4">
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
                          <th className="text-left p-2">Items</th>
                          <th className="text-left p-2">Description</th>
                          <th className="text-right p-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {isLoading ? (
                          <tr>
                            <td colSpan={4} className="p-8 text-center text-muted-foreground">
                              Loading checklists...
                            </td>
                          </tr>
                        ) : checklists.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="p-8 text-center text-muted-foreground">
                              No checklist templates found. Create one to get started.
                            </td>
                          </tr>
                        ) : (
                          checklists.map((checklist) => {
                            const itemCount = Array.isArray(checklist.items) ? checklist.items.length : 0;
                            return (
                              <tr key={checklist.id} className="border-b">
                                <td className="p-2 font-medium">{checklist.name}</td>
                                <td className="p-2">{itemCount} items</td>
                                <td className="p-2 text-muted-foreground max-w-xs truncate">
                                  {checklist.description || 'No description'}
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
                                      disabled={deleteChecklistMutation.isPending}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
              {isLoading ? (
                <div className="text-center p-8 text-muted-foreground">
                  Loading checklists...
                </div>
              ) : checklists.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground">
                  No checklist templates found. Create one to get started.
                </div>
              ) : (
                checklists.map((checklist) => {
                  const itemCount = Array.isArray(checklist.items) ? checklist.items.length : 0;
                  return (
                    <Card key={checklist.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-base">{checklist.name}</CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-sm text-muted-foreground flex items-center gap-1">
                                <CheckSquare className="h-3 w-3" />
                                {itemCount} items
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
                              disabled={deleteChecklistMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-sm text-muted-foreground">
                          {checklist.description || 'No description'}
                        </p>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </TabsContent>

          <TabsContent value="phases" className="space-y-4">
            {/* Desktop View */}
            <div className="hidden md:block space-y-4">
              {phasesLoading ? (
                <div className="text-center p-8 text-muted-foreground">
                  Loading default phases...
                </div>
              ) : (
                defaultPhases.map((phase) => (
                  <Card key={phase.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Layers className="h-5 w-5" />
                          <CardTitle>{phase.name}</CardTitle>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditPhase(phase)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                      <CardDescription>
                        {phase.checklist.length} checklist items
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-2">
                        {phase.checklist.map((item, itemIndex) => (
                          <div key={itemIndex} className="flex items-center gap-2 p-2 rounded border">
                            <CheckSquare className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{item}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Mobile View */}
            <div className="md:hidden space-y-4">
              {phasesLoading ? (
                <div className="text-center p-8 text-muted-foreground">
                  Loading default phases...
                </div>
              ) : (
                defaultPhases.map((phase) => (
                  <Card key={phase.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Layers className="h-4 w-4" />
                          <CardTitle className="text-base">{phase.name}</CardTitle>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditPhase(phase)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                      <CardDescription className="text-sm">
                        {phase.checklist.length} items
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {phase.checklist.map((item, itemIndex) => (
                          <div key={itemIndex} className="flex items-start gap-2 text-sm">
                            <CheckSquare className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}