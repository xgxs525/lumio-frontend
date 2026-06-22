import { getStoredAuth } from "@/lib/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";
const API_TIMEOUT_MS = 30_000;
const SLOW_REQUEST_MS = 1_500;

type ApiResponse<T> = {
  success: boolean;
  data: T;
};

type WorkspaceOverview = ApiResponse<{
  workspace: Record<string, unknown>;
  metrics: Record<string, number | string>;
  recentFiles: Array<Record<string, unknown>>;
  recentJobs: Array<Record<string, unknown>>;
}>;

type DriveFile = Record<string, unknown>;
type DriveFolder = Record<string, unknown>;
type ShareItem = Record<string, unknown>;
type DocumentItem = Record<string, unknown>;
type KnowledgeBaseItem = Record<string, unknown>;
type JobItem = Record<string, unknown>;
type TeamMemberItem = Record<string, unknown>;
type DepartmentItem = Record<string, unknown>;
type RoleItem = Record<string, unknown>;
type UsageItem = Record<string, unknown>;
type BillingPlanItem = Record<string, unknown>;
type BillingOrderItem = Record<string, unknown>;
type BillingProviderItem = Record<string, unknown>;
type DrivePreview = {
  kind: "text" | "image" | "pdf" | "download";
  file: DriveFile;
  content: string;
  truncated: boolean;
  downloadUrl: string;
};
type AuthResult = ApiResponse<{
  accessToken: string;
  tokenType: string;
  expiresAt: string;
  user: Record<string, unknown>;
  workspace: Record<string, unknown>;
}>;

async function fetchWithTimeout(url: string, init?: RequestInit) {
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  if (init?.signal) {
    if (init.signal.aborted) controller.abort();
    init.signal.addEventListener("abort", () => controller.abort(), { once: true });
  }

  const startedAt = Date.now();
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("接口响应超时，请稍后重试");
    }
    throw error;
  } finally {
    globalThis.clearTimeout(timeout);
    const duration = Date.now() - startedAt;
    if (process.env.NODE_ENV !== "production" && duration > SLOW_REQUEST_MS) {
      console.warn(`[序光 API] slow request ${duration}ms`, url);
    }
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  const auth = getStoredAuth();
  if (auth?.token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${auth.token}`);
  }

  const response = await fetchWithTimeout(`${API_BASE}${path}`, {
    ...init,
    headers,
    cache: init?.cache ?? "no-store",
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.detail || data.error || `请求失败：${response.status}`);
  }
  return data as T;
}

async function download(path: string): Promise<{ blob: Blob; filename: string }> {
  const headers = new Headers();
  const auth = getStoredAuth();
  if (auth?.token) {
    headers.set("Authorization", `Bearer ${auth.token}`);
  }
  const response = await fetchWithTimeout(`${API_BASE}${path}`, { headers, cache: "no-store" });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.detail || data.error || `请求失败：${response.status}`);
  }
  const disposition = response.headers.get("Content-Disposition") ?? "";
  const encoded = disposition.match(/filename\*=UTF-8''([^;]+)/)?.[1];
  const plain = disposition.match(/filename="?([^";]+)"?/)?.[1];
  return {
    blob: await response.blob(),
    filename: encoded ? decodeURIComponent(encoded) : plain || "download",
  };
}

export const api = {
  health: () => request<{ status: string }>("/health"),

  register: (payload: { account: string; password: string; name?: string }) =>
    request<AuthResult>("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),

  login: (payload: { account: string; password: string; remember?: boolean }) =>
    request<AuthResult>("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),

  me: (token: string) =>
    request<ApiResponse<{ user: Record<string, unknown>; workspace: Record<string, unknown> }>>(
      "/auth/me",
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    ),

  logout: (token: string) =>
    request<{ success: boolean }>("/auth/logout", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    }),

  updateProfile: (payload: {
    name?: string;
    phone?: string;
    avatarUrl?: string;
    locale?: string;
    timezone?: string;
  }) =>
    request<ApiResponse<{ user: Record<string, unknown>; workspace: Record<string, unknown> }>>(
      "/auth/profile",
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    ),

  updatePassword: (payload: { currentPassword: string; newPassword: string }) =>
    request<{ success: boolean }>("/auth/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),

  deleteAccount: (payload: { confirmation: string; currentPassword?: string }) =>
    request<{ success: boolean }>("/auth/account", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),

  currentWorkspace: () =>
    request<ApiResponse<{ user: Record<string, unknown>; workspace: Record<string, unknown> }>>(
      "/workspaces/current",
    ),

  updateCurrentWorkspace: (payload: { name?: string; locale?: string; timezone?: string; logo_url?: string }) =>
    request<ApiResponse<{ user: Record<string, unknown>; workspace: Record<string, unknown> }>>(
      "/workspaces/current",
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    ),

  workspaceOverview: () => request<WorkspaceOverview>("/workspaces/overview"),

  driveOverview: () => request<ApiResponse<Record<string, unknown>>>("/drive/overview"),

  listDriveFolders: (parentId?: string) =>
    request<ApiResponse<DriveFolder[]>>(
      `/drive/folders${parentId ? `?parent_id=${encodeURIComponent(parentId)}` : ""}`,
    ),

  createDriveFolder: (name: string, parentId?: string) => {
    const form = new FormData();
    form.append("name", name);
    if (parentId) form.append("parent_id", parentId);
    return request<ApiResponse<DriveFolder>>("/drive/folders", { method: "POST", body: form });
  },

  getFolder: (folderId: string) =>
    request<ApiResponse<DriveFolder>>(`/folders/${folderId}`),

  updateFolder: (folderId: string, payload: { name?: string; parent_id?: string }) =>
    request<ApiResponse<DriveFolder>>(`/folders/${folderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),

  deleteFolder: (folderId: string) =>
    request<{ success: boolean }>(`/folders/${folderId}`, { method: "DELETE" }),

  listDriveFiles: (folderId?: string) =>
    request<ApiResponse<DriveFile[]>>(
      `/drive/files${folderId ? `?folder_id=${encodeURIComponent(folderId)}` : ""}`,
    ),

  createDriveFile: (payload: {
    name: string;
    extension?: string;
    mime_type?: string;
    content?: string;
    folder_id?: string;
  }) =>
    request<ApiResponse<DriveFile>>("/drive/files", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),

  uploadDriveFile: async (file: File, folderId?: string) => {
    const form = new FormData();
    form.append("file", file);
    if (folderId) form.append("folder_id", folderId);
    return request<ApiResponse<DriveFile>>("/drive/files/upload", { method: "POST", body: form });
  },

  deleteDriveFile: (fileId: string) =>
    request<{ success: boolean }>(`/drive/files/${fileId}`, { method: "DELETE" }),

  listTrash: () =>
    request<ApiResponse<DriveFile[]>>("/drive/trash"),

  restoreFile: (fileId: string) =>
    request<{ success: boolean }>(`/drive/files/${fileId}/restore`, { method: "POST" }),

  permanentDeleteFile: (fileId: string) =>
    request<{ success: boolean }>(`/drive/files/${fileId}/permanent`, { method: "DELETE" }),

  emptyTrash: () =>
    request<{ success: boolean; deleted_count: number }>("/drive/trash/empty", { method: "POST" }),

  previewDriveFile: (fileId: string) =>
    request<ApiResponse<DrivePreview>>(`/drive/files/${fileId}/preview`),

  getDriveFile: (fileId: string) =>
    request<ApiResponse<DriveFile>>(`/drive/files/${fileId}`),

  createUploadUrl: (payload: { filename: string; size?: number; mime_type?: string; folder_id?: string }) =>
    request<ApiResponse<Record<string, unknown>>>("/drive/files/create-upload-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),

  completeUpload: (payload: {
    filename: string;
    storage_key: string;
    size?: number;
    mime_type?: string;
    folder_id?: string;
    checksum?: string;
  }) =>
    request<ApiResponse<DriveFile>>("/drive/files/complete-upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),

  signedPreviewUrl: (fileId: string) =>
    request<ApiResponse<Record<string, unknown>>>(`/drive/files/${fileId}/signed-preview-url`),

  listFileVersions: (fileId: string) =>
    request<ApiResponse<Array<Record<string, unknown>>>>(`/drive/files/${fileId}/versions`),

  createFileVersion: (fileId: string, payload: { storage_key: string; size?: number; checksum?: string }) =>
    request<ApiResponse<Record<string, unknown>>>(`/drive/files/${fileId}/versions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),

  driveFileDownloadUrl: (fileId: string) => `${API_BASE}/drive/files/${fileId}/download`,

  downloadDriveFile: (fileId: string) => download(`/drive/files/${fileId}/download`),

  sharedFileDownloadUrl: (token: string) => `${API_BASE}/share/files/${encodeURIComponent(token)}/download`,

  getSharedFile: (token: string) =>
    request<ApiResponse<Record<string, unknown>>>(`/share/files/${encodeURIComponent(token)}`),

  downloadSharedFile: (token: string) => download(`/share/files/${encodeURIComponent(token)}/download`),

  listFileShares: (fileId: string) =>
    request<ApiResponse<ShareItem[]>>(`/drive/files/${fileId}/shares`),

  createFileShare: (
    fileId: string,
    payload: { share_type?: "link" | "workspace" | "team"; permission?: "view" | "comment" | "edit"; expires_at?: string },
  ) =>
    request<ApiResponse<ShareItem>>(`/drive/files/${fileId}/shares`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),

  deleteFileShare: (shareId: string) =>
    request<{ success: boolean }>(`/drive/files/shares/${shareId}`, { method: "DELETE" }),

  indexDriveFile: (fileId: string, knowledgeBaseId?: string) =>
    request<ApiResponse<Record<string, unknown>>>(
      `/file-ai/files/${fileId}/index${knowledgeBaseId ? `?knowledge_base_id=${encodeURIComponent(knowledgeBaseId)}` : ""}`,
      { method: "POST" },
    ),

  indexDriveFileAsync: (fileId: string, knowledgeBaseId?: string) =>
    request<ApiResponse<Record<string, unknown>>>(
      `/file-ai/files/${fileId}/index-async${knowledgeBaseId ? `?knowledge_base_id=${encodeURIComponent(knowledgeBaseId)}` : ""}`,
      { method: "POST" },
    ),

  askDriveFile: (fileId: string, payload: { question: string; knowledge_base_id?: string }) =>
    request<ApiResponse<Record<string, unknown>>>(`/file-ai/files/${fileId}/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),

  askDriveFileAsync: (fileId: string, payload: { question: string; knowledge_base_id?: string }) =>
    request<ApiResponse<Record<string, unknown>>>(`/file-ai/files/${fileId}/ask-async`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),

  summarizeDriveFile: (fileId: string, payload?: { knowledge_base_id?: string }) =>
    request<ApiResponse<Record<string, unknown>>>(`/file-ai/files/${fileId}/summarize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload ?? {}),
    }),

  summarizeDriveFileAsync: (fileId: string, payload?: { knowledge_base_id?: string }) =>
    request<ApiResponse<Record<string, unknown>>>(`/file-ai/files/${fileId}/summarize-async`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload ?? {}),
    }),

  cleanDriveTable: (fileId: string) =>
    request<ApiResponse<Record<string, unknown>>>(`/file-ai/files/${fileId}/excel/clean`, {
      method: "POST",
    }),

  cleanDriveTableAsync: (fileId: string) =>
    request<ApiResponse<Record<string, unknown>>>(`/file-ai/files/${fileId}/excel/clean-async`, {
      method: "POST",
    }),

  splitDriveTable: (fileId: string, payload: { column: string; output_prefix?: string }) =>
    request<ApiResponse<Record<string, unknown>>>(`/file-ai/files/${fileId}/excel/split`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),

  splitDriveTableAsync: (fileId: string, payload: { column: string; output_prefix?: string }) =>
    request<ApiResponse<Record<string, unknown>>>(`/file-ai/files/${fileId}/excel/split-async`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),

  mergeDriveTables: (payload: { file_ids: string[]; output_name?: string }) =>
    request<ApiResponse<Record<string, unknown>>>("/file-ai/files/merge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),

  mergeDriveTablesAsync: (payload: { file_ids: string[]; output_name?: string }) =>
    request<ApiResponse<Record<string, unknown>>>("/file-ai/files/merge-async", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),

  listDocuments: () => request<ApiResponse<DocumentItem[]>>("/documents"),

  createDocument: (payload: { title: string; content?: Record<string, unknown>; content_text?: string }) =>
    request<ApiResponse<DocumentItem>>("/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),

  updateDocument: (documentId: string, payload: Record<string, unknown>) =>
    request<ApiResponse<DocumentItem>>(`/documents/${documentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),

  getDocument: (documentId: string) =>
    request<ApiResponse<DocumentItem>>(`/documents/${documentId}`),

  deleteDocument: (documentId: string) =>
    request<{ success: boolean }>(`/documents/${documentId}`, { method: "DELETE" }),

  exportDocument: (documentId: string, format: "md" | "txt" | "json" = "md") =>
    download(`/documents/${documentId}/export?format=${encodeURIComponent(format)}`),

  aiWriteDocument: (
    documentId: string,
    payload: { instruction: string; mode?: "draft" | "rewrite" | "summary" | "outline" | "continue"; apply?: boolean },
  ) =>
    request<ApiResponse<Record<string, unknown>>>(`/documents/${documentId}/ai-write`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),

  addDocumentToKnowledge: (
    documentId: string,
    payload: { knowledge_base_id: string; title?: string },
  ) =>
    request<ApiResponse<Record<string, unknown>>>(`/documents/${documentId}/knowledge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),

  listDocumentShares: (documentId: string) =>
    request<ApiResponse<ShareItem[]>>(`/documents/${documentId}/shares`),

  createDocumentShare: (
    documentId: string,
    payload: { share_type?: "link" | "workspace" | "team"; permission?: "view" | "comment" | "edit"; expires_at?: string },
  ) =>
    request<ApiResponse<ShareItem>>(`/documents/${documentId}/shares`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),

  deleteDocumentShare: (shareId: string) =>
    request<{ success: boolean }>(`/documents/shares/${shareId}`, { method: "DELETE" }),

  getSharedDocument: (token: string) =>
    request<ApiResponse<Record<string, unknown>>>(`/share/documents/${encodeURIComponent(token)}`),

  listKnowledgeBases: () => request<ApiResponse<KnowledgeBaseItem[]>>("/knowledge-bases"),

  getKnowledgeBase: (knowledgeBaseId: string) =>
    request<ApiResponse<KnowledgeBaseItem>>(`/knowledge-bases/${knowledgeBaseId}`),

  createKnowledgeBase: (payload: { name: string; description?: string; visibility?: string }) =>
    request<ApiResponse<KnowledgeBaseItem>>("/knowledge-bases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),

  updateKnowledgeBase: (knowledgeBaseId: string, payload: Record<string, unknown>) =>
    request<ApiResponse<KnowledgeBaseItem>>(`/knowledge-bases/${knowledgeBaseId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),

  addKnowledgeSource: (
    knowledgeBaseId: string,
    payload: { source_type?: string; source_id?: string; title?: string },
  ) =>
    request<ApiResponse<Record<string, unknown>>>(`/knowledge-bases/${knowledgeBaseId}/sources`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),

  listKnowledgeSources: (knowledgeBaseId: string) =>
    request<ApiResponse<Array<Record<string, unknown>>>>(`/knowledge-bases/${knowledgeBaseId}/sources`),

  syncKnowledgeBase: (knowledgeBaseId: string) =>
    request<ApiResponse<Record<string, unknown>>>(`/knowledge-bases/${knowledgeBaseId}/sync`, {
      method: "POST",
    }),

  askKnowledgeBase: (knowledgeBaseId: string, payload: { question: string }) =>
    request<ApiResponse<Record<string, unknown>>>(`/knowledge-bases/${knowledgeBaseId}/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),

  listJobs: () => request<ApiResponse<JobItem[]>>("/jobs"),

  getJob: (jobId: string) =>
    request<ApiResponse<JobItem>>(`/jobs/${jobId}`),

  createJob: (payload: { type: string; input?: Record<string, unknown> }) =>
    request<ApiResponse<JobItem>>("/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),

  updateJob: (jobId: string, payload: Record<string, unknown>) =>
    request<ApiResponse<JobItem>>(`/jobs/${jobId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),

  listAIConversations: () => request<ApiResponse<Array<Record<string, unknown>>>>("/ai/conversations"),

  listAIMessages: (conversationId: string) =>
    request<ApiResponse<Array<Record<string, unknown>>>>(`/ai/conversations/${conversationId}/messages`),

  uploadFile: async (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request<{
      success: boolean;
      filename: string;
      filepath: string;
      storageKey: string;
      size: number;
    }>("/files/upload", { method: "POST", body: form });
  },

  getColumns: (payload: { filepath?: string; storageKey?: string; headerRow?: number }) =>
    request<{ success: boolean; columns: string[]; headerRow: number }>("/files/columns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),

  previewSplit: (payload: Record<string, unknown>) =>
    request<Record<string, unknown>>("/tasks/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),

  createSplitTask: (payload: Record<string, unknown>) =>
    request<{ success: boolean; taskId: string }>("/tasks/split", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),

  getTask: (taskId: string) =>
    request<{ success: boolean; task: Record<string, unknown> }>(`/tasks/${taskId}`),

  chat: (
    messages: { role: string; content: string }[],
    options?: { conversationId?: string; sourceType?: string; sourceId?: string; title?: string },
  ) =>
    request<{
      success: boolean;
      data: {
        content: string;
        model: string;
        mock?: boolean;
        conversationId?: string;
        messageId?: string;
        usage?: Record<string, number | string>;
      };
    }>(
      "/ai/chat",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages, ...options }),
      },
    ),

  chatStreamUrl: () => `${API_BASE}/chat/stream`,

  listTemplates: () =>
    request<{ success: boolean; templates: Array<Record<string, unknown>> }>("/templates"),

  listMyTemplates: () =>
    request<{ success: boolean; templates: Array<Record<string, unknown>> }>("/templates/mine"),

  uploadTemplate: async (file: File, name?: string) => {
    const form = new FormData();
    form.append("file", file);
    if (name?.trim()) form.append("name", name.trim());
    return request<{ success: boolean; template: Record<string, unknown> }>("/templates/upload", {
      method: "POST",
      body: form,
    });
  },

  deleteTemplate: (templateId: string) =>
    request<{ success: boolean }>(`/templates/${templateId}`, { method: "DELETE" }),

  templateDownloadUrl: (templateId: string) => `${API_BASE}/templates/${templateId}/download`,

  teamOverview: () => request<ApiResponse<Record<string, unknown>>>("/team/overview"),

  listTeamMembers: () => request<ApiResponse<TeamMemberItem[]>>("/team/members"),

  getTeamMember: (memberId: string) =>
    request<ApiResponse<TeamMemberItem>>(`/team/members/${memberId}`),

  updateTeamMember: (
    memberId: string,
    payload: { role_code?: string; department_id?: string; status?: string },
  ) =>
    request<ApiResponse<TeamMemberItem>>(`/team/members/${memberId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),

  inviteTeamMember: (payload: { email: string; role_code?: string; department_id?: string }) =>
    request<ApiResponse<Record<string, unknown>>>("/team/invitations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),

  listDepartments: () => request<ApiResponse<DepartmentItem[]>>("/team/departments"),

  createDepartment: (payload: { name: string; parent_id?: string }) =>
    request<ApiResponse<DepartmentItem>>("/team/departments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),

  getDepartment: (departmentId: string) =>
    request<ApiResponse<DepartmentItem>>(`/team/departments/${departmentId}`),

  updateDepartment: (departmentId: string, payload: { name?: string; parent_id?: string }) =>
    request<ApiResponse<DepartmentItem>>(`/team/departments/${departmentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),

  deleteDepartment: (departmentId: string) =>
    request<{ success: boolean }>(`/team/departments/${departmentId}`, { method: "DELETE" }),

  listRoles: () => request<ApiResponse<RoleItem[]>>("/team/roles"),

  listPermissions: () => request<ApiResponse<Array<Record<string, unknown>>>>("/team/permissions"),

  getRole: (roleId: string) =>
    request<ApiResponse<RoleItem>>(`/team/roles/${roleId}`),

  createRole: (payload: { name: string; code: string; description?: string; permission_codes?: string[] }) =>
    request<ApiResponse<RoleItem>>("/team/roles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),

  updateRole: (roleId: string, payload: { name?: string; description?: string; permission_codes?: string[] }) =>
    request<ApiResponse<RoleItem>>(`/team/roles/${roleId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),

  deleteRole: (roleId: string) =>
    request<{ success: boolean }>(`/team/roles/${roleId}`, { method: "DELETE" }),

  listAuditLogs: () => request<ApiResponse<Array<Record<string, unknown>>>>("/team/audit-logs"),

  teamUsage: () => request<ApiResponse<UsageItem[]>>("/team/usage"),

  usageSummary: () => request<ApiResponse<Record<string, unknown>>>("/usage/summary"),

  listUsageRecords: (params?: { usageType?: string; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.usageType) query.set("usage_type", params.usageType);
    if (params?.limit) query.set("limit", String(params.limit));
    return request<ApiResponse<UsageItem[]>>(`/usage/records${query.toString() ? `?${query}` : ""}`);
  },

  adminOverview: () => request<ApiResponse<Record<string, unknown>>>("/admin/overview"),

  adminUsers: () => request<ApiResponse<Array<Record<string, unknown>>>>("/admin/users"),

  adminWorkspaces: () => request<ApiResponse<Array<Record<string, unknown>>>>("/admin/workspaces"),

  adminJobs: () => request<ApiResponse<Array<Record<string, unknown>>>>("/admin/jobs"),

  adminCommerce: () => request<ApiResponse<Record<string, unknown>>>("/admin/commerce"),

  adminAuditLogs: () => request<ApiResponse<Array<Record<string, unknown>>>>("/admin/audit-logs"),

  adminFiles: () => request<ApiResponse<Array<Record<string, unknown>>>>("/admin/files"),

  adminOrders: () => request<ApiResponse<Array<Record<string, unknown>>>>("/admin/orders"),

  adminPayments: () => request<ApiResponse<Array<Record<string, unknown>>>>("/admin/payments"),

  adminModelConfigs: () => request<ApiResponse<Array<Record<string, unknown>>>>("/admin/model-configs"),

  adminStorage: () => request<ApiResponse<Record<string, unknown>>>("/admin/storage"),

  adminPaymentConfigs: () => request<ApiResponse<Array<Record<string, unknown>>>>("/admin/payment-configs"),

  adminRisk: () => request<ApiResponse<Record<string, unknown>>>("/admin/risk"),

  adminAnnouncements: () => request<ApiResponse<Array<Record<string, unknown>>>>("/admin/announcements"),

  adminSystem: () => request<ApiResponse<Record<string, unknown>>>("/admin/system"),

  integrationsStatus: () => request<ApiResponse<Record<string, unknown>>>("/integrations/status"),

  listBillingPlans: (params?: { billingCycle?: "monthly" | "yearly"; currency?: string; locale?: string }) => {
    const query = new URLSearchParams();
    if (params?.billingCycle) query.set("billing_cycle", params.billingCycle);
    if (params?.currency) query.set("currency", params.currency);
    if (params?.locale) query.set("locale", params.locale);
    return request<ApiResponse<BillingPlanItem[]>>(`/billing/plans${query.toString() ? `?${query}` : ""}`);
  },

  listPaymentProviders: (params?: { currency?: string; region?: string }) => {
    const query = new URLSearchParams();
    if (params?.currency) query.set("currency", params.currency);
    if (params?.region) query.set("region", params.region);
    return request<ApiResponse<BillingProviderItem[]>>(`/billing/providers${query.toString() ? `?${query}` : ""}`);
  },

  billingCurrent: () => request<ApiResponse<Record<string, unknown>>>("/billing/current"),

  listBillingOrders: () => request<ApiResponse<BillingOrderItem[]>>("/billing/orders"),

  getBillingOrder: (orderNo: string) =>
    request<ApiResponse<Record<string, unknown>>>(`/billing/orders/${encodeURIComponent(orderNo)}`),

  createBillingCheckout: (payload: {
    plan_code: string;
    billing_cycle?: "monthly" | "yearly";
    currency?: string;
    provider?: string;
    locale?: string;
    region?: string;
    seats?: number;
  }) =>
    request<ApiResponse<Record<string, unknown>>>("/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),

  completeMockPayment: (orderNo: string) =>
    request<ApiResponse<Record<string, unknown>>>(`/billing/mock-pay/${encodeURIComponent(orderNo)}`, {
      method: "POST",
    }),

  cancelSubscription: () =>
    request<ApiResponse<Record<string, unknown>>>("/billing/subscription/cancel", {
      method: "POST",
    }),

  enterpriseBillingOverview: () =>
    request<ApiResponse<Record<string, unknown>>>("/billing/enterprise/overview"),
};

