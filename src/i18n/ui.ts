export const languages = {
  en: 'EN',
  ru: 'RU',
};

export const defaultLang = 'en';

export const ui = {
  en: {
    'nav.projects': '/projects',
    'nav.notes': '/notes',
    'nav.services': '/services',
    'nav.about': '/about',
    'nav.arcade': '/arcade',
    'role.subtitle': 'MLOps & Infrastructure Engineer',
    'footer.location': '© 2026 ALEKSANDR ZHDANOV // ST. PETERSBURG',
  },
  ru: {
    'nav.projects': '/проекты',
    'nav.notes': '/заметки',
    'nav.services': '/услуги',
    'nav.about': '/обо-мне',
    'nav.arcade': '/аркада',
    'role.subtitle': 'Инженер MLOps и ML-инфраструктуры',
    'footer.location': '© 2026 АЛЕКСАНДР ЖДАНОВ // САНКТ-ПЕТЕРБУРГ',
  },
} as const;

export function getLangFromUrl(url: URL, base: string) {
  const cleanPath = url.pathname.replace(base, '').replace(/^\/+/, '');
  const [firstSegment] = cleanPath.split('/');
  if (firstSegment in ui) return firstSegment as keyof typeof ui;
  return defaultLang;
}

export function useTranslations(lang: keyof typeof ui) {
  return function t(key: keyof (typeof ui)[typeof defaultLang]) {
    return ui[lang][key] || ui[defaultLang][key];
  };
}
