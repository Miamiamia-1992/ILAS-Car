import { Vehicle, Reservation, UnavailableDate } from '../types';

const API_BASE = 'https://ilas-car.onrender.com/api';

export const api = {
  vehicles: {
    getAll: async (): Promise<Vehicle[]> => {
      const res = await fetch(`${API_BASE}/vehicles`);
      return res.json();
    },
    getUnavailable: async (vehicleId: number): Promise<UnavailableDate[]> => {
      const res = await fetch(`${API_BASE}/vehicles/${vehicleId}/unavailable`);
      return res.json();
    }
  },

  reservations: {
    getAll: async (): Promise<Reservation[]> => {
      const res = await fetch(`${API_BASE}/reservations`);
      return res.json();
    },
    getByVehicleAndDate: async (vehicleId: number, date: string): Promise<Reservation[]> => {
      const res = await fetch(`${API_BASE}/reservations/${vehicleId}/${date}`);
      return res.json();
    },
    create: async (data: {
      vehicleId: number;
      date: string;
      startTime: string;
      endTime: string;
      personName: string;
      phone: string;
      reason: string;
    }): Promise<{ success: boolean; id?: number; message: string }> => {
      const res = await fetch(`${API_BASE}/reservations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return res.json();
    },
    updateStatus: async (id: number, status: string, token: string): Promise<{ success: boolean }> => {
      const res = await fetch(`${API_BASE}/reservations/${id}/status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({ status })
      });
      return res.json();
    },
    delete: async (id: number, token: string): Promise<{ success: boolean }> => {
      const res = await fetch(`${API_BASE}/reservations/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': token }
      });
      return res.json();
    }
  },

  unavailable: {
    getAll: async (token: string): Promise<UnavailableDate[]> => {
      const res = await fetch(`${API_BASE}/unavailable`, {
        headers: { 'Authorization': token }
      });
      return res.json();
    },
    create: async (data: { vehicleId: number; date: string; reason?: string }, token: string): Promise<{ success: boolean; message?: string }> => {
      const res = await fetch(`${API_BASE}/unavailable`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify(data)
      });
      return res.json();
    },
    delete: async (id: number, token: string): Promise<{ success: boolean }> => {
      const res = await fetch(`${API_BASE}/unavailable/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': token }
      });
      return res.json();
    }
  },

  auth: {
    login: async (password: string): Promise<{ success: boolean; token?: string; message?: string }> => {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      return res.json();
    },
    logout: async (): Promise<{ success: boolean }> => {
      const res = await fetch(`${API_BASE}/auth/logout`, { method: 'POST' });
      return res.json();
    }
  }
};
