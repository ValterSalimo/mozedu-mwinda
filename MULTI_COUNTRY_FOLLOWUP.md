# Multi-Country Support - Follow-up Tasks

## Internationalization Improvements

### Priority: Medium
**Status**: Optional Enhancement

The code review identified that several UI components have hardcoded English or Portuguese text that should be internationalized using the translation system.

### Components to Update

#### 1. CountryCurriculumSettings Component
**File**: `apps/web/components/settings/country-curriculum-settings.tsx`

**Hardcoded Strings to Translate**:
- "Country & Curriculum Configuration" → Use translation key
- "Edit Settings" → Use translation key
- "Cancel" → Use translation key
- "Save Changes" → Use translation key
- "Select Country" → Use `t('curriculum.selectCountry')`
- "Primary Language" → Use translation key
- "Curriculum Systems" → Use translation key
- "Primary Curriculum System" → Use `t('curriculum.primaryCurriculum')`
- "Additional Curriculum Systems (Optional)" → Use `t('curriculum.secondaryCurriculums')`
- "Current Configuration Summary" → Use translation key
- Info panel labels: "Default Language:", "Grade Scale:", "Terms per Year:", "Final Exam:"

**Implementation**:
```typescript
import { useTranslations } from 'next-intl'

export function CountryCurriculumSettings({ schoolId }: CountryCurriculumSettingsProps) {
  const t = useTranslations('curriculum')
  
  // Use t('selectCountry'), t('primaryCurriculum'), etc.
}
```

#### 2. GradeSystemSettings Component
**File**: `apps/web/components/settings/grade-system-settings.tsx`

**Hardcoded Portuguese Strings**:
```typescript
// Current (Portuguese):
const GRADE_SYSTEM_TYPES = [
  {
    value: 'MOZAMBIQUE_NATIONAL',
    label: 'Sistema Moçambicano',
    description: 'Escala de 0 a 20, nota mínima de aprovação: 10. Avaliações contínuas e prova final (AP)',
  },
  // ...
]

// Should be:
const GRADE_SYSTEM_TYPES = [
  {
    value: 'MOZAMBIQUE_NATIONAL',
    label: t('curriculum.mozambiqueNational'),
    description: t('curriculum.descriptions.mozambique'),
  },
  // ...
]
```

**Translation Keys Already Available**:
- `curriculum.mozambiqueNational`
- `curriculum.angolaNational`
- `curriculum.congoNational`
- `curriculum.southAfricaCaps`
- `curriculum.cambridge`
- `curriculum.descriptions.mozambique`
- etc.

#### 3. EmailTemplateManager Component
**File**: `apps/web/components/settings/email-template-manager.tsx`

**Hardcoded English Strings**:
- Template category labels
- "Template Category" label
- "Usage Guide" section
- Variable descriptions
- "Available Variables", "Best Practices" headings

**Already Using Translations**:
- Component already uses `useTranslations('emailTemplates')`
- Translation keys exist: `t('categories.attendance')`, `t('subject')`, `t('body')`, etc.

**Missing Usage**:
```typescript
// Should use:
const categoryLabel = t('categories.' + cat.key)
```

#### 4. School Settings Page
**File**: `apps/web/app/school/settings/page.tsx`

**Hardcoded Portuguese Section Labels**:
```typescript
// Current:
{ id: 'country', label: 'País e Currículo', icon: Globe },
{ id: 'communications', label: 'Comunicações', icon: Mail },

// Should use translation system similar to other sections
```

### Additional Translation Keys Needed

Add to all language files (`en.json`, `pt.json`, `fr.json`, `tr.json`):

```json
{
  "settings": {
    "sections": {
      "country": "Country & Curriculum",
      "communications": "Communications"
    }
  },
  "curriculum": {
    "title": "Country & Curriculum Configuration",
    "editSettings": "Edit Settings",
    "cancel": "Cancel",
    "saveChanges": "Save Changes",
    "currentConfiguration": "Current Configuration Summary",
    "country": "Country",
    "language": "Language",
    "defaultLanguage": "Default Language",
    "gradeScaleLabel": "Grade Scale",
    "termsPerYear": "Terms per Year",
    "finalExam": "Final Exam",
    "curriculumSystems": "Curriculum Systems",
    "noCurriculums": "No curriculum systems configured"
  },
  "emailTemplates": {
    "categoryLabel": "Template Category",
    "usageGuide": "Usage Guide",
    "availableVariables": "Available Variables",
    "bestPractices": "Best Practices",
    "variableDescriptions": {
      "studentName": "Student's full name",
      "parentName": "Parent/Guardian name",
      "schoolName": "School name",
      "date": "Current or relevant date",
      "subject": "Subject/course name",
      "grade": "Grade or score",
      "term": "Academic term"
    }
  }
}
```

### Implementation Steps

1. **Add Translation Keys**:
   - Run the `add-translations.js` script again with new keys
   - Or manually add to all 4 language files

2. **Update Components**:
   - Import `useTranslations` hook
   - Replace hardcoded strings with `t('key')` calls
   - Test in all 4 languages

3. **Language-Specific Labels**:
   - For language names, consider using native names:
     - Portuguese → "Português"
     - English → "English"
     - French → "Français"
     - Turkish → "Türkçe"

4. **Testing**:
   - Switch between all 4 languages
   - Verify all text displays correctly
   - Check RTL languages if added later

### Why This is Follow-up

These improvements are important for a polished multilingual experience, but they don't affect core functionality:
- The system works correctly with current strings
- Translations are already in place for key data
- UI is functional in Portuguese (primary language)
- Country/curriculum configurations contain proper multilingual data

### Estimated Effort
- **Time**: 2-3 hours
- **Complexity**: Low (simple string replacement)
- **Impact**: Improves consistency of multilingual UI

### Benefits When Completed
- ✅ Fully consistent multilingual experience
- ✅ Easy to add new languages
- ✅ Professional appearance in all languages
- ✅ Easier maintenance

## Other Potential Enhancements

### 1. Email Template WYSIWYG Editor
- Rich text editor for email bodies
- Live preview with variable substitution
- Template versioning

### 2. Curriculum System Testing Tools
- Grade calculation simulator
- Schedule validation tools
- Assessment weight calculator

### 3. Language Auto-Detection
- Detect user's browser language
- Suggest appropriate school language
- Smart language fallbacks

### 4. Export/Import Configurations
- Export school configuration as JSON
- Import configuration from file
- Bulk configuration updates

### 5. Advanced Schedule Constraints
- Teacher preferences by curriculum
- Room equipment requirements
- Subject clustering by curriculum

## Conclusion

The multi-country support is **fully functional** as implemented. The internationalization improvements are **cosmetic enhancements** that would improve consistency but are not required for the system to work correctly. They can be implemented as time permits.
