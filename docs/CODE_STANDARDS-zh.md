# Oreno3dI18n 项目开发代码规范

[English Version](../CODE_STANDARDS.md)

## 项目概述

本项目是一个基于 Next.js 15 + TypeScript 的国际化管理工具，采用现代化的 React 开发模式，集成了 shadcn/ui 组件库和 next-intl 国际化方案。

## 技术栈

- **框架**: Next.js 15 (App Router)
- **语言**: TypeScript 5
- **样式**: Tailwind CSS 4
- **UI组件**: shadcn/ui (基于 Radix UI)
- **国际化**: next-intl
- **状态管理**: TanStack Query (React Query)
- **表单**: React Hook Form + Zod
- **图标**: Lucide React
- **通知**: Sonner

## 目录结构规范

```
src/
├── app/                    # Next.js App Router 页面
│   ├── admin/             # 管理后台页面
│   ├── api/               # API 路由
│   ├── globals.css        # 全局样式
│   └── layout.tsx         # 根布局
├── components/            # 组件目录
│   ├── admin/            # 业务组件
│   └── ui/               # UI 基础组件 (shadcn/ui)
├── hooks/                # 自定义 Hooks
├── i18n/                 # 国际化配置
├── lib/                  # 工具库
│   ├── types.ts          # 类型定义
│   └── utils.ts          # 工具函数
messages/                 # 国际化文本文件
├── zh.json              # 简体中文
├── zh-TW.json           # 繁体中文
├── en.json              # 英语
└── ja.json              # 日语
```

## TypeScript 类型定义规范

### 1. 类型文件位置
- 所有全局类型定义统一放在 `src/lib/types.ts`
- 组件特有类型可在组件文件内定义
- API 相关类型统一在 `types.ts` 中定义

### 2. 类型命名规范
``typescript
// 接口使用 PascalCase，以 Interface 或具体名词结尾
export interface ModuleConfig { }
export interface ApiResponse<T = unknown> { }

// 类型别名使用 PascalCase
export type ModuleHandler = () => Promise<ScrapedItem[]>;
export type SourceLanguageData = Record<string, string>;

// 枚举使用 PascalCase
export enum TaskStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED'
}
```

### 3. 类型导出规范
``typescript
// 统一使用 export 导出，避免 export default
export interface ModuleInfo {
  name: string;
  displayName: string;
  // ...
}

// 泛型类型定义
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
```

## UI 组件库使用规范

### 1. shadcn/ui 组件引用
``typescript
// 正确：从 @/components/ui 引用
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

// 错误：直接从第三方库引用
import { Button } from '@radix-ui/react-button';
```

### 2. 组件变体定义
``typescript
// 使用 class-variance-authority 定义组件变体
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  "base-classes",
  {
    variants: {
      variant: {
        default: "default-classes",
        destructive: "destructive-classes",
      },
      size: {
        default: "default-size",
        sm: "small-size",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);
```

### 3. 组件 Props 类型定义
``typescript
// 继承 HTML 元素属性并添加变体类型
interface ButtonProps 
  extends React.ComponentProps<"button">,
          VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}
```

## 国际化 (i18n) 规范

### 1. 文本文件结构
``json
{
  "common": {
    "loading": "加载中...",
    "save": "保存",
    "cancel": "取消"
  },
  "navigation": {
    "dashboard": "仪表盘",
    "modules": "模块管理"
  },
  "dashboard": {
    "title": "仪表盘",
    "description": "管理和监控所有 i18n 模块的翻译进度"
  }
}
```

### 2. 文本使用方式
``typescript
// 在组件中使用 useTranslations Hook
import { useTranslations } from 'next-intl';

export function Dashboard() {
  const t = useTranslations('dashboard');
  const tCommon = useTranslations('common');
  
  return (
    <div>
      <h1>{t('title')}</h1>
      <button>{tCommon('save')}</button>
    </div>
  );
}
```

### 3. 语言配置
``typescript
// src/i18n/request.ts 中配置支持的语言
const supportedLocales = ['zh', 'zh-TW', 'en', 'ja'];

// 语言切换组件
const languages = [
  { code: 'system', name: 'Follow System' },
  { code: 'zh', name: '简体中文' },
  { code: 'zh-TW', name: '繁體中文' },
  { code: 'en', name: 'English' },
  { code: 'ja', name: '日本語' },
];
```

