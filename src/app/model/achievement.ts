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
  createdAt: string; 
  mainCriterion: string;
  subCriterion: string;
  attachments: string[];
  comments?: string;
  status: "pending" | "approved" | "rejected" | "draft";
}

export interface Activity {
  _id?: string;
  user: { _id?: string; name?: string } | string;
  activityTitle: string;
  activityDescription: string;
  MainCriteria: { _id?: string; name?: string } | string;
  SubCriteria: { _id?: string; name?: string } | string;
  department?: { _id?: string; name?: string } | string;
  status: 'مرفوض' | 'قيد المراجعة' | 'معتمد' | string;
  SaveStatus: 'مسودة' | 'مكتمل';
  Attachments: string[];
  name?: string;
  date?: Date;
  createdAt?: Date;
  updatedAt?: Date;

  // إضافة خاصية generatedFiles
  generatedFiles?: {
    pdf?: string;
    docx?: string;
  };
}


