const User = require('../models/User');
const Message = require('../models/Message');

const activeUsers = new Map(); // maps userId -> socketId

const socketHandler = (io) => {
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Online status event
    socket.on('online', async (userId) => {
      if (!userId) return;
      
      activeUsers.set(userId, socket.id);
      socket.userId = userId;
      
      socket.join(userId);

      try {
        await User.findByIdAndUpdate(userId, { status: 'online' });
        socket.broadcast.emit('user_online', { userId });
        // Emit list of currently online user IDs to the connecting client
        socket.emit('get_online_users', Array.from(activeUsers.keys()));
        console.log(`User ${userId} is online. Socket: ${socket.id}`);
      } catch (error) {
        console.error('Socket online error:', error);
      }
    });

    // Join chat room
    socket.on('join_chat', (chatId) => {
      socket.join(chatId);
      console.log(`Socket ${socket.id} joined chat: ${chatId}`);
    });

    // Leave chat room
    socket.on('leave_chat', (chatId) => {
      socket.leave(chatId);
      console.log(`Socket ${socket.id} left chat: ${chatId}`);
    });

    // Typing status
    socket.on('typing', (data) => {
      socket.to(data.chatId).emit('typing', data);
    });

    socket.on('stop_typing', (data) => {
      socket.to(data.chatId).emit('stop_typing', data);
    });

    // Message sent
    socket.on('send_message', (message) => {
      const chat = message.chatId;
      if (!chat) return;

      socket.to(chat._id).emit('receive_message', message);

      if (chat.members) {
        chat.members.forEach((member) => {
          const memberId = typeof member === 'object' ? member._id.toString() : member.toString();
          if (memberId !== message.sender._id.toString()) {
            io.to(memberId).emit('notification', {
              chatId: chat._id,
              senderName: message.sender.name,
              content: message.content || 'Sent an attachment',
              isGroup: chat.isGroup,
              groupName: chat.groupName
            });
          }
        });
      }
    });

    // Message edited
    socket.on('edit_message', (message) => {
      const chatId = message.chatId._id || message.chatId;
      socket.to(chatId).emit('message_updated', message);
    });

    // Message deleted
    socket.on('delete_message', (message) => {
      const chatId = message.chatId._id || message.chatId;
      socket.to(chatId).emit('message_deleted', message);
    });

    // Message seen
    socket.on('message_seen', async (data) => {
      const { chatId, userId } = data;
      if (!chatId || !userId) return;

      try {
        await Message.updateMany(
          { chatId, seenBy: { $ne: userId } },
          { $push: { seenBy: userId } }
        );

        socket.to(chatId).emit('message_seen', { chatId, userId });
      } catch (error) {
        console.error('Socket message seen error:', error);
      }
    });

    // Disconnect
    socket.on('disconnect', async () => {
      console.log(`Socket disconnected: ${socket.id}`);
      if (socket.userId) {
        const userId = socket.userId;
        activeUsers.delete(userId);
        
        try {
          const lastSeen = new Date();
          await User.findByIdAndUpdate(userId, {
            status: 'offline',
            lastSeen: lastSeen,
          });
          
          socket.broadcast.emit('user_offline', { userId, lastSeen });
          console.log(`User ${userId} went offline.`);
        } catch (error) {
          console.error('Socket offline on disconnect error:', error);
        }
      }
    });
  });
};

module.exports = { socketHandler, activeUsers };
