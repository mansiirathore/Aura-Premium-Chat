const Chat = require('../models/Chat');
const User = require('../models/User');
const Message = require('../models/Message');

const accessChat = async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: 'UserId param not sent with request' });
  }

  try {
    let isChat = await Chat.find({
      isGroup: false,
      $and: [
        { members: { $elemMatch: { $eq: req.user._id } } },
        { members: { $elemMatch: { $eq: userId } } },
      ],
    })
      .populate('members', '-password')
      .populate('admin', '-password');

    if (isChat.length > 0) {
      res.send(isChat[0]);
    } else {
      const chatData = {
        groupName: 'sender',
        isGroup: false,
        members: [req.user._id, userId],
        status: 'requested',
        initiatedBy: req.user._id,
      };

      const createdChat = await Chat.create(chatData);
      const fullChat = await Chat.findOne({ _id: createdChat._id }).populate('members', '-password');
      res.status(201).json(fullChat);
    }
  } catch (error) {
    console.error('Access chat error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const fetchChats = async (req, res) => {
  try {
    let chats = await Chat.find({
      members: { $elemMatch: { $eq: req.user._id } },
      $or: [
        { isGroup: true },
        { status: 'accepted' },
        { $and: [{ status: 'requested' }, { initiatedBy: req.user._id }] }
      ]
    })
      .populate('members', '-password')
      .populate('admin', '-password')
      .sort({ updatedAt: -1 });

    res.json(chats);
  } catch (error) {
    console.error('Fetch chats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteChat = async (req, res) => {
  const { chatId } = req.body;

  if (!chatId) {
    return res.status(400).json({ message: 'ChatId is required' });
  }

  try {
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    if (!chat.members.includes(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to delete this chat' });
    }

    await Chat.findByIdAndDelete(chatId);
    await Message.deleteMany({ chatId });

    const io = req.app.get('socketio');
    if (io) {
      chat.members.forEach(m => {
        io.to(m.toString()).emit('chat_deleted', { chatId });
      });
    }

    res.json({ message: 'Chat and messages deleted successfully' });
  } catch (error) {
    console.error('Delete chat error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const createGroupChat = async (req, res) => {
  const { name, members } = req.body;

  if (!name || !members) {
    return res.status(400).json({ message: 'Please fill all fields' });
  }

  let parsedMembers = [];
  try {
    parsedMembers = typeof members === 'string' ? JSON.parse(members) : members;
  } catch (e) {
    parsedMembers = members;
  }

  if (parsedMembers.length < 1) {
    return res.status(400).json({ message: 'More than 2 users are required to form a group chat' });
  }

  parsedMembers.push(req.user._id);

  try {
    const groupChat = await Chat.create({
      groupName: name,
      members: parsedMembers,
      isGroup: true,
      admin: req.user._id,
    });

    const fullGroupChat = await Chat.findOne({ _id: groupChat._id })
      .populate('members', '-password')
      .populate('admin', '-password');

    res.status(201).json(fullGroupChat);
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const addToGroup = async (req, res) => {
  const { chatId, userId } = req.body;

  if (!chatId || !userId) {
    return res.status(400).json({ message: 'ChatId and UserId are required' });
  }

  try {
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    if (chat.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only admins can add members' });
    }

    if (chat.members.includes(userId)) {
      return res.status(400).json({ message: 'User already in group' });
    }

    const added = await Chat.findByIdAndUpdate(
      chatId,
      { $push: { members: userId } },
      { new: true }
    )
      .populate('members', '-password')
      .populate('admin', '-password');

    const io = req.app.get('socketio');
    if (io) {
      added.members.forEach(m => {
        io.to(m._id.toString()).emit('group_updated', added);
      });
    }

    res.json(added);
  } catch (error) {
    console.error('Add to group error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const removeFromGroup = async (req, res) => {
  const { chatId, userId } = req.body;

  if (!chatId || !userId) {
    return res.status(400).json({ message: 'ChatId and UserId are required' });
  }

  try {
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    const isAdmin = chat.admin.toString() === req.user._id.toString();
    const isSelf = userId.toString() === req.user._id.toString();

    if (!isAdmin && !isSelf) {
      return res.status(403).json({ message: 'Only admins can remove members' });
    }

    const removed = await Chat.findByIdAndUpdate(
      chatId,
      { $pull: { members: userId } },
      { new: true }
    )
      .populate('members', '-password')
      .populate('admin', '-password');

    const io = req.app.get('socketio');
    if (io) {
      removed.members.forEach(m => {
        io.to(m._id.toString()).emit('group_updated', removed);
      });
      io.to(userId.toString()).emit('group_deleted', { chatId });
    }

    res.json(removed);
  } catch (error) {
    console.error('Remove from group error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const renameGroup = async (req, res) => {
  const { chatId, name } = req.body;

  if (!chatId || !name) {
    return res.status(400).json({ message: 'ChatId and name are required' });
  }

  try {
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    if (!chat.members.includes(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const updatedChat = await Chat.findByIdAndUpdate(
      chatId,
      { groupName: name },
      { new: true }
    )
      .populate('members', '-password')
      .populate('admin', '-password');

    const io = req.app.get('socketio');
    if (io) {
      updatedChat.members.forEach(m => {
        io.to(m._id.toString()).emit('group_updated', updatedChat);
      });
    }

    res.json(updatedChat);
  } catch (error) {
    console.error('Rename group error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const leaveOrDeleteGroup = async (req, res) => {
  const { chatId } = req.body;

  if (!chatId) {
    return res.status(400).json({ message: 'ChatId is required' });
  }

  try {
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Group chat not found' });
    }

    if (chat.admin.toString() === req.user._id.toString()) {
      await Chat.findByIdAndDelete(chatId);
      await Message.deleteMany({ chatId });

      const io = req.app.get('socketio');
      if (io) {
        chat.members.forEach(m => {
          io.to(m.toString()).emit('group_deleted', { chatId });
        });
      }

      return res.json({ message: 'Group deleted by admin' });
    } else {
      const updatedChat = await Chat.findByIdAndUpdate(
        chatId,
        { $pull: { members: req.user._id } },
        { new: true }
      )
        .populate('members', '-password')
        .populate('admin', '-password');

      const io = req.app.get('socketio');
      if (io) {
        updatedChat.members.forEach(m => {
          io.to(m._id.toString()).emit('group_updated', updatedChat);
        });
        io.to(req.user._id.toString()).emit('group_deleted', { chatId });
      }

      return res.json({ message: 'Left group successfully', chat: updatedChat });
    }
  } catch (error) {
    console.error('Leave/Delete group error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const fetchChatRequests = async (req, res) => {
  try {
    let requests = await Chat.find({
      members: { $elemMatch: { $eq: req.user._id } },
      isGroup: false,
      status: 'requested',
      initiatedBy: { $ne: req.user._id }
    })
      .populate('members', '-password')
      .populate('admin', '-password')
      .sort({ updatedAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error('Fetch chat requests error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const acceptChat = async (req, res) => {
  const { chatId } = req.body;

  if (!chatId) {
    return res.status(400).json({ message: 'ChatId is required' });
  }

  try {
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    if (!chat.members.includes(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to accept this chat' });
    }

    chat.status = 'accepted';
    await chat.save();

    const fullChat = await Chat.findById(chatId)
      .populate('members', '-password')
      .populate('admin', '-password');

    const io = req.app.get('socketio');
    if (io) {
      fullChat.members.forEach(m => {
        io.to(m._id.toString()).emit('chat_accepted', fullChat);
      });
    }

    res.json(fullChat);
  } catch (error) {
    console.error('Accept chat error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const declineChat = async (req, res) => {
  const { chatId } = req.body;

  if (!chatId) {
    return res.status(400).json({ message: 'ChatId is required' });
  }

  try {
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    if (!chat.members.includes(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to decline this chat' });
    }

    await Chat.findByIdAndDelete(chatId);
    await Message.deleteMany({ chatId });

    const io = req.app.get('socketio');
    if (io) {
      chat.members.forEach(m => {
        io.to(m.toString()).emit('chat_declined', { chatId });
      });
    }

    res.json({ message: 'Chat request declined and deleted' });
  } catch (error) {
    console.error('Decline chat error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  accessChat,
  fetchChats,
  deleteChat,
  createGroupChat,
  addToGroup,
  removeFromGroup,
  renameGroup,
  leaveOrDeleteGroup,
  fetchChatRequests,
  acceptChat,
  declineChat,
};
