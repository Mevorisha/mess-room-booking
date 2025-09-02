import { Language, LanguageCodes, mkLangCodeFromLang, mkLangFromStr, Nullable } from "sharedtypes";

export function lang(englishTxt: string, banglaTxt: string, hindiTxt: string): string {
  const lang = getLangNotNull();
  switch (lang) {
    case Language.ENGLISH:
      return englishTxt;
    case Language.BANGLA:
      return banglaTxt;
    case Language.HINDI:
      return hindiTxt;
  }
}

export function getLangCode(): LanguageCodes {
  return mkLangCodeFromLang(getLangNotNull());
}

export function getLangNotNull(): Language {
  return getLangOrNull() ?? Language.ENGLISH;
}

export function getLangOrNull(): Nullable<Language> {
  const lang = window.localStorage.getItem("lang");
  return lang != null ? mkLangFromStr(lang) : null;
}
