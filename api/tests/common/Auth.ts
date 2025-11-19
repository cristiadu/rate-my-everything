import fs from 'fs'
import path from 'path'
import os from 'os'

const TMP_TOKEN_PATH = path.resolve(__dirname, '../../tmp/auth-token.txt')

// Helper to write token to ./tmp/auth-token.txt
export const writeAuthTokenToFile = (token: string) => {
  const tmpDir = path.resolve(__dirname, '../../tmp')
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir)
  fs.writeFileSync(TMP_TOKEN_PATH, token + os.EOL)
  console.log('Authentication token written to file:', TMP_TOKEN_PATH)
}

// Helper to read token from ./tmp/auth-token.txt
export const getAuthTokenFromFile = (): Promise<string> => {
  return new Promise((resolve) => {
    fs.readFile(TMP_TOKEN_PATH, 'utf-8', (_err, data) => {
      resolve(data.trim())
    })
  })
}