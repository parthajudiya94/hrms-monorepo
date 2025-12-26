import api from './api';
import { User, Role } from '../types';

export const createUser = async (
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  roleId: number
): Promise<{ user: User }> => {
  const response = await api.post<{ user: User }>('/users', {
    email,
    password,
    firstName,
    lastName,
    roleId,
  });
  return response.data;
};

export const getUsers = async (): Promise<{ users: User[] }> => {
  const response = await api.get<{ users: User[] }>('/users');
  return response.data;
};

export const getRoles = async (): Promise<{ roles: Role[] }> => {
  const response = await api.get<{ roles: Role[] }>('/users/roles');
  return response.data;
};

