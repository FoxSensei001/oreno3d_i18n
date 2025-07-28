import { useTranslations } from 'next-intl';
import { Dashboard } from '@/components/admin/Dashboard';

export default function AdminDashboardPage() {
  const t = useTranslations('dashboard');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground">
          {t('description')}
        </p>
      </div>

      <Dashboard />
    </div>
  );
}
