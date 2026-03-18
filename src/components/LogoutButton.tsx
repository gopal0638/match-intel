"use client";

import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();
  const pathname = usePathname();

  if (pathname === '/login') return null;

  async function handleLogout() {
    await fetch('/api/logout', { method: 'POST' });
    router.replace('/login');
  }

  return (
    <button
      onClick={handleLogout}
      style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        padding: '10px 12px',
        background: 'white',
        cursor: 'pointer',
        zIndex: 1000,
        borderRadius: '8px',
        border: '1px solid rgba(0,0,0,0.12)',
      }}
    >
      Logout
    </button>
  );
}
