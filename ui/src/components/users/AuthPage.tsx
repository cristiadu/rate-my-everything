import React, { useState } from 'react';
import LoginForm from '@/components/users/LoginForm';
import RegisterForm from '@/components/users/RegisterForm';
import { useAuth } from '@/components/users/AuthContext';

const AuthPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const { login } = useAuth();
  
  const handleLoginSuccess = (token: string) => {
    login(token);
    // In a real app, you might redirect here
  };
  
  const handleRegisterSuccess = () => {
    setActiveTab('login');
  };

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
  );
};

export default AuthPage;