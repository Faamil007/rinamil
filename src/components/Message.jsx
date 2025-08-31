import React from 'react';

const Message = ({ message, isOwn, currentUser, otherUser }) => {
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getSenderName = () => {
    if (isOwn) return 'You';
    return otherUser?.name || 'Unknown';
  };

  return (
    <div className={`message ${isOwn ? 'own-message' : 'other-message'}`}>
      <div className="message-content">
        {!isOwn && <div className="sender-name">{getSenderName()}</div>}
        <p>{message.text}</p>
        <span className="message-time">
          {formatTime(message.created_at)}
        </span>
      </div>
    </div>
  );
};

export default Message;