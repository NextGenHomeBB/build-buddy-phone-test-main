import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Shield, Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { t } from "@/lib/i18n";

const formSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormData = z.infer<typeof formSchema>;

export default function AdminLogin() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) throw error;

      if (authData.user) {
        // Check if user has admin role
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', authData.user.id)
          .single();

        if (profileError) {
          throw new Error(t("Failed to verify admin access"));
        }

        if (profile?.role !== 'admin') {
          await supabase.auth.signOut();
          throw new Error(t("Access denied. Admin privileges required."));
        }

        toast({
          title: t("Welcome back!"),
          description: t("Successfully signed in to admin panel"),
        });

        // Redirect to admin dashboard
        navigate("/admin/users");
      }
    } catch (error) {
      let errorMessage = t("Invalid email or password");
      
      if (error instanceof Error) {
        if (error.message.includes("Invalid login credentials")) {
          errorMessage = t("Invalid email or password");
        } else if (error.message.includes("Access denied")) {
          errorMessage = error.message;
        } else if (error.message.includes("verify admin access")) {
          errorMessage = t("Unable to verify admin access. Please try again.");
        } else {
          errorMessage = error.message;
        }
      }

      toast({
        title: t("Sign in failed"),
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">{t("Admin Access")}</CardTitle>
            <CardDescription>
              {t("Sign in to access the admin panel")}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t("Email Address")}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t("admin@company.com")}
                className="min-h-[44px]"
                {...form.register("email")}
                disabled={isLoading}
              />
              {form.formState.errors.email && (
                <p className="text-sm text-destructive">
                  {t(form.formState.errors.email.message || "")}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t("Password")}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={t("Enter your password")}
                  className="min-h-[44px] pr-12"
                  {...form.register("password")}
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full w-12 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {form.formState.errors.password && (
                <p className="text-sm text-destructive">
                  {t(form.formState.errors.password.message || "")}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full min-h-[44px]"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t("Signing in...")}
                </>
              ) : (
                t("Sign In")
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              ← {t("Back to main site")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}