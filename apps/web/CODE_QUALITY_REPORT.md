# Code Quality Review Report - MozEdu Frontend Web App

**Review Date:** February 14, 2026  
**Scope:** `frontend/apps/web/` - app/, components/, lib/ directories

---

## Summary

| Severity | Total Found | Fixed | Remaining |
|----------|-------------|-------|-----------|
| Critical | 4 | 4 | 0 |
| High | 8 | 3 | 5 |
| Medium | 12 | 0 | 12 |
| Low | 6 | 0 | 6 |

---

## 1. Issues Fixed ✅

### Critical Fixes Applied

#### 1.1 TypeScript Type Safety - Replaced `any` types with proper types
**Files:** 
- `components/messaging/MessagingPage.tsx` - Lines 1159, 1178
- `components/schedule/schedule-generator.tsx` - Lines 47, 117-125, 133, 139, 157, 163

**Changes:**
- Replaced `props: any` with `React.SVGProps<SVGSVGElement>` for icon components
- Added proper types: `SchedulingConstraints`, `PotentialConflict`, `GenerateScheduleResponse`
- Replaced `(constraints as any)` with type-safe `typedConstraints` variable

#### 1.2 Accessibility - Added Missing aria-labels
**Files:**
- `app/page.tsx` - Lines 115, 130
- `components/student/header.tsx` - Lines 58, 62
- `components/student/sidebar.tsx` - Lines 60, 98
- `app/school/layout.tsx` - Line 156

**Changes:**
- Theme toggle buttons: `aria-label="Switch to light/dark mode"`
- Mobile menu buttons: `aria-label="Open menu" / "Close menu"`
- Notification buttons: `aria-label={t('notifications')}`
- Logout buttons: `aria-label={t('logout')}`
- Sidebar close buttons: `aria-label="Close sidebar"`

#### 1.3 Dead Code Removal
**File:** `components/messaging/MessagingPage.tsx` - Lines 398-405

**Change:** Removed commented-out useEffect block that was flagged as dead code

---

## 2. Remaining Issues (To Be Addressed)

### High Severity

#### 2.1 Excessive `any` Type Usage 🔴
**File:** `components/messaging/MessagingPage.tsx`

| Line | Usage | Recommended Fix |
|------|-------|-----------------|
| 52 | `participants?: any[]` | Define `Participant` interface |
| 68 | `toUiBulkFromRest(m: any)` | Type parameter as `RestBulkMessage` |
| 83 | `toUiBulkFromGraphql(m: any)` | Type parameter as `GraphQLBulkMessage` |
| 141 | `toUiMessageFromRest(m: any)` | Type parameter as `RestMessage` |
| 162 | `toUiMessageFromGraphql(m: any)` | Type parameter as `GraphQLMessage` |
| 306, 352, 370, 449, 467, 480 | Callback `data: any` | Use proper GraphQL response types |

**File:** `app/student/schedule/page.tsx` - Line 152
- `session: any` → Define `ScheduleSession` type

**File:** `app/teacher/schedule/page.tsx` - Lines 156, 170, 198
- Multiple `any` usages in reduce/map operations

#### 2.2 No React.memo/useCallback Usage 🔴
**Issue:** No components use `React.memo` or `useCallback` for optimization

**Affected Files:**
- `components/messaging/MessagingPage.tsx` - Large component with many handlers
- `components/schedule/schedule-generator.tsx` - Complex state management
- `components/settings/grade-system-settings.tsx` - Form with many state updates

**Recommendation:**
```tsx
// Wrap pure components
export const TeacherCard = React.memo(function TeacherCard(props) { ... })

// Memoize callbacks
const handleSubmit = useCallback((data) => { ... }, [deps])
```

#### 2.3 No Dynamic Imports / Lazy Loading 🔴
**Issue:** Large page components are not using `next/dynamic` for code splitting

**Affected Routes:**
- `/school/messages` - MessagingPage (1198 lines)
- `/school/schedule` - ScheduleGenerator (473 lines)
- `/school/student-cards` - StudentCardsPage (large)

**Recommendation:**
```tsx
const MessagingPage = dynamic(() => import('@/components/messaging/MessagingPage'), {
  loading: () => <Skeleton />,
  ssr: false
})
```

#### 2.4 Native `<img>` Instead of `next/image` 🔴
**10 instances found - Performance Impact**

| File | Line |
|------|------|
| `app/school/layout.tsx` | 190 |
| `components/student/header.tsx` | 69 |
| `components/layout/top-bar.tsx` | 86 |
| `app/student/settings/page.tsx` | 76 |
| `app/parent/settings/page.tsx` | 108, 186 |
| `app/parent/page.tsx` | 285 |
| `app/parent/layout.tsx` | 137 |
| `app/teacher/settings/page.tsx` | 79 |
| `app/teacher/layout.tsx` | 153 |

