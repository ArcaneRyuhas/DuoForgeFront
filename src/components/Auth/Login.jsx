import React, { useState } from 'react';
import { authenticateUser } from '../../api/session';
import './Login.css';

const Login = ({ onAuthSuccess }) => {
    const [isLoginMode, setIsLoginMode] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: ''
    });
    const [errors, setErrors] = useState({});

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.username) {
            newErrors.username = 'Username is required';
        } else if (formData.username.length < 3) {
            newErrors.username = 'Username must be at least 3 characters';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        if (!isLoginMode) {
            if (!formData.email) {
                newErrors.email = 'Email is required';
            } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
                newErrors.email = 'Please enter a valid email';
            }
            if (!formData.firstName) {
                newErrors.firstName = 'First name is required';
            }
            if (!formData.lastName) {
                newErrors.lastName = 'Last name is required';
            }
            if (!formData.confirmPassword) {
                newErrors.confirmPassword = 'Please confirm your password';
            } else if (formData.password !== formData.confirmPassword) {
                newErrors.confirmPassword = 'Passwords do not match';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        setIsLoading(true);

        try {
            const user = await authenticateUser(formData.username, formData.password);

            if (onAuthSuccess) {
                onAuthSuccess(user);
            }
        } catch (error) {
            setErrors({ submit: 'Authentication failed. Please try again.' });
        } finally {
            setIsLoading(false);
        }
    };

    const toggleMode = () => {
        setIsLoginMode(!isLoginMode);
        setErrors({});
        setFormData({
            email: '',
            password: '',
            confirmPassword: '',
            firstName: '',
            lastName: ''
        });
    };

    return (
        <div className="auth-wrapper">
            <div className="auth-nav">
                <div>InfyCode</div>
                <div className="auth-profile"></div>
            </div>
            
            <div className="auth-container">
                <div className="auth-welcome-section">
                    <h1 className="auth-greet">
                        {isLoginMode ? 'Welcome' : 'Join'} <span>back!</span>
                    </h1>
                </div>
                
                <div className="auth-card">
                    <div className="auth-tabs">
                        <button 
                            className={`auth-tab ${isLoginMode ? 'active' : ''}`}
                            onClick={() => setIsLoginMode(true)}
                            type="button"
                        >
                            Sign In
                        </button>
                        <button 
                            className={`auth-tab ${!isLoginMode ? 'active' : ''}`}
                            onClick={() => setIsLoginMode(false)}
                            type="button"
                        >
                            Sign Up
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="auth-form">
                        {!isLoginMode && (
                            <div className="auth-row">
                                <div className="auth-input-group">
                                    <label htmlFor="firstName">First Name</label>
                                    <input
                                        type="text"
                                        id="firstName"
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleInputChange}
                                        className={errors.firstName ? 'error' : ''}
                                        placeholder="Enter your first name"
                                        disabled={isLoading}
                                    />
                                    {errors.firstName && <span className="error-text">{errors.firstName}</span>}
                                </div>
                                <div className="auth-input-group">
                                    <label htmlFor="lastName">Last Name</label>
                                    <input
                                        type="text"
                                        id="lastName"
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleInputChange}
                                        className={errors.lastName ? 'error' : ''}
                                        placeholder="Enter your last name"
                                        disabled={isLoading}
                                    />
                                    {errors.lastName && <span className="error-text">{errors.lastName}</span>}
                                </div>
                            </div>
                        )}

                        <div className="auth-input-group">
                            <label htmlFor="email">Username</label>
                            <input
                                type="username"
                                id="username"
                                name="username"
                                value={formData.username}
                                onChange={handleInputChange}
                                className={errors.username ? 'error' : ''}
                                placeholder="Enter your username"
                                disabled={isLoading}
                            />
                            {errors.username && <span className="error-text">{errors.username}</span>}
                        </div>

                        <div className="auth-input-group">
                            <label htmlFor="password">Password</label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                className={errors.password ? 'error' : ''}
                                placeholder="Enter your password"
                                disabled={isLoading}
                            />
                            {errors.password && <span className="error-text">{errors.password}</span>}
                        </div>

                        {!isLoginMode && (
                            <div className="auth-input-group">
                                <label htmlFor="confirmPassword">Confirm Password</label>
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleInputChange}
                                    className={errors.confirmPassword ? 'error' : ''}
                                    placeholder="Confirm your password"
                                    disabled={isLoading}
                                />
                                {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
                            </div>
                        )}

                        {errors.submit && (
                            <div className="auth-error-banner">
                                {errors.submit}
                            </div>
                        )}

                        <button 
                            type="submit" 
                            className="auth-submit-btn"
                            disabled={isLoading}
                        >
                            <span>{isLoading ? (isLoginMode ? 'Signing in...' : 'Creating account...') : (isLoginMode ? 'Sign In' : 'Create Account')}</span>
                            {!isLoading && (
                                <div className="auth-icon-container">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M5 12h14"></path>
                                        <path d="m12 5 7 7-7 7"></path>
                                    </svg>
                                </div>
                            )}
                        </button>

                        <div 
                            className={`auth-progress-bar ${isLoading ? "animate-progress" : ''}`} 
                            style={{ width: isLoading ? '100%' : '0' }}
                        ></div>
                    </form>

                    <div className="auth-switch">
                        <p>
                            {isLoginMode ? "Don't have an account? " : "Already have an account? "}
                            <button 
                                type="button" 
                                onClick={toggleMode} 
                                className="auth-switch-btn"
                                disabled={isLoading}
                            >
                                {isLoginMode ? 'Sign up' : 'Sign in'}
                            </button>
                        </p>
                    </div>
                </div>
                
                <div className="auth-alternative-actions">
                    <button className="auth-alt-btn" type="button" disabled={isLoading}>Forgot Password?</button>
                    <button className="auth-alt-btn" type="button" disabled={isLoading}>Help</button>
                </div>
            </div>
            
            <div className="auth-bottom-info">
                © {new Date().getFullYear()} InfyCode. All rights reserved.
            </div>
        </div>
    );
};

export default Login;