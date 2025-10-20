export interface LoginCredentials {
  username: string;
  password: string;
}

export interface User {
  _id: string;
  username: string;
  fullname: string; 
  role: 'admin' | 'user' | string;
  sector: string;
  status: 'active' | 'inactive'; 
  department?: string;
  password?: string;
}

export interface LoginResponse {
  token: string;
  user?: User;
}

export interface DecodedToken {
  userId: string;
  name?: string;
  email?: string;
  role?: string;
  exp?: number;
  iat?: number;
}

export interface Department {
  _id?: string;
  username: string;
  fullname: string;
  password: string;
  role: 'user' | 'admin';
  sector: string;
}


export interface Sector {
  _id?: string;
  sector: string;
}

