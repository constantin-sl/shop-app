import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function LogoutButton() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <button 
      onClick={handleLogout}
      style={{
        marginLeft: '20px',
        padding: '8px 16px',
        background: '#ff4444',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer'
      }}
    >
      Выйти
    </button>
  );
}
