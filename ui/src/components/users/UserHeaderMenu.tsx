import React, { useState } from 'react'
import {
  Heading, Level, Form, Button,
} from 'react-bulma-components'
import { useAuth } from '@/components/users/AuthContext'
import { getUsernameFromToken } from '@/components/admin/RequireAdmin'
import { login as signIn } from '@/api/generated/api'

/** Page where a visitor creates their own account. */
export const SIGN_UP_PATH = '/register'

const UserHeaderMenu = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const {
    isAuthenticated, token, login, logout,
  } = useAuth()

  const handleLogin = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!username || !password) return

    setIsLoading(true)
    setError('')

    try {
      const { token: newToken } = await signIn({ username, password })
      login(newToken)
      setUsername('')
      setPassword('')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    // The bar spans the window while its content lines up with the header's title on wide screens
    <div className="has-background-grey-dark">
      <div className="container is-fullhd">
        <Level p={2} textColor="primary" className={isAuthenticated ? 'is-mobile' : 'user-bar-login'}>
          <Level.Side pr={2} align="left" className={isAuthenticated ? undefined : 'is-hidden-mobile'}>
            <Level.Item>
              <Heading
                size={6}
                subtitle
                textColor="white"
              >
                {isAuthenticated ? (
                  <>
                    Welcome,
                    {' '}
                    <strong className="has-text-danger">{getUsernameFromToken(token)}</strong>
                  </>
                ) : 'Welcome, visitor'}
              </Heading>
            </Level.Item>
          </Level.Side>

          {!isAuthenticated ? (
            <Level.Side align="right">
              <Level.Item>
                <Form.Field horizontal>
                  <Form.Field.Label className="is-align-items-center is-flex">
                    <Form.Label size="small" textColor="danger">
                      Username
                    </Form.Label>
                  </Form.Field.Label>
                  <Form.Field.Body>
                    <Form.Field>
                      <Form.Control>
                        <input
                          className="input is-small"
                          aria-label="Username"
                          placeholder="Username"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                        />
                      </Form.Control>
                    </Form.Field>
                  </Form.Field.Body>
                </Form.Field>
              </Level.Item>
              <Level.Item>
                <Form.Field horizontal>
                  <Form.Field.Label className="is-align-items-center is-flex">
                    <Form.Label size="small" textColor="danger">
                      Password
                    </Form.Label>
                  </Form.Field.Label>
                  <Form.Field.Body>
                    <Form.Field>
                      <Form.Control>
                        <input
                          className="input is-small"
                          aria-label="Password"
                          placeholder="Password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                      </Form.Control>
                    </Form.Field>
                  </Form.Field.Body>
                </Form.Field>
              </Level.Item>
              <Level.Item>
                <Button
                  size="small"
                  color="danger"
                  mr={2}
                  onClick={handleLogin}
                  loading={isLoading}
                >
                  Log In
                </Button>
                <a className="button is-small is-info" href={SIGN_UP_PATH}>New Account</a>
              </Level.Item>
              {error && (
                <Level.Item>
                  <div className="has-text-danger is-size-7">{error}</div>
                </Level.Item>
              )}
            </Level.Side>
          ) : (
            <Level.Side align="right">
              <Level.Item>
                <Button size="small" color="danger" onClick={logout}>Log Out</Button>
              </Level.Item>
            </Level.Side>
          )}
        </Level>
      </div>
    </div>
  )
}

export default UserHeaderMenu
