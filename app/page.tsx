'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard
    router.push('/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center"
      style={{
        background: 'linear-gradient(90deg, rgba(5, 185, 250, 1) 0%, rgba(1, 210, 243, 1) 51%, rgba(0, 214, 242, 1) 58%, rgba(0, 255, 217, 1) 100%)'
      }}
    >
      <div className="text-center text-white">
        <h1 className="text-4xl font-bold mb-4">TDX WhatsApp Agent</h1>
        <p className="text-xl">Redirigiendo al dashboard...</p>
      </div>
    </div>
  );
}
