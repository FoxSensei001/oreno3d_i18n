import { redirect } from 'next/navigation';

export default function Home() {
  // 重定向到管理后台
  redirect('/admin');
}
