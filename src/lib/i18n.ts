import React, { createContext, useContext, useState } from 'react';

export type Language = 'en' | 'hi' | 'es';

const translations: Record<Language, Record<string, string>> = {
  en: {
    overview: 'Overview', courses: 'Courses', analytics: 'Analytics', settings: 'Settings',
    browse: 'Browse Courses', enrolled: 'My Learning', myCourses: 'My Courses',
    createCourse: 'Create Course', assignments: 'Assignments', liveClasses: 'Live Classes',
    assignmentsByCourseHint: 'Organized by course. Pick a course to see only its work.',
    assignmentsFilterLabel: 'Course',
    assignmentsFilterAll: 'All courses',
    assignmentsCountInCourse: '{n} assignment(s)',
    discussions: 'Discussions', community: 'Community', certificates: 'Certificates',
    payment: 'Payments', aiAssistant: 'AI Assistant', mcqGenerator: 'MCQ Generator',
    careerPath: 'Career path',
    logout: 'Logout', enroll: 'Enroll Now', enrolled_btn: 'Enrolled',
    submit: 'Submit', cancel: 'Cancel', save: 'Save', delete: 'Delete',
    loading: 'Loading...', noData: 'No data yet', search: 'Search...',
    welcome: 'Welcome back', notifications: 'Notifications',
  },
  hi: {
    overview: 'अवलोकन', courses: 'पाठ्यक्रम', analytics: 'विश्लेषण', settings: 'सेटिंग्स',
    browse: 'पाठ्यक्रम खोजें', enrolled: 'मेरी शिक्षा', myCourses: 'मेरे पाठ्यक्रम',
    createCourse: 'पाठ्यक्रम बनाएं', assignments: 'असाइनमेंट', liveClasses: 'लाइव क्लास',
    assignmentsByCourseHint: 'पाठ्यक्रम के अनुसार व्यवस्थित। एक वर्ग पर केंद्रित करने के लिए फ़िल्टर चुनें।',
    assignmentsFilterLabel: 'पाठ्यक्रम',
    assignmentsFilterAll: 'सभी पाठ्यक्रम',
    assignmentsCountInCourse: '{n} असाइनमेंट',
    discussions: 'चर्चाएं', community: 'समुदाय', certificates: 'प्रमाण पत्र',
    payment: 'भुगतान', aiAssistant: 'AI सहायक', mcqGenerator: 'MCQ जनरेटर',
    careerPath: 'करियर पथ',
    logout: 'लॉगआउट', enroll: 'अभी नामांकन करें', enrolled_btn: 'नामांकित',
    submit: 'जमा करें', cancel: 'रद्द करें', save: 'सहेजें', delete: 'हटाएं',
    loading: 'लोड हो रहा है...', noData: 'अभी कोई डेटा नहीं', search: 'खोजें...',
    welcome: 'वापस स्वागत है', notifications: 'सूचनाएं',
  },
  es: {
    overview: 'Resumen', courses: 'Cursos', analytics: 'Analíticas', settings: 'Configuración',
    browse: 'Explorar Cursos', enrolled: 'Mi Aprendizaje', myCourses: 'Mis Cursos',
    createCourse: 'Crear Curso', assignments: 'Tareas', liveClasses: 'Clases en Vivo',
    assignmentsByCourseHint: 'Organizado por curso. Elige un curso para ver solo sus tareas.',
    assignmentsFilterLabel: 'Curso',
    assignmentsFilterAll: 'Todos los cursos',
    assignmentsCountInCourse: '{n} tarea(s)',
    discussions: 'Discusiones', community: 'Comunidad', certificates: 'Certificados',
    payment: 'Pagos', aiAssistant: 'Asistente IA', mcqGenerator: 'Generador MCQ',
    careerPath: 'Ruta profesional',
    logout: 'Cerrar Sesión', enroll: 'Inscribirse', enrolled_btn: 'Inscrito',
    submit: 'Enviar', cancel: 'Cancelar', save: 'Guardar', delete: 'Eliminar',
    loading: 'Cargando...', noData: 'Sin datos aún', search: 'Buscar...',
    welcome: 'Bienvenido de nuevo', notifications: 'Notificaciones',
  },
};

interface I18nContextType {
  lang: Language;
  setLang: (l: Language) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType>({
  lang: 'en',
  setLang: () => {},
  t: (key) => key,
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const stored = (localStorage.getItem('lang') as Language) || 'en';
  const [lang, setLangState] = useState<Language>(stored);

  const setLang = (l: Language) => {
    setLangState(l);
    localStorage.setItem('lang', l);
  };

  const t = (key: string): string => translations[lang][key] || translations['en'][key] || key;

  return React.createElement(I18nContext.Provider, { value: { lang, setLang, t } }, children);
}

export function useI18n() {
  return useContext(I18nContext);
}
