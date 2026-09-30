import { Suspense } from 'react';
import { LoginForm } from './login-form';

export const metadata = {
  title: 'Sign In',
};

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-rose-50">
          <div className="animate-pulse text-gray-400">Loading...</div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
