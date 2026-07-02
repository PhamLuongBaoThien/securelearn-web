export type TicketType = 'REPORT' | 'SUPPORT' | 'FEEDBACK';
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING_USER' | 'RESOLVED' | 'CLOSED';
export type ReportTargetType = 'COURSE' | 'LESSON' | 'REVIEW' | 'USER';
export interface TicketSnapshot { id: string; name: string; email: string; role: string }
export interface TicketTarget { type: ReportTargetType; id: string; title: string; courseId?: string; ownerUserId?: string; actionUrl?: string }
export interface Ticket { _id: string; type: TicketType; title: string; description: string; sender: TicketSnapshot; target?: TicketTarget | null; status: TicketStatus; lastActivityAt: string; userUnread: boolean; adminUnread: boolean; createdAt: string; updatedAt: string }
export interface TicketMessage { _id: string; ticketId: string; author: { id: string; name: string; role: string; type: 'USER' | 'ADMIN' }; content: string; internal: boolean; attachmentIds: string[]; createdAt: string }
export interface TicketActivity { _id: string; action: string; fromValue?: string; toValue?: string; createdAt: string; actor: { id: string; name: string; type: string } }
export interface TicketAttachment { _id: string; originalName: string; mimeType: string; sizeBytes: number }
export interface PaginatedTicketItems<T> { items: T[]; total: number; page: number; limit: number; totalPages: number }
export interface TicketDetail extends Ticket { messages: PaginatedTicketItems<TicketMessage>; activities: PaginatedTicketItems<TicketActivity>; attachments: TicketAttachment[] }
export interface TicketList { items: Ticket[]; total: number; page: number; limit: number; totalPages: number }
