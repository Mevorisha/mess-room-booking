/**
 * A function that takes a string and checks it:
 * - if cuss words are found, returns "Stop cussing kiddo" if cuss words are found
 * - if the string is "I love you", returns "Aww, I love you too"
 * - if the string is "I hate you", returns "Screw you"
 * - if string contains 69 or 420, returns "I see you're a man of culture"
 *   - make sure the numbers are not part of a larger number, e.g. 169 or 4200
 * - otherwise, return null to indicate no easteregg was found
 * @param {string} str
 * @returns {string | null}
 */
export function checkForEasterEgg(str) {
  // Define the list of mild, humorous cuss words
  const mildCussWords = [
    "dingus",
    "numpty",
    "nincompoop",
    "dunce",
    "numbskull",
    "nitwit",
    "twit",
    "wally",
    "goofball",
    "wuss",
    "gadha",
    "ullu ka pattha",
    "bewakoof",
    "nalayak",
    "chirkut",
    "buddhu",
    "chappal chor",
    "darpok",
    "ghochu",
    "fuddu",
  ];

  // Check for mild cuss words (case insensitive)
  for (let word of mildCussWords) {
    const regex = new RegExp(`\\b${word}\\b`, "i");
    if (regex.test(str)) {
      return `Kisko ${word} bolta hai be?`;
    }
  }

  // Check if "I love you" or "I hate you" are substrings (case insensitive)
  const lowerStr = str.toLowerCase();
  if (lowerStr.includes("i love you")) {
    return "Aww, I love you too";
  }
  if (lowerStr.includes("i hate you")) {
    return "Screw you";
  }

  // Check for standalone numbers 69 or 420
  if (/\b69\b/.test(str) || /\b420\b/.test(str)) {
    return "I see you're a man of culture";
  }

  // Return null if no easter egg is found
  return null;
}
