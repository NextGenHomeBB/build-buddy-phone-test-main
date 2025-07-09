import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Phone, MessageCircle, Clock, CheckCircle, AlertTriangle, DollarSign } from "lucide-react";
import { useOfflineQuery } from "@/hooks/useOfflineQuery";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { t } from "@/lib/i18n";
import { getPriorityIcon, getStatusColor, getPhaseStatusIcon } from '@/lib/ui-helpers';

interface Task {
  id: string;
  title: string;
  description: string;
  status: "todo" | "in-progress" | "review" | "completed";
  priority: "low" | "medium" | "high" | "urgent";
  dueDate: string;
  projectName: string;
  phase: string;
  estimatedHours: number;
}

interface PhaseProgress {
  id: string;
  name: string;
  progress: number;
  totalTasks: number;
  completedTasks: number;
  status: "planning" | "active" | "completed" | "on-hold";
}

interface Payment {
  id: string;
  invoiceNumber: string;
  amount: number;
  status: "pending" | "paid" | "overdue";
  dueDate: string;
  description: string;
}

interface Subcontractor {
  id: string;
  name: string;
  company: string;
  avatar: string;
  email: string;
  phone: string;
  whatsapp: string;
  specialty: string;
  rating: number;
  tasks: Task[];
  phases: PhaseProgress[];
  payments: Payment[];
}

