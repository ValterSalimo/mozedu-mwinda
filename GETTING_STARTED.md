# 🚀 MozEdu Frontend - Quick Start Guide

## Prerequisites Check
- ✅ Node.js >= 18.17.0
- ✅ npm >= 9.0.0

## Installation Steps

### 1. Install Dependencies
```powershell
# From the frontend folder
cd frontend
npm install
```

This will install all dependencies for:
- Root workspace
- All apps (student, teacher, parent, school, web)
- All packages (ui, types, utils, config)

**Note**: First install might take 2-3 minutes.

### 2. Set Up Environment Variables
```powershell
# Copy example env file for student app
cp apps/student/.env.example apps/student/.env.local
```

### 3. Run Development Server
```powershell
# Run student portal only
npm run dev:student

# OR run all apps at once
npm run dev
```

### 4. Open in Browser
- Student Portal: http://localhost:3001/dashboard

You should see the Student Dashboard with:
- Quick stats cards (GPA, Attendance, Assignments, Notifications)
- Recent grades
- Upcoming classes

## 🎨 What You'll See

The Student Portal includes:
- ✅ Responsive sidebar navigation
- ✅ Header with search, theme toggle, notifications
- ✅ Dashboard with stats cards
- ✅ DRC-inspired color scheme (Blue, Yellow, Green)
- ✅ Dark mode support
- ✅ Mobile-responsive layout

## 🔧 Troubleshooting

### Error: Cannot find module '@MozEdu/ui'
```powershell
# Clean and reinstall
npm run clean
npm install
```

### Error: Port 3001 already in use
```powershell
# Change port in package.json or kill the process
# Windows:
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

### TypeScript errors in IDE
```powershell
# Rebuild TypeScript
npm run type-check
```

## 📦 What's Been Created

### Apps
- ✅ `apps/student` - Student Portal (complete basic structure)
- ⏳ `apps/teacher` - Teacher Portal (coming next)
- ⏳ `apps/parent` - Parent Portal (coming next)
- ⏳ `apps/school` - School Admin (coming next)
- ⏳ `apps/web` - Main Website (coming next)

### Packages
- ✅ `packages/ui` - Shared UI components
  - Button (with variants: primary, secondary, accent, outline, ghost, danger)
  - Card (with Header, Content, Footer)
  - Input (with label, error, icons)
  - Utility functions (cn for className merging)
  
- ✅ `packages/types` - TypeScript definitions
  - Student, Teacher, School, Class
  - Attendance, Grades, Payments
  - Notifications, Analytics
  - API responses

### Current Features
- ✅ Monorepo structure with Turborepo
- ✅ Next.js 15 with App Router
- ✅ Tailwind CSS 4 with DRC colors
- ✅ Dark mode toggle
- ✅ Responsive design
- ✅ Type-safe development

## 🚀 Next Steps

1. **Add Mock Data**: Create sample student, attendance, grade data
2. **Build Dashboard Components**: 
   - Performance analytics charts
   - Attendance calendar
   - Grade viewer
   - Real-time notifications
3. **Add Authentication**: Login/register pages with mock JWT
4. **State Management**: Set up Zustand stores
5. **Create Other Portals**: Teacher, Parent, School, Web

## 📝 Useful Commands

```powershell
# Development
npm run dev:student      # Student portal on :3001
npm run dev:teacher      # Teacher portal on :3002
npm run dev:parent       # Parent portal on :3003
npm run dev:school       # School portal on :3004
npm run dev              # All apps at once

# Building
npm run build            # Build all apps
npm run build:student    # Build student only

# Code Quality
npm run lint             # Lint all code
npm run type-check       # Check TypeScript
npm run format           # Format with Prettier

# Cleanup
npm run clean            # Remove node_modules
```

## 🎯 Development Workflow

1. **Make changes** in `apps/student` or `packages/ui`
2. **Hot reload** will automatically update the browser
3. **Check types** with `npm run type-check`
4. **Lint code** with `npm run lint`
5. **Format** with `npm run format`

## 📚 Learn More

- [Next.js 15 Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [TypeScript](https://www.typescriptlang.org)
- [Turborepo](https://turbo.build)

---

**Happy Coding! 🎉**

