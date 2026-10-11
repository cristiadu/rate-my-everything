import { ValueTransformer } from 'typeorm'

/** Postgres returns decimal columns as strings; reads them back as numbers. */
export const decimalToNumber: ValueTransformer = {
  to: (value: number) => value,
  from: (value: string | null) => (value === null ? null : parseFloat(value)),
}
