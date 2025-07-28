import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';

// 支持的语言列表
const supportedLocales = ['zh', 'zh-TW', 'en', 'ja'];

// 获取浏览器首选语言
function getBrowserLocale(acceptLanguage: string): string {
  // 解析 Accept-Language 头
  const languages = acceptLanguage
    .split(',')
    .map(lang => {
      const [code, q = '1'] = lang.trim().split(';q=');
      return { code: code.toLowerCase(), quality: parseFloat(q) };
    })
    .sort((a, b) => b.quality - a.quality);

  // 查找支持的语言
  for (const { code } of languages) {
    // 精确匹配
    if (supportedLocales.includes(code)) {
      return code;
    }

    // 特殊处理中文变体
    if (code.startsWith('zh-')) {
      const region = code.split('-')[1]?.toUpperCase();
      // TW, HK 使用繁体中文
      if (region === 'TW' || region === 'HK' || region === 'MO') {
        return 'zh-TW';
      }
      // 其他中文变体使用简体中文
      return 'zh';
    }

    // 语言前缀匹配
    const prefix = code.split('-')[0];
    if (supportedLocales.includes(prefix)) {
      return prefix;
    }
  }

  // 默认返回英语
  return 'en';
}

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const headersList = await headers();

  // 优先使用 cookie 中保存的语言
  let locale = cookieStore.get('locale')?.value;

  // 如果没有 cookie，则使用浏览器语言
  if (!locale) {
    const acceptLanguage = headersList.get('accept-language') || '';
    locale = getBrowserLocale(acceptLanguage);
  }

  // 确保语言在支持列表中
  if (!supportedLocales.includes(locale)) {
    locale = 'en';
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default
  };
});
