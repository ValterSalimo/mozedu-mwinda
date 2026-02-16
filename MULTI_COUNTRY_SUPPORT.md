# Multi-Country Admin System

## Overview

The MozEdu platform now supports multiple countries with different educational systems, languages, and curriculum schemas. This enables schools from Mozambique, Angola, South Africa, and Congo (DRC) to use the platform with their specific requirements.

## Supported Countries

### Mozambique (MZ)
- **Language**: Portuguese
- **Grading Scale**: 0-20
- **Passing Score**: 10
- **Curriculum**: Mozambique National System
- **Assessment**: MAC (continuous) + AP (final exam)
- **Terms**: 3 trimesters per year
- **Schedule**: 8 periods × 45 minutes

### Angola (AO)
- **Language**: Portuguese
- **Grading Scale**: 0-20
- **Passing Score**: 10
- **Curriculum**: Angola National System
- **Assessment**: Regular tests + Final exam
- **Terms**: 3 trimesters per year
- **Schedule**: 7 periods × 45 minutes

### South Africa (ZA)
- **Language**: English
- **Grading Scale**: 0-100
- **Passing Score**: 30
- **Curriculum**: CAPS (Curriculum and Assessment Policy Statement)
- **Assessment**: Continuous Assessment + Final Examination
- **Terms**: 4 terms per year
- **Schedule**: 8 periods × 45 minutes
- **Grade Levels**: 7 achievement levels (7=Outstanding to 1=Not Achieved)

### Congo/DRC (CD)
- **Language**: French
- **Grading Scale**: 0-100
- **Passing Score**: 50
- **Curriculum**: Congo National System
- **Assessment**: Contrôle + Examen Final
- **Terms**: 3 trimesters per year
- **Schedule**: 8 periods × 50 minutes

### Cambridge International
- **Language**: English
- **Grading Scale**: 0-100
- **Passing Score**: 40
- **Curriculum**: Cambridge Assessment International
- **Grade Levels**: A* to U
- **Assessment**: Coursework + External Examination
- **Can be used as secondary curriculum by any school**

## Features

### 1. Country Configuration
Schools can configure their country settings, which automatically sets:
- Default language for all communications
- Appropriate grading scale
- Number of academic terms
- Assessment types and weights
- Schedule period configurations

### 2. Multi-Curriculum Support
Schools can select:
- **Primary Curriculum**: Main educational system
- **Secondary Curriculums**: Additional systems (e.g., Cambridge alongside national curriculum)

This allows schools to:
- Offer multiple educational pathways
- Support international students
- Prepare students for different examination boards

### 3. Multilingual Interface
The platform supports 4 languages:
- **Portuguese (pt)**: Mozambique, Angola
- **English (en)**: South Africa, International
- **French (fr)**: Congo (DRC)
- **Turkish (tr)**: Optional

All UI elements, notifications, and email templates are available in these languages.

### 4. Grade System Flexibility
Each curriculum has its own:
- Min/max score ranges
- Passing thresholds
- Letter grade mappings
- GPA calculations (where applicable)
- Grade boundary descriptions

### 5. Schedule Generation
Schedule generation respects curriculum-specific:
- Number of periods per day
- Period duration
- Break durations
- Lunch break timing

## Configuration Guide

### For School Administrators

1. **Access Settings**
   - Navigate to School Portal → Settings
   - Select "País e Currículo" (Country & Curriculum) section

2. **Select Country**
   - Choose your country from the dropdown
   - System automatically applies country defaults
   - Default language, grading scale, and curriculum are set

3. **Choose Primary Language**
   - Select the main language for communications
   - This affects emails, notifications, and reports
   - Choose from languages supported in your country

4. **Configure Curriculum**
   - Select primary curriculum system
   - Optionally add secondary curriculum systems
   - Example: Mozambique National + Cambridge

5. **Review Configuration**
   - Check the summary of your settings
   - Verify grading scale, assessment types, schedule config
   - Save changes

6. **Generate Schedules**
   - Navigate to Schedule → Generate
   - Select curriculum for the timetable
   - Schedule respects curriculum-specific constraints

## Type Definitions

