export interface User {
  id: number;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface Form {
  id: number;
  title: string;
  description: string | null;
  status: 'draft' | 'published';
  isPublic: boolean;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  questions?: Question[];
  responseCount?: number;
  creator?: User;
}

export interface Question {
  id: number;
  formId: number;
  type: 'short_answer' | 'long_answer' | 'single_choice' | 'multiple_choice' | 'file_upload';
  title: string;
  description: string | null;
  isRequired: boolean;
  options: string[] | null;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
  validation?: QuestionValidation;
}

export interface QuestionValidation {
  minLength?: number;
  maxLength?: number;
  minValue?: number;
  maxValue?: number;
  pattern?: string;
  allowedFileTypes?: string[];
  maxFileSize?: number;
}

export interface Response {
  id: number;
  formId: number;
  respondentId: number | null;
  respondentEmail: string | null;
  submittedAt: string;
  answers: Answer[];
  form?: Form;
  respondent?: User;
}

export interface Answer {
  id: number;
  responseId: number;
  questionId: number;
  answerText: string | null;
  answerOptions: string[] | null;
  fileUrls: string[] | null;
  question?: Question;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface FormStatistics {
  totalResponses: number;
  completionRate: number;
  averageCompletionTime: number;
  questionStatistics: QuestionStatistics[];
  dailyResponses: DailyResponseCount[];
}

export interface QuestionStatistics {
  questionId: number;
  question: Question;
  responseCount: number;
  answerDistribution: AnswerDistribution[];
}

export interface AnswerDistribution {
  value: string;
  count: number;
  percentage: number;
}

export interface DailyResponseCount {
  date: string;
  count: number;
}

export interface UploadedFile {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedBy: number;
  uploadedAt: string;
}

export interface ApiError {
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>;
}