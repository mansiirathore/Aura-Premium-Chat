const Message = require('../models/Message');
const Chat = require('../models/Chat');
const User = require('../models/User');

const sendMessage = async (req, res) => {
  const { chatId, content, messageType } = req.body;

  if (!chatId) {
    return res.status(400).json({ message: 'ChatId is required' });
  }

  try {
    let type = messageType || 'text';
    let fileUrl = '';

    if (req.file) {
      if (process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_CLOUD_NAME) {
        fileUrl = req.file.path;
      } else {
        fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
      }
      
      const mime = req.file.mimetype;
      if (mime.startsWith('image/')) {
        type = 'image';
      } else {
        type = 'file';
      }
    }

    if (type === 'text' && !content) {
      return res.status(400).json({ message: 'Message content cannot be empty' });
    }

    const newMessage = {
      chatId,
      sender: req.user._id,
      content: type === 'text' ? content : '',
      messageType: type,
      image: type === 'image' ? fileUrl : '',
      file: type === 'file' ? fileUrl : '',
      seenBy: [req.user._id],
    };

    let message = await Message.create(newMessage);
    
    await Chat.findByIdAndUpdate(chatId, { updatedAt: Date.now() });

    message = await Message.findById(message._id)
      .populate('sender', 'name avatar email')
      .populate({
        path: 'chatId',
        populate: {
          path: 'members',
          select: 'name avatar email',
        },
      });

    res.status(201).json(message);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const allMessages = async (req, res) => {
  try {
    const messages = await Message.find({ chatId: req.params.chatId })
      .populate('sender', 'name avatar email')
      .populate('chatId');

    await Message.updateMany(
      { chatId: req.params.chatId, seenBy: { $ne: req.user._id } },
      { $push: { seenBy: req.user._id } }
    );

    res.json(messages);
  } catch (error) {
    console.error('Fetch messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const editMessage = async (req, res) => {
  const { messageId, content } = req.body;

  if (!messageId || !content) {
    return res.status(400).json({ message: 'MessageId and content are required' });
  }

  try {
    let message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only edit your own messages' });
    }

    if (message.messageType !== 'text') {
      return res.status(400).json({ message: 'Only text messages can be edited' });
    }

    message.content = content;
    message.edited = true;
    await message.save();

    message = await Message.findById(messageId)
      .populate('sender', 'name avatar email')
      .populate('chatId');

    res.json(message);
  } catch (error) {
    console.error('Edit message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteMessage = async (req, res) => {
  const { messageId } = req.body;

  if (!messageId) {
    return res.status(400).json({ message: 'MessageId is required' });
  }

  try {
    let message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only delete your own messages' });
    }

    message.deleted = true;
    message.content = 'This message was deleted';
    message.image = '';
    message.file = '';
    await message.save();

    message = await Message.findById(messageId)
      .populate('sender', 'name avatar email')
      .populate('chatId');

    res.json(message);
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  sendMessage,
  allMessages,
  editMessage,
  deleteMessage,
};
