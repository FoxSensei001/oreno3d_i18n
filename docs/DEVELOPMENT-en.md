# Oreno3dI18n Development Guide

[中文版本](DEVELOPMENT-zh.md)

## 🚀 Quick Start

### Environment Requirements
- Node.js 18.0+
- npm or yarn or pnpm

### Installation and Running

1. **Clone the Project**
```bash
git clone <repository-url>
cd oreno3d_i18n
```

2. **Install Dependencies**
```bash
npm install
```

3. **Start Development Server**
```bash
npm run dev
```

4. **Access the Application**
- Open browser to: http://localhost:3000
- Automatically redirected to admin dashboard: http://localhost:3000/admin

## 📁 Detailed Project Structure

```
oreno3d_i18n/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── admin/             # Admin dashboard pages
│   │   │   ├── layout.tsx     # Dashboard layout
│   │   │   ├── page.tsx       # Dashboard
│   │   │   ├── modules/       # Module management
│   │   │   └── settings/      # System settings
│   │   ├── api/v1/            # API routes
│   │   │   ├── scrape/        # Scraper API
│   │   │   └── modules/       # Module data API
│   │   ├── globals.css        # Global styles
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Home page (redirect)
│   ├── components/            # React components
│   │   ├── ui/               # shadcn/ui base components
│   │   └── admin/            # Admin dashboard components
│   ├── hooks/                # Custom React Hooks
│   │   └── use-modules.ts    # Module data management
│   ├── lib/                  # Core logic
│   │   ├── types.ts          # TypeScript type definitions
│   │   ├── scraper.ts        # Scraper core logic
│   │   └── utils.ts          # Utility functions
│   └── i18n/                 # Generated i18n files
│       └── tags/             # Tag module data
│           ├── ja.json       # Japanese (source language)
│           ├── en.json       # English
│           ├── zh-CN.json    # Simplified Chinese
│           └── zh-TW.json    # Traditional Chinese
├── scraper-config/           # Scraper configuration
│   ├── config.ts            # Global configuration
│   └── handlers/            # Scraper handlers
│       └── tagsHandler.ts   # Tag scraper
├── components.json          # shadcn/ui configuration
├── tailwind.config.js       # Tailwind CSS configuration
├── tsconfig.json           # TypeScript configuration
└── package.json            # Project dependencies
```

## 🔧 Development Guide

### Adding New Data Modules

1. **Create Scraper Handler**
```typescript
// scraper-config/handlers/authorsHandler.ts
import type { ScrapedItem } from '@/lib/types';

export default async function authorsHandler(): Promise<ScrapedItem[]> {
  // Implement scraping logic
  const results: ScrapedItem[] = [];
  
  // Example: Scrape author data from website
  // const response = await axios.get('https://example.com/authors');
  // const $ = cheerio.load(response.data);
  // ... parsing logic
  
  return results;
}
```

2. **Update Configuration File**
```typescript
// scraper-config/config.ts
export const MODULES: ModuleConfig[] = [
  // Existing modules...
  {
    name: 'authors',
    handler: () => import('./handlers/authorsHandler'),
    keyPrefix: 'author_',
    ui: {
      displayName: 'Authors',
      description: 'Content creator information',
      icon: 'User',
      priority: 2,
      estimatedTime: 45
    }
  }
];
```

3. **Restart Application**
```bash
npm run dev
```

The new module will automatically appear in the dashboard.

### Adding New Supported Languages

1. **Update Language Configuration**
```typescript
// scraper-config/config.ts
export const TARGET_LANGUAGES: string[] = [
  'ja', 'en', 'zh-CN', 'zh-TW', 'ko'  // Add Korean
];
```

2. **Run Scraper Update**
Access the admin dashboard and click "Update All Modules", the system will automatically create JSON files for the new language for all modules.

### Custom Scraper Configuration

