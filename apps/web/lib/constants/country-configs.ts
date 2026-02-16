/**
 * Country and Curriculum Configuration Constants
 * Defines grading systems, languages, and academic settings for each supported country
 */

import type { CountryCode, CurriculumSystem, LanguageCode, CountryConfig, CurriculumConfig } from '@mozedu/types'

// ==================== COUNTRY CONFIGURATIONS ====================

export const COUNTRY_CONFIGS: Record<CountryCode, CountryConfig> = {
  MZ: {
    code: 'MZ',
    name: 'Mozambique',
    defaultLanguage: 'pt',
    supportedLanguages: ['pt', 'en'],
    defaultCurriculum: 'MOZAMBIQUE_NATIONAL',
    supportedCurriculums: ['MOZAMBIQUE_NATIONAL', 'CAMBRIDGE'],
    gradeScale: {
      min: 0,
      max: 20,
      passingScore: 10,
      description: 'Sistema de 0 a 20 valores',
    },
    academicTerms: {
      count: 3,
      names: ['1º Trimestre', '2º Trimestre', '3º Trimestre'],
    },
    assessmentTypes: {
      hasTests: true,
      hasFinalExam: true,
      finalExamName: 'AP (Avaliação Periódica)',
      weights: {
        tests: 60,
        finalExam: 40,
      },
    },
  },
  AO: {
    code: 'AO',
    name: 'Angola',
    defaultLanguage: 'pt',
    supportedLanguages: ['pt', 'en'],
    defaultCurriculum: 'ANGOLA_NATIONAL',
    supportedCurriculums: ['ANGOLA_NATIONAL', 'CAMBRIDGE'],
    gradeScale: {
      min: 0,
      max: 20,
      passingScore: 10,
      description: 'Sistema de 0 a 20 valores',
    },
    academicTerms: {
      count: 3,
      names: ['1º Trimestre', '2º Trimestre', '3º Trimestre'],
    },
    assessmentTypes: {
      hasTests: true,
      hasFinalExam: true,
      finalExamName: 'Exame Final',
      weights: {
        tests: 60,
        finalExam: 40,
      },
    },
  },
  ZA: {
    code: 'ZA',
    name: 'South Africa',
    defaultLanguage: 'en',
    supportedLanguages: ['en', 'pt'],
    defaultCurriculum: 'SOUTH_AFRICA_CAPS',
    supportedCurriculums: ['SOUTH_AFRICA_CAPS', 'CAMBRIDGE'],
    gradeScale: {
      min: 0,
      max: 100,
      passingScore: 30,
      description: 'Percentage-based system with 7 achievement levels',
    },
    academicTerms: {
      count: 4,
      names: ['Term 1', 'Term 2', 'Term 3', 'Term 4'],
    },
    assessmentTypes: {
      hasTests: true,
      hasFinalExam: true,
      finalExamName: 'Final Examination',
      weights: {
        tests: 50,
        finalExam: 50,
      },
    },
  },
  CD: {
    code: 'CD',
    name: 'Congo (DRC)',
    defaultLanguage: 'fr',
    supportedLanguages: ['fr', 'en'],
    defaultCurriculum: 'CONGO_NATIONAL',
    supportedCurriculums: ['CONGO_NATIONAL', 'CAMBRIDGE'],
    gradeScale: {
      min: 0,
      max: 100,
      passingScore: 50,
      description: 'Système sur 100 points',
    },
    academicTerms: {
      count: 3,
      names: ['1er Trimestre', '2e Trimestre', '3e Trimestre'],
    },
    assessmentTypes: {
      hasTests: true,
      hasFinalExam: true,
      finalExamName: 'Examen Final',
      weights: {
        tests: 60,
        finalExam: 40,
      },
    },
  },
}

// ==================== CURRICULUM CONFIGURATIONS ====================

