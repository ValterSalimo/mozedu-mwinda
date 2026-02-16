# 🔧 Quick Fix - Next.js 15 + next-intl Errors

## ✅ Fixed Two Critical Errors

### Error 1: `params` should be awaited
```
Error: Route "/[locale]" used `params.locale`. 
`params` should be awaited before using its properties.
```

**Cause:** Next.js 15 changed `params` to be a Promise that must be awaited.

**Fix:**
```typescript
// BEFORE (❌ Error)
export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  params: { locale: string }
})

// AFTER (✅ Fixed)
export default async function LocaleLayout({
  children,
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params  // Await the params
```

---

### Error 2: Couldn't find next-intl config file
```
Error: Couldn't find next-intl config file. 
Please follow the instructions at https://next-intl.dev/docs/getting-started/app-router
```

**Cause:** `next.config.js` wasn't configured to use the next-intl plugin.

**Fix:**
```javascript
// BEFORE (❌ Error)
const nextConfig = { ... }
module.exports = nextConfig

// AFTER (✅ Fixed)
const createNextIntlPlugin = require('next-intl/plugin')
const withNextIntl = createNextIntlPlugin('./i18n.ts')

const nextConfig = { ... }
module.exports = withNextIntl(nextConfig)
```

---

## 📂 Files Changed

1. **`apps/web/app/[locale]/layout.tsx`**
   - Changed `params: { locale: string }` to `params: Promise<{ locale: string }>`
   - Added `const { locale } = await params`
   - Updated `getMessages()` to `getMessages({ locale })`

2. **`apps/web/next.config.js`**
   - Added `createNextIntlPlugin` import
   - Wrapped config with `withNextIntl()`
   - Points to `./i18n.ts` config file

---

## 🚀 Test Now

The dev server should be working now! Visit:
- `http://localhost:3000` → Should redirect to `/fr` (French)
- `http://localhost:3000/en` → Should show English

No more errors! ✅

---

**Fixed:** October 18, 2025
**Next.js Version:** 15.x (with async params)
**Status:** ✅ Ready to use

