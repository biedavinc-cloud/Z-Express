// Content dictionaries on this site are written per language ({ en, fr }) and
// fall back to English for a language that has not been translated yet, so a
// visitor never sees an empty heading.

export function localized(entry, lang) {
  if (!entry) return '';
  return entry[lang] || entry.en || '';
}

export function localizedList(entry, lang) {
  const value = localized(entry, lang);
  return Array.isArray(value) ? value : [];
}