export const CURRICULUM_CONFIGS: Record<CurriculumSystem, CurriculumConfig> = {
  MOZAMBIQUE_NATIONAL: {
    system: 'MOZAMBIQUE_NATIONAL',
    name: 'Sistema Nacional Moçambicano',
    description: 'Sistema de avaliação nacional de Moçambique (0-20 valores)',
    countryCode: 'MZ',
    gradeScale: {
      min: 0,
      max: 20,
      passingScore: 10,
      gradeBoundaries: [
        { minScore: 18, maxScore: 20, letterGrade: 'A', description: 'Excelente', passingStatus: 'excellent' },
        { minScore: 16, maxScore: 17, letterGrade: 'B', description: 'Muito Bom', passingStatus: 'excellent' },
        { minScore: 14, maxScore: 15, letterGrade: 'C', description: 'Bom', passingStatus: 'good' },
        { minScore: 12, maxScore: 13, letterGrade: 'D', description: 'Suficiente', passingStatus: 'satisfactory' },
        { minScore: 10, maxScore: 11, letterGrade: 'E', description: 'Suficiente', passingStatus: 'pass' },
        { minScore: 0, maxScore: 9, letterGrade: 'F', description: 'Insuficiente', passingStatus: 'fail' },
      ],
    },
    scheduleConfig: {
      periodsPerDay: 8,
      periodDurationMinutes: 45,
      breakDurationMinutes: 15,
      lunchBreakMinutes: 60,
    },
    assessmentConfig: {
      termsPerYear: 3,
      assessmentTypes: ['MAC (Mini-Avaliação Contínua)', 'AP (Avaliação Periódica)'],
      hasIntermediateAssessments: true,
      hasFinalExam: true,
      finalExamWeight: 40,
    },
  },
  ANGOLA_NATIONAL: {
    system: 'ANGOLA_NATIONAL',
    name: 'Sistema Nacional Angolano',
    description: 'Sistema de avaliação nacional de Angola (0-20 valores)',
    countryCode: 'AO',
    gradeScale: {
      min: 0,
      max: 20,
      passingScore: 10,
      gradeBoundaries: [
        { minScore: 18, maxScore: 20, letterGrade: 'A', description: 'Excelente', passingStatus: 'excellent' },
        { minScore: 16, maxScore: 17, letterGrade: 'B', description: 'Muito Bom', passingStatus: 'excellent' },
        { minScore: 14, maxScore: 15, letterGrade: 'C', description: 'Bom', passingStatus: 'good' },
        { minScore: 12, maxScore: 13, letterGrade: 'D', description: 'Suficiente', passingStatus: 'satisfactory' },
        { minScore: 10, maxScore: 11, letterGrade: 'E', description: 'Suficiente', passingStatus: 'pass' },
        { minScore: 0, maxScore: 9, letterGrade: 'F', description: 'Insuficiente', passingStatus: 'fail' },
      ],
    },
    scheduleConfig: {
      periodsPerDay: 7,
      periodDurationMinutes: 45,
      breakDurationMinutes: 15,
      lunchBreakMinutes: 45,
    },
    assessmentConfig: {
      termsPerYear: 3,
      assessmentTypes: ['Teste', 'Exame'],
      hasIntermediateAssessments: true,
      hasFinalExam: true,
      finalExamWeight: 40,
    },
  },
  SOUTH_AFRICA_CAPS: {
    system: 'SOUTH_AFRICA_CAPS',
    name: 'South African CAPS',
    description: 'Curriculum and Assessment Policy Statement (0-100%)',
    countryCode: 'ZA',
    gradeScale: {
      min: 0,
      max: 100,
      passingScore: 30,
      gradeBoundaries: [
        { minScore: 80, maxScore: 100, letterGrade: '7', gpa: 4.0, description: 'Outstanding Achievement', passingStatus: 'excellent' },
        { minScore: 70, maxScore: 79, letterGrade: '6', gpa: 3.5, description: 'Meritorious Achievement', passingStatus: 'excellent' },
        { minScore: 60, maxScore: 69, letterGrade: '5', gpa: 3.0, description: 'Substantial Achievement', passingStatus: 'good' },
        { minScore: 50, maxScore: 59, letterGrade: '4', gpa: 2.5, description: 'Adequate Achievement', passingStatus: 'satisfactory' },
        { minScore: 40, maxScore: 49, letterGrade: '3', gpa: 2.0, description: 'Moderate Achievement', passingStatus: 'pass' },
        { minScore: 30, maxScore: 39, letterGrade: '2', gpa: 1.0, description: 'Elementary Achievement', passingStatus: 'pass' },
        { minScore: 0, maxScore: 29, letterGrade: '1', gpa: 0.0, description: 'Not Achieved', passingStatus: 'fail' },
      ],
    },
    scheduleConfig: {
      periodsPerDay: 8,
      periodDurationMinutes: 45,
      breakDurationMinutes: 20,
      lunchBreakMinutes: 45,
    },
    assessmentConfig: {
      termsPerYear: 4,
      assessmentTypes: ['Continuous Assessment', 'Examination'],
      hasIntermediateAssessments: true,
      hasFinalExam: true,
      finalExamWeight: 50,
    },
  },
  CONGO_NATIONAL: {
    system: 'CONGO_NATIONAL',
    name: 'Système National Congolais',
    description: 'Système d\'évaluation national du Congo (0-100 points)',
    countryCode: 'CD',
    gradeScale: {
      min: 0,
      max: 100,
      passingScore: 50,
      gradeBoundaries: [
        { minScore: 90, maxScore: 100, letterGrade: 'A+', description: 'Excellent', passingStatus: 'excellent' },
        { minScore: 80, maxScore: 89, letterGrade: 'A', description: 'Très Bien', passingStatus: 'excellent' },
        { minScore: 70, maxScore: 79, letterGrade: 'B', description: 'Bien', passingStatus: 'good' },
        { minScore: 60, maxScore: 69, letterGrade: 'C', description: 'Assez Bien', passingStatus: 'satisfactory' },
        { minScore: 50, maxScore: 59, letterGrade: 'D', description: 'Passable', passingStatus: 'pass' },
        { minScore: 0, maxScore: 49, letterGrade: 'F', description: 'Échec', passingStatus: 'fail' },
      ],
    },
    scheduleConfig: {
      periodsPerDay: 8,
      periodDurationMinutes: 50,
      breakDurationMinutes: 15,
      lunchBreakMinutes: 60,
    },
    assessmentConfig: {
      termsPerYear: 3,
      assessmentTypes: ['Contrôle', 'Examen'],
      hasIntermediateAssessments: true,
      hasFinalExam: true,
      finalExamWeight: 40,
    },
  },
  CAMBRIDGE: {
    system: 'CAMBRIDGE',
    name: 'Cambridge International',
    description: 'Cambridge Assessment International Education (0-100%)',
    countryCode: 'MZ', // Can be used by any country
    gradeScale: {
      min: 0,
      max: 100,
      passingScore: 40,
      gradeBoundaries: [
        { minScore: 90, maxScore: 100, letterGrade: 'A*', gpa: 4.0, description: 'Outstanding', passingStatus: 'excellent' },
        { minScore: 80, maxScore: 89, letterGrade: 'A', gpa: 4.0, description: 'Excellent', passingStatus: 'excellent' },
        { minScore: 70, maxScore: 79, letterGrade: 'B', gpa: 3.0, description: 'Very Good', passingStatus: 'good' },
        { minScore: 60, maxScore: 69, letterGrade: 'C', gpa: 2.5, description: 'Good', passingStatus: 'satisfactory' },
        { minScore: 50, maxScore: 59, letterGrade: 'D', gpa: 2.0, description: 'Satisfactory', passingStatus: 'pass' },
        { minScore: 40, maxScore: 49, letterGrade: 'E', gpa: 1.0, description: 'Pass', passingStatus: 'pass' },
        { minScore: 0, maxScore: 39, letterGrade: 'U', gpa: 0.0, description: 'Ungraded', passingStatus: 'fail' },
      ],
    },
    scheduleConfig: {
      periodsPerDay: 8,
      periodDurationMinutes: 50,
      breakDurationMinutes: 20,
      lunchBreakMinutes: 60,
    },
    assessmentConfig: {
      termsPerYear: 3,
      assessmentTypes: ['Coursework', 'External Examination'],
      hasIntermediateAssessments: true,
      hasFinalExam: true,
      finalExamWeight: 70,
    },
  },
  CUSTOM: {
    system: 'CUSTOM',
    name: 'Custom System',
    description: 'Customizable grading system',
    countryCode: 'MZ',
    gradeScale: {
      min: 0,
      max: 100,
      passingScore: 50,
    },
    scheduleConfig: {
      periodsPerDay: 8,
      periodDurationMinutes: 45,
      breakDurationMinutes: 15,
    },
    assessmentConfig: {
      termsPerYear: 3,
      assessmentTypes: ['Assessment'],
      hasIntermediateAssessments: true,
      hasFinalExam: false,
    },
  },
}

// ==================== HELPER FUNCTIONS ====================

export function getCountryConfig(countryCode: CountryCode): CountryConfig {
  return COUNTRY_CONFIGS[countryCode]
}

export function getCurriculumConfig(curriculum: CurriculumSystem): CurriculumConfig {
  return CURRICULUM_CONFIGS[curriculum]
}

export function getAvailableCurriculumsForCountry(countryCode: CountryCode): CurriculumConfig[] {
  const country = COUNTRY_CONFIGS[countryCode]
  return country.supportedCurriculums.map(curriculum => CURRICULUM_CONFIGS[curriculum])
}

export function getCountryByLanguage(language: LanguageCode): CountryCode[] {
  return Object.values(COUNTRY_CONFIGS)
    .filter(config => config.supportedLanguages.includes(language))
    .map(config => config.code)
}
