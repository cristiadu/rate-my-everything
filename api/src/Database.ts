import { DataSource } from 'typeorm'
import dotenv from 'dotenv'
import path from 'path'
import RatedItem from '@/models/RatedItem'
import Item from '@/models/Item'
import User from '@/models/User'
import Attribute from '@/models/Attribute'
import AttributeValue from '@/models/AttributeValue'
import Category from '@/models/Category'
import ChangeRequest from '@/models/ChangeRequest'
import Comment from '@/models/Comment'

/*
 * The database connection lives apart from index.ts so services can use it without importing the app and its generated
 * routes, which would make the OpenAPI spec's order depend on the previously generated routes.
 */

/** Postgres port used when neither PGPORT nor DATABASE_PORT is set. */
const DEFAULT_DATABASE_PORT = 5432

/** How long to wait for a database connection, in milliseconds. */
const DATABASE_CONNECT_TIMEOUT_MS = 10000

/** Most database connections the pool keeps open. */
const DATABASE_POOL_SIZE = 10

if (process.env.NODE_ENV === 'test') {
  dotenv.config({
    path: path.resolve(__dirname, '../.env.test'),
    override: true
  })
} else {
  dotenv.config({ path: path.resolve(__dirname, '../.env') })
}

export const DBConnection: DataSource = new DataSource({
  name: 'default',
  type: 'postgres',
  host: process.env.PGHOST || process.env.DATABASE_HOST,
  port: Number(process.env.PGPORT || process.env.DATABASE_PORT || DEFAULT_DATABASE_PORT),
  username: process.env.PGUSER || process.env.DATABASE_USERNAME,
  password: process.env.PGPASSWORD || process.env.DATABASE_PASSWORD,
  database: process.env.PGDATABASE || process.env.DATABASE_NAME,
  entities: [RatedItem, Item, User, Attribute, AttributeValue, Category, ChangeRequest, Comment],
  synchronize: true,
  connectTimeoutMS: DATABASE_CONNECT_TIMEOUT_MS,
  extra: {
    max: DATABASE_POOL_SIZE,
    connectionTimeoutMillis: DATABASE_CONNECT_TIMEOUT_MS,
  }
})

