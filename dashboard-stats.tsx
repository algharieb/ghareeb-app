import React from "react";
import { storage } from "@/lib/storage";

const DashboardStats: React.FC = () => {
  // Get stats from storage
  const users = storage.getUsers();
  const messages = storage.getMessages();
  
  const hostCount = users.filter(user => user.role === "host").length;
  const activeHostCount = users.filter(user => user.role === "host" && user.isOnline).length;
  
  // Get messages from today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayMessages = messages.filter(
    msg => new Date(msg.timestamp) >= today
  ).length;
  
  // Get financial notifications count
  const financialMessages = messages.filter(
    msg => msg.contentType === "financial"
  ).length;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-card p-4 rounded-lg shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">عدد المضيفين</p>
            <h3 className="text-2xl font-bold">{hostCount}</h3>
          </div>
          <div className="w-12 h-12 rounded-full bg-blue-900/30 flex items-center justify-center">
            <span className="material-icons text-blue-500">people</span>
          </div>
        </div>
      </div>
      
      <div className="bg-card p-4 rounded-lg shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">المضيفين النشطين</p>
            <h3 className="text-2xl font-bold">{activeHostCount}</h3>
          </div>
          <div className="w-12 h-12 rounded-full bg-green-900/30 flex items-center justify-center">
            <span className="material-icons text-green-500">person_outline</span>
          </div>
        </div>
      </div>
      
      <div className="bg-card p-4 rounded-lg shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">رسائل اليوم</p>
            <h3 className="text-2xl font-bold">{todayMessages}</h3>
          </div>
          <div className="w-12 h-12 rounded-full bg-purple-900/30 flex items-center justify-center">
            <span className="material-icons text-purple-500">chat</span>
          </div>
        </div>
      </div>
      
      <div className="bg-card p-4 rounded-lg shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">الحوالات المالية</p>
            <h3 className="text-2xl font-bold">{financialMessages}</h3>
          </div>
          <div className="w-12 h-12 rounded-full bg-yellow-900/30 flex items-center justify-center">
            <span className="material-icons text-yellow-500">payments</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardStats;
