import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';

export const metadata = {
  title: 'لوحة الإدارة | SES',
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user || (session.user as { role?: string }).role !== 'ADMIN') {
    redirect('/auth/login?callbackUrl=/admin');
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', direction: 'rtl' }}>
      <AdminSidebar />
      <main style={{ flex: 1, marginRight: '240px', padding: '24px', backgroundColor: '#f7fafc', minHeight: '100vh' }}>
        {children}
      </main>
    </div>
  );
}
