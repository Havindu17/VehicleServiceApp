import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const api = axios.create({
  baseURL: Platform.OS === 'android'
    ? 'http://10.0.2.2:5000/api'
    : 'http://192.168.1.9:5000/api',
  timeout: 10000,
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
