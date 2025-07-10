import { supabase } from '@/integrations/supabase/client';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

export interface ProjectCostData {
  project: any;
  phases: any[];
  materialCosts: any[];
  labourCosts: any[];
}

export async function fetchProjectCostData(projectId: string): Promise<ProjectCostData> {
  // Fetch project data
  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();

  // Fetch phases
  const { data: phases } = await supabase
    .from('project_phases')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at');

  // Fetch material costs for all phases
  const { data: materialCosts } = await supabase
    .from('material_costs')
    .select(`
      *,
      project_phases!inner(name, project_id)
    `)
    .eq('project_phases.project_id', projectId);

  // Fetch labour costs for all phases
  const { data: labourCosts } = await supabase
    .from('labour_costs')
    .select(`
      *,
      project_phases!inner(name, project_id)
    `)
    .eq('project_phases.project_id', projectId);

  return {
    project: project || {},
    phases: phases || [],
    materialCosts: materialCosts || [],
    labourCosts: labourCosts || []
  };
}

export function exportToCSV(data: ProjectCostData): void {
  const wb = XLSX.utils.book_new();

  // Project Overview sheet
  const projectOverview = [
    ['Project Name', data.project.name],
    ['Location', data.project.location],
    ['Type', data.project.type],
    ['Status', data.project.status],
    ['Start Date', format(new Date(data.project.start_date), 'yyyy-MM-dd')],
    ['End Date', format(new Date(data.project.end_date), 'yyyy-MM-dd')],
    ['Budget', data.project.budget],
    ['Spent', data.project.spent],
    ['Remaining', data.project.remaining_budget],
    ['Progress', `${data.project.progress}%`]
  ];
  const wsProject = XLSX.utils.aoa_to_sheet(projectOverview);
  XLSX.utils.book_append_sheet(wb, wsProject, 'Project Overview');

  // Phases sheet
  const phaseHeaders = ['Phase Name', 'Status', 'Budget', 'Spent', 'Progress', 'Start Date', 'End Date'];
  const phaseData = data.phases.map(phase => [
    phase.name,
    phase.status,
    phase.budget,
    phase.spent,
    `${phase.progress}%`,
    phase.start_date ? format(new Date(phase.start_date), 'yyyy-MM-dd') : '',
    phase.end_date ? format(new Date(phase.end_date), 'yyyy-MM-dd') : ''
  ]);
  const wsPhases = XLSX.utils.aoa_to_sheet([phaseHeaders, ...phaseData]);
  XLSX.utils.book_append_sheet(wb, wsPhases, 'Phases');

  // Material Costs sheet
  const materialHeaders = ['Phase', 'Category', 'Quantity', 'Unit', 'Unit Price', 'Total', 'Date'];
  const materialData = data.materialCosts.map(cost => [
    cost.project_phases?.name || 'Unknown Phase',
    cost.category,
    cost.qty,
    cost.unit,
    cost.unit_price,
    cost.total,
    format(new Date(cost.created_at), 'yyyy-MM-dd')
  ]);
  const wsMaterials = XLSX.utils.aoa_to_sheet([materialHeaders, ...materialData]);
  XLSX.utils.book_append_sheet(wb, wsMaterials, 'Material Costs');

  // Labour Costs sheet
  const labourHeaders = ['Phase', 'Task', 'Hours', 'Rate', 'Total', 'Date'];
  const labourData = data.labourCosts.map(cost => [
    cost.project_phases?.name || 'Unknown Phase',
    cost.task,
    cost.hours,
    cost.rate,
    cost.total,
    format(new Date(cost.created_at), 'yyyy-MM-dd')
  ]);
  const wsLabour = XLSX.utils.aoa_to_sheet([labourHeaders, ...labourData]);
  XLSX.utils.book_append_sheet(wb, wsLabour, 'Labour Costs');

  // Download file
  const fileName = `${data.project.name.replace(/[^a-zA-Z0-9]/g, '_')}_costs_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

export function exportToPDF(data: ProjectCostData): void {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(20);
  doc.text('Project Cost Report', 20, 20);
  
  // Project info
  doc.setFontSize(12);
  doc.text(`Project: ${data.project.name}`, 20, 35);
  doc.text(`Location: ${data.project.location}`, 20, 45);
  doc.text(`Budget: $${data.project.budget.toLocaleString()}`, 20, 55);
  doc.text(`Spent: $${data.project.spent.toLocaleString()}`, 20, 65);
  doc.text(`Remaining: $${data.project.remaining_budget.toLocaleString()}`, 20, 75);
  doc.text(`Generated: ${format(new Date(), 'MMM dd, yyyy')}`, 20, 85);

  // Phases table
  const phaseRows = data.phases.map(phase => [
    phase.name,
    phase.status,
    `$${phase.budget.toLocaleString()}`,
    `$${phase.spent.toLocaleString()}`,
    `${phase.progress}%`
  ]);

  autoTable(doc, {
    head: [['Phase', 'Status', 'Budget', 'Spent', 'Progress']],
    body: phaseRows,
    startY: 95,
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185] }
  });

  // Material costs table
  const materialRows = data.materialCosts.map(cost => [
    cost.project_phases?.name || 'Unknown',
    cost.category,
    cost.qty.toString(),
    cost.unit,
    `$${cost.unit_price.toFixed(2)}`,
    `$${cost.total.toFixed(2)}`
  ]);

  if (materialRows.length > 0) {
    autoTable(doc, {
      head: [['Phase', 'Category', 'Qty', 'Unit', 'Unit Price', 'Total']],
      body: materialRows,
      startY: (doc as any).lastAutoTable.finalY + 20,
      theme: 'grid',
      headStyles: { fillColor: [231, 76, 60] }
    });
  }

  // Labour costs table
  const labourRows = data.labourCosts.map(cost => [
    cost.project_phases?.name || 'Unknown',
    cost.task,
    cost.hours.toString(),
    `$${cost.rate.toFixed(2)}`,
    `$${cost.total.toFixed(2)}`
  ]);

  if (labourRows.length > 0) {
    autoTable(doc, {
      head: [['Phase', 'Task', 'Hours', 'Rate', 'Total']],
      body: labourRows,
      startY: (doc as any).lastAutoTable?.finalY + 20 || 200,
      theme: 'grid',
      headStyles: { fillColor: [46, 204, 113] }
    });
  }

  // Download PDF
  const fileName = `${data.project.name.replace(/[^a-zA-Z0-9]/g, '_')}_costs_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  doc.save(fileName);
}

export function exportToJSON(data: ProjectCostData): void {
  const exportData = {
    exportDate: new Date().toISOString(),
    project: data.project,
    phases: data.phases,
    costs: {
      materials: data.materialCosts,
      labour: data.labourCosts
    },
    summary: {
      totalMaterialCost: data.materialCosts.reduce((sum, cost) => sum + cost.total, 0),
      totalLabourCost: data.labourCosts.reduce((sum, cost) => sum + cost.total, 0),
      totalCost: data.materialCosts.reduce((sum, cost) => sum + cost.total, 0) + 
                 data.labourCosts.reduce((sum, cost) => sum + cost.total, 0)
    }
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${data.project.name.replace(/[^a-zA-Z0-9]/g, '_')}_costs_${format(new Date(), 'yyyy-MM-dd')}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}