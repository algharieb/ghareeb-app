import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage, comparePassword } from "./storage";
import bcrypt from "bcrypt";

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes
  const apiPrefix = "/api";

  // Auth routes
  app.post(`${apiPrefix}/login`, async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      const isPasswordValid = comparePassword(password, user.password);
      
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      // Update user status to online
      await storage.updateUserOnlineStatus(user.id, true);
      
      // Don't send the password back to the client
      const { password: _, ...userWithoutPassword } = user;
      
      return res.status(200).json({ 
        message: "Login successful",
        user: userWithoutPassword
      });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  app.post(`${apiPrefix}/logout`, async (req, res) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      await storage.updateUserOnlineStatus(userId, false);
      
      return res.status(200).json({ message: "Logout successful" });
    } catch (error) {
      console.error("Logout error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  app.post(`${apiPrefix}/register`, async (req, res) => {
    try {
      const { username, password, firstName, lastName, email } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }
      
      // Create profile picture URL with UI Avatars
      const profilePicture = `https://ui-avatars.com/api/?name=${encodeURIComponent(firstName || '')}+${encodeURIComponent(lastName || '')}&background=7E57C2&color=fff`;
      
      const newUser = await storage.createUser({
        username,
        password,
        firstName,
        lastName,
        email,
        role: "host",
        isOnline: true,
        profilePicture
      });
      
      // Don't send the password back to the client
      const { password: _, ...userWithoutPassword } = newUser;
      
      return res.status(201).json({
        message: "Registration successful",
        user: userWithoutPassword
      });
    } catch (error) {
      console.error("Registration error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  // Users routes
  app.get(`${apiPrefix}/users`, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      
      // Remove passwords from response
      const usersWithoutPasswords = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      return res.status(200).json(usersWithoutPasswords);
    } catch (error) {
      console.error("Get users error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  app.get(`${apiPrefix}/users/hosts`, async (req, res) => {
    try {
      const hosts = await storage.getAllHosts();
      
      // Remove passwords from response
      const hostsWithoutPasswords = hosts.map(host => {
        const { password, ...hostWithoutPassword } = host;
        return hostWithoutPassword;
      });
      
      return res.status(200).json(hostsWithoutPasswords);
    } catch (error) {
      console.error("Get hosts error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  app.get(`${apiPrefix}/users/:id`, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const user = await storage.getUserById(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't send the password back to the client
      const { password, ...userWithoutPassword } = user;
      
      return res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error("Get user error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  app.post(`${apiPrefix}/users`, async (req, res) => {
    try {
      const { username, password, firstName, lastName, email, role } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }
      
      // Create profile picture URL with UI Avatars
      const profilePicture = `https://ui-avatars.com/api/?name=${encodeURIComponent(firstName || '')}+${encodeURIComponent(lastName || '')}&background=7E57C2&color=fff`;
      
      const newUser = await storage.createUser({
        username,
        password,
        firstName,
        lastName,
        email,
        role: role || "host",
        isOnline: false,
        profilePicture
      });
      
      // Don't send the password back to the client
      const { password: _, ...userWithoutPassword } = newUser;
      
      return res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error("Create user error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  app.put(`${apiPrefix}/users/:id`, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const user = await storage.getUserById(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { username, password, firstName, lastName, email, isOnline } = req.body;
      
      // If username is changing, check if new username already exists
      if (username && username !== user.username) {
        const existingUser = await storage.getUserByUsername(username);
        
        if (existingUser) {
          return res.status(409).json({ message: "Username already exists" });
        }
      }
      
      const updatedUser = await storage.updateUser(userId, {
        username,
        password,
        firstName,
        lastName,
        email,
        isOnline
      });
      
      // Don't send the password back to the client
      const { password: _, ...userWithoutPassword } = updatedUser;
      
      return res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error("Update user error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  app.delete(`${apiPrefix}/users/:id`, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const user = await storage.getUserById(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      await storage.deleteUser(userId);
      
      return res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Delete user error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  // Messages routes
  app.get(`${apiPrefix}/messages/:userId1/:userId2`, async (req, res) => {
    try {
      const userId1 = parseInt(req.params.userId1);
      const userId2 = parseInt(req.params.userId2);
      
      if (isNaN(userId1) || isNaN(userId2)) {
        return res.status(400).json({ message: "Invalid user IDs" });
      }
      
      const messages = await storage.getMessages(userId1, userId2);
      
      return res.status(200).json(messages);
    } catch (error) {
      console.error("Get messages error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  app.post(`${apiPrefix}/messages`, async (req, res) => {
    try {
      const { senderId, receiverId, content, contentType, mediaUrl, metadata } = req.body;
      
      if (!senderId || !receiverId) {
        return res.status(400).json({ message: "Sender and receiver IDs are required" });
      }
      
      const sender = await storage.getUserById(senderId);
      const receiver = await storage.getUserById(receiverId);
      
      if (!sender || !receiver) {
        return res.status(404).json({ message: "Sender or receiver not found" });
      }
      
      const newMessage = await storage.createMessage({
        senderId,
        receiverId,
        content,
        contentType: contentType || "text",
        mediaUrl,
        metadata
      });
      
      return res.status(201).json(newMessage);
    } catch (error) {
      console.error("Create message error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  app.put(`${apiPrefix}/messages/read/:senderId/:receiverId`, async (req, res) => {
    try {
      const senderId = parseInt(req.params.senderId);
      const receiverId = parseInt(req.params.receiverId);
      
      if (isNaN(senderId) || isNaN(receiverId)) {
        return res.status(400).json({ message: "Invalid user IDs" });
      }
      
      await storage.markMessagesAsRead(senderId, receiverId);
      
      return res.status(200).json({ message: "Messages marked as read" });
    } catch (error) {
      console.error("Mark messages as read error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  // Notifications routes
  app.get(`${apiPrefix}/notifications/:userId`, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const notifications = await storage.getUserNotifications(userId);
      
      return res.status(200).json(notifications);
    } catch (error) {
      console.error("Get notifications error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  app.post(`${apiPrefix}/notifications`, async (req, res) => {
    try {
      const { userId, title, content, type, metadata } = req.body;
      
      if (!userId || !title || !content) {
        return res.status(400).json({ message: "User ID, title, and content are required" });
      }
      
      const user = await storage.getUserById(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const newNotification = await storage.createNotification({
        userId,
        title,
        content,
        type: type || "general",
        metadata
      });
      
      return res.status(201).json(newNotification);
    } catch (error) {
      console.error("Create notification error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  app.put(`${apiPrefix}/notifications/:id/read`, async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      
      if (isNaN(notificationId)) {
        return res.status(400).json({ message: "Invalid notification ID" });
      }
      
      await storage.markNotificationAsRead(notificationId);
      
      return res.status(200).json({ message: "Notification marked as read" });
    } catch (error) {
      console.error("Mark notification as read error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  // Broadcast and financial notifications
  app.post(`${apiPrefix}/broadcast`, async (req, res) => {
    try {
      const { senderId, content, contentType, mediaUrl, metadata } = req.body;
      
      if (!senderId || !content) {
        return res.status(400).json({ message: "Sender ID and content are required" });
      }
      
      const sender = await storage.getUserById(senderId);
      
      if (!sender) {
        return res.status(404).json({ message: "Sender not found" });
      }
      
      const messages = await storage.broadcastMessage(
        senderId,
        content,
        contentType,
        mediaUrl,
        metadata
      );
      
      return res.status(201).json({
        message: "Broadcast sent successfully",
        messageCount: messages.length
      });
    } catch (error) {
      console.error("Broadcast error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  app.post(`${apiPrefix}/financial-notifications`, async (req, res) => {
    try {
      const { senderId, recipientId, title, content, amount, mediaUrl } = req.body;
      
      if (!senderId || !title || !content || amount === undefined) {
        return res.status(400).json({ 
          message: "Sender ID, title, content, and amount are required" 
        });
      }
      
      const sender = await storage.getUserById(senderId);
      
      if (!sender) {
        return res.status(404).json({ message: "Sender not found" });
      }
      
      // If recipientId is provided, check if recipient exists
      if (recipientId) {
        const recipient = await storage.getUserById(recipientId);
        
        if (!recipient) {
          return res.status(404).json({ message: "Recipient not found" });
        }
      }
      
      const results = await storage.sendFinancialNotification(
        senderId,
        recipientId,
        title,
        content,
        amount,
        mediaUrl
      );
      
      return res.status(201).json({
        message: "Financial notification sent successfully",
        count: results.length
      });
    } catch (error) {
      console.error("Financial notification error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
