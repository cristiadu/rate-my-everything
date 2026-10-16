import { readFileSync } from 'fs'
import path from 'path'
import process from 'process'

/** Coverage metrics shown per package, in table order, keyed by their name in coverage-summary.json. */
const METRICS = ['lines', 'statements', 'functions', 'branches']

/**
 * Builds one Markdown table row from a package's coverage-summary.json.
 * @param {string} summaryPath path to the package's coverage/coverage-summary.json
 * @returns {string} the table row, named after the package's folder
 */
const toRow = (summaryPath) => {
  const { total } = JSON.parse(readFileSync(summaryPath, 'utf8'))
  const packageName = path.dirname(path.dirname(summaryPath))
  const cells = METRICS.map((metric) => `${total[metric].pct}% (${total[metric].covered}/${total[metric].total})`)
  return `| ${packageName} | ${cells.join(' | ')} |`
}

/** Prints a Markdown coverage table for the coverage-summary.json files given as arguments. */
const printSummary = () => {
  const rows = process.argv.slice(2).map(toRow)
  process.stdout.write([
    '## Unit test coverage',
    '',
    '| Package | Lines | Statements | Functions | Branches |',
    '| --- | --- | --- | --- | --- |',
    ...rows,
  ].join('\n') + '\n')
}

printSummary()
