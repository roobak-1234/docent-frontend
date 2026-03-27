import { get, post, put } from './Api';

export interface LeaveApplication {
  id?: number;
  username: string;
  staffType: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt?: string;
  approvedBy?: string;
  comments?: string;
}

class LeaveService {
  async applyLeave(leave: Omit<LeaveApplication, 'id' | 'status'>): Promise<any> {
    return await post('/api/Leave/Apply', { ...leave, status: 'Pending' });
  }

  async getMyLeaves(username: string): Promise<LeaveApplication[]> {
    return await get<LeaveApplication[]>(`/api/Leave/MyLeaves/${username}`);
  }

  async getPendingLeaves(): Promise<LeaveApplication[]> {
    return await get<LeaveApplication[]>('/api/Leave/Pending');
  }

  async reviewLeave(id: number, status: 'Approved' | 'Rejected', reviewer: string, comments?: string): Promise<any> {
    return await put(`/api/Leave/Review/${id}`, { status, reviewer, comments });
  }
}

export const leaveService = new LeaveService();
