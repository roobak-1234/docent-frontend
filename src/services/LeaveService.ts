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
  async applyLeave(leave: Omit<LeaveApplication, 'id' | 'status'>): Promise<void> {
    await post('/api/Leave/Apply', leave);
  }

  async getMyLeaves(username: string): Promise<LeaveApplication[]> {
    return await get<LeaveApplication[]>(`/api/Leave/MyLeaves/${encodeURIComponent(username)}`);
  }

  async getPendingLeaves(requester: string): Promise<LeaveApplication[]> {
    return await get<LeaveApplication[]>(`/api/Leave/Pending?requester=${encodeURIComponent(requester)}`);
  }

  async getAllLeaves(requester: string): Promise<LeaveApplication[]> {
    return await get<LeaveApplication[]>(`/api/Leave/All?requester=${encodeURIComponent(requester)}`);
  }

  async reviewLeave(id: number, status: 'Approved' | 'Rejected', reviewer: string, comments?: string): Promise<void> {
    await put(`/api/Leave/Review/${id}`, { status, reviewer, comments: comments || '' });
  }
}

export const leaveService = new LeaveService();
