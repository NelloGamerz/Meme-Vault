import React from 'react';
import { Mail, Lock, User } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom'

export const RegisterForm: React.FC = () => {
  const { register, isLoading, error } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = React.useState({
    username: '',
    email: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await register(formData);
    
    navigate('/')
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        icon={User}
        type="text"
        name="name"
        placeholder="Full Name"
        value={formData.username}
        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
        required
        error={error?.name}
      />
      <Input
        icon={Mail}
        type="email"
        name="email"
        placeholder="Email Address"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        required
        error={error?.email}
      />
      <Input
        icon={Lock}
        type="password"
        name="password"
        placeholder="Password"
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        required
        error={error?.password}
      />

      <Button type="submit" className="w-full" isLoading={isLoading}>
        Create Account
      </Button>
    </form>
  );
};