const fs = require('fs');
const path = require('path');

// English translations
const curriculumTranslationsEN = {
  curriculum: {
    title: "Curriculum & Grading System",
    selectCountry: "Select Country",
    selectCurriculum: "Select Curriculum System",
    primaryCurriculum: "Primary Curriculum",
    secondaryCurriculums: "Additional Curriculum Systems",
    mozambiqueNational: "Mozambique National System",
    angolaNational: "Angola National System",
    congoNational: "Congo National System (DRC)",
    southAfricaCaps: "South African CAPS",
    cambridge: "Cambridge International",
    custom: "Custom System",
    gradeScale: "Grade Scale",
    passingScore: "Passing Score",
    assessmentTypes: "Assessment Types",
    hasTests: "Regular Tests",
    hasFinalExam: "Final Examination",
    finalExamName: "Final Exam Name",
    termsPerYear: "Terms per Year",
    scheduleConfiguration: "Schedule Configuration",
    periodsPerDay: "Periods per Day",
    periodDuration: "Period Duration (minutes)",
    breakDuration: "Break Duration (minutes)",
    countries: {
      MZ: "Mozambique",
      AO: "Angola",
      ZA: "South Africa",
      CD: "Congo (DRC)"
    },
    descriptions: {
      mozambique: "0-20 scale with continuous assessment and final AP exam",
      angola: "0-20 scale similar to Mozambique system",
      congo: "0-100 percentage-based system",
      southAfrica: "0-100 with 7 achievement levels (CAPS curriculum)",
      cambridge: "International A*-U grading system"
    }
  },
  emailTemplates: {
    title: "Email Templates",
    selectLanguage: "Template Language",
    categories: {
      attendance: "Attendance Notifications",
      grades: "Grade Reports",
      general: "General Communications",
      payment: "Payment Reminders",
      report: "Progress Reports"
    },
    variables: "Available Variables",
    subject: "Subject",
    body: "Email Body",
    preview: "Preview",
    save: "Save Template"
  }
};

// Portuguese translations
const curriculumTranslationsPT = {
  curriculum: {
    title: "Currículo e Sistema de Avaliação",
    selectCountry: "Selecionar País",
    selectCurriculum: "Selecionar Sistema Curricular",
    primaryCurriculum: "Currículo Principal",
    secondaryCurriculums: "Sistemas Curriculares Adicionais",
    mozambiqueNational: "Sistema Nacional Moçambicano",
    angolaNational: "Sistema Nacional Angolano",
    congoNational: "Sistema Nacional Congolês (RDC)",
    southAfricaCaps: "CAPS Sul-Africano",
    cambridge: "Cambridge Internacional",
    custom: "Sistema Personalizado",
    gradeScale: "Escala de Notas",
    passingScore: "Nota de Aprovação",
    assessmentTypes: "Tipos de Avaliação",
    hasTests: "Testes Regulares",
    hasFinalExam: "Exame Final",
    finalExamName: "Nome do Exame Final",
    termsPerYear: "Trimestres por Ano",
    scheduleConfiguration: "Configuração de Horário",
    periodsPerDay: "Períodos por Dia",
    periodDuration: "Duração do Período (minutos)",
    breakDuration: "Duração do Intervalo (minutos)",
    countries: {
      MZ: "Moçambique",
      AO: "Angola",
      ZA: "África do Sul",
      CD: "Congo (RDC)"
    },
    descriptions: {
      mozambique: "Escala 0-20 com avaliação contínua e exame final AP",
      angola: "Escala 0-20 similar ao sistema moçambicano",
      congo: "Sistema percentual 0-100",
      southAfrica: "0-100 com 7 níveis de aproveitamento (currículo CAPS)",
      cambridge: "Sistema internacional de notas A*-U"
    }
  },
  emailTemplates: {
    title: "Modelos de Email",
    selectLanguage: "Idioma do Modelo",
    categories: {
      attendance: "Notificações de Presença",
      grades: "Relatórios de Notas",
      general: "Comunicações Gerais",
      payment: "Lembretes de Pagamento",
      report: "Relatórios de Progresso"
    },
    variables: "Variáveis Disponíveis",
    subject: "Assunto",
    body: "Corpo do Email",
    preview: "Pré-visualização",
    save: "Guardar Modelo"
  }
};

