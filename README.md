# Oreno3dI18n - Automated i18n Management Tool

[中文版本](docs/README-zh.md)

Oreno3dI18n is a localization i18n management tool built on Next.js. It is designed to automatically crawl source data (defaulting to Japanese) from specified websites and generate and maintain multilingual JSON files.

## 🚀 Features

- **Modular Design**: Easily add new data scraping modules
- **Automated Scraping**: Configure dedicated crawler handlers for each module
- **i18n File Generation**: Automatically create and update multilingual JSON files
- **Extensible Language Support**: Add or remove supported languages by simply modifying configuration files
- **Web Management Interface**: Intuitive dashboard and data management interface
- **Online Editing**: Support for online editing of translation content
- **Smart Filtering**: Quickly locate untranslated entries
- **🌍 Multilingual Interface**: Support for switching between Chinese, English, and Japanese user interfaces
- **⌨️ Enhanced Editing**: Keyboard shortcut support, reset function, multiline translation

## 🛠️ Tech Stack

- **Next.js 15** - React full-stack framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Atomic CSS
- **shadcn/ui** - Modern UI component library
- **React Query** - Server state management
- **Axios & Cheerio** - Web scraping
- **Sonner** - Notification prompts
- **next-intl** - Internationalization support

## 📦 Installation and Running

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

### 3. Access the Application
Open your browser and visit [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── admin/             # Admin dashboard pages
│   └── api/v1/            # API routes
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── admin/            # Admin dashboard components
├── hooks/                # Custom React Hooks
├── lib/                  # Core logic and utilities
├── i18n/                 # Generated i18n files and internationalization configuration
└── scraper-config/       # Scraper configuration and handlers
    ├── handlers/         # Scraper handlers
    └── config.ts         # Global configuration
├── messages/             # UI translation files
│   ├── zh.json          # Simplified Chinese
│   ├── en.json          # English
│   └── ja.json          # Japanese
```

## 🔧 Configuration Guide

### Language Configuration
Modify supported languages in `scraper-config/config.ts`:

```typescript
export const TARGET_LANGUAGES: string[] = ['ja', 'en', 'zh-CN', 'zh-TW'];
export const SOURCE_LANGUAGE: string = 'ja';
```

### Adding New Modules
1. Create a new handler file in `scraper-config/handlers/`
2. Add configuration to the `MODULES` array in `scraper-config/config.ts`
3. Restart the application, and the new module will automatically appear on the dashboard

## 🌐 API Endpoints

### Get All Modules
```bash
GET /api/v1/modules
```

### Get Module Data
```bash
GET /api/v1/modules/{moduleName}
GET /api/v1/modules/{moduleName}?type=stats
```

### Update Translation
```bash
PATCH /api/v1/modules/{moduleName}
Content-Type: application/json

{
  "key": "tag_1",
  "lang": "en",
  "value": "Video Features"
}
```

### Run Scraper
```bash
POST /api/v1/scrape
Content-Type: application/json

{
  "moduleName": "tags"  // Optional, if not provided, scrape all modules
}
```

## 📊 User Guide

### 1. Dashboard
- View translation progress for all modules
- Update all modules or individual modules with one click
- Quickly navigate to module detail pages

### 2. Module Management
- View detailed translation data for modules
- Edit translation content online
- Filter untranslated entries
- Search for specific content

### 3. Data Updates
- Manually trigger crawler to update data
- Automatically preserve existing translations
- New entries will be marked as "untranslated"

## 🔍 Development Guide

### Creating New Scraper Handlers
```typescript
// scraper-config/handlers/exampleHandler.ts
import type { ScrapedItem } from '@/lib/types';

export default async function exampleHandler(): Promise<ScrapedItem[]> {
  // Implement scraping logic
  return [
    { id: '1', name: 'Example Item' }
  ];
}
```

### Data File Format
- **Source language file** (`ja.json`): `{ "key": "value" }`
- **Target language file** (`en.json`): `{ "key": { "value": "translation", "translated": true } }`

## 🚨 Notes

1. **Scraper Frequency**: Please set appropriate scraper request intervals to avoid putting pressure on target websites
2. **Data Backup**: It is recommended to regularly back up translation files in the `src/i18n/` directory
3. **Network Environment**: Ensure access to target websites

## 📝 License

MIT License

## 🤝 Contributing

Issues and Pull Requests are welcome!

If you want to contribute to internationalization translation:
1. Clone and set up the project following the [Installation and Running](#-installation-and-running) guide
2. Visit http://localhost:3000/admin/modules after starting the development server
3. Select the module you want to update
4. Translate the untranslated entries
5. Once translation work is complete, commit and push your changes

If you are a developer looking to create new scrapers, please refer to the development guide:
- [Development Guide (English)](docs/DEVELOPMENT-en.md)
- [开发指南 (Chinese)](docs/DEVELOPMENT-zh.md)

---

**Oreno3dI18n** - Making i18n management simple and efficient!