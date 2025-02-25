import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useLocation } from "wouter";
import { loginUserSchema } from "@shared/schema";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useState, useEffect } from "react";

export default function AuthPage() {
  const { user, loginMutation } = useAuth();
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);

  const loginForm = useForm({
    resolver: zodResolver(loginUserSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Move redirect logic to useEffect
  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  // Remove the direct return and render conditionally
  if (!user) {
    return (
      <div className="min-h-screen grid lg:grid-cols-2">
        <div className="flex items-center justify-center p-8">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Welcome to Adova Marketing</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={loginForm.handleSubmit((data) => {
                  loginMutation.mutate(data);
                })}
                className="space-y-4"
              >
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input {...loginForm.register("username")} />
                  {loginForm.formState.errors.username && (
                    <p className="text-sm text-red-500 mt-1">
                      {loginForm.formState.errors.username.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      {...loginForm.register("password")}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-500" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-500" />
                      )}
                    </Button>
                  </div>
                  {loginForm.formState.errors.password && (
                    <p className="text-sm text-red-500 mt-1">
                      {loginForm.formState.errors.password.message}
                    </p>
                  )}
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Login
                </Button>
                {loginMutation.isError && (
                  <p className="text-sm text-red-500 text-center">
                    {loginMutation.error.message}
                  </p>
                )}
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="hidden lg:flex items-center justify-center bg-gray-50 p-8">
          <div className="max-w-md text-center">
            <h1 className="text-4xl font-bold mb-4">
              Professional Channel Marketing Platform
            </h1>
            <p className="text-gray-600">
              Generate high-converting landing pages for your Telegram channels and track performance with advanced Facebook Pixel integration.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}