import { Language, LanguageCodes } from "@/types/typeEnums";

export function mkLangCodeFromLang(lang: Language): LanguageCodes {
  switch (lang) {
    case Language.ENGLISH:
      return LanguageCodes.en_US;
    case Language.BANGLA:
      return LanguageCodes.bn_IN;
    case Language.HINDI:
      return LanguageCodes.hi_IN;
  }
}

export function mkLangFromStr(str: string): Language {
  return Object.values(Language).includes(str as Language) ? (str as Language) : Language.ENGLISH;
}
