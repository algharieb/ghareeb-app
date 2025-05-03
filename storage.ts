import React, { useContext, createContext, useState, useEffect } from "react";
import * as CryptoJS from "crypto-js";
import { User, Message, Notification } from "@/lib/types";

const SECRET_KEY = "al-ghareeb-app-secret-key";

// Encrypt and decrypt data
const encrypt = (data: any): string => {
  return CryptoJS.AES.encrypt(JSON.stringify(data), SECRET_KEY).toString();
};

const decrypt = (ciphertext: string): any => {
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
  } catch (error) {
    console.error("Decryption error:", error);
    return null;
  }
};

// Storage keys
const KEYS = {
  CURRENT_USER: "al-ghareeb-current-user",
  USERS: "al-ghareeb-users",
  MESSAGES: "al-ghareeb-messages",
  NOTIFICATIONS: "al-ghareeb-notifications",
};

// Storage functions
export const storage = {
  // User management
  getUsers: (): User[] => {
    const data = localStorage.getItem(KEYS.USERS);
    const users = data ? decrypt(data) : [];
    console.log("تم جلب المستخدمين من التخزين المحلي:", users.length);
    return users;
  },
  
  getUserByUsername: (username: string): User | undefined => {
    const users = storage.getUsers();
    const user = users.find(user => user.username === username);
    return user;
  },
  
  getUserById: (id: number): User | undefined => {
    const users = storage.getUsers();
    const user = users.find(user => user.id === id);
    return user;
  },
  
  saveUsers: (users: User[]): void => {
    console.log("حفظ المستخدمين في التخزين المحلي:", users.length);
    localStorage.setItem(KEYS.USERS, encrypt(users));
  },
  
  addUser: (user: Omit<User, "id">): User => {
    const users = storage.getUsers();
    const newUser: User = { 
      ...user, 
      id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
      createdAt: new Date().toISOString(),
      lastSeen: new Date().toISOString()
    };
    
    users.push(newUser);
    storage.saveUsers(users);
    return newUser;
  },
  
  updateUser: (user: User): User => {
    const users = storage.getUsers();
    const index = users.findIndex(u => u.id === user.id);
    if (index !== -1) {
      users[index] = user;
      storage.saveUsers(users);
    }
    return user;
  },
  
  deleteUser: (id: number): void => {
    const users = storage.getUsers();
    const updatedUsers = users.filter(user => user.id !== id);
    storage.saveUsers(updatedUsers);
    
    // Also delete all messages and notifications for this user
    const messages = storage.getMessages();
    const updatedMessages = messages.filter(
      msg => msg.senderId !== id && msg.receiverId !== id
    );
    storage.saveMessages(updatedMessages);
    
    const notifications = storage.getNotifications();
    const updatedNotifications = notifications.filter(
      notif => notif.userId !== id
    );
    storage.saveNotifications(updatedNotifications);
  },
  
  // Authentication
  getCurrentUser: (): User | null => {
    const data = localStorage.getItem(KEYS.CURRENT_USER);
    return data ? decrypt(data) : null;
  },
  
  setCurrentUser: (user: User | null): void => {
    if (user) {
      localStorage.setItem(KEYS.CURRENT_USER, encrypt(user));
    } else {
      localStorage.removeItem(KEYS.CURRENT_USER);
    }
  },
  
  login: async (username: string, password: string): Promise<User | null> => {
    try {
      // Send login request to API
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ username, password })
      });
      
      if (!response.ok) {
        return null;
      }
      
      const data = await response.json();
      const user = data.user || data;
      
      // Store user in local storage
      storage.setCurrentUser(user);
      return user;
    } catch (error) {
      console.error('Login error:', error);
      return null;
    }
  },
  
  logout: async (): Promise<void> => {
    try {
      const currentUser = storage.getCurrentUser();
      if (currentUser) {
        // Send logout request to API
        await fetch('/api/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({ userId: currentUser.id })
        });
      }
      storage.setCurrentUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  },
  
  // Messages
  getMessages: (): Message[] => {
    const data = localStorage.getItem(KEYS.MESSAGES);
    return data ? decrypt(data) : [];
  },
  
  saveMessages: (messages: Message[]): void => {
    localStorage.setItem(KEYS.MESSAGES, encrypt(messages));
  },
  
  getMessagesByUsers: (user1Id: number, user2Id: number): Message[] => {
    const messages = storage.getMessages();
    return messages.filter(
      msg => 
        (msg.senderId === user1Id && msg.receiverId === user2Id) ||
        (msg.senderId === user2Id && msg.receiverId === user1Id)
    ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  },
  
  addMessage: (message: Omit<Message, "id" | "timestamp">): Message => {
    const messages = storage.getMessages();
    const newMessage: Message = {
      ...message,
      id: messages.length > 0 ? Math.max(...messages.map(m => m.id)) + 1 : 1,
      timestamp: new Date().toISOString(),
    };
    
    messages.push(newMessage);
    storage.saveMessages(messages);
    return newMessage;
  },
  
  updateMessageReadStatus: (senderId: number, receiverId: number): void => {
    const messages = storage.getMessages();
    const updatedMessages = messages.map(msg => {
      if (msg.senderId === senderId && msg.receiverId === receiverId && !msg.isRead) {
        return { ...msg, isRead: true };
      }
      return msg;
    });
    
    storage.saveMessages(updatedMessages);
  },
  
  updateMessageDeliveryStatus: (messageId: number): void => {
    const messages = storage.getMessages();
    const updatedMessages = messages.map(msg => {
      if (msg.id === messageId && !msg.isDelivered && !msg.isRead) {
        return { ...msg, isDelivered: true };
      }
      return msg;
    });
    
    storage.saveMessages(updatedMessages);
  },
  
  // حذف المحادثات بين مستخدمين
  deleteMessagesBetweenUsers: (user1Id: number, user2Id: number): void => {
    const messages = storage.getMessages();
    const filteredMessages = messages.filter(
      msg => !(
        (msg.senderId === user1Id && msg.receiverId === user2Id) ||
        (msg.senderId === user2Id && msg.receiverId === user1Id)
      )
    );
    storage.saveMessages(filteredMessages);
  },

  // حظر مستخدم
  blockUser: (blockedById: number, blockedUserId: number): void => {
    // يمكننا حفظ المستخدمين المحظورين في localStorage
    const blockedUsersKey = `${KEYS.CURRENT_USER}_blocked_users_${blockedById}`;
    let blockedUsers = JSON.parse(localStorage.getItem(blockedUsersKey) || '[]');
    
    // التأكد من عدم وجود المستخدم بالفعل في قائمة المحظورين
    if (!blockedUsers.includes(blockedUserId)) {
      blockedUsers.push(blockedUserId);
      localStorage.setItem(blockedUsersKey, JSON.stringify(blockedUsers));
    }
    
    // تحديث حالة المستخدم المحظور في قائمة المستخدمين
    const users = storage.getUsers();
    const updatedUsers = users.map(user => {
      if (user.id === blockedUserId) {
        return { ...user, isBlocked: true, blockedBy: blockedById };
      }
      return user;
    });
    
    storage.saveUsers(updatedUsers);
  },
  
  // الحصول على قائمة المستخدمين المحظورين من قبل مستخدم معين
  getBlockedUsers: (userId: number): number[] => {
    const blockedUsersKey = `${KEYS.CURRENT_USER}_blocked_users_${userId}`;
    return JSON.parse(localStorage.getItem(blockedUsersKey) || '[]') as number[];
  },
  
  // التحقق مما إذا كان المستخدم محظورًا
  isUserBlocked: (userId: number, blockedId: number): boolean => {
    const blockedUsers = storage.getBlockedUsers(userId);
    return blockedUsers.includes(blockedId);
  },
  
  // إلغاء حظر مستخدم
  unblockUser: (blockedById: number, blockedUserId: number): void => {
    const blockedUsersKey = `${KEYS.CURRENT_USER}_blocked_users_${blockedById}`;
    let blockedUsers: number[] = JSON.parse(localStorage.getItem(blockedUsersKey) || '[]');
    
    // إزالة المستخدم من قائمة المحظورين
    blockedUsers = blockedUsers.filter((id: number) => id !== blockedUserId);
    localStorage.setItem(blockedUsersKey, JSON.stringify(blockedUsers));
    
    // تحديث حالة المستخدم في قائمة المستخدمين
    const users = storage.getUsers();
    const updatedUsers = users.map(user => {
      if (user.id === blockedUserId) {
        // نستخدم السمات المطلوبة فقط
        const userWithoutBlocking = { ...user };
        delete userWithoutBlocking.isBlocked;
        delete userWithoutBlocking.blockedBy;
        return userWithoutBlocking;
      }
      return user;
    });
    
    storage.saveUsers(updatedUsers);
  },
  
  // Notifications
  getNotifications: (): Notification[] => {
    const data = localStorage.getItem(KEYS.NOTIFICATIONS);
    return data ? decrypt(data) : [];
  },
  
  saveNotifications: (notifications: Notification[]): void => {
    localStorage.setItem(KEYS.NOTIFICATIONS, encrypt(notifications));
  },
  
  getNotificationsByUserId: (userId: number): Notification[] => {
    const notifications = storage.getNotifications();
    return notifications.filter(notif => notif.userId === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },
  
  addNotification: (notification: Omit<Notification, "id" | "timestamp">): Notification => {
    const notifications = storage.getNotifications();
    const newNotification: Notification = {
      ...notification,
      id: notifications.length > 0 ? Math.max(...notifications.map(n => n.id)) + 1 : 1,
      timestamp: new Date().toISOString(),
    };
    
    notifications.push(newNotification);
    storage.saveNotifications(notifications);
    return newNotification;
  },
  
  updateNotificationReadStatus: (notificationId: number, isRead: boolean): void => {
    const notifications = storage.getNotifications();
    const updatedNotifications = notifications.map(notif => {
      if (notif.id === notificationId) {
        return { ...notif, isRead };
      }
      return notif;
    });
    
    storage.saveNotifications(updatedNotifications);
  },
  
  // Broadcast message to all hosts
  broadcastMessage: (senderId: number, content: string, contentType: string = "text", mediaUrl?: string): void => {
    const users = storage.getUsers().filter(user => user.role === "host");
    
    users.forEach(user => {
      storage.addMessage({
        senderId,
        receiverId: user.id,
        content,
        contentType,
        mediaUrl,
        isRead: false
      });
    });
  },
  
  // Send financial notification to a user or all hosts
  sendFinancialNotification: (
    senderId: number, 
    userId: number | null, 
    title: string,
    content: string,
    amount: number,
    mediaUrl?: string
  ): void => {
    const users = userId 
      ? [storage.getUserById(userId)].filter(Boolean) 
      : storage.getUsers().filter(user => user.role === "host");
    
    users.forEach(user => {
      if (!user) return;
      
      // Add notification
      storage.addNotification({
        userId: user.id,
        title,
        content,
        type: "financial",
        isRead: false,
        metadata: { amount, mediaUrl }
      });
      
      // Also add a message
      storage.addMessage({
        senderId,
        receiverId: user.id,
        content,
        contentType: "financial",
        mediaUrl,
        isRead: false,
        metadata: { title, amount }
      });
    });
  },
  
  // Initialize default data (admin user) if storage is empty
  initializeStorage: (): void => {
    const users = storage.getUsers();
    
    if (users.length === 0) {
      // We won't add an admin user here anymore as it will come from the database
      console.log("Local storage is empty, users will be loaded from database");
    }
  }
};

// Initialize storage on first load
storage.initializeStorage();

// Auth Context
type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<User | null>;
  logout: () => void;
  register: (userData: Omit<User, "id" | "createdAt" | "lastSeen">) => Promise<User | null>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  login: async () => null,
  logout: () => {},
  register: async () => null
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(storage.getCurrentUser());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!storage.getCurrentUser());
  
  useEffect(() => {
    // Check for stored user on mount
    const storedUser = storage.getCurrentUser();
    if (storedUser) {
      setUser(storedUser);
      setIsAuthenticated(true);
    }
  }, []);
  
  const login = async (username: string, password: string): Promise<User | null> => {
    try {
      const loggedInUser = await storage.login(username, password);
      if (loggedInUser) {
        setUser(loggedInUser);
        setIsAuthenticated(true);
        return loggedInUser;
      }
      return null;
    } catch (error) {
      console.error("Login error:", error);
      return null;
    }
  };
  
  const logout = async () => {
    try {
      await storage.logout();
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };
  
  const register = async (userData: Omit<User, "id" | "createdAt" | "lastSeen">): Promise<User | null> => {
    try {
      // Send registration request to API
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(userData)
      });
      
      if (!response.ok) {
        return null;
      }
      
      const data = await response.json();
      const newUser = data.user || data;
      
      if (newUser) {
        storage.setCurrentUser(newUser);
        setUser(newUser);
        setIsAuthenticated(true);
      }
      
      return newUser;
    } catch (error) {
      console.error("Registration error:", error);
      return null;
    }
  };
  
  // Using React.createElement to avoid JSX in .ts file
  return React.createElement(
    AuthContext.Provider, 
    { value: { user, isAuthenticated, login, logout, register } },
    children
  );
};

export const useAuth = () => useContext(AuthContext);
