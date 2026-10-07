/**
 * Meta description from a longer passage.
 *
 * Search results show about 155 characters on desktop and about 120 on phones, and cut the
 * rest. A whole body paragraph as meta description hides the point behind the cut and gets
 * rewritten by the search engine. This keeps whole sentences up to the limit; when even the first
 * sentence is too long it cuts at a word boundary. No ellipsis is added.
 *
 * @param {string} text the passage
 * @param {number} max maximum characters (default 155)
 * @returns {string}
 */
export const toMetaDescription = (text, max = 155) => {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;

  const sentences = clean.match(/[^.!?]+[.!?]+(?=\s|$)/g) || [];
  let result = '';
  for (const sentence of sentences) {
    const next = `${result}${result ? ' ' : ''}${sentence.trim()}`;
    if (next.length > max) break;
    result = next;
  }
  if (result) return result;

  const cut = clean.slice(0, max + 1);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 0 ? cut.slice(0, lastSpace) : clean.slice(0, max)).replace(/[,;:]$/, '');
};
