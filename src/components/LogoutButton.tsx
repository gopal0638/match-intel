"use client";

import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/logout', { method: 'POST' });
    router.replace('/login');
  }

  return (
    <button onClick={handleLogout} style={{ position: 'fixed', top: 10, right: 10 }}>
      Logout
    </button>
  );
}
