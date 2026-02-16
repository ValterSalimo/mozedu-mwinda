# MozEdu Frontend

Modern, multi-tenant educational platform frontend built with Next.js 15, React 19, and TypeScript.

## 🏗️ Architecture

This is a **monorepo** containing multiple Next.js applications (one per subdomain) and shared packages:

### Apps
- **`student`** - Student portal (student.mozedu.org) - Port 3001
- **`teacher`** - Teacher portal (teacher.mozedu.org) - Port 3002
- **`parent`** - Parent portal (parent.mozedu.org) - Port 3003
- **`school`** - School admin (school.mozedu.org) - Port 3004
- **`web`** - Main website + Ministry dashboard (mozedu.org) - Port 3000

### Packages
- **`@MozEdu/ui`** - Shared UI components (Button, Card, Input, etc.)
- **`@MozEdu/types`** - TypeScript type definitions
- **`@MozEdu/utils`** - Shared utilities
- **`@MozEdu/config`** - Shared configurations

## 🚀 Getting Started

### Prerequisites
- **Node.js** >= 18.17.0
- **npm** >= 9.0.0

### Installation

1. **Install dependencies** (from frontend folder):
```powershell
npm install
```

2. **Run development servers**:

```powershell
# Run all apps
npm run dev

# Run specific app
npm run dev:student    # Student portal on http://localhost:3001
npm run dev:teacher    # Teacher portal on http://localhost:3002
npm run dev:parent     # Parent portal on http://localhost:3003
npm run dev:school     # School portal on http://localhost:3004
npm run dev:web        # Main website on http://localhost:3000
```

3. **Open in browser**:
- Student Portal: http://localhost:3001
- Teacher Portal: http://localhost:3002
- Parent Portal: http://localhost:3003
- School Portal: http://localhost:3004
- Main Website: http://localhost:3000

## 📦 Project Structure

```
frontend/
├── apps/
│   ├── student/              # Student portal
│   │   ├── app/              # Next.js 15 App Router
│   │   │   ├── dashboard/    # Dashboard pages
│   │   │   ├── layout.tsx    # Root layout
│   │   │   └── page.tsx      # Home page
│   │   ├── components/       # App-specific components
│   │   └── lib/              # App utilities
│   │
│   ├── teacher/              # Teacher portal (coming soon)
│   ├── parent/               # Parent portal (coming soon)
│   ├── school/               # School admin (coming soon)
│   └── web/                  # Main website (coming soon)
│
├── packages/
│   ├── ui/                   # Shared UI components
│   │   ├── components/       # Button, Card, Input, etc.
│   │   ├── lib/              # UI utilities (cn)
│   │   └── styles/           # Tailwind CSS
│   │
│   ├── types/                # TypeScript types
│   │   └── index.ts          # All type definitions
│   │
│   └── config/               # Shared configs
│
├── package.json              # Root package.json
├── turbo.json                # Turborepo config
└── tsconfig.json             # Root TypeScript config
```

## 🎨 Tech Stack

### Core
- **Next.js 15** - React framework with App Router
- **React 19** - UI library
- **TypeScript 5.3+** - Type safety
- **Tailwind CSS 4** - Styling
- **Turborepo** - Monorepo build system

### State & Data
- **Zustand** - State management
- **TanStack Query (React Query)** - Server state & caching
- **React Hook Form** - Form handling
- **Zod** - Schema validation

### UI & Animation
- **Shadcn/ui** - Base components
- **Lucide React** - Icons
- **Framer Motion** - Animations
- **Recharts** - Charts & graphs

### Design System
- **DRC-Inspired Colors**:
  - Primary: Electric Blue (#00A8FF)
  - Secondary: Sunshine Yellow (#FFD700)
  - Accent: Congo Green (#009B3A)
- **Fonts**: Poppins, Inter, JetBrains Mono
- **Dark Mode**: Full support

## 🛠️ Development

### Available Scripts

```powershell
# Development
npm run dev              # Run all apps
npm run dev:student      # Run student portal only

# Building
npm run build            # Build all apps
npm run build:student    # Build student portal only

# Code Quality
npm run lint             # Lint all code
npm run type-check       # TypeScript type checking
npm run format           # Format with Prettier

# Cleanup
npm run clean            # Remove node_modules and build artifacts
```

### Adding New Components

1. **Shared components** go in `packages/ui/components/`:
```tsx
// packages/ui/components/badge.tsx
export function Badge({ children }: { children: React.ReactNode }) {
  return <span className="badge">{children}</span>
}
```

2. **App-specific components** go in `apps/{app}/components/`:
```tsx
// apps/student/components/grade-card.tsx
export function GradeCard({ grade }: { grade: Grade }) {
  return <Card>...</Card>
}
```

### Creating New Pages

```tsx
// apps/student/app/dashboard/grades/page.tsx
export default function GradesPage() {
  return <div>Grades content</div>
}
```

## 🔐 Mock Data (Current Phase)

Currently using **mock data** for development. Mock implementations are in:
- `apps/student/lib/mock-data.ts` - Sample student data
- `apps/student/lib/api-client.ts` - Mock API client

**Real API integration** will be added in Phase 2.

## 📱 Responsive Design

- **Mobile**: 320px - 767px
- **Tablet**: 768px - 1023px
- **Desktop**: 1024px+

All components are mobile-first and fully responsive.

## 🌍 DRC-Specific Features

- **Offline Mode**: PWA support (coming soon)
- **Low-Bandwidth**: Optimized for 2G/3G networks
- **Multi-Language**: French (primary), English, Lingala, Swahili
- **Mobile Money**: Integration ready for Airtel, M-Pesa, Orange Money

## 📊 Current Progress

### ✅ Completed
- [x] Monorepo setup with Turborepo
- [x] Shared UI package (@MozEdu/ui)
- [x] Shared types package (@MozEdu/types)
- [x] Student Portal basic structure
- [x] Dashboard layout with sidebar & header
- [x] DRC-inspired design system
- [x] Dark mode support
- [x] Responsive layout

### 🚧 In Progress
- [ ] Mock data & API layer
- [ ] Student dashboard components
- [ ] Authentication flow
- [ ] State management setup

### 📅 Coming Soon
- [ ] Teacher Portal
- [ ] Parent Portal
- [ ] School Admin Portal
- [ ] Main Website & Ministry Dashboard
- [ ] Real-time features (WebSocket)
- [ ] PWA support

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run tests: `npm run lint && npm run type-check`
4. Submit a pull request

## 📝 Notes

- **Port Numbers**:
  - 3000: Main Website
  - 3001: Student Portal
  - 3002: Teacher Portal
  - 3003: Parent Portal
  - 3004: School Portal

- **Environment Variables** (create `.env.local` in each app):
```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:8080/ws
```

## 📚 Documentation

- [Next.js 15 Docs](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Shadcn/ui](https://ui.shadcn.com)
- [TanStack Query](https://tanstack.com/query)
- [Zustand](https://github.com/pmndrs/zustand)

---

**Built with ❤️ for education in the Democratic Republic of the Congo** 🇨🇩