## 代码风格规范

### 1. 组件定义
``typescript
// 使用函数式组件，优先使用 function 声明
export function ComponentName({ prop1, prop2 }: ComponentProps) {
  // 组件逻辑
  return <div>...</div>;
}

// Props 接口定义在组件上方
interface ComponentProps {
  prop1: string;
  prop2?: number;
  className?: string;
}
```

### 2. Hooks 使用
``typescript
// 自定义 Hooks 放在 src/hooks/ 目录
// 使用 TanStack Query 进行数据获取
export function useModules() {
  return useQuery<ModuleInfo[]>({
    queryKey: ['modules'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/modules`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || '获取模块列表失败');
      }
      
      return result.data;
    },
    staleTime: 5 * 60 * 1000, // 5分钟内不重新获取
  });
}
```

### 3. 样式处理
``typescript
// 使用 cn 工具函数合并 className
import { cn } from '@/lib/utils';

export function Component({ className }: { className?: string }) {
  return (
    <div className={cn(
      "base-classes",
      "conditional-classes",
      className
    )}>
      Content
    </div>
  );
}
```

### 4. 客户端组件标识
``typescript
// 需要客户端交互的组件添加 'use client' 指令
'use client';

import { useState } from 'react';

export function InteractiveComponent() {
  const [state, setState] = useState(false);
  // ...
}
```

## 文件命名规范

### 1. 组件文件
- React 组件使用 PascalCase: `Dashboard.tsx`, `ModuleTable.tsx`
- UI 组件使用 kebab-case: `button.tsx`, `language-switcher.tsx`

### 2. 工具文件
- 工具函数使用 kebab-case: `utils.ts`, `scraper.ts`
- Hooks 使用 kebab-case: `use-modules.ts`, `use-settings.ts`

### 3. 页面文件
- Next.js 页面文件使用 kebab-case: `page.tsx`, `layout.tsx`
- 动态路由使用方括号: `[moduleName]/page.tsx`

## 导入规范

### 1. 导入顺序
``typescript
// 1. React 相关
import React from 'react';
import { useState, useEffect } from 'react';

// 2. 第三方库
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

// 3. UI 组件
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// 4. 业务组件
import { Dashboard } from '@/components/admin/Dashboard';

// 5. Hooks 和工具
import { useModules } from '@/hooks/use-modules';
import { cn } from '@/lib/utils';

// 6. 类型定义
import type { ModuleInfo } from '@/lib/types';
```

### 2. 路径别名
``typescript
// 使用 @ 别名引用 src 目录下的文件
import { Button } from '@/components/ui/button';
import { ModuleInfo } from '@/lib/types';
import { useModules } from '@/hooks/use-modules';
```

## 错误处理规范

### 1. API 错误处理
``typescript
// 统一的 API 响应格式
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 在 Hooks 中处理错误
export function useModules() {
  return useQuery<ModuleInfo[]>({
    queryKey: ['modules'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/modules`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || '获取模块列表失败');
      }
      
      return result.data;
    },
  });
}
```

### 2. 用户反馈
``typescript
// 使用 Sonner 进行用户通知
import { toast } from 'sonner';

const handleAction = async () => {
  try {
    toast.loading('处理中...', { id: 'action' });
    await performAction();
    toast.success('操作成功', { id: 'action' });
  } catch (error) {
    toast.error(
      error instanceof Error ? error.message : '操作失败',
      { id: 'action' }
    );
  }
};
```

## 性能优化规范

### 1. 数据缓存
``typescript
// 使用 TanStack Query 的 staleTime 控制缓存
export function useModules() {
  return useQuery<ModuleInfo[]>({
    queryKey: ['modules'],
    queryFn: fetchModules,
    staleTime: 5 * 60 * 1000, // 5分钟内不重新获取
  });
}
```

### 2. 组件优化
``typescript
// 使用 React.memo 优化纯组件
export const OptimizedComponent = React.memo(function OptimizedComponent({
  data
}: {
  data: string;
}) {
  return <div>{data}</div>;
});
```

这份代码规范涵盖了项目的主要开发模式和最佳实践，为团队开发提供了统一的标准。
