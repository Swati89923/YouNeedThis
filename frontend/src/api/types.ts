export type Role = "DEVELOPER" | "REVIEWER" | "ADMIN";
export type FeedbackStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface Session {
  token: string;
  email: string;
  name: string;
  role: Role;
}

export interface Project {
  id: number;
  projectName: string;
  description: string;
  projectLink: string | null;
  reviewersNeeded: number;
  payPerReview: number;
  createdAt: string | null;
  developerId: number;
  developerName: string;
  funded: boolean;
  escrowTotal: number;
  escrowRemaining: number;
  assignedToMe: boolean;
  feedbackSubmittedByMe: boolean;
  feedbackCount: number;
  pendingFeedbackCount: number;
}

export interface Feedback {
  id: number;
  rating: number;
  comment: string;
  status: FeedbackStatus;
  projectId: number;
  projectName: string;
  reviewerId: number;
  reviewerName: string;
  payPerReview: number;
  createdAt: string | null;
}

export interface FeedbackComment {
  id: number;
  message: string;
  authorId: number;
  authorName: string;
  authorRole: Role;
  createdAt: string | null;
}

export interface AppNotification {
  id: number;
  message: string;
  seen: boolean;
  createdAt: string | null;
}

export interface DeveloperStats {
  totalProjects: number;
  totalFeedbacks: number;
  pendingReview: number;
  totalSpent: number;
  escrowRemaining: number;
  avgRating: number;
}

export interface ReviewerStats {
  totalFeedbacks: number;
  approvedFeedbacks: number;
  pendingFeedbacks: number;
  activeProjects: number;
  reviewerScore: number;
  totalEarnings: number;
  walletBalance: number;
}

export interface NewProject {
  projectName: string;
  description: string;
  projectLink: string;
  reviewersNeeded: number;
  payPerReview: number;
}
