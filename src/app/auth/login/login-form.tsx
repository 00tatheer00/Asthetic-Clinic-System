'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createClient } from '@/lib/supabase/client';
import { loginStaffAction } from '@/actions/auth';
import { loginSchema, type LoginInput } from '@/lib/validations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';

export function LoginForm() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';
  const errorParam = searchParams.get('error');

  const getInitialError = (): string | null => {
    if (errorParam === 'unauthorized') {
      return 'Your account is not authorized to access the clinic dashboard. Please contact administrator.';
    }
    if (errorParam === 'environment_not_configured') {
      return 'Database connection environment variables are missing. Please contact technical support.';
    }
    if (errorParam === 'session_expired') {
      return 'Your session has expired. Please sign in again.';
    }
    return null;
  };

  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(getInitialError());
  const [isNavigating, setIsNavigating] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'bilal@admin.com',
      password: 'Brimish@2026!',
    },
  });

  const onSubmit = async (data: LoginInput) => {
    setServerError(null);

    try {
      // 1. Call Server Action to authenticate, verify active staff role, and write HTTP session cookies
      const actionResult = await loginStaffAction(data, redirect);

      if (!actionResult.success) {
        const errorMsg = actionResult.error || 'Invalid email or password. Please try again.';
        setServerError(errorMsg);
        toast.error(errorMsg);
        return;
      }

      setIsNavigating(true);
      toast.success('Login successful! Redirecting to clinic dashboard...');

      // 2. Also synchronize client-side Supabase browser client storage
      try {
        const supabase = createClient();
        await supabase.auth.signInWithPassword({
          email: data.email.trim().toLowerCase(),
          password: data.password.trim(),
        });
      } catch {
        // Non-fatal if browser client sync fails since server-side session cookies are already written
      }

      // 3. HARD NAVIGATION to dashboard:
      const targetUrl = actionResult.redirectTo || redirect || '/dashboard';
      window.location.href = targetUrl;
    } catch (err: unknown) {
      console.error('[LoginForm] Uncaught error during sign in:', err);
      const errorMsg =
        err instanceof Error
          ? err.message
          : 'A network or server error occurred. Please check your connection.';
      setServerError(errorMsg);
      toast.error(errorMsg);
      setIsNavigating(false);
    }
  };

  const handleQuickAdminLogin = async () => {
    setValue('email', 'bilal@admin.com');
    setValue('password', 'Brimish@2026!');
    await onSubmit({ email: 'bilal@admin.com', password: 'Brimish@2026!' });
  };

  const isLoading = isSubmitting || isNavigating;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-rose-50 px-4">
      <div className="w-full max-w-md">
        {/* Clinic Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl overflow-hidden shadow-xl shadow-rose-200/50 mb-4 border border-rose-100 bg-white p-1">
            <Image
              src="/images/logo.png"
              alt="Brimish Skin Care Clinic Logo"
              width={76}
              height={76}
              className="w-full h-full object-contain p-1"
              priority
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Brimish Skin Care
          </h1>
          <p className="text-sm text-gray-500 mt-1">Staff Portal</p>
        </div>

        <Card className="shadow-xl border-0 shadow-gray-200/50">
          <CardHeader className="text-center pb-3">
            <CardTitle className="text-xl">Welcome back</CardTitle>
            <CardDescription>Sign in to access the clinic dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Quick 1-Click Login Card for Dr. Bilal / Super Admin */}
            <div className="mb-5 p-3.5 rounded-xl bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200/80 flex items-center justify-between gap-3 shadow-2xs">
              <div className="min-w-0">
                <div className="font-semibold text-rose-950 text-xs flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Dr. Bilal (Super Admin)
                </div>
                <div className="text-[11px] text-gray-600 font-mono mt-0.5 truncate">
                  bilal@admin.com • Brimish@2026!
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={handleQuickAdminLogin}
                disabled={isLoading}
                className="shrink-0 h-8 px-3 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer"
              >
                ⚡ 1-Click Login
              </Button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {serverError && (
                <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
                  <span>{serverError}</span>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="email">Email or Username</Label>
                  <button
                    type="button"
                    onClick={() => {
                      setValue('email', 'bilal@admin.com');
                      setValue('password', 'Brimish@2026!');
                    }}
                    className="text-[11px] text-rose-600 hover:text-rose-700 font-medium cursor-pointer"
                  >
                    Auto-Fill
                  </button>
                </div>
                <Input
                  id="email"
                  type="text"
                  placeholder="bilal@admin.com"
                  autoComplete="email"
                  disabled={isLoading}
                  {...register('email')}
                  className={errors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}
                />
                {errors.email && (
                  <p className="text-xs text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <span className="text-[11px] text-gray-400 font-mono">Brimish@2026!</span>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    disabled={isLoading}
                    {...register('password')}
                    className={errors.password ? 'border-red-500 pr-10 focus-visible:ring-red-500' : 'pr-10'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-600">{errors.password.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 shadow-md font-medium text-white transition-all cursor-pointer"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-gray-400 mt-6">
          &copy; {new Date().getFullYear()} Brimish Skin Care. Staff access only.
        </p>
      </div>
    </div>
  );
}
