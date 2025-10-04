import React, { useState } from 'react';
import ApiConfig from '../../config/ApiConfig';

interface LoginFormProps {
  onSuccess: (token: string) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${ApiConfig.API_URL}${ApiConfig.ENDPOINTS.LOGIN}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to login');
      }

      localStorage.setItem('authToken', data.token);
      onSuccess(data.token);
    } catch (err: any) {
      setError(err.message || 'An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="box">
      <h2 className="title is-4">Login</h2>
      {error && <div className="notification is-danger">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label className="label">Username</label>
          <div className="control">
            <input
              className="input"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="field">
          <label className="label">Password</label>
          <div className="control">
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="field">
          <div className="control">
            <button
              className={`button is-primary ${isLoading ? 'is-loading' : ''}`}
              type="submit"
              disabled={isLoading}
            >
              Login
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;