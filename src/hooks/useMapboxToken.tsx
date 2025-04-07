
import { useState, useEffect } from 'react';

const STORAGE_KEY = 'mapbox_access_token';
const DEFAULT_TOKEN = 'pk.eyJ1Ijoid292ZW53ZWIiLCJhIjoiY205N2IxeHM3MDVrczJscG9qbTQ0c2ZrZSJ9.hTV-N1S_KisyXQ_QNiFb5A';

export const useMapboxToken = () => {
  const [token, setToken] = useState<string>(() => {
    // Try to get token from localStorage or use default
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_TOKEN;
  });

  const [isValid, setIsValid] = useState<boolean>(!!token);

  useEffect(() => {
    // When token changes, save to localStorage and reset validity
    if (token) {
      localStorage.setItem(STORAGE_KEY, token);
      setIsValid(true);
    }
  }, [token]);

  const validateToken = async (token: string): Promise<boolean> => {
    try {
      // Simple validation by trying to access the Mapbox API
      const response = await fetch(
        `https://api.mapbox.com/styles/v1/mapbox/streets-v12?access_token=${token}`
      );
      const isValid = response.ok;
      setIsValid(isValid);
      return isValid;
    } catch (error) {
      console.error('Error validating Mapbox token:', error);
      setIsValid(false);
      return false;
    }
  };

  const clearToken = () => {
    localStorage.removeItem(STORAGE_KEY);
    setToken('');
    setIsValid(false);
  };

  return {
    token,
    setToken,
    isValid,
    validateToken,
    clearToken
  };
};
