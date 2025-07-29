# Oreno3dI18n Project Development Code Standards

[中文版本](./CODE_STANDARDS-zh.md)

## Project Overview

This project is an internationalization management tool based on Next.js 15 + TypeScript, using modern React development patterns, integrated with the shadcn/ui component library and next-intl internationalization solution.

## Technology Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui (based on Radix UI)
- **Internationalization**: next-intl
- **State Management**: TanStack Query (React Query)
- **Forms**: React Hook Form + Zod
- **Icons**: Lucide React
- **Notifications**: Sonner

## Directory Structure Standards

```
src/
├── app/                    # Next.js App Router pages
│   ├── admin/             # Admin dashboard pages
│   ├── api/               # API routes
│   ├── globals.css        # Global styles
│   └── layout.tsx         # Root layout
├── components/            # Components directory
│   ├── admin/            # Business components
│   └── ui/               # UI base components (shadcn/ui)
├── hooks/                # Custom Hooks
├── i18n/                 # Internationalization configuration
├── lib/                  # Utility library
│   ├── types.ts          # Type definitions
│   └── utils.ts          # Utility functions
messages/                 # Internationalization text files
├── zh.json              # Simplified Chinese
├── zh-TW.json           # Traditional Chinese
├── en.json              # English
└── ja.json              # Japanese
```

## TypeScript Type Definition Standards

### 1. Type File Location
- All global type definitions are unified in `src/lib/types.ts`
- Component-specific types can be defined within the component file
- API-related types are unified in `types.ts`

### 2. Type Naming Conventions
```typescript
// Interfaces use PascalCase, ending with Interface or a specific noun
export interface ModuleConfig { }
export interface ApiResponse<T = unknown> { }

// Type aliases use PascalCase
export type ModuleHandler = () => Promise<ScrapedItem[]>;
export type SourceLanguageData = Record<string, string>;

// Enums use PascalCase
export enum TaskStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED'
}
```

### 3. Type Export Standards
```typescript
// Use export uniformly, avoid export default
export interface ModuleInfo {
  name: string;
  displayName: string;
  // ...
}

// Generic type definitions
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
```

## UI Component Library Usage Standards

### 1. shadcn/ui Component Import
```typescript
// Correct: import from @/components/ui
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

// Incorrect: import directly from third-party libraries
import { Button } from '@radix-ui/react-button';
```

### 2. Component Variant Definition
```typescript
// Use class-variance-authority to define component variants
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

### 3. Component Props Type Definition
```typescript
// Extend HTML element attributes and add variant types
interface ButtonProps 
  extends React.ComponentProps<"button">,
          VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}
```

## Internationalization (i18n) Standards

### 1. Text File Structure
```json
{
  "common": {
    "loading": "Loading...",
    "save": "Save",
    "cancel": "Cancel"
  },
  "navigation": {
    "dashboard": "Dashboard",
    "modules": "Module Management"
  },
  "dashboard": {
    "title": "Dashboard",
    "description": "Manage and monitor translation progress of all i18n modules"
  }
}
```

### 2. Text Usage
```typescript
// Use the useTranslations Hook in components
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

### 3. Language Configuration
```typescript
// Configure supported languages in src/i18n/request.ts
const supportedLocales = ['zh', 'zh-TW', 'en', 'ja'];

// Language switcher component
const languages = [
  { code: 'system', name: 'Follow System' },
  { code: 'zh', name: '简体中文' },
  { code: 'zh-TW', name: '繁體中文' },
  { code: 'en', name: 'English' },
  { code: 'ja', name: '日本語' },
];
```

## Code Style Standards

### 1. Component Definition
```typescript
// Use functional components, prefer function declaration
export function ComponentName({ prop1, prop2 }: ComponentProps) {
  // Component logic
  return <div>...</div>;
}

// Props interface definition above the component
interface ComponentProps {
  prop1: string;
  prop2?: number;
  className?: string;
}
```

### 2. Hooks Usage
```typescript
// Custom Hooks placed in src/hooks/ directory
// Use TanStack Query for data fetching
export function useModules() {
  return useQuery<ModuleInfo[]>({
    queryKey: ['modules'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/modules`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch module list');
      }
      
      return result.data;
    },
    staleTime: 5 * 60 * 1000, // Don't refetch within 5 minutes
  });
}
```

### 3. Style Handling
```typescript
// Use cn utility function to merge className
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

### 4. Client Component Identification
```typescript
// Add 'use client' directive to components requiring client interaction
'use client';

import { useState } from 'react';

export function InteractiveComponent() {
  const [state, setState] = useState(false);
  // ...
}
```

## File Naming Standards

### 1. Component Files
- React components use PascalCase: `Dashboard.tsx`, `ModuleTable.tsx`
- UI components use kebab-case: `button.tsx`, `language-switcher.tsx`

### 2. Utility Files
- Utility functions use kebab-case: `utils.ts`, `scraper.ts`
- Hooks use kebab-case: `use-modules.ts`, `use-settings.ts`

### 3. Page Files
- Next.js page files use kebab-case: `page.tsx`, `layout.tsx`
- Dynamic routes use square brackets: `[moduleName]/page.tsx`

## Import Standards

### 1. Import Order
```typescript
// 1. React related
import React from 'react';
import { useState, useEffect } from 'react';

// 2. Third-party libraries
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

// 3. UI components
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// 4. Business components
import { Dashboard } from '@/components/admin/Dashboard';

// 5. Hooks and utilities
import { useModules } from '@/hooks/use-modules';
import { cn } from '@/lib/utils';

// 6. Type definitions
import type { ModuleInfo } from '@/lib/types';
```

### 2. Path Aliases
```typescript
// Use @ alias to reference files under src directory
import { Button } from '@/components/ui/button';
import { ModuleInfo } from '@/lib/types';
import { useModules } from '@/hooks/use-modules';
```

## Error Handling Standards

### 1. API Error Handling
```typescript
// Unified API response format
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Handle errors in Hooks
export function useModules() {
  return useQuery<ModuleInfo[]>({
    queryKey: ['modules'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/modules`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch module list');
      }
      
      return result.data;
    },
  });
}
```

### 2. User Feedback
```typescript
// Use Sonner for user notifications
import { toast } from 'sonner';

const handleAction = async () => {
  try {
    toast.loading('Processing...', { id: 'action' });
    await performAction();
    toast.success('Operation successful', { id: 'action' });
  } catch (error) {
    toast.error(
      error instanceof Error ? error.message : 'Operation failed',
      { id: 'action' }
    );
  }
};
```

## Performance Optimization Standards

### 1. Data Caching
```typescript
// Use TanStack Query's staleTime to control caching
export function useModules() {
  return useQuery<ModuleInfo[]>({
    queryKey: ['modules'],
    queryFn: fetchModules,
    staleTime: 5 * 60 * 1000, // Don't refetch within 5 minutes
  });
}
```

### 2. Component Optimization
```typescript
// Use React.memo to optimize pure components
export const OptimizedComponent = React.memo(function OptimizedComponent({
  data
}: {
  data: string;
}) {
  return <div>{data}</div>;
});
```

These code standards cover the main development patterns and best practices of the project, providing a unified standard for team development.