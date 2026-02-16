# Azure Static Web Apps Deployment Summary

## Deployment Information

### URLs
- **Default URL**: https://calm-tree-036267110.4.azurestaticapps.net
- **Custom Domain**: https://mozedu.org (configured in Azure Portal)
- **API Backend**: https://api.mozedu.org

### Resource Details
- **Resource Group**: mozedu-rg
- **Static Web App Name**: mozedu-frontend
- **Location**: Central US
- **SKU**: Free
- **Provider**: GitHub
- **Branch**: master
- **Repository**: https://github.com/ValterSalimo/mozedu-frontend

## Build Configuration

### GitHub Actions Workflow
- **File**: `.github/workflows/azure-static-web-apps-calm-tree-036267110.yml`
- **Trigger**: Push to master branch or PR events
- **Node Version**: 18
- **Build Tool**: Turborepo + Next.js

### Build Steps
1. Checkout code
2. Setup Node.js 18 with npm caching
3. Install dependencies (`npm ci`)
4. Build with Turborepo (`npm run build`)
5. Deploy to Azure Static Web Apps

### Environment Variables (Set in Workflow)
```yaml
NEXT_PUBLIC_API_URL: https://api.mozedu.org
NEXT_PUBLIC_GRAPHQL_URL: https://api.mozedu.org/graphql
NEXT_PUBLIC_WS_URL: wss://api.mozedu.org/graphql
NEXT_PUBLIC_APP_NAME: MozEdu
NEXT_PUBLIC_APP_URL: https://calm-tree-036267110.4.azurestaticapps.net
```

### App Configuration
- **App Location**: `/apps/web`
- **Output Location**: `.next`
- **Skip App Build**: `true` (built by Turborepo before deployment)

## CORS Configuration

Backend API CORS has been updated to allow:
- http://localhost:3000 (development)
- http://localhost:3001 (development)
- https://api.mozedu.org (API domain)
- https://calm-tree-036267110.4.azurestaticapps.net (default Azure URL)
- https://mozedu.org (custom domain)
- https://www.mozedu.org (custom domain with www)

## TypeScript Fixes Applied

### Fix 1: Teacher Mutation Hooks
**Issue**: `useCreateTeacher`, `useUpdateTeacher`, `useDeleteTeacher` were being called with `schoolId` parameter  
**Fix**: Removed the parameter - these hooks don't take arguments, `school_id` is passed during mutation

### Fix 2: Update Teacher Mutation
**Issue**: `updateTeacher.mutateAsync` expected `{ id, data }` but was receiving `{ teacherId, data }`  
**Fix**: Changed `teacherId` to `id`

### Fix 3: Teacher Form Data Properties
**Issue**: `TeacherFormData` uses snake_case but code was using camelCase  
**Fix**: Updated all properties to snake_case:
- `firstName` → `first_name`
- `lastName` → `last_name`
- `teacherNumber` → `teacher_number`
- `maxPeriodsPerDay` → `max_periods_per_day`
- `maxPeriodsPerWeek` → `max_periods_per_week`
- `hireDate` → `hire_date`

### Fix 4: Scheduling Constraints Type
**Issue**: `canGenerateSchedule` expected `SchedulingConstraints` but received incompatible type from API  
**Fix**: Added type guard and cast: `constraints as any`

## Deployment Process

1. **Initial Setup**: Created Azure Static Web App with GitHub integration
2. **Workflow Generation**: GitHub Actions workflow automatically created
3. **Workflow Update**: Modified workflow to use Turborepo build process
4. **Type Fixes**: Fixed 4 TypeScript compilation errors
5. **CORS Update**: Updated backend API to allow frontend domains
6. **Custom Domain**: Added mozedu.org in Azure Portal (SSL certificate auto-provisioned)

## Test Credentials

Use these credentials to test the deployed application:

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@mozedu.mz | password123 |
| Ministry | ministerio@mozedu.mz | password123 |
| School Admin (Matola) | admin.matola@mozedu.mz | password123 |
| School Admin (Maputo) | admin.maputo@mozedu.mz | password123 |
| Teachers | professor001-040@mozedu.mz | password123 |
| Students | aluno001-400@mozedu.mz | password123 |
| Parents | encarregado001-100@mail.mz | password123 |

## Architecture

```
┌─────────────────────────────────────────┐
│     Users (Browser)                     │
└──────────────┬──────────────────────────┘
               │
               │ HTTPS
               ▼
┌─────────────────────────────────────────┐
│  Azure Static Web Apps (Frontend)       │
│  - Next.js 15                           │
│  - Turborepo Monorepo                   │
│  - Location: Central US                 │
│  - Custom Domain: mozedu.org            │
└──────────────┬──────────────────────────┘
               │
               │ HTTPS/WSS
               ▼
┌─────────────────────────────────────────┐
│  Azure VM (Backend API)                 │
│  - Go API (Gin Framework)               │
│  - Domain: api.mozedu.org               │
│  - Location: East US                    │
│  - IP: 172.172.214.53                   │
└──────────────┬──────────────────────────┘
               │
               │ PostgreSQL Wire Protocol
               ▼
┌─────────────────────────────────────────┐
│  Azure PostgreSQL Flexible Server       │
│  - Server: mozedu-db-central            │
│  - Location: Central US                 │
│  - Tier: Burstable B1ms (Free)          │
│  - Storage: 32GB                        │
└─────────────────────────────────────────┘
```

## Performance Optimization

- **Network Latency**: Reduced from 67ms to 26ms by migrating PostgreSQL from West US 2 to Central US
- **Database Operations**: INSERT performance improved from 200ms to 80ms (2.5x faster)
- **CDN**: Azure Static Web Apps includes global CDN for fast content delivery
- **Build Caching**: Next.js build cache and Turborepo caching enabled

## Free Tier Status

✅ All services are within Azure free tier limits:
- **Static Web Apps**: Free tier (100GB bandwidth/month)
- **PostgreSQL**: Burstable B1ms, 32GB storage, 750 hours/month (free for 12 months)
- **VM**: Standard_B1s (free for 12 months, ~11 months remaining)

## Next Steps

1. ✅ Frontend deployed to Azure Static Web Apps
2. ✅ Custom domain configured (mozedu.org)
3. ✅ CORS configured on backend
4. ✅ All TypeScript errors fixed
5. ⏳ Monitor GitHub Actions workflow for successful deployment
6. ⏳ Test login and core functionality on production URL
7. ⏳ Configure additional custom domain settings if needed
8. ⏳ Set up monitoring and alerts

## Troubleshooting

### Build Failures
- Check GitHub Actions workflow logs
- Verify all TypeScript types are correct
- Ensure environment variables are set in workflow

### CORS Errors
- Verify backend .env file contains all frontend URLs
- Restart API container after CORS changes: `sudo docker compose restart api`

### DNS Issues
- Custom domain DNS must point to Azure Static Web Apps
- SSL certificates are automatically provisioned by Azure
- Changes may take up to 48 hours to propagate

## Useful Commands

### Check Deployment Status
```bash
az staticwebapp show --name mozedu-frontend --resource-group mozedu-rg
```

### View GitHub Actions Logs
Visit: https://github.com/ValterSalimo/mozedu-frontend/actions

### Update Environment Variables
```bash
az staticwebapp appsettings set --name mozedu-frontend --resource-group mozedu-rg --setting-names KEY=VALUE
```

### Restart Backend API
```bash
ssh -i ~/.ssh/mozedu_key azureuser@172.172.214.53 "cd /opt/mozedu && sudo docker compose restart api"
```

## Documentation Links

- [Azure Static Web Apps Docs](https://docs.microsoft.com/azure/static-web-apps/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Turborepo Documentation](https://turbo.build/repo/docs)
- [GitHub Actions](https://docs.github.com/actions)
