export const copyRules = [
  { name: 'em dash', pattern: /—/g },
  { name: 'slash-heavy shorthand', pattern: /\b(?:website\/app|email\/text|booking\/payments)\b/gi },
  {
    name: 'retired studio wording',
    pattern: /\b(?:I’ll personally|I'll personally|Tell me about the business|choose how I should respond|We clarify goals)\b/gi
  }
];

export function findCopyViolations(text, source = 'unknown') {
  return copyRules.flatMap(({ name, pattern }) => {
    const matcher = new RegExp(pattern.source, pattern.flags);
    return [...text.matchAll(matcher)].map((match) => ({
      source,
      rule: name,
      match: match[0],
      index: match.index ?? -1
    }));
  });
}
