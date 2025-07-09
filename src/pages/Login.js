import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import './Login.css';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    // 如果已经登录，直接跳转到工序选择页面
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (isLoggedIn === 'true') {
      navigate('/process-selection', { replace: true });
    }
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // 清除对应字段的错误信息
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.username.trim()) {
      newErrors.username = '请输入用户名';
    }
    
    if (!formData.password.trim()) {
      newErrors.password = '请输入密码';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});
    
    try {
      // 调用真实的登录API
      const response = await authAPI.login(formData.username, formData.password);
      
      console.log('登录响应:', response.data);
      
      // 检查响应结果
      if (response.data && response.data.success) {
        // 登录成功
        const userData = response.data.data;
        
        // 保存用户信息到localStorage
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('username', userData.username || formData.username);
        localStorage.setItem('userId', userData.userId || userData.id || '');
        localStorage.setItem('userInfo', JSON.stringify(userData));
        localStorage.setItem('loginTime', new Date().toISOString());
        
        // 如果有token，也保存起来
        if (userData.token) {
          localStorage.setItem('token', userData.token);
        }
        
        console.log('登录成功，跳转到工序选择页面');
        navigate('/process-selection', { replace: true });
      } else {
        // 登录失败
        const errorMessage = response.data?.message || response.data?.reason?.errMsg || '登录失败';
        setErrors({ general: errorMessage });
      }
    } catch (error) {
      console.error('登录错误:', error);
      
      // 处理不同类型的错误
      let errorMessage = '登录失败，请重试';
      
      if (typeof error === 'string') {
        errorMessage = error;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      setErrors({ general: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-background">
        <div className="login-form-wrapper">
          <div className="login-header">
            <h1 className="login-title">工序管理系统</h1>
            <p className="login-subtitle">请登录您的账户</p>
          </div>
          
          <form className="login-form" onSubmit={handleLogin}>
            {errors.general && (
              <div className="error-message">
                {errors.general}
              </div>
            )}
            
            <div className="form-group">
              <label className="form-label">用户名</label>
              <input
                type="text"
                name="username"
                className={`form-input ${errors.username ? 'error' : ''}`}
                value={formData.username}
                onChange={handleInputChange}
                placeholder="请输入用户名"
                autoComplete="username"
                disabled={loading}
              />
              {errors.username && (
                <div className="field-error">{errors.username}</div>
              )}
            </div>
            
            <div className="form-group">
              <label className="form-label">密码</label>
              <input
                type="password"
                name="password"
                className={`form-input ${errors.password ? 'error' : ''}`}
                value={formData.password}
                onChange={handleInputChange}
                placeholder="请输入密码"
                autoComplete="current-password"
                disabled={loading}
              />
              {errors.password && (
                <div className="field-error">{errors.password}</div>
              )}
            </div>
            
            <button 
              type="submit" 
              className="btn btn-primary btn-block login-btn"
              disabled={loading}
            >
              {loading ? '登录中...' : '登录'}
            </button>
          </form>
          
          <div className="login-tips">
            <p>请使用您的系统账户登录</p>
            <p className="api-info">API地址: http://175.24.15.119:10019</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;