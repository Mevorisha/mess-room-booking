export function lang(englishTxt: string, banglaTxt: string, hindiTxt: string): string {
  const lang = window.localStorage.getItem("lang");
  if (lang == null) return englishTxt;
  if (lang === "ENGLISH") return englishTxt;
  if (lang === "BANGLA") return banglaTxt;
  if (lang === "HINDI") return hindiTxt;
  return englishTxt;
}

export function getLang(): string {
  return window.localStorage.getItem("lang") ?? "ENGLISH";
}

export function getLangCode(): string {
  const lang = window.localStorage.getItem("lang");
  if (lang == null) return "en-US";
  if (lang === "ENGLISH") return "en-US";
  if (lang === "BANGLA") return "bn-IN";
  if (lang === "HINDI") return "hi-IN";
  return "en-US";
}
