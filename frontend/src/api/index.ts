import { buildQuery, http } from './http'
import type {
  AnswerSubmit,
  Certificate,
  Exam,
  ExamCreateInput,
  ExamResultResponse,
  ExamStartResponse,
  ExamStats,
  KnowledgePoint,
  LeaderboardItem,
  PageResponse,
  Question,
  QuestionCreateInput,
  QuestionListItem,
  QuestionType,
  ScreenSwitchResponse,
  Subject,
  Tag,
  TokenResponse,
  User,
} from '@/types'

// ---------- 认证 ----------
export const authApi = {
  login: (username: string, password: string) =>
    http.post<TokenResponse>('/auth/login', { username, password }),
  register: (username: string, password: string) =>
    http.post<User>('/auth/register', { username, password }),
  me: () => http.get<User>('/users/me'),
}

// ---------- 题库 ----------
export interface QuestionListParams {
  page: number
  page_size: number
  question_type?: QuestionType | ''
  difficulty?: number | ''
  knowledge_point_id?: number | ''
  subject_id?: number | ''
  keyword?: string
}

export const questionApi = {
  list: (params: QuestionListParams) =>
    http.get<PageResponse<QuestionListItem>>(`/questions${buildQuery({ ...params })}`),
  detail: (id: number) => http.get<Question>(`/questions/${id}`),
  create: (data: QuestionCreateInput) => http.post<Question>('/questions', data),
  remove: (id: number) => http.delete<null>(`/questions/${id}`),
  subjects: () => http.get<Subject[]>('/questions/subjects'),
  knowledgePoints: (subjectId?: number) =>
    http.get<KnowledgePoint[]>(`/questions/knowledge-points${buildQuery({ subject_id: subjectId })}`),
  tags: () => http.get<Tag[]>('/questions/tags'),
}

// ---------- 考试 ----------
export const examApi = {
  list: (params: { page: number; page_size: number; status?: string; subject_id?: number }) =>
    http.get<PageResponse<Exam>>(`/exams${buildQuery({ ...params })}`),
  create: (data: ExamCreateInput) => http.post<Exam>('/exams', data),
  update: (id: number, data: Partial<ExamCreateInput> & { status?: string }) =>
    http.put<Exam>(`/exams/${id}`, data),
  remove: (id: number) => http.delete<null>(`/exams/${id}`),
}

// ---------- 答题 ----------
export const attemptApi = {
  start: (examId: number) => http.post<ExamStartResponse>(`/attempts/${examId}/start`),
  submit: (attemptId: number, answers: AnswerSubmit[]) =>
    http.post<ExamResultResponse>(`/attempts/${attemptId}/submit`, { answers }),
  result: (attemptId: number) => http.get<ExamResultResponse>(`/attempts/${attemptId}/result`),
  screenSwitch: (attemptId: number) =>
    http.post<ScreenSwitchResponse>(`/attempts/${attemptId}/screen-switch`),
}

// ---------- 成绩统计 ----------
export const gradeApi = {
  stats: (examId: number) => http.get<ExamStats>(`/grades/stats/${examId}`),
  leaderboard: (examId: number, limit = 20) =>
    http.get<LeaderboardItem[]>(`/grades/leaderboard/${examId}${buildQuery({ limit })}`),
  certificates: () => http.get<Certificate[]>('/grades/certificates'),
  generateCertificate: (examId: number) =>
    http.post<Certificate>(`/grades/certificates/${examId}/generate`),
}
