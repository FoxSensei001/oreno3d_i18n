'use client';

import React, { useState, useTransition } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe, Check } from 'lucide-react';

const languages = [
  { code: 'system', name: 'Follow System', },
  { code: 'zh', name: '简体中文' },
  { code: 'zh-TW', name: '繁體中文'},
  { code: 'en', name: 'English'},
  { code: 'ja', name: '日本語'},
];

export function LanguageSwitcher() {
  const locale = useLocale();
  const t = useTranslations('language');
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);

  // 获取当前保存的语言偏好
  const [savedLocale, setSavedLocale] = useState<string>('system');

  // 在客户端获取 cookie 值
  React.useEffect(() => {
    const cookieValue = document.cookie
      .split('; ')
      .find(row => row.startsWith('locale='))
      ?.split('=')[1] || 'system';
    setSavedLocale(cookieValue);
  }, []);

  // 显示的当前语言：如果是 system 则显示 Follow System，否则显示对应语言
  const currentLanguage = languages.find(lang => lang.code === savedLocale) || languages[0];

  const handleLanguageChange = (languageCode: string) => {
    startTransition(() => {
      if (languageCode === 'system') {
        // 如果选择 Follow System，删除 cookie 让系统自动检测
        document.cookie = 'locale=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      } else {
        // 设置 cookie 来保存用户的语言选择
        document.cookie = `locale=${languageCode}; path=/; max-age=31536000`; // 1年
      }

      // 刷新页面以应用新语言
      window.location.reload();
    });
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2"
          disabled={isPending}
        >
          <Globe className="h-4 w-4" />
          <span className="hidden md:inline">{currentLanguage.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span>{language.name}</span>
            </div>
            {savedLocale === language.code && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