// French translations
const curriculumTranslationsFR = {
  curriculum: {
    title: "Curriculum et Système d'Évaluation",
    selectCountry: "Sélectionner le Pays",
    selectCurriculum: "Sélectionner le Système Curriculaire",
    primaryCurriculum: "Curriculum Principal",
    secondaryCurriculums: "Systèmes Curriculaires Supplémentaires",
    mozambiqueNational: "Système National Mozambicain",
    angolaNational: "Système National Angolais",
    congoNational: "Système National Congolais (RDC)",
    southAfricaCaps: "CAPS Sud-Africain",
    cambridge: "Cambridge International",
    custom: "Système Personnalisé",
    gradeScale: "Échelle de Notes",
    passingScore: "Note de Passage",
    assessmentTypes: "Types d'Évaluation",
    hasTests: "Tests Réguliers",
    hasFinalExam: "Examen Final",
    finalExamName: "Nom de l'Examen Final",
    termsPerYear: "Trimestres par An",
    scheduleConfiguration: "Configuration d'Horaire",
    periodsPerDay: "Périodes par Jour",
    periodDuration: "Durée de la Période (minutes)",
    breakDuration: "Durée de la Pause (minutes)",
    countries: {
      MZ: "Mozambique",
      AO: "Angola",
      ZA: "Afrique du Sud",
      CD: "Congo (RDC)"
    },
    descriptions: {
      mozambique: "Échelle 0-20 avec évaluation continue et examen final AP",
      angola: "Échelle 0-20 similaire au système mozambicain",
      congo: "Système de pourcentage 0-100",
      southAfrica: "0-100 avec 7 niveaux de réussite (curriculum CAPS)",
      cambridge: "Système international de notation A*-U"
    }
  },
  emailTemplates: {
    title: "Modèles d'Email",
    selectLanguage: "Langue du Modèle",
    categories: {
      attendance: "Notifications de Présence",
      grades: "Bulletins de Notes",
      general: "Communications Générales",
      payment: "Rappels de Paiement",
      report: "Rapports de Progrès"
    },
    variables: "Variables Disponibles",
    subject: "Sujet",
    body: "Corps de l'Email",
    preview: "Aperçu",
    save: "Enregistrer le Modèle"
  }
};

// Turkish translations
const curriculumTranslationsTR = {
  curriculum: {
    title: "Müfredat ve Değerlendirme Sistemi",
    selectCountry: "Ülke Seçin",
    selectCurriculum: "Müfredat Sistemini Seçin",
    primaryCurriculum: "Ana Müfredat",
    secondaryCurriculums: "Ek Müfredat Sistemleri",
    mozambiqueNational: "Mozambik Ulusal Sistemi",
    angolaNational: "Angola Ulusal Sistemi",
    congoNational: "Kongo Ulusal Sistemi (DRC)",
    southAfricaCaps: "Güney Afrika CAPS",
    cambridge: "Cambridge Uluslararası",
    custom: "Özel Sistem",
    gradeScale: "Not Ölçeği",
    passingScore: "Geçme Notu",
    assessmentTypes: "Değerlendirme Türleri",
    hasTests: "Düzenli Testler",
    hasFinalExam: "Final Sınavı",
    finalExamName: "Final Sınavı Adı",
    termsPerYear: "Yıllık Dönem Sayısı",
    scheduleConfiguration: "Program Yapılandırması",
    periodsPerDay: "Günlük Ders Sayısı",
    periodDuration: "Ders Süresi (dakika)",
    breakDuration: "Ara Süresi (dakika)",
    countries: {
      MZ: "Mozambik",
      AO: "Angola",
      ZA: "Güney Afrika",
      CD: "Kongo (DRC)"
    },
    descriptions: {
      mozambique: "Sürekli değerlendirme ve final AP sınavı ile 0-20 ölçeği",
      angola: "Mozambik sistemine benzer 0-20 ölçeği",
      congo: "0-100 yüzde tabanlı sistem",
      southAfrica: "7 başarı seviyeli 0-100 (CAPS müfredatı)",
      cambridge: "Uluslararası A*-U not sistemi"
    }
  },
  emailTemplates: {
    title: "E-posta Şablonları",
    selectLanguage: "Şablon Dili",
    categories: {
      attendance: "Devam Bildirimleri",
      grades: "Not Raporları",
      general: "Genel İletişim",
      payment: "Ödeme Hatırlatmaları",
      report: "İlerleme Raporları"
    },
    variables: "Kullanılabilir Değişkenler",
    subject: "Konu",
    body: "E-posta İçeriği",
    preview: "Önizleme",
    save: "Şablonu Kaydet"
  }
};

// Function to add translations to a file
function addTranslations(filePath, translations) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Remove BOM if present
  if (content.charCodeAt(0) === 0xFEFF) {
    content = content.slice(1);
  }
  
  const data = JSON.parse(content);
  
  // Add new translations
  Object.assign(data, translations);
  
  // Write back with proper formatting
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
  console.log(`✅ Updated ${filePath}`);
}

// Update all message files
const messagesDir = path.join(__dirname, '../../messages');

addTranslations(path.join(messagesDir, 'en.json'), curriculumTranslationsEN);
addTranslations(path.join(messagesDir, 'pt.json'), curriculumTranslationsPT);
addTranslations(path.join(messagesDir, 'fr.json'), curriculumTranslationsFR);
addTranslations(path.join(messagesDir, 'tr.json'), curriculumTranslationsTR);

console.log('\n✅ All translation files updated successfully!');
