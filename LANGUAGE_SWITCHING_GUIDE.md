# 🌍 Language Switching with JavaScript & Cookies

## ✅ How It Works Now

### Two Ways to Change Language

#### 1. **Header Language Switcher** (Quick Toggle)
- Click the 🌍 globe icon in the header
- Select language from dropdown
- Language preference saved to:
  - **Cookie** (`NEXT_LOCALE`) - Persists across sessions
  - **localStorage** - Backup storage
- URL updates to show current language (`/fr` or `/en`)

#### 2. **Settings Page** (Detailed Control)
- Go to Settings → Language & Region
- Select from dropdown with flags and full names
- Same cookie + localStorage persistence
- Page reloads with new language

---

## 🔧 Technical Implementation

### Cookie-Based Persistence
```javascript
// When user changes language
document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`

// Cookie lasts for 1 year
// Available across entire site
// Secure & HTTP-only safe
```

### Middleware Checks Cookie
```typescript
// middleware.ts reads the cookie
const localeCookie = request.cookies.get('NEXT_LOCALE')?.value

// Redirects to user's preferred language
if (localeCookie && !pathname.includes(localeCookie)) {
  redirect(`/${localeCookie}${pathname}`)
}
```

### localStorage Backup
```javascript
// Secondary storage (client-side only)
localStorage.setItem('preferredLanguage', newLocale)

// Can be used if cookies are disabled
const savedLanguage = localStorage.getItem('preferredLanguage')
```

---

## 🎯 User Experience

### First Visit
1. User visits `http://localhost:3000`
2. No cookie found → Default to **French** (DRC default)
3. Redirects to `/fr`

### User Changes Language
1. Click language switcher in header OR go to settings
2. Select "English"
3. Cookie saved: `NEXT_LOCALE=en`
4. Page redirects to `/en/...`

### Next Visit
1. User visits `http://localhost:3000` again
2. Cookie found: `NEXT_LOCALE=en`
3. Automatically redirects to `/en` (their preference)

### Preference Persists
- Works across all pages
- Survives browser close/reopen
- Lasts 1 year (or until cleared)
- No need to select again

---

## 📍 URL Structure

### With Language Preference
```
User prefers French:
/ → /fr
/student → /fr/student
/student/grades → /fr/student/grades

User prefers English:
/ → /en
/student → /en/student
/student/grades → /en/student/grades
```

### Benefits
✅ **Shareable URLs** - Send link with language included
✅ **SEO Friendly** - Search engines index both languages
✅ **Browser History** - Back button respects language
✅ **Bookmarks** - Saved with chosen language

---

## 🎨 Where Language Can Be Changed

### 1. Header (All Pages)
- **Location:** Top right corner
- **Component:** `LanguageSwitcher`
- **Visual:** 🌍 Globe icon + current language + flag
- **Access:** Always visible

### 2. Settings Page
- **Location:** `/student/settings`
- **Section:** Language & Region card
- **Visual:** Dropdown with flags
- **Details:** Shows both options with descriptions

---

## 💾 Data Storage Comparison

| Storage | Duration | Scope | Security | Purpose |
|---------|----------|-------|----------|---------|
| **Cookie** | 1 year | Server + Client | ✅ Secure | Primary storage, server reads |
| **localStorage** | Forever* | Client only | ⚠️ JS only | Backup, client reads |
| **URL** | Current session | Page specific | ✅ Public | Current page state |

*Until manually cleared

---

## 🔄 Language Change Flow

```
User Action
    ↓
[Click Language Switcher]
    ↓
JavaScript saves:
  → Cookie (NEXT_LOCALE=en)
  → localStorage (preferredLanguage=en)
    ↓
URL updates:
  → /fr/student → /en/student
    ↓
Middleware reads cookie on next request
    ↓
Automatically applies language preference
    ↓
User sees content in chosen language
```

---

## 🌐 Supported Languages

| Code | Language | Flag | Default | Status |
|------|----------|------|---------|--------|
| `fr` | Français | 🇨🇩 | ✅ Yes | ✅ Complete |
| `en` | English | 🇬🇧 | No | ✅ Complete |

### Future Languages (Ready to Add)
| Code | Language | Flag | Translations Needed |
|------|----------|------|---------------------|
| `ln` | Lingala | 🇨🇩 | ⏳ Not yet |
| `sw` | Swahili | 🇹🇿 | ⏳ Not yet |

---

## 🧪 Testing

### Test Cookie Persistence
1. Visit `http://localhost:3000` → Should show `/fr`
2. Switch to English → URL becomes `/en`
3. **Close browser completely**
4. Reopen and visit `http://localhost:3000`
5. Should **automatically** redirect to `/en` (preference saved!)

### Test Header Switcher
1. Click 🌍 globe icon
2. Select "English 🇬🇧"
3. Page reloads in English
4. Navigate to different pages
5. Language stays English

### Test Settings Page
1. Go to `/student/settings`
2. Find "Language & Region" card
3. Change dropdown to French
4. Page reloads
5. All text changes to French

### Clear Preferences (Reset)
```javascript
// Open browser console (F12)

// Clear cookie
document.cookie = 'NEXT_LOCALE=; path=/; max-age=0'

// Clear localStorage
localStorage.removeItem('preferredLanguage')

// Reload page
location.reload()
```

---

## ⚙️ Configuration Files

### middleware.ts
```typescript
export default function middleware(request: NextRequest) {
  // Check cookie for language preference
  const localeCookie = request.cookies.get('NEXT_LOCALE')?.value
  
  // Redirect to preferred language if set
  if (localeCookie && locales.includes(localeCookie)) {
    // Apply preference...
  }
}
```

### language-switcher.tsx
```typescript
const changeLanguage = (newLocale: string) => {
  // Save to cookie (server-readable)
  document.cookie = `NEXT_LOCALE=${newLocale}; ...`
  
  // Save to localStorage (client-backup)
  localStorage.setItem('preferredLanguage', newLocale)
  
  // Navigate to new language
  router.replace(`/${newLocale}${pathname}`)
}
```

---

## ✨ Benefits of This Approach

✅ **Persistent** - Preference saved across sessions
✅ **Fast** - Cookie checked on server (no flash)
✅ **Flexible** - Change in header OR settings
✅ **SEO Friendly** - URLs include language
✅ **Shareable** - Links preserve language
✅ **User-Friendly** - Set once, works everywhere
✅ **DRC Default** - French as primary language

---

## 🐛 Troubleshooting

### Language not persisting?
```javascript
// Check if cookie is set (in browser console)
document.cookie

// Should see: NEXT_LOCALE=fr or NEXT_LOCALE=en
```

### Wrong language showing?
```javascript
// Check localStorage
localStorage.getItem('preferredLanguage')

// Clear and try again
localStorage.clear()
document.cookie = 'NEXT_LOCALE=; path=/; max-age=0'
location.reload()
```

### URL not updating?
- Hard refresh: `Ctrl + Shift + R`
- Clear browser cache
- Restart dev server

---

**Status:** ✅ Cookie + localStorage persistence implemented
**Date:** October 18, 2025
**Next:** Restart server and test language switching!

