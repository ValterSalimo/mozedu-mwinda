# 🚀 MozEdu Frontend - Quick Reference

## Server Status
✅ **Running on**: http://localhost:3000

## 📍 Routes

| Route | Description | Status |
|-------|-------------|--------|
| `/` | Landing page with portal selector | ✅ Done |
| `/student` | Student dashboard | ✅ Done |
| `/student/attendance` | Attendance check-in | 📝 Coming |
| `/student/grades` | View grades | 📝 Coming |
| `/teacher` | Teacher dashboard | 📝 Coming |
| `/parent` | Parent dashboard | 📝 Coming |
| `/school` | School admin | 📝 Coming |
| `/admin` | Ministry dashboard | 📝 Coming |
| `/auth/login` | Login page | 📝 Coming |
| `/auth/register` | Registration | 📝 Coming |

## 🎨 Available Components

### From @MozEdu/ui

```tsx
import { Button, Card, Input } from '@MozEdu/ui'

// Button - 6 variants
<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="accent">Accent</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="danger">Danger</Button>

// Button sizes
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>

// With icons
<Button leftIcon={<Icon />}>Left Icon</Button>
<Button rightIcon={<Icon />}>Right Icon</Button>
<Button isLoading>Loading...</Button>

// Card
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    Content goes here
  </CardContent>
  <CardFooter>
    Footer actions
  </CardFooter>
</Card>

// Input
<Input 
  label="Email"
  placeholder="Enter email"
  error="Invalid email"
  leftIcon={<MailIcon />}
  rightIcon={<CheckIcon />}
/>
```

## 🎨 Color Palette

```tsx
// Primary - Electric Blue
className="bg-primary-500"     // #00A8FF
className="text-primary-500"
className="border-primary-500"

// Secondary - Sunshine Yellow  
className="bg-secondary-500"   // #FFD700
className="text-secondary-500"

// Accent - Congo Green
className="bg-accent-500"      // #009B3A
className="text-accent-500"

// Semantic
className="bg-success"         // Green
className="bg-error"           // Red
className="bg-warning"         // Orange
className="bg-info"            // Blue
```

## 📝 TypeScript Types

```tsx
import type { 
  Student, 
  Teacher, 
  Grade, 
  Attendance,
  AttendanceRecord,
  Subject,
  Class,
  School,
  User,
  Notification 
} from '@MozEdu/types'
```

## 🗂️ File Structure

```
apps/web/
├── app/
│   ├── page.tsx              # Landing page
│   ├── layout.tsx            # Root layout
│   ├── providers.tsx         # Query provider
│   ├── student/
│   │   ├── layout.tsx        # Student layout
│   │   ├── page.tsx          # Student dashboard
│   │   ├── attendance/       # Attendance pages
│   │   └── grades/           # Grades pages
│   └── teacher/              # Teacher portal
│
├── components/
│   ├── student/              # Student components
│   │   ├── sidebar.tsx
│   │   └── header.tsx
│   ├── teacher/              # Teacher components
│   └── shared/               # Shared components
│
└── lib/
    ├── api/                  # API client
    ├── hooks/                # Custom hooks
    └── stores/               # Zustand stores
```

## 🔧 Common Tasks

### Add New Page

```tsx
// apps/web/app/student/grades/page.tsx
export default function GradesPage() {
  return (
    <div>
      <h1>My Grades</h1>
      {/* Content */}
    </div>
  )
}
```

Auto-accessible at `/student/grades`

### Add New Portal

1. Create folder: `apps/web/app/teacher/`
2. Add layout: `apps/web/app/teacher/layout.tsx`
3. Add page: `apps/web/app/teacher/page.tsx`
4. Create components: `apps/web/components/teacher/`

### Use Dark Mode

```tsx
'use client'
import { useState } from 'react'

export function Component() {
  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark')
  }
  
  return <button onClick={toggleTheme}>Toggle</button>
}
```

### Add to Shared UI

```tsx
// packages/ui/components/badge.tsx
export function Badge({ children }) {
  return <span className="badge">{children}</span>
}

// Export in packages/ui/index.tsx
export { Badge } from './components/badge'

// Use anywhere
import { Badge } from '@MozEdu/ui'
```

## 📦 NPM Scripts

```powershell
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # Lint code
npm run type-check   # TypeScript check
npm run format       # Format with Prettier
npm run clean        # Remove node_modules
```

## 🌐 External Links

- Landing: http://localhost:3000
- Student: http://localhost:3000/student
- Docs: See README.md
- Setup: See SETUP_COMPLETE.md

## ✅ What's Working

- ✅ Landing page
- ✅ Student dashboard
- ✅ Navigation sidebar
- ✅ Dark mode toggle
- ✅ Responsive design
- ✅ Type-safe code
- ✅ Hot reload

## 📝 What's Next

1. Mock data layer
2. More dashboard components
3. Additional student pages
4. Teacher portal
5. Parent portal
6. Authentication

---

**Happy Coding! 🎉**

