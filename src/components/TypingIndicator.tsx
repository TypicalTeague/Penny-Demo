import React from 'react';

export const TypingIndicator: React.FC = () => {
  return (
    <div className="flex items-end mb-3 ml-2 animate-fade-in">
      <div className="bg-[#E9E9EB] text-black px-4 py-3 rounded-[20px] rounded-bl-[6px] shadow-xs flex items-center space-x-1.5 h-9">
        <span className="w-2 h-2 rounded-full bg-[#8E8E93] animate-bounce [animation-delay:-0.3s]"></span>
        <span className="w-2 h-2 rounded-full bg-[#8E8E93] animate-bounce [animation-delay:-0.15s]"></span>
        <span className="w-2 h-2 rounded-full bg-[#8E8E93] animate-bounce"></span>
      </div>
    </div>
  );
};