```typescript
// scraper-config/config.ts
export const SCRAPER_CONFIG = {
  requestDelay: 1000,      // Request interval (milliseconds)
  maxRetries: 3,           // Maximum retry attempts
  timeout: 10000,          // Request timeout (milliseconds)
  concurrency: 2,          // Concurrent requests
  userAgent: '...'         // User-Agent
};
```

## 🌐 API Documentation

### Get All Module Information
```http
GET /api/v1/modules
```

**Response Example:**
```json
{
  "success": true,
  "data": [
    {
      "name": "tags",
      "displayName": "Tags",
      "description": "Website content classification tags",
      "totalItems": 100,
      "progress": 75
    }
  ]
}
```

### Get Module Data
```http
GET /api/v1/modules/{moduleName}
GET /api/v1/modules/{moduleName}?type=stats
```

### Update Translation
```http
PATCH /api/v1/modules/{moduleName}
Content-Type: application/json

{
  "key": "tag_1",
  "lang": "en", 
  "value": "Video Features"
}
```

### Run Scraper
```http
POST /api/v1/scrape
Content-Type: application/json

{
  "moduleName": "tags"  // Optional, if not provided, scrape all modules
}
```

## 📊 Data File Format

### Source Language File (ja.json)
```json
{
  "tag_1": "動画の特徴",
  "tag_2": "キャラの特徴"
}
```

### Target Language File (en.json)
```json
{
  "tag_1": {
    "value": "Video Features",
    "translated": true
  },
  "tag_2": {
    "value": "キャラの特徴",
    "translated": false
  }
}
```

## 🛠️ Common Commands

```bash
# Development
npm run dev          # Start development server
npm run build        # Build production version
npm run start        # Start production server
npm run lint         # Code linting

# Add UI Components
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add table

# Test API
curl http://localhost:3000/api/v1/modules
curl -X POST http://localhost:3000/api/v1/scrape
```

## 🐛 Debugging Tips

### Enable Detailed Logging
```bash
# Enabled by default in development environment
NODE_ENV=development npm run dev
```

### Check Scraper Status
View the development server console output, all scraper operations will have detailed logs.

## 🚨 Notes

1. **Scraper Frequency**: Set appropriate `requestDelay` to avoid putting pressure on target websites
2. **Data Backup**: Regularly back up the `src/i18n/` directory
3. **Network Environment**: Ensure access to target websites
4. **File Permissions**: Ensure the application has read/write permissions for the `src/i18n/` directory

## 📝 Contribution Guide

1. Fork the project
2. Create feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push branch: `git push origin feature/new-feature`
5. Submit Pull Request

## ✨ New Features

### Enhanced Editing Experience

In the translation editing of the module detail page, we provide the following enhanced features:

#### 🔄 Reset Function
- **Reset Button**: Clicking the reset button will reset the current editing content to the original Japanese text
- **Purpose**: When translation goes wrong or you need to start over, quickly restore to the source language content

#### ⌨️ Keyboard Shortcuts
- **Enter**: Save current translation and exit edit mode
- **Ctrl/Cmd + Enter**: Insert a line break at the current cursor position (supports multiline translation)
- **Esc**: Cancel editing and discard all changes

#### 💡 User Experience Optimization
- **Real-time Tips**: Display keyboard shortcut tips and Japanese original reference during editing
- **Visual Feedback**: Clear button icons and tooltips
- **Smart Layout**: Editing area automatically expands, providing better editing space

### Usage Example

1. **Start Editing**: Click on any non-source language cell
2. **Enter Translation**: Enter translation content in the input box
3. **Multiline Support**: Use Ctrl/Cmd + Enter to add line breaks
4. **Reset Content**: Click the reset button to restore the Japanese original
5. **Save Translation**: Press Enter key or click the save button
6. **Cancel Editing**: Press Esc key or click the cancel button

## 🔗 Related Links

- [Next.js Documentation](https://nextjs.org/docs)
- [shadcn/ui Component Library](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [React Query](https://tanstack.com/query/latest)