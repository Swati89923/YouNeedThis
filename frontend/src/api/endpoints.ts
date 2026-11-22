import { request } from "./client";
import type {
  AppNotification,
  DeveloperStats,
  Feedback,
  FeedbackComment,
  NewProject,
  Project,
  ReviewerStats,
  Role,
  Session,
} from "./types";

export const api = {
  // ----- auth -----
  login: (email: string, password: string) =>
    request<Session & { token: string }>("/api/v1/auth/login", {
      method: "POST",
      body: { email, password },
      anonymous: true,
    }),
  register: (name: string, email: string, password: string, role: Role) =>
    request<{ id: number }>("/api/v1/auth/register", {
      method: "POST",
      body: { name, email, password, role },
      anonymous: true,
    }),

  // ----- projects -----
  availableProjects: () => request<Project[]>("/projects"),
  myProjects: () => request<Project[]>("/projects/mine"),
  assignedProjects: () => request<Project[]>("/projects/assigned"),
  project: (id: number) => request<Project>(`/projects/${id}`),
  createProject: (project: NewProject) =>
    request<Project>("/projects", { method: "POST", body: project }),
  fundProject: (id: number) =>
    request<Project>(`/payments/deposit/${id}`, { method: "POST" }),
  takeProject: (id: number) =>
    request<Project>(`/projects/${id}/assign`, { method: "POST" }),

  // ----- feedback -----
  submitFeedback: (projectId: number, rating: number, comment: string) =>
    request<Feedback>(`/api/v1/feedback/project/${projectId}`, {
      method: "POST",
      body: { rating, comment },
    }),
  myFeedback: () => request<Feedback[]>("/api/v1/feedback/mine"),
  receivedFeedback: () => request<Feedback[]>("/api/v1/feedback/received"),
  projectFeedback: (projectId: number) =>
    request<Feedback[]>(`/api/v1/feedback/project/${projectId}`),
  approveFeedback: (id: number) =>
    request<Feedback>(`/api/v1/feedback/${id}/approve`, { method: "POST" }),
  rejectFeedback: (id: number) =>
    request<Feedback>(`/api/v1/feedback/${id}/reject`, { method: "POST" }),

  // ----- comments -----
  comments: (feedbackId: number) =>
    request<FeedbackComment[]>(`/feedback-comments/${feedbackId}`),
  addComment: (feedbackId: number, message: string) =>
    request<FeedbackComment>(`/feedback-comments/${feedbackId}`, {
      method: "POST",
      body: { message },
    }),

  // ----- money, stats, notifications -----
  wallet: () => request<{ balance: number }>("/wallet"),
  withdraw: (amount: number) =>
    request<{ balance: number }>("/wallet/withdraw", {
      method: "POST",
      body: { amount },
    }),
  developerStats: () => request<DeveloperStats>("/api/v1/dashboard/developer"),
  reviewerStats: () => request<ReviewerStats>("/api/v1/dashboard/reviewer"),
  notifications: () => request<AppNotification[]>("/notifications"),
  markAllNotificationsRead: () =>
    request<void>("/notifications/read-all", { method: "POST" }),
};
