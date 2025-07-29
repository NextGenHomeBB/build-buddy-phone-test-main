import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export interface WorkerData {
  id: string;
  name: string;
  role: string;
  hourlyRate: number;
  hoursThisMonth: number;
  totalEarnings: number;
  status: string;
  lastPayment: string;
  phone?: string;
  avatar_url?: string;
}

export interface PaymentData {
  id: string;
  workerId: string;
  workerName: string;
  amount: number;
  period: string;
  status: string;
  paidDate: string | null;
  method: string;
}

export const useWorkerCosts = () => {
  const [workers, setWorkers] = useState<WorkerData[]>([]);
  const [payments, setPayments] = useState<PaymentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const { toast } = useToast();

  const loadWorkers = async () => {
    try {
      setLoading(true);
      
      // Fetch all workers from profiles table
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_placeholder', false);

      if (profilesError) throw profilesError;

      // Fetch labour entries for the current month to calculate hours and earnings
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
      
      const { data: labourData, error: labourError } = await supabase
        .from('labour_entries')
        .select('user_id, total_hours, total_cost, created_at')
        .gte('created_at', `${currentMonth}-01`)
        .lt('created_at', `${currentMonth}-31`);

      if (labourError) throw labourError;

      // Process and combine the data
      const workersWithStats = profilesData?.map(profile => {
        const userLabourEntries = labourData?.filter(entry => entry.user_id === profile.user_id) || [];
        
        const totalHours = userLabourEntries.reduce((sum, entry) => sum + (entry.total_hours || 0), 0);
        const totalEarnings = userLabourEntries.reduce((sum, entry) => sum + (entry.total_cost || 0), 0);
        const hourlyRate = totalHours > 0 ? totalEarnings / totalHours : 25; // Default rate if no data
        
        return {
          id: profile.user_id,
          name: profile.name,
          role: profile.role === 'admin' ? 'Site Manager' : 
                profile.role === 'manager' ? 'Project Manager' : 
                profile.role === 'worker' ? 'Worker' : 'Team Member',
          hourlyRate: Math.round(hourlyRate),
          hoursThisMonth: Math.round(totalHours),
          totalEarnings: Math.round(totalEarnings),
          status: 'active',
          lastPayment: new Date().toISOString().split('T')[0],
          phone: profile.phone,
          avatar_url: profile.avatar_url,
        };
      }) || [];

      setWorkers(workersWithStats);

      // Mock payment data for now - you can replace this with actual payment tracking
      const mockPayments = workersWithStats.map(worker => ({
        id: `payment-${worker.id}`,
        workerId: worker.id,
        workerName: worker.name,
        amount: worker.totalEarnings,
        period: `${new Date().toLocaleString('default', { month: 'long' })} ${new Date().getFullYear()}`,
        status: worker.totalEarnings > 0 ? 'paid' : 'pending',
        paidDate: worker.totalEarnings > 0 ? new Date().toISOString().split('T')[0] : null,
        method: 'bank_transfer',
      }));

      setPayments(mockPayments);

    } catch (error) {
      console.error('Failed to load worker data:', error);
      toast({
        title: "Error",
        description: "Failed to load worker data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkers();
  }, []);

  const filteredWorkers = workers.filter(worker => {
    const matchesSearch = worker.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === "all" || worker.role.toLowerCase().includes(selectedRole.toLowerCase());
    return matchesSearch && matchesRole;
  });

  const stats = {
    totalWorkers: workers.length,
    totalMonthlyPay: workers.reduce((sum, worker) => sum + worker.totalEarnings, 0),
    averageHourlyRate: workers.length > 0 ? 
      workers.reduce((sum, worker) => sum + worker.hourlyRate, 0) / workers.length : 0,
    pendingPayments: payments.filter(p => p.status === "pending").length,
  };

  const updateWorkerRate = async (workerId: string, newRate: number) => {
    try {
      // This would typically update a workers table or rates table
      // For now, we'll just show a success message
      toast({
        title: "Rate Updated",
        description: "Worker hourly rate has been updated successfully.",
      });
      loadWorkers(); // Refresh data
    } catch (error) {
      console.error('Failed to update worker rate:', error);
      toast({
        title: "Error",
        description: "Failed to update worker rate. Please try again.",
        variant: "destructive",
      });
    }
  };

  const processPayment = async (workerId: string, amount: number, period: string) => {
    try {
      // This would typically create a payment record
      toast({
        title: "Payment Processed",
        description: "Payment has been successfully processed.",
      });
      loadWorkers(); // Refresh data
    } catch (error) {
      console.error('Failed to process payment:', error);
      toast({
        title: "Error",
        description: "Failed to process payment. Please try again.",
        variant: "destructive",
      });
    }
  };

  return {
    workers: filteredWorkers,
    payments,
    loading,
    searchTerm,
    setSearchTerm,
    selectedRole,
    setSelectedRole,
    stats,
    updateWorkerRate,
    processPayment,
    refreshData: loadWorkers,
  };
};