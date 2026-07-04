const User = require('../models/User');
const Message = require('../models/Message');

const getStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({});
    const activeUsers = await User.countDocuments({ status: 'online' });
    const totalMessages = await Message.countDocuments({});

    const textMessages = await Message.countDocuments({ messageType: 'text' });
    const imageMessages = await Message.countDocuments({ messageType: 'image' });
    const fileMessages = await Message.countDocuments({ messageType: 'file' });

    res.json({
      totalUsers,
      activeUsers,
      totalMessages,
      analytics: {
        text: textMessages,
        image: imageMessages,
        file: fileMessages,
      },
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ message: 'Server error loading admin stats' });
  }
};

const getUsersList = async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error('Admin get users error:', error);
    res.status(500).json({ message: 'Server error loading users list' });
  }
};

const toggleBanUser = async (req, res) => {
  const targetUserId = req.params.id;

  if (targetUserId.toString() === req.user._id.toString()) {
    return res.status(400).json({ message: 'You cannot ban yourself' });
  }

  try {
    const user = await User.findById(targetUserId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.banned = !user.banned;
    
    if (user.banned) {
      user.status = 'offline';
      
      // Disconnect socket connections in real-time
      const io = req.app.get('socketio');
      if (io) {
        const userRoom = targetUserId.toString();
        io.to(userRoom).emit('banned');
        const socketsInRoom = io.sockets.adapter.rooms.get(userRoom);
        if (socketsInRoom) {
          const socketIds = Array.from(socketsInRoom);
          socketIds.forEach(socketId => {
            const socket = io.sockets.sockets.get(socketId);
            if (socket) {
              socket.disconnect(true);
            }
          });
        }
      }
    }

    await user.save();

    res.json({
      message: `User ${user.name} has been ${user.banned ? 'banned' : 'unbanned'}`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        banned: user.banned,
        status: user.status,
      },
    });
  } catch (error) {
    console.error('Admin toggle ban error:', error);
    res.status(500).json({ message: 'Server error toggling ban state' });
  }
};

const moderateMessage = async (req, res) => {
  const messageId = req.params.id;

  try {
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    await Message.findByIdAndDelete(messageId);

    res.json({ message: 'Message moderated and deleted successfully', messageId });
  } catch (error) {
    console.error('Admin moderate message error:', error);
    res.status(500).json({ message: 'Server error deleting message' });
  }
};

module.exports = {
  getStats,
  getUsersList,
  toggleBanUser,
  moderateMessage,
};
