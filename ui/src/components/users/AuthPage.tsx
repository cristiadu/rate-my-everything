import React, { useState } from 'react'
import { Navigate } from 'react-router-dom'
import LoginForm from '@/components/users/LoginForm'
import RegisterForm from '@/components/users/RegisterForm'
import { useAuth } from '@/components/users/AuthContext'
import type { AuthTab } from '@/components/types'

/** Props for the account page; initialTab picks the tab it opens on. */
interface AuthPageProps {
  initialTab?: AuthTab;
}

const AuthPage: React.FC<AuthPageProps> = ({ initialTab = 'login' }) => {
  const [activeTab, setActiveTab] = useState<AuthTab>(initialTab)
  const { isAuthenticated, login } = useAuth()
  
  const handleLoginSuccess = (token: string) => {
    login(token)
  }
  
  const handleRegisterSuccess = () => {
    setActiveTab('login')
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />
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
