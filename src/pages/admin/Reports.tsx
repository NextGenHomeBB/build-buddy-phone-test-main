import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Download, Plus, Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';

const mockReports = [
  {
    id: '1',
    name: 'Monthly Progress Report - November 2024',
    type: 'progress',
    project: 'Office Tower Construction',
    generatedAt: '2024-11-15T09:30:00Z',
    generatedBy: 'John Manager',
    size: '2.3 MB',
    status: 'ready'
  },
  {
    id: '2',
    name: 'Cost Analysis Q4 2024',
    type: 'financial',
    project: 'Mall Renovation',
    generatedAt: '2024-11-10T14:45:00Z',
    generatedBy: 'Sarah Director',
    size: '1.8 MB',
    status: 'ready'
  },
  {
    id: '3',
    name: 'Safety Compliance Report',
    type: 'safety',
    project: 'Residential Complex',
    generatedAt: '2024-11-08T11:20:00Z',
    generatedBy: 'Mike Safety',
    size: '0.9 MB',
    status: 'ready'
  },
  {
    id: '4',
    name: 'Material Usage Summary',
    type: 'materials',
    project: 'Warehouse Development',
    generatedAt: '2024-11-05T16:15:00Z',
    generatedBy: 'Lisa Coordinator',
    size: '1.2 MB',
    status: 'processing'
  }
];

const reportTypes = [
  { value: 'progress', label: 'Progress Report' },
  { value: 'financial', label: 'Financial Report' },
  { value: 'safety', label: 'Safety Report' },
  { value: 'materials', label: 'Materials Report' },
  { value: 'quality', label: 'Quality Report' }
];

const projects = [
  'Office Tower Construction',
  'Mall Renovation',
  'Residential Complex',
  'Warehouse Development'
];

export default function AdminReports() {
  const [reports, setReports] = useState(mockReports);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState('');
  const [selectedProject, setSelectedProject] = useState('');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'bg-success text-success-foreground';
      case 'processing': return 'bg-warning text-warning-foreground';
      case 'failed': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'progress': return 'bg-primary text-primary-foreground';
      case 'financial': return 'bg-success text-success-foreground';
      case 'safety': return 'bg-warning text-warning-foreground';
      case 'materials': return 'bg-accent text-accent-foreground';
      case 'quality': return 'bg-secondary text-secondary-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const handleGenerateReport = () => {
    if (!selectedType || !selectedProject) {
      toast({
        title: "Error",
        description: "Please select both report type and project.",
        variant: "destructive"
      });
      return;
    }

    const newReport = {
      id: Date.now().toString(),
      name: `${reportTypes.find(t => t.value === selectedType)?.label} - ${format(new Date(), 'MMMM yyyy')}`,
      type: selectedType,
      project: selectedProject,
      generatedAt: new Date().toISOString(),
      generatedBy: 'Current User',
      size: '0 MB',
      status: 'processing'
    };

    setReports(prev => [newReport, ...prev]);
    setIsDialogOpen(false);
    setSelectedType('');
    setSelectedProject('');

    toast({
      title: "Report generation started",
      description: "Your report is being generated and will be available shortly."
    });

    // Simulate report processing
    setTimeout(() => {
      setReports(prev => prev.map(r => 
        r.id === newReport.id 
          ? { ...r, status: 'ready', size: `${(Math.random() * 3 + 0.5).toFixed(1)} MB` }
          : r
      ));
      
      toast({
        title: "Report ready",
        description: "Your report has been generated and is ready for download."
      });
    }, 3000);
  };

  const handleDownload = (reportId: string) => {
    // Mock download
    toast({
      title: "Download started",
      description: "Report download has begun."
    });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
              Generated Reports
            </h1>
            <p className="text-muted-foreground mt-1">
              View and download project reports
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Generate Report
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Generate New Report</DialogTitle>
                <DialogDescription>
                  Select the type of report and project to generate a new report
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Report Type</label>
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select report type" />
                    </SelectTrigger>
                    <SelectContent>
                      {reportTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Project</label>
                  <Select value={selectedProject} onValueChange={setSelectedProject}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map(project => (
                        <SelectItem key={project} value={project}>
                          {project}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={handleGenerateReport} className="flex-1">
                    Generate Report
                  </Button>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
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
                <FileText className="h-5 w-5" />
                Report Archive
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Report Name</th>
                      <th className="text-left p-2">Type</th>
                      <th className="text-left p-2">Project</th>
                      <th className="text-left p-2">Generated</th>
                      <th className="text-left p-2">Size</th>
                      <th className="text-left p-2">Status</th>
                      <th className="text-right p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((report) => (
                      <tr key={report.id} className="border-b">
                        <td className="p-2">
                          <div className="font-medium">{report.name}</div>
                          <div className="text-sm text-muted-foreground">
                            by {report.generatedBy}
                          </div>
                        </td>
                        <td className="p-2">
                          <Badge className={getTypeColor(report.type)}>
                            {reportTypes.find(t => t.value === report.type)?.label}
                          </Badge>
                        </td>
                        <td className="p-2">{report.project}</td>
                        <td className="p-2">
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(report.generatedAt), 'MMM dd, yyyy')}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {format(new Date(report.generatedAt), 'HH:mm')}
                          </div>
                        </td>
                        <td className="p-2 font-mono text-sm">{report.size}</td>
                        <td className="p-2">
                          <Badge className={getStatusColor(report.status)}>
                            {report.status}
                          </Badge>
                        </td>
                        <td className="p-2">
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownload(report.id)}
                              disabled={report.status !== 'ready'}
                            >
                              <Download className="h-4 w-4" />
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
          {reports.map((report) => (
            <Card key={report.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base leading-tight">{report.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={getTypeColor(report.type)}>
                        {reportTypes.find(t => t.value === report.type)?.label}
                      </Badge>
                      <Badge className={getStatusColor(report.status)}>
                        {report.status}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(report.id)}
                    disabled={report.status !== 'ready'}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                <div className="text-sm">
                  <div><strong>Project:</strong> {report.project}</div>
                  <div><strong>Generated by:</strong> {report.generatedBy}</div>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(report.generatedAt), 'MMM dd, yyyy')}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(report.generatedAt), 'HH:mm')}
                    </span>
                    <span className="font-mono">{report.size}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}