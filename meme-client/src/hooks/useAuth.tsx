import { useState } from 'react';
// import { Navigate} from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

interface LoginData {
  username: string;
  password: string;
  rememberMe?: boolean;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
}

interface AuthError {
  username?: string;
  email?: string;
  password?: string;
  name?: string;
  message?: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export const useAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);

  const login = async (data: LoginData) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await axios.post(`${API_URL}/auth/login`, data);
      
      // Store the token in localStorage or a secure cookie
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data));
      
      // Store user data if provided by the API
      if (response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      toast.success('Successfully logged in!');
      return response.data;
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data.errors || { message: 'Login failed' });
        toast.error(err.response.data.message || 'Invalid username or password');
      } else {
        setError({ message: 'An unexpected error occurred' });
        toast.error('An unexpected error occurred');
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await axios.post(`${API_URL}/auth/register`, data);
  
      // Store the token in localStorage or a secure cookie
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data));
  
      // Store user data if provided by the API
      if (response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
  
      toast.success('Successfully registered!');
      return response.data;
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        const errorData = err.response.data;
        
        // If response follows { "username": "Username already exists", "token": null }
        const errorMessage = errorData.username || errorData.message || 'Registration failed';
  
        setError({ message: errorMessage });
        toast.error(errorMessage);
      } else {
        setError({ message: 'An unexpected error occurred' });
        toast.error('An unexpected error occurred');
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const requestPasswordReset = async (email: string) => {
    try {
      setIsLoading(true);
      setError(null);
  
      const response = await axios.post(`${API_URL}/auth/forgot-password`, { email });
  
      toast.success("Password reset link sent to your email!");
      return response.data;
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        const errorData = err.response.data;
        const errorMessage = errorData.message || "Failed to send reset link";
  
        setError({ message: errorMessage });
        toast.error(errorMessage);
      } else {
        setError({ message: "An unexpected error occurred" });
        toast.error("An unexpected error occurred");
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (password: string, token: string) => {
    if (!token) {
      throw new Error("Invalid or expired token");
    }

    try {
      // Make the API call using Axios
      const response = await axios.post(`${API_URL}/auth/reset-password`, {
        token,
        newPassword: password,
      });

      return response.data;
    } catch (error) {
      console.error("Password reset error:", error);

      // Extract error message from response if available
      const errorMessage = "Failed to reset password";
      throw new Error(errorMessage);
    }
  };

    

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('Successfully logged out!');
  };

  return {
    login,
    register,
    logout,
    requestPasswordReset,
    resetPassword,
    isLoading,
    error
  };
};