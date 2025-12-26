import api from './api';
import { TimeTrackingStatus } from '../types';

export const clockIn = async (): Promise<{ message: string; timestamp: string }> => {
  const response = await api.post<{ message: string; timestamp: string }>('/time-tracking/clock-in');
  return response.data;
};

export const clockOut = async (): Promise<{ message: string; timestamp: string; totalWorkHours: string }> => {
  const response = await api.post<{ message: string; timestamp: string; totalWorkHours: string }>('/time-tracking/clock-out');
  return response.data;
};

export const breakIn = async (): Promise<{ message: string; timestamp: string }> => {
  const response = await api.post<{ message: string; timestamp: string }>('/time-tracking/break-in');
  return response.data;
};

export const breakOut = async (): Promise<{ message: string; timestamp: string; breakHours: string }> => {
  const response = await api.post<{ message: string; timestamp: string; breakHours: string }>('/time-tracking/break-out');
  return response.data;
};

export const getTodayStatus = async (): Promise<TimeTrackingStatus> => {
  const response = await api.get<TimeTrackingStatus>('/time-tracking/today');
  return response.data;
};

