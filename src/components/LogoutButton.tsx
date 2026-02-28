"use client";

import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/logout', { method: 'POST' });
    router.replace('/login');
  }

  return (
    <button onClick={handleLogout} style={{  position: 'absolute', top: '10px', right: '10px', padding: '10px', background: 'white', cursor: 'pointer' }}>
      Logout
    </button>
  );
}
