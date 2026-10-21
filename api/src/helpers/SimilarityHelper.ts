import type { Request } from 'express'
import type { DataSource, ObjectLiteral, SelectQueryBuilder } from 'typeorm'

/**
 * Lowest name similarity at which two names count as likely duplicates.
 * Similarity goes from 0 (no three-letter piece in common) to 1 (same name once normalized).
 * For example "lord of the ring" and "The Lord of the Rings" score 0.81, "Interstellar" and "Intersteller" 0.63,
 * "Books" and "Book" 0.57, while "Star Wars" and "Star Trek" score 0.29 and are not suggested.
 */
const SIMILAR_NAME_THRESHOLD = 0.5

/** Most similar records returned for one name. */
const MAX_SIMILAR_RESULTS = 5

/**
 * Postgres extensions the similarity query needs:
 * pg_trgm provides similarity() and unaccent provides unaccent(), which turns "Pokémon" into "Pokemon".
 */
const SIMILARITY_EXTENSIONS = ['pg_trgm', 'unaccent']

/**
 * SQL that puts a name in a comparable form: accents removed, lowercased, a leading "the", "a" or "an" dropped,
 * and everything but letters and digits removed, so "The Lord of the Rings!" becomes "lordoftherings".
 */
const normalizedNameSql = (sqlValue: string): string => (
  `regexp_replace(regexp_replace(lower(unaccent(btrim(${sqlValue}))), '^(the|a|an)[[:space:]]+', ''), '[^a-z0-9]', '', 'g')`
)

/**
 * SQL scoring how alike a name column is to a name parameter, with Postgres' pg_trgm similarity() on the normalized names.
 * pg_trgm splits each name into trigrams, every run of three letters in it (plus the padded start and end), so "dune"
 * gives "  d", " du", "dun", "une" and "ne ". The score is the number of trigrams both names share divided by the
 * number of distinct trigrams in either name, so a typo only changes the few trigrams around it and the score stays high.
 */
const nameSimilaritySql = (column: string): string => `similarity(${normalizedNameSql(column)}, ${normalizedNameSql(':similarName')})`

/** Whether a query value is a name worth comparing: text with at least one character that is not a space. */
export const isValidSimilarName = (name: Request['query'][string]): name is string => typeof name === 'string' && name.trim().length > 0

/** Turns on the Postgres extensions the similarity query needs, when they are not on yet. */
export const enableSimilarityExtensions = async (dataSource: DataSource): Promise<void> => {
  for (const extension of SIMILARITY_EXTENSIONS) {
    await dataSource.query(`CREATE EXTENSION IF NOT EXISTS ${extension}`)
  }
}

/**
 * Runs the query in the database for the ids of the records whose name is likely a duplicate of the given name,
 * most similar first (oldest first on a tie), so only those ids leave the database.
 */
export const findSimilarIds = async <T extends ObjectLiteral>(query: SelectQueryBuilder<T>, name: string): Promise<number[]> => {
  const similaritySql = nameSimilaritySql(`${query.alias}.name`)
  const rows: { id: number }[] = await query
    .select(`${query.alias}.id`, 'id')
    .andWhere(`${similaritySql} >= :threshold`, { similarName: name, threshold: SIMILAR_NAME_THRESHOLD })
    .orderBy(similaritySql, 'DESC')
    .addOrderBy(`${query.alias}.id`, 'ASC')
    .limit(MAX_SIMILAR_RESULTS)
    .getRawMany()
  return rows.map((row) => row.id)
}

/** Puts records in the order of the given ids, which is the order findSimilarIds ranked them in. */
export const orderByIds = <T extends { id: number }>(records: T[], ids: number[]): T[] => (
  ids.map((id) => records.find((record) => record.id === id)).filter((record): record is T => record !== undefined)
)
