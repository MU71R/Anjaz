// src/app/models/achievement.model.ts
export interface User {
  id: string;
  role: 'admin' | 'user' | string;
  name?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  userId: string;
  userName: string;
  department: string;
  createdAt: string; // ISO date
  mainCriterion: string;
  subCriterion: string;
  attachments: string[];
  comments?: string;
  status: "pending" | "approved" | "rejected" | "draft";
}

// src/app/model/achievement.ts
export interface Activity {
  _id?: string;
  user: string; // ObjectId
  activityTitle: string;
  activityDescription: string;
  MainCriteria: string; // ObjectId
  SubCriteria: string; // ObjectId
  status: 'مرفوض' | 'قيد المراجعة' | 'معتمد';
  SaveStatus: 'مسودة' | 'مكتمل';
  Attachments: string[];
  name: string;
  date?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

