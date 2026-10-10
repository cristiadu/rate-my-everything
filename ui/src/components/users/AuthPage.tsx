import React, { useState } from 'react'
import { type Location, Navigate, useLocation } from 'react-router-dom'
import LoginForm from '@/components/users/LoginForm'
import RegisterForm from '@/components/users/RegisterForm'
import { useAuth } from '@/components/users/AuthContext'

const AuthPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login')
  const { isAuthenticated, login } = useAuth()
  const location = useLocation()

  const handleLoginSuccess = (token: string) => {
    login(token)
  }

  const handleRegisterSuccess = () => {
    setActiveTab('login')
  }

  // Send the user back to the page that required a login, or to their own area.
  if (isAuthenticated) {
    const from = (location.state as { from?: Location } | null)?.from
    return <Navigate to={from?.pathname ?? '/account'} replace />
  }

  return (
    <div className="container">
      <div className="columns is-centered">
        <div className="column is-half">
          <div className="tabs">
            <ul>
              <li className={activeTab === 'login' ? 'is-active' : ''}>
                <a onClick={() => setActiveTab('login')}>Login</a>
              </li>
              <li className={activeTab === 'register' ? 'is-active' : ''}>
                <a onClick={() => setActiveTab('register')}>Register</a>
              </li>
            </ul>
          </div>

          {activeTab === 'login' ? (
            <LoginForm onSuccess={handleLoginSuccess} />
          ) : (
            <RegisterForm onSuccess={handleRegisterSuccess} />
          )}
        </div>
      </div>
    </div>
  )
}

export default AuthPage
