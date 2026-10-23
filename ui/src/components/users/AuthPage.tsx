import React, { useState } from 'react'
import { Navigate } from 'react-router-dom'
import LoginForm from '@/components/users/LoginForm'
import RegisterForm from '@/components/users/RegisterForm'
import ForgotPasswordForm from '@/components/users/ForgotPasswordForm'
import ResetPasswordForm from '@/components/users/ResetPasswordForm'
import { useAuth } from '@/components/users/AuthContext'
import type { AuthTab } from '@/components/types'

/** Props for the account page; initialTab picks the tab it opens on. */
interface AuthPageProps {
  initialTab?: AuthTab;
}

const AuthPage: React.FC<AuthPageProps> = ({ initialTab = 'login' }) => {
  const [activeTab, setActiveTab] = useState<AuthTab>(initialTab)
  const [notice, setNotice] = useState('')
  const { isAuthenticated, login } = useAuth()
  
  const handleLoginSuccess = (token: string) => {
    login(token)
  }
  
  const handleRegisterSuccess = () => {
    setActiveTab('login')
  }

  const handlePasswordReset = () => {
    setNotice('Your password was changed. Log in with your new password.')
    setActiveTab('login')
  }

  const showTab = (tab: AuthTab) => {
    setNotice('')
    setActiveTab(tab)
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
              <li className={activeTab === 'register' ? '' : 'is-active'}>
                <a onClick={() => showTab('login')}>Login</a>
              </li>
              <li className={activeTab === 'register' ? 'is-active' : ''}>
                <a onClick={() => showTab('register')}>Register</a>
              </li>
            </ul>
          </div>

          {activeTab === 'login' && (
            <LoginForm onSuccess={handleLoginSuccess} onForgotPassword={() => showTab('forgotPassword')} notice={notice} />
          )}
          {activeTab === 'register' && <RegisterForm onSuccess={handleRegisterSuccess} />}
          {activeTab === 'forgotPassword' && <ForgotPasswordForm onBack={() => showTab('login')} />}
          {activeTab === 'resetPassword' && <ResetPasswordForm onSuccess={handlePasswordReset} onCancel={() => showTab('login')} />}
        </div>
      </div>
    </div>
  )
}

export default AuthPage
