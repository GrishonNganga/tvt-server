export interface LoginRequest {
    email: string;
    password: string;
  }
  
  export interface SignupRequest {
    email: string;
    password: string;
    name?: string;
  }
  
  export interface AuthResponse {
    token: string;
    user: {
      id: number;
      email: string;
      name: string | null;
      role: 'USER' | 'ADMIN';
    };
  }
  