// في ملف notification.model.ts
export interface Notification {
  _id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  read: boolean;

  // الخصائص الجديدة من الباك إند
  targetRole?: string;
  activity?: string;
  createdAt?: string;
  updatedAt?: string;
  seen?: boolean;
  __v?: number;
}
