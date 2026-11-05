import pg from 'pg'

const { Pool } = pg

export const database = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : null
