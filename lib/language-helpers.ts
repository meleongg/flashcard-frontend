// Map of POS tags to more readable descriptions
export const posDescriptions: Record<string, string> = {
  NOUN: "Noun",
  VERB: "Verb",
  ADJ: "Adjective",
  ADV: "Adverb",
  ADP: "Preposition",
  CONJ: "Conjunction",
  DET: "Determiner",
  PRON: "Pronoun",
  PROPN: "Proper noun",
  NUM: "Number",
  PART: "Particle",
  INTJ: "Interjection",
  PUNCT: "Punctuation",
  SYM: "Symbol",
  X: "Other",
};

// Map of POS tags to colors
export const posColors: Record<string, string> = {
  NOUN: "bg-blue-100 text-blue-800",
  VERB: "bg-green-100 text-green-800",
  ADJ: "bg-purple-100 text-purple-800",
  ADV: "bg-amber-100 text-amber-800",
  PRON: "bg-pink-100 text-pink-800",
  PROPN: "bg-indigo-100 text-indigo-800",
};

export const getLanguageName = (code: string | undefined): string => {
  if (!code) return "Unknown";

  const languages: Record<string, string> = {
    en: "English",
    zh: "Mandarin",
    es: "Spanish",
    fr: "French",
    ja: "Japanese",
    de: "German",
    ru: "Russian",
    it: "Italian",
    pt: "Portuguese",
    ko: "Korean",
  };

  return languages[code] || code;
};
