import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const userInfo = localStorage.getItem('userInfo');
  
  // 检查登录状态和用户信息
  if (!isLoggedIn || !userInfo) {
    // 清除可能存在的无效数据
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userInfo');
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('userId');
    
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

export default ProtectedRoute;