**Recommendation:**
```tsx
import Image from 'next/image'

// Replace:
<img src={user.profileImageUrl} alt={user.firstName} className="..." />

// With:
<Image src={user.profileImageUrl} alt={user.firstName} width={40} height={40} className="..." />
```

#### 2.5 Missing Input Validation/Sanitization 🔴
**File:** `lib/api/sanitize.ts`

**Issue:** Current implementation uses basic regex - TODO for DOMPurify noted in comments

**Recommendation:**
```bash
npm install dompurify @types/dompurify
```
```tsx
import DOMPurify from 'dompurify'
export function sanitizeString(input: string): string {
  return DOMPurify.sanitize(input)
}
```

### Medium Severity

#### 2.6 Incomplete Feature TODOs 🟡
| File | Line | TODO |
|------|------|------|
| `app/student/reports/page.tsx` | 166 | PDF download when backend supports it |
| `app/teacher/grades/page.tsx` | 60 | Calculate from pending assignments |
| `app/school/page.tsx` | 87 | Implement teacher attendance tracking |
| `app/school/page.tsx` | 93 | Implement active class tracking |

#### 2.7 Buttons Missing aria-labels 🟡
Multiple buttons across the codebase still lack proper accessibility attributes:
- `components/teachers/teacher-form.tsx` - Form action buttons
- `components/settings/grade-system-settings.tsx` - Edit/save buttons
- `components/settings/email-template-manager.tsx` - Action buttons
- `components/rooms/room-management.tsx` - CRUD buttons

#### 2.8 Missing Error Boundaries 🟡
**Issue:** No React Error Boundaries found in the app structure

**Recommendation:** Add error boundaries around major sections:
```tsx
// app/error.tsx
'use client'
export default function GlobalError({ error, reset }) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={reset}>Try again</button>
    </div>
  )
}
```

#### 2.9 useEffect Without Cleanup Function 🟡
Several useEffect hooks subscribe to events without proper cleanup:

**Files:**
- `components/messaging/MessagingPage.tsx` - Multiple subscriptions
- `app/theme-provider.tsx` - Event listeners

Review and ensure all subscriptions return cleanup functions.

### Low Severity

#### 2.10 Inconsistent Naming 🟢
- Some files use kebab-case (`teacher-form.tsx`), others use PascalCase (`MessagingPage.tsx`)
- Recommendation: Standardize on kebab-case for files, PascalCase for components

#### 2.11 Commented Code Blocks 🟢
Additional commented code found in:
- `components/auth/session-error-modal.tsx` - Lines 20-25
- `app/language-provider.tsx` - Lines 55-60

Consider removing or converting to documentation.

#### 2.12 Mixed Styling Approaches 🟢
Some components use inline styles while others use Tailwind exclusively.
Recommendation: Standardize on Tailwind CSS only.

---

## 3. Security Assessment

### ✅ Good Practices Found
- Input sanitization module exists (`lib/api/sanitize.ts`)
- No `dangerouslySetInnerHTML` usage found
- `console.log` statements removed from production code
- Authentication guard properly implemented

### ⚠️ Recommendations
1. **Upgrade sanitization** to use DOMPurify library
2. **Add CSP headers** in next.config.js
3. **Review API endpoints** for proper authorization checks

---

## 4. Performance Recommendations

### Immediate Actions
1. **Add lazy loading** for messaging and schedule components
2. **Replace `<img>` with `next/image`** for automatic optimization
3. **Add React.memo** to expensive list item components

### Future Improvements
1. Implement virtual scrolling for large lists (conversation lists, student lists)
2. Add service worker for offline support
3. Implement bundle analysis and optimization

---

## 5. Files Changed in This Review

| File | Changes Applied |
|------|-----------------|
| `components/messaging/MessagingPage.tsx` | ✅ Removed dead code, fixed SVG icon types |
| `components/schedule/schedule-generator.tsx` | ✅ Added proper types for constraints |
| `components/student/header.tsx` | ✅ Added aria-labels to buttons |
| `components/student/sidebar.tsx` | ✅ Added aria-labels to buttons |
| `app/page.tsx` | ✅ Added aria-labels to theme/menu buttons |
| `app/school/layout.tsx` | ✅ Added aria-label to close button |

---

## 6. Recommended Next Steps

### Priority 1 (This Sprint)
- [ ] Replace remaining `any` types in messaging components
- [ ] Add `next/image` to all profile image usages
- [ ] Add error boundaries to main layouts

### Priority 2 (Next Sprint)
- [ ] Implement React.memo for list components
- [ ] Add lazy loading for heavy page components  
- [ ] Upgrade to DOMPurify for sanitization

### Priority 3 (Backlog)
- [ ] Standardize file naming conventions
- [ ] Add comprehensive aria-labels to all interactive elements
- [ ] Implement bundle size monitoring

---

*Report generated by Code Quality Review automation*