export default function SubcontractorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("tasks");

  // Mock data - replace with actual Supabase query
  const mockSubcontractor: Subcontractor = {
    id: id || "1",
    name: "John Martinez",
    company: "Martinez Electrical Solutions",
    avatar: "",
    email: "john@martinez-electric.com",
    phone: "+1-555-0123",
    whatsapp: "+1-555-0123",
    specialty: "Electrical",
    rating: 4.8,
    tasks: [
      {
        id: "1",
        title: "Install main electrical panel",
        description: "Install and wire the main electrical distribution panel for the residential project",
        status: "in-progress",
        priority: "high",
        dueDate: "2024-01-15",
        projectName: "Sunset Villa",
        phase: "Electrical Rough-in",
        estimatedHours: 8
      },
      {
        id: "2", 
        title: "Wire kitchen outlets",
        description: "Install GFCI outlets and wiring for kitchen appliances",
        status: "todo",
        priority: "medium",
        dueDate: "2024-01-18",
        projectName: "Sunset Villa",
        phase: "Electrical Finish",
        estimatedHours: 4
      },
      {
        id: "3",
        title: "Lighting fixture installation",
        description: "Install all interior and exterior lighting fixtures",
        status: "completed",
        priority: "medium",
        dueDate: "2024-01-10",
        projectName: "Oak Street Renovation",
        phase: "Finishing",
        estimatedHours: 6
      }
    ],
    phases: [
      {
        id: "1",
        name: "Electrical Rough-in",
        progress: 75,
        totalTasks: 4,
        completedTasks: 3,
        status: "active"
      },
      {
        id: "2",
        name: "Electrical Finish",
        progress: 30,
        totalTasks: 5,
        completedTasks: 1,
        status: "active"
      },
      {
        id: "3",
        name: "Final Inspection",
        progress: 0,
        totalTasks: 2,
        completedTasks: 0,
        status: "planning"
      }
    ],
    payments: [
      {
        id: "1",
        invoiceNumber: "INV-2024-001",
        amount: 2500,
        status: "paid",
        dueDate: "2024-01-05",
        description: "Electrical rough-in work - Phase 1"
      },
      {
        id: "2",
        invoiceNumber: "INV-2024-002", 
        amount: 1800,
        status: "pending",
        dueDate: "2024-01-20",
        description: "Kitchen electrical installations"
      },
      {
        id: "3",
        invoiceNumber: "INV-2024-003",
        amount: 950,
        status: "overdue",
        dueDate: "2024-01-12",
        description: "Lighting fixture installations"
      }
    ]
  };

  const { data: subcontractor, isLoading } = useOfflineQuery(
    ["subcontractor", id],
    async () => {
      // Mock API call - replace with actual Supabase query
      await new Promise(resolve => setTimeout(resolve, 500));
      return mockSubcontractor;
    }
  );

  const handleCall = () => {
    if (subcontractor?.phone) {
      window.location.href = `tel:${subcontractor.phone}`;
    }
  };

  const handleWhatsApp = () => {
    if (subcontractor?.whatsapp) {
      window.open(`https://wa.me/${subcontractor.whatsapp.replace(/[^0-9]/g, '')}`, '_blank');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-success text-success-foreground";
      case "in-progress": return "bg-primary text-primary-foreground";
      case "review": return "bg-warning text-warning-foreground";
      case "overdue": return "bg-destructive text-destructive-foreground";
      case "paid": return "bg-success text-success-foreground";
      case "pending": return "bg-warning text-warning-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };


  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!subcontractor) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-muted-foreground">{t("Subcontractor not found")}</h2>
          <Button onClick={() => navigate(-1)} className="mt-4">
            {t("Go Back")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur border-b">
        <div className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="h-10 w-10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold">{t("Subcontractor Details")}</h1>
          </div>

          {/* Contractor Info */}
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={subcontractor.avatar} />
              <AvatarFallback className="text-lg">
                {subcontractor.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold truncate">{subcontractor.name}</h2>
              <p className="text-muted-foreground truncate">{subcontractor.company}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline">{t(subcontractor.specialty)}</Badge>
                <div className="flex items-center gap-1">
                  <span className="text-sm">⭐</span>
                  <span className="text-sm font-medium">{subcontractor.rating}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="tasks" className="min-h-[44px]">{t("Tasks")}</TabsTrigger>
            <TabsTrigger value="progress" className="min-h-[44px]">{t("Progress")}</TabsTrigger>
            <TabsTrigger value="payments" className="min-h-[44px]">{t("Payments")}</TabsTrigger>
          </TabsList>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="space-y-3">
            {subcontractor.tasks.map((task) => (
              <Card key={task.id}>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{t(task.title)}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {t(task.description)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-3">
                        {(() => {
                          const Icon = getPriorityIcon(task.priority);
                          return <Icon className="h-4 w-4" />;
                        })()}
                        <Badge className={getStatusColor(task.status)}>
                          {t(task.status)}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                      <div>
                        <span className="font-medium">{t("Project")}:</span> {t(task.projectName)}
                      </div>
                      <div>
                        <span className="font-medium">{t("Phase")}:</span> {t(task.phase)}
                      </div>
                      <div>
                        <span className="font-medium">{t("Due")}:</span> {new Date(task.dueDate).toLocaleDateString()}
                      </div>
                      <div>
                        <span className="font-medium">{t("Hours")}:</span> {task.estimatedHours}h
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Progress Tab */}
          <TabsContent value="progress" className="space-y-4">
            {subcontractor.phases.map((phase) => (
              <Card key={phase.id}>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {(() => {
                          const Icon = getPhaseStatusIcon(phase.status);
                          return <Icon className="h-4 w-4" />;
                        })()}
                        <div>
                          <h3 className="font-semibold">{t(phase.name)}</h3>
                          <p className="text-sm text-muted-foreground">
                            {phase.completedTasks} / {phase.totalTasks} {t("tasks completed")}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{phase.progress}%</div>
                        <Badge variant="outline" className={getStatusColor(phase.status)}>
                          {t(phase.status)}
                        </Badge>
                      </div>
                    </div>

                    <Progress value={phase.progress} className="h-3" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-4">
            <div className="space-y-3">
              {subcontractor.payments.map((payment) => (
                <Card key={payment.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold">{payment.invoiceNumber}</h3>
                        <p className="text-sm text-muted-foreground">
                          {t(payment.description)}
                        </p>
                      </div>
                      <Badge className={getStatusColor(payment.status)}>
                        {t(payment.status)}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold">${payment.amount.toLocaleString()}</span>
                      </div>
                      <div className="text-muted-foreground">
                        <span className="font-medium">{t("Due")}:</span> {new Date(payment.dueDate).toLocaleDateString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("Payment Summary")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span>{t("Total Invoiced")}:</span>
                  <span className="font-semibold">
                    ${subcontractor.payments.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>{t("Paid")}:</span>
                  <span className="text-success font-semibold">
                    ${subcontractor.payments
                      .filter(p => p.status === 'paid')
                      .reduce((sum, p) => sum + p.amount, 0)
                      .toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>{t("Pending")}:</span>
                  <span className="text-warning font-semibold">
                    ${subcontractor.payments
                      .filter(p => p.status === 'pending')
                      .reduce((sum, p) => sum + p.amount, 0)
                      .toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-4 flex flex-col gap-3">
        <Button
          onClick={handleWhatsApp}
          size="icon"
          className="h-14 w-14 rounded-full shadow-lg bg-green-600 hover:bg-green-700"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
        
        <Button
          onClick={handleCall}
          size="icon"
          className="h-14 w-14 rounded-full shadow-lg"
        >
          <Phone className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
}