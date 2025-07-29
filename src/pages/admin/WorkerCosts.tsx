import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Search, Plus, DollarSign, TrendingUp, Users, Calendar, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Mock data for demonstration
const mockWorkers = [
  {
    id: "1",
    name: "John Smith",
    role: "Site Manager",
    hourlyRate: 45,
    hoursThisMonth: 160,
    totalEarnings: 7200,
    status: "active",
    lastPayment: "2024-01-15",
  },
  {
    id: "2", 
    name: "Sarah Johnson",
    role: "Electrician",
    hourlyRate: 38,
    hoursThisMonth: 155,
    totalEarnings: 5890,
    status: "active",
    lastPayment: "2024-01-15",
  },
  {
    id: "3",
    name: "Mike Davis", 
    role: "Plumber",
    hourlyRate: 42,
    hoursThisMonth: 148,
    totalEarnings: 6216,
    status: "active",
    lastPayment: "2024-01-15",
  },
];

const mockPayments = [
  {
    id: "1",
    workerId: "1",
    workerName: "John Smith",
    amount: 7200,
    period: "January 2024",
    status: "paid",
    paidDate: "2024-01-31",
    method: "bank_transfer",
  },
  {
    id: "2",
    workerId: "2", 
    workerName: "Sarah Johnson",
    amount: 5890,
    period: "January 2024",
    status: "pending",
    paidDate: null,
    method: "bank_transfer",
  },
];

export function WorkerCosts() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isRateDialogOpen, setIsRateDialogOpen] = useState(false);
  const { toast } = useToast();

  const totalWorkers = mockWorkers.length;
  const totalMonthlyPay = mockWorkers.reduce((sum, worker) => sum + worker.totalEarnings, 0);
  const averageHourlyRate = mockWorkers.reduce((sum, worker) => sum + worker.hourlyRate, 0) / mockWorkers.length;
  const pendingPayments = mockPayments.filter(p => p.status === "pending").length;

  const filteredWorkers = mockWorkers.filter(worker => {
    const matchesSearch = worker.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === "all" || worker.role.toLowerCase().includes(selectedRole.toLowerCase());
    return matchesSearch && matchesRole;
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "default",
      inactive: "secondary",
      pending: "outline"
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || "outline"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getPaymentStatusBadge = (status: string) => {
    const variants = {
      paid: "default",
      pending: "outline",
      failed: "destructive"
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || "outline"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const handleProcessPayment = () => {
    toast({
      title: "Payment Processed",
      description: "Payment has been successfully processed.",
    });
    setIsPaymentDialogOpen(false);
  };

  const handleUpdateRate = () => {
    toast({
      title: "Rate Updated",
      description: "Worker hourly rate has been updated successfully.",
    });
    setIsRateDialogOpen(false);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Worker Cost Management</h1>
          <p className="text-muted-foreground">
            Manage worker salaries, payments, and financial data
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Workers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalWorkers}</div>
              <p className="text-xs text-muted-foreground">Active employees</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Payroll</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalMonthlyPay.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Current month total</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${averageHourlyRate.toFixed(0)}/hr</div>
              <p className="text-xs text-muted-foreground">Per hour average</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingPayments}</div>
              <p className="text-xs text-muted-foreground">Awaiting processing</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="workers" className="space-y-4">
          <TabsList>
            <TabsTrigger value="workers">Workers</TabsTrigger>
            <TabsTrigger value="payments">Payment History</TabsTrigger>
          </TabsList>

          <TabsContent value="workers">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Worker Management</CardTitle>
                    <CardDescription>
                      Manage worker rates, hours, and earnings
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Dialog open={isRateDialogOpen} onOpenChange={setIsRateDialogOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="h-4 w-4 mr-2" />
                          Update Rates
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Update Worker Rate</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="worker">Worker</Label>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="Select worker" />
                              </SelectTrigger>
                              <SelectContent>
                                {mockWorkers.map((worker) => (
                                  <SelectItem key={worker.id} value={worker.id}>
                                    {worker.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="rate">New Hourly Rate ($)</Label>
                            <Input id="rate" type="number" placeholder="45.00" />
                          </div>
                          <div>
                            <Label htmlFor="effective">Effective Date</Label>
                            <Input id="effective" type="date" />
                          </div>
                          <div>
                            <Label htmlFor="notes">Notes</Label>
                            <Textarea id="notes" placeholder="Reason for rate change..." />
                          </div>
                          <Button onClick={handleUpdateRate} className="w-full">
                            Update Rate
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search workers..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="electrician">Electrician</SelectItem>
                      <SelectItem value="plumber">Plumber</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Worker</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Hourly Rate</TableHead>
                      <TableHead>Hours This Month</TableHead>
                      <TableHead>Total Earnings</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredWorkers.map((worker) => (
                      <TableRow key={worker.id}>
                        <TableCell className="font-medium">{worker.name}</TableCell>
                        <TableCell>{worker.role}</TableCell>
                        <TableCell>${worker.hourlyRate}/hr</TableCell>
                        <TableCell>{worker.hoursThisMonth}h</TableCell>
                        <TableCell>${worker.totalEarnings.toLocaleString()}</TableCell>
                        <TableCell>{getStatusBadge(worker.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Payment History</CardTitle>
                    <CardDescription>
                      Track and manage worker payments
                    </CardDescription>
                  </div>
                  <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Process Payment
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Process Payment</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="paymentWorker">Worker</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select worker" />
                            </SelectTrigger>
                            <SelectContent>
                              {mockWorkers.map((worker) => (
                                <SelectItem key={worker.id} value={worker.id}>
                                  {worker.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="amount">Amount ($)</Label>
                          <Input id="amount" type="number" placeholder="5000.00" />
                        </div>
                        <div>
                          <Label htmlFor="period">Pay Period</Label>
                          <Input id="period" placeholder="January 2024" />
                        </div>
                        <div>
                          <Label htmlFor="method">Payment Method</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select method" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                              <SelectItem value="check">Check</SelectItem>
                              <SelectItem value="cash">Cash</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button onClick={handleProcessPayment} className="w-full">
                          Process Payment
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Worker</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment Date</TableHead>
                      <TableHead>Method</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">{payment.workerName}</TableCell>
                        <TableCell>${payment.amount.toLocaleString()}</TableCell>
                        <TableCell>{payment.period}</TableCell>
                        <TableCell>{getPaymentStatusBadge(payment.status)}</TableCell>
                        <TableCell>{payment.paidDate || "Pending"}</TableCell>
                        <TableCell className="capitalize">{payment.method.replace("_", " ")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}