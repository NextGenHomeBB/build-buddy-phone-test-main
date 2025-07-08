import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface OnboardingData {
  profilePicture?: string;
  jobTitle: string;
  company: string;
  bio: string;
  projectName: string;
  projectType: string;
  projectDescription: string;
}

export default function Onboarding() {
  const { user, profile, updateProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    jobTitle: '',
    company: '',
    bio: '',
    projectName: '',
    projectType: '',
    projectDescription: ''
  });

  // Redirect if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const totalSteps = 3;
  const progress = (currentStep / totalSteps) * 100;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = async () => {
    try {
      // Update user profile with onboarding data
      await updateProfile({
        name: profile?.name || user?.email, // Keep existing name
        // In a real app, you'd save the additional profile data
      });

      toast({
        title: "Welcome to Build-Buddy!",
        description: "Your account has been set up successfully.",
      });

      navigate('/dashboard');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to complete onboarding. Please try again.",
        variant: "destructive",
      });
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return true; // Welcome step, always can proceed
      case 2:
        return data.jobTitle && data.company;
      case 3:
        return data.projectName && data.projectType;
      default:
        return false;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6 text-center">
            <div className="space-y-4">
              <CheckCircle className="h-16 w-16 text-success mx-auto" />
              <div>
                <h2 className="text-2xl font-bold">Welcome to Build-Buddy!</h2>
                <p className="text-muted-foreground mt-2">
                  Let's get you set up in just a few quick steps.
                </p>
              </div>
            </div>
            
            <div className="bg-muted/30 rounded-lg p-4 space-y-2">
              <h3 className="font-semibold">What we'll set up:</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Your profile information</li>
                <li>• Your first project</li>
                <li>• Dashboard preferences</li>
              </ul>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold">Set up your profile</h2>
              <p className="text-muted-foreground mt-2">
                Tell us a bit about yourself and your work.
              </p>
            </div>

            <div className="flex justify-center">
              <div className="relative">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={data.profilePicture} />
                  <AvatarFallback className="text-lg">
                    {profile?.name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="jobTitle">Job Title</Label>
                <Input
                  id="jobTitle"
                  placeholder="e.g., Project Manager, Foreman, Engineer"
                  value={data.jobTitle}
                  onChange={(e) => setData(prev => ({ ...prev, jobTitle: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  placeholder="Your company name"
                  value={data.company}
                  onChange={(e) => setData(prev => ({ ...prev, company: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio (Optional)</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell us about your experience in construction..."
                  value={data.bio}
                  onChange={(e) => setData(prev => ({ ...prev, bio: e.target.value }))}
                  rows={3}
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold">Create your first project</h2>
              <p className="text-muted-foreground mt-2">
                Start by setting up your first construction project.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="projectName">Project Name</Label>
                <Input
                  id="projectName"
                  placeholder="e.g., Downtown Office Building"
                  value={data.projectName}
                  onChange={(e) => setData(prev => ({ ...prev, projectName: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="projectType">Project Type</Label>
                <Select 
                  value={data.projectType} 
                  onValueChange={(value) => setData(prev => ({ ...prev, projectType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select project type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="commercial">Commercial Building</SelectItem>
                    <SelectItem value="residential">Residential</SelectItem>
                    <SelectItem value="infrastructure">Infrastructure</SelectItem>
                    <SelectItem value="renovation">Renovation</SelectItem>
                    <SelectItem value="industrial">Industrial</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="projectDescription">Description (Optional)</Label>
                <Textarea
                  id="projectDescription"
                  placeholder="Brief description of the project..."
                  value={data.projectDescription}
                  onChange={(e) => setData(prev => ({ ...prev, projectDescription: e.target.value }))}
                  rows={3}
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-between mb-4">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary-light flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">BB</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Step {currentStep} of {totalSteps}
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </CardHeader>

        <CardContent>
          {renderStep()}
        </CardContent>

        <div className="p-6 pt-0">
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Previous
            </Button>

            {currentStep === totalSteps ? (
              <Button
                onClick={handleComplete}
                disabled={!canProceed()}
                className="flex items-center gap-2"
              >
                Complete Setup
                <CheckCircle className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="flex items-center gap-2"
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}