### Country Configuration
```typescript
interface CountryConfig {
  code: CountryCode
  name: string
  defaultLanguage: LanguageCode
  supportedLanguages: LanguageCode[]
  defaultCurriculum: CurriculumSystem
  supportedCurriculums: CurriculumSystem[]
  gradeScale: {
    min: number
    max: number
    passingScore: number
    description: string
  }
  academicTerms: {
    count: number
    names: string[]
  }
  assessmentTypes: {
    hasTests: boolean
    hasFinalExam: boolean
    finalExamName?: string
    weights?: {
      tests?: number
      finalExam?: number
    }
  }
}
```

### Curriculum Configuration
```typescript
interface CurriculumConfig {
  system: CurriculumSystem
  name: string
  description: string
  countryCode: CountryCode
  gradeScale: {
    min: number
    max: number
    passingScore: number
    gradeBoundaries?: GradeBoundary[]
  }
  scheduleConfig: {
    periodsPerDay: number
    periodDurationMinutes: number
    breakDurationMinutes: number
    lunchBreakMinutes?: number
  }
  assessmentConfig: {
    termsPerYear: number
    assessmentTypes: string[]
    hasIntermediateAssessments: boolean
    hasFinalExam: boolean
    finalExamWeight?: number
  }
}
```

## API Integration

### Update School Configuration
```typescript
PUT /api/v1/schools/:id
{
  "country": "MZ",
  "preferred_language": "pt",
  "curriculum_systems": ["MOZAMBIQUE_NATIONAL", "CAMBRIDGE"]
}
```

### Get Grade System Defaults
```typescript
GET /api/v1/schools/:id/grade-system/defaults/:systemType
// systemType: MOZAMBIQUE_NATIONAL, ANGOLA_NATIONAL, etc.
```

### Generate Schedule
```typescript
POST /api/v1/timetables/generate
{
  "school_id": "...",
  "curriculum_type": "MOZAMBIQUE_NATIONAL",
  "academic_year": "2024",
  "term": "1",
  "start_date": "2024-01-15",
  "end_date": "2024-04-30"
}
```

## Grade Calculation Examples

### Mozambique (0-20 scale)
- 18-20: A (Excelente)
- 16-17: B (Muito Bom)
- 14-15: C (Bom)
- 12-13: D (Suficiente)
- 10-11: E (Suficiente)
- 0-9: F (Insuficiente) ❌

**Final Grade**: 60% tests + 40% AP exam

### South Africa (0-100 scale, 7 levels)
- 80-100: Level 7 (Outstanding Achievement)
- 70-79: Level 6 (Meritorious Achievement)
- 60-69: Level 5 (Substantial Achievement)
- 50-59: Level 4 (Adequate Achievement)
- 40-49: Level 3 (Moderate Achievement)
- 30-39: Level 2 (Elementary Achievement)
- 0-29: Level 1 (Not Achieved) ❌

**Final Grade**: 50% continuous + 50% examination

### Congo (0-100 scale)
- 90-100: A+ (Excellent)
- 80-89: A (Très Bien)
- 70-79: B (Bien)
- 60-69: C (Assez Bien)
- 50-59: D (Passable)
- 0-49: F (Échec) ❌

**Final Grade**: 60% contrôles + 40% examen final

## Backend Requirements

For full functionality, the backend needs to implement:

1. **Database Schema**
   - Add `country`, `preferred_language`, `curriculum_systems` columns to `schools` table
   - Create `school_country_settings` table for extended settings
   - Create `email_templates` table with language variants

2. **API Endpoints**
   - School update endpoint with new fields
   - Grade system defaults for all curriculum types
   - Email template management by language

3. **Schedule Generation**
   - Read curriculum config from school settings
   - Apply curriculum-specific constraints
   - Respect period durations and break times

4. **Grade Calculations**
   - Implement grade boundaries for each system
   - Calculate letter grades based on curriculum
   - Apply assessment weights correctly

5. **Email System**
   - Template selection by school language
   - Variable substitution
   - Multi-language notification queue

## Migration Guide

For existing schools in the system:

1. **Default Configuration**
   - Existing schools: Mozambique + Portuguese + Mozambique National
   - Can be changed in settings

2. **Grade System**
   - Existing grade boundaries preserved
   - Can update to new curriculum defaults

3. **Schedules**
   - Existing schedules continue to work
   - New schedules use curriculum config

## Testing

To test multi-country support:

1. Create test schools for each country
2. Configure different curriculums
3. Generate schedules for each curriculum
4. Verify grade calculations
5. Test language switching
6. Check email templates in each language

## Support

For questions or issues:
- Check this documentation
- Review country configs in `lib/constants/country-configs.ts`
- Contact system administrator
