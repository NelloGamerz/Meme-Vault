"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import toast from "react-hot-toast"
import { useMemeStore } from "../store/useMemeStore"

interface LoginData {
  username: string
  password: string
  rememberMe?: boolean
}

interface RegisterData {
  username: string
  email: string
  password: string
}

interface AuthError {
  username?: string
  email?: string
  password?: string
  name?: string
  message?: string
}

export const API_URL =
  import.meta.env.VITE_API_URL;

export const useAuthCheck = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  useEffect(() => {
    axios
      .get(`${API_URL}auth/me`, { withCredentials: true })
      .then(() => setIsAuthenticated(true))
      .catch(() => setIsAuthenticated(false))
  }, [])

  return isAuthenticated
}

const useAuth = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<AuthError | null>(null)

  const login = async (data: LoginData) => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await axios.post(`${API_URL}auth/login`, data, {
        withCredentials: true,
      })

      toast.success("Successfully logged in!")
      localStorage.setItem('user', JSON.stringify(response.data));
      useMemeStore.getState().connectWebSocket();
      return response.data
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data.errors || { message: "Login failed" })
        toast.error(err.response.data.message || "Invalid username or password")
      } else {
        setError({ message: "An unexpected error occurred" })
        toast.error("An unexpected error occurred")
      }
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (data: RegisterData) => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await axios.post(`${API_URL}auth/register`, data)

      toast.success("Successfully registered!")
      localStorage.setItem('user', JSON.stringify(response.data));
      useMemeStore.getState().connectWebSocket();
      return response.data
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        const errorData = err.response.data
        const errorMessage = errorData.username || errorData.message || "Registration failed"

        setError({ message: errorMessage })
        toast.error(errorMessage)
      } else {
        setError({ message: "An unexpected error occurred" })
        toast.error("An unexpected error occurred")
      }
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const requestPasswordReset = async (email: string) => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await axios.post(`${API_URL}auth/forgot-password`, { email })

      toast.success("Password reset link sent to your email!")
      return response.data
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        const errorData = err.response.data
        const errorMessage = errorData.message || "Failed to send reset link"

        setError({ message: errorMessage })
        toast.error(errorMessage)
      } else {
        setError({ message: "An unexpected error occurred" })
        toast.error("An unexpected error occurred")
      }
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const resetPassword = async (password: string, resetId: string) => {
    if (!resetId) {
      throw new Error("Invalid or expired token")
    }

    try {
      const response = await axios.post(`${API_URL}auth/reset-password`, {
        resetId,
        newPassword: password,
      })

      return response.data
    } catch (error) {
      console.error("Password reset error:", error)
      const errorMessage = "Failed to reset password"
      throw new Error(errorMessage)
    }
  }

  const checkUsernameAvailability = () => { }

  const logout = async () => {
  try {
    await axios.post(`${API_URL}auth/logout`, {}, {
      withCredentials: true,
    })

    localStorage.removeItem("user")
    useMemeStore.getState().disconnectWebSocket();
    toast.success("Successfully logged out!")
  } catch (error) {
    toast.error("Failed to log out. Please try again.")
    console.error("Logout error:", error)
  }
}

  return {
    login,
    register,
    logout,
    requestPasswordReset,
    resetPassword,
    checkUsernameAvailability,
    isLoading,
    error,
  }
}

export {useAuth}
