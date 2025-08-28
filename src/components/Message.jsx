import React from 'react';

const Message = ({ message, isOwn }) => {
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className={`message ${isOwn ? 'own-message' : 'other-message'}`}>
      <div className="message-content">
        <p>{message.text}</p>
        <span className="message-time">
          {formatTime(message.created_at)}
        </span>
      </div>
    </div>
  );
};

export default Message;