import apiClient from "./apiClient";
import type {
  Ticket,
  TicketAttachment,
  TicketDetail,
  TicketList,
  TicketMessage,
  TicketStatus,
  TicketType,
  ReportTargetType,
} from "@/types/inbox.types";
type R<T> = { status: "OK" | "ERR"; message?: string; data: T };
const root = (admin = false) => (admin ? "/api/admin/inbox" : "/api/inbox");
export const inboxApi = {
  list: async (params: Record<string, unknown> = {}, admin = false) =>
    (await apiClient.get<R<TicketList>>(`${root(admin)}/tickets`, { params }))
      .data.data,
  detail: async (
    id: string,
    admin = false,
    params: { messagePage?: number; activityPage?: number } = {},
  ) =>
    (
      await apiClient.get<R<TicketDetail>>(`${root(admin)}/tickets/${id}`, {
        params,
      })
    ).data.data,
  create: async (input: {
    type: TicketType;
    title: string;
    description: string;
    target?: { type: ReportTargetType; id: string; courseId?: string };
  }) =>
    (await apiClient.post<R<Ticket>>("/api/inbox/tickets", input)).data.data,
  message: async (
    id: string,
    input: { content: string; internal?: boolean; attachmentIds?: string[] },
    admin = false,
  ) =>
    (
      await apiClient.post<R<TicketMessage>>(
        `${root(admin)}/tickets/${id}/messages`,
        input,
      )
    ).data.data,
  status: async (id: string, status: TicketStatus) =>
    (
      await apiClient.patch<R<Ticket>>(
        `/api/admin/inbox/tickets/${id}/status`,
        { status },
      )
    ).data.data,
  upload: async (id: string, files: File[], admin = false) => {
    const form = new FormData();
    files.forEach((file) => form.append("files", file));
    return (
      await apiClient.post<R<TicketAttachment[]>>(
        `${root(admin)}/tickets/${id}/attachments`,
        form,
      )
    ).data.data;
  },
  openAttachment: async (id: string, admin = false) => {
    const response = await apiClient.get(`${root(admin)}/attachments/${id}`, {
      responseType: "blob",
    });
    const url = URL.createObjectURL(response.data);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  },
};
