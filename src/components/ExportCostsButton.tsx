import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileText, FileSpreadsheet, Code } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  fetchProjectCostData,
  exportToCSV,
  exportToPDF,
  exportToJSON,
  type ProjectCostData
} from '@/services/exportService';

interface ExportCostsButtonProps {
  projectId: string;
  projectName: string;
}

export function ExportCostsButton({ projectId, projectName }: ExportCostsButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async (format: 'csv' | 'pdf' | 'json') => {
    try {
      setIsExporting(true);
      
      // Fetch all project cost data
      const data: ProjectCostData = await fetchProjectCostData(projectId);
      
      // Export based on format
      switch (format) {
        case 'csv':
          exportToCSV(data);
          toast({
            title: "Export Complete",
            description: "Cost data exported to Excel/CSV format"
          });
          break;
        case 'pdf':
          exportToPDF(data);
          toast({
            title: "Export Complete", 
            description: "Cost report exported to PDF format"
          });
          break;
        case 'json':
          exportToJSON(data);
          toast({
            title: "Export Complete",
            description: "Cost data exported to JSON format"
          });
          break;
      }
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export cost data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          disabled={isExporting}
          className="w-full"
        >
          <Download className="h-4 w-4 mr-2" />
          {isExporting ? 'Exporting...' : 'Export Costs'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport('csv')}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Export to Excel
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('pdf')}>
          <FileText className="h-4 w-4 mr-2" />
          Export to PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('json')}>
          <Code className="h-4 w-4 mr-2" />
          Export to JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}