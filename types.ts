// Type definitions for the application

export interface User {
  id: number;
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role: string;
  isOnline: boolean;
  lastSeen: string;
  profilePicture?: string;
  createdAt: string;
  isBlocked?: boolean;
  blockedBy?: number;
}

export interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  content?: string;
  contentType: string; // text, image, audio, financial, sticker
  mediaUrl?: string;
  isRead: boolean;
  isDelivered?: boolean; // مؤشر إضافي لحالة الرسالة (تم الاستلام)
  timestamp: string;
  metadata?: any;
}

export interface Notification {
  id: number;
  userId: number;
  title: string;
  content: string;
  type: string; // general, financial, broadcast
  isRead: boolean;
  timestamp: string;
  metadata?: any;
}

export interface FormattedMessage extends Message {
  sender?: User;
  receiver?: User;
  formattedTime?: string;
}

export interface ChatContact {
  user: User;
  lastMessage?: FormattedMessage;
  unreadCount: number;
}

export enum OnlineStatus {
  ONLINE = "online",
  OFFLINE = "offline",
  AWAY = "away"
}

export interface FinancialNotification {
  title: string;
  content: string;
  amount: number;
  recipient: number | null; // null means broadcast to all hosts
  attachmentUrl?: string;
}

export interface BroadcastMessage {
  content: string;
  attachmentUrl?: string;
}
