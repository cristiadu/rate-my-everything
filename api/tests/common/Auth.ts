import fs from 'fs'
import path from 'path'
import os from 'os'

// Helper to write token to ./tmp/auth-token.txt
export const writeAuthTokenToFile = (token: string) => {
  const tmpDir = path.resolve(__dirname, '../../tmp')
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir)
  fs.writeFileSync(path.join(tmpDir, 'auth-token.txt'), token + os.EOL)
  console.log('Authentication token written to ./tmp/auth-token.txt:', token)
}

export const getAuthTokenFromFile = (): Promise<string> => {
  return new Promise((resolve) => {
    const tokenPath = path.resolve(__dirname, '../../tmp/auth-token.txt')
    fs.readFile(tokenPath, 'utf-8', (_err, data) => {
      resolve(data.trim())
    })
  })
}