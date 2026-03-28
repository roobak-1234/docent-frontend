import { get, post } from './Api';

export interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  phone?: string;
  doctorId?: string;
  uniqueDoctorId?: string;
  userType: 'doctor' | 'patient' | 'nurse' | 'staff';
  country?: string;
  medicalId?: string;
  staffType?: string;
  shift?: 'Morning' | 'Evening' | 'Night';
  vehicleNumber?: string;
  junctionId?: string;
  badgeNumber?: string;
  assignedPatientIds?: string[];
  specialization?: string;
  permissions?: {
    canAccessPatientData?: boolean;
  };
  createdAt: string;
  isOnline?: boolean;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: Omit<User, 'password'>;
}

class AuthService {
  private users: User[] = [];
  private currentUser: Omit<User, 'password'> | null = null;

  constructor() {
    this.loadUsers();
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<AuthResponse> {
    if (process.env.REACT_APP_API_URL) {
      try {
        const result = await post<AuthResponse>(`/api/auth/update/${userId}`, updates);
        if (result.success && result.user) {
          localStorage.setItem('docent_current_user', JSON.stringify(result.user));
          this.currentUser = result.user;
        }
        return result;
      } catch (e) {
        console.error("Failed to update user in backend", e);
      }
    }

    const userIndex = this.users.findIndex(u => u.id === userId);
    if (userIndex === -1) return { success: false, message: 'User not found' };

    this.users[userIndex] = { ...this.users[userIndex], ...updates };
    this.saveUsers();

    if (this.currentUser && this.currentUser.id === userId) {
      const { password, ...userWithoutPassword } = this.users[userIndex];
      this.currentUser = userWithoutPassword;
      localStorage.setItem('docent_current_user', JSON.stringify(this.currentUser));
    }

    return { success: true, message: 'Profile updated successfully', user: this.currentUser || undefined };
  }

  public loadUsers() {
    try {
      const stored = localStorage.getItem('docent_users');
      if (stored) {
        this.users = JSON.parse(stored);
      }
    } catch (e) {
      console.error("Failed to load users", e);
      this.users = [];
    }
  }

  private saveUsers() {
    try {
      localStorage.setItem('docent_users', JSON.stringify(this.users));
    } catch (e) {
      console.error("Failed to save users", e);
    }
  }

  async signup(userData: {
    username: string;
    email: string;
    password: string;
    phone?: string;
    doctorId?: string;
    userType: 'doctor' | 'patient' | 'nurse' | 'staff';
    country?: string;
    medicalId?: string;
    staffType?: string;
    shift?: 'Morning' | 'Evening' | 'Night';
    vehicleNumber?: string;
    junctionId?: string;
    badgeNumber?: string;
  }): Promise<AuthResponse> {
    // if backend URL is provided, send request there
    if (process.env.REACT_APP_API_URL) {
      try {
        const result = await post<AuthResponse>('/api/auth/signup', userData);
        return result;
      } catch (e) {
        return { success: false, message: (e as Error).message };
      }
    }

    const existingUser = this.users.find(
      u => u.username === userData.username || u.email === userData.email
    );

    if (existingUser) {
      return {
        success: false,
        message: 'Username or email already exists'
      };
    }

    let uniqueDoctorId: string | undefined;
    if (userData.userType === 'doctor') {
      uniqueDoctorId = this.generateUniqueDoctorId();
    }

    if ((userData.userType === 'patient' || userData.userType === 'nurse' || userData.userType === 'staff') && userData.doctorId) {
      if (userData.userType === 'patient') {
        const doctorExists = this.users.find(
          u => u.userType === 'doctor' && u.uniqueDoctorId === userData.doctorId
        );
        if (!doctorExists) {
          return {
            success: false,
            message: 'Invalid doctor ID'
          };
        }
      } else {
        // For nurses and staff, validate hospital ID
        const hospitals = JSON.parse(localStorage.getItem('registered_hospitals') || '[]');
        const hospitalExists = hospitals.find((h: any) => h.uniqueHospitalId === userData.doctorId);
        if (!hospitalExists) {
          return {
            success: false,
            message: 'Invalid hospital ID'
          };
        }
      }
    }

    const newUser: User = {
      id: Date.now().toString(),
      ...userData,
      uniqueDoctorId,
      createdAt: new Date().toISOString()
    };

    this.users.push(newUser);
    this.saveUsers();

    // Don't auto-login after signup
    return {
      success: true,
      message: 'Account created successfully'
    };
  }

  // Updated to accept an object to match SigninPage usage and generic credential check
  async signin(credentials: { username: string; password: string }): Promise<AuthResponse> {
    if (process.env.REACT_APP_API_URL) {
      try {
        const result = await post<AuthResponse>('/api/auth/signin', credentials);
        if (result.success && result.user) {
          localStorage.setItem('docent_current_user', JSON.stringify(result.user));
          this.currentUser = result.user;
        }
        return result;
      } catch (e) {
        return { success: false, message: (e as Error).message };
      }
    }

    const user = this.users.find(
      u => (u.username === credentials.username || u.email === credentials.username) && u.password === credentials.password
    );

    if (!user) {
      return {
        success: false,
        message: 'Invalid credentials'
      };
    }

    // Set online status
    const userIndex = this.users.findIndex(u => u.id === user.id);
    if (userIndex !== -1) {
      this.users[userIndex].isOnline = true;
      this.saveUsers();
    }

    const { password: _, ...userWithoutPassword } = this.users[userIndex]; // Use updated user object
    this.currentUser = userWithoutPassword;
    localStorage.setItem('docent_current_user', JSON.stringify(this.currentUser));

    return {
      success: true,
      message: 'Signed in successfully',
      user: userWithoutPassword
    };
  }

  getCurrentUser(): Omit<User, 'password'> | null {
    if (!this.currentUser) {
      const stored = localStorage.getItem('docent_current_user');
      if (stored) {
        try {
          this.currentUser = JSON.parse(stored);
        } catch (e) {
          this.currentUser = null;
        }
      }
    }
    return this.currentUser;
  }

  async resetPassword(username: string, userType: 'doctor' | 'patient' | 'nurse' | 'staff', newPassword: string): Promise<AuthResponse> {
    const userIndex = this.users.findIndex(
      u => u.username === username && u.userType === userType
    );

    if (userIndex === -1) {
      return {
        success: false,
        message: 'User not found'
      };
    }

    // Update password
    this.users[userIndex].password = newPassword;
    this.saveUsers();

    return {
      success: true,
      message: 'Password reset successfully'
    };
  }

  signout() {
    if (this.currentUser) {
      const userIndex = this.users.findIndex(u => u.id === this.currentUser?.id);
      if (userIndex !== -1) {
        this.users[userIndex].isOnline = false;
        this.saveUsers();
      }
    }
    this.currentUser = null;
    localStorage.removeItem('docent_current_user');
  }

  // Force refresh current user data
  refreshCurrentUser() {
    const stored = localStorage.getItem('docent_current_user');
    if (stored) {
      try {
        this.currentUser = JSON.parse(stored);
      } catch (e) {
        this.currentUser = null;
      }
    }
  }

  private generateUniqueDoctorId(): string {
    const prefix = 'DR';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}-${timestamp}-${random}`;
  }

  private addDoctorIdToExistingUser(userId: string): Omit<User, 'password'> | null {
    const userIndex = this.users.findIndex(u => u.id === userId);
    if (userIndex !== -1 && this.users[userIndex].userType === 'doctor' && !this.users[userIndex].uniqueDoctorId) {
      this.users[userIndex].uniqueDoctorId = this.generateUniqueDoctorId();
      this.saveUsers();
      const { password, ...userWithoutPassword } = this.users[userIndex];
      return userWithoutPassword;
    }
    return null;
  }

  async getPatientsByDoctorId(doctorId: string): Promise<Omit<User, 'password'>[]> {
    if (process.env.REACT_APP_API_URL) {
      try {
        const patients = await get<Omit<User, 'password'>[]>(`/api/auth/patients/${doctorId}`);
        return patients;
      } catch (e) {
        console.error("Failed to fetch patients from backend", e);
        // Fallback to local storage if API fails
      }
    }

    return this.users
      .filter(u => u.userType === 'patient' && u.doctorId === doctorId)
      .map(({ password, ...user }) => user);
  }

  deleteUser(userId: string): void {
    this.users = this.users.filter(u => u.id !== userId);
    this.saveUsers();

    if (this.currentUser && this.currentUser.id === userId) {
      this.currentUser = null;
      localStorage.removeItem('docent_current_user');
    }
  }

  async getHospitalStaff(hospitalId: string): Promise<Omit<User, 'password'>[]> {
    if (process.env.REACT_APP_API_URL) {
      try {
        const staff = await get<Omit<User, 'password'>[]>(`/api/hospital/staff/${hospitalId}`);
        return staff;
      } catch (e) {
        console.error("Failed to fetch hospital staff from backend", e);
      }
    }

    return this.users
      .filter(u =>
        (u.userType === 'nurse' || u.userType === 'staff') &&
        u.doctorId === hospitalId
      )
      .map(({ password, ...user }) => user);
  }

  async getAllDoctors(): Promise<Omit<User, 'password'>[]> {
    if (process.env.REACT_APP_API_URL) {
      try {
        const doctors = await get<Omit<User, 'password'>[]>('/api/auth/doctors');
        return doctors;
      } catch (e) {
        console.error("Failed to fetch doctors from backend", e);
      }
    }

    return this.users
      .filter(u => u.userType === 'doctor' && u.uniqueDoctorId)
      .map(({ password, ...user }) => user);
  }

  async getDoctorByUniqueId(uniqueId: string): Promise<Omit<User, 'password'> | null> {
    if (process.env.REACT_APP_API_URL) {
      try {
        const doctors = await this.getAllDoctors();
        return doctors.find(d => d.uniqueDoctorId === uniqueId) || null;
      } catch (e) {
        console.error("Failed to find doctor in backend list", e);
      }
    }

    return this.users.find(u => u.userType === 'doctor' && u.uniqueDoctorId === uniqueId) || null;
  }

  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }
}

export const authService = new AuthService();