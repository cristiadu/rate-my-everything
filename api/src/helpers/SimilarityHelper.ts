/** Lowest name similarity, from 0 (nothing shared) to 1 (same name), at which two names count as likely duplicates. */
export const SIMILAR_NAME_THRESHOLD = 0.6

/** Most similar records returned for one name. */
export const MAX_SIMILAR_RESULTS = 5

/** Leading words that do not tell names apart, such as "The" in "The Matrix". */
const LEADING_ARTICLES = /^(the|a|an) /

/** Lowercases a name, strips accents, punctuation and a leading article, and collapses spaces. */
export const normalizeName = (name: string): string => name
  .normalize('NFKD')
  .replace(/[̀-ͯ]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .trim()
  .replace(LEADING_ARTICLES, '')

/** Counts each pair of adjacent characters in the text. */
const countBigrams = (text: string): Map<string, number> => {
  const bigrams = new Map<string, number>()
  for (let index = 0; index < text.length - 1; index++) {
    const bigram = text.slice(index, index + 2)
    bigrams.set(bigram, (bigrams.get(bigram) ?? 0) + 1)
  }
  return bigrams
}

/**
 * Scores how alike two names are, from 0 to 1, with the Sørensen–Dice coefficient of their character pairs
 * after normalizing them, so typos, accents, case and word order barely lower the score.
 */
export const nameSimilarity = (firstName: string, secondName: string): number => {
  const first = normalizeName(firstName).replace(/ /g, '')
  const second = normalizeName(secondName).replace(/ /g, '')
  if (first === second) {
    return first.length > 0 ? 1 : 0
  }
  if (first.length < 2 || second.length < 2) {
    return 0
  }

  const firstBigrams = countBigrams(first)
  let sharedBigrams = 0
  countBigrams(second).forEach((count, bigram) => {
    sharedBigrams += Math.min(count, firstBigrams.get(bigram) ?? 0)
  })
  return (2 * sharedBigrams) / (first.length - 1 + second.length - 1)
}

/** Keeps the records whose name is likely a duplicate of the given name, most similar first. */
export const findSimilarByName = <T extends { name: string }>(records: T[], name: string): T[] => records
  .map((record) => ({ record, similarity: nameSimilarity(record.name, name) }))
  .filter(({ similarity }) => similarity >= SIMILAR_NAME_THRESHOLD)
  .sort((first, second) => second.similarity - first.similarity)
  .slice(0, MAX_SIMILAR_RESULTS)
  .map(({ record }) => record)
