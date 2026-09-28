import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, User, Sparkles } from "lucide-react";
import { useChat } from "../hooks/useChat";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import "../styles/ChatWidget.css";

// Import images
import botIdle from "../../../assets/chatbot/bot-idle.png";
import botGreeting from "../../../assets/chatbot/bot-greeting.png";
import botThinking from "../../../assets/chatbot/bot-thinking.png";
import botTyping from "../../../assets/chatbot/bot-typing.png";
import botSuccess from "../../../assets/chatbot/bot-success.png";
import botError from "../../../assets/chatbot/bot-error.png";

const AVATARS = {
  idle: botIdle,
  greeting: botGreeting,
  thinking: botThinking,
  typing: botTyping,
  success: botSuccess,
  error: botError,
};

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const { messages, input, setInput, isLoading, sendMessage, messagesEndRef, botState } = useChat();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="chat-widget-container">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="chat-panel"
          >
            {/* Header */}
            <div className="chat-header">
              <div className="header-info">
                <div className="bot-avatar header-avatar">
                  <img src={AVATARS[botState] || AVATARS.idle} alt="MDA Avatar" className="bot-avatar-img" />
                  <span className={`status-dot ${botState}`}></span>
                </div>
                <div className="header-text">
                  <h3>
                    MDA Assistant <Sparkles className="sparkle-icon" />
                  </h3>
                  <p>Powered by Zenith AI</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="close-btn"
              >
                <X size={20} />
              </button>
            </div>

            {/* Chat Area */}
            <div className="chat-area">
              {messages.map((msg, index) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={msg.id}
                  className={`message-row ${msg.role === "user" ? "user" : "assistant"}`}
                >
                  <div className="message-content">
                    <div className={`msg-avatar ${msg.role === "user" ? "user" : "assistant"}`}>
                      {msg.role === "user" ? (
                        <User size={16} color="white" />
                      ) : (
                        <img src={AVATARS.idle} alt="MDA" className="msg-bot-img" />
                      )}
                    </div>
                    
                    <div className="msg-bubble">
                      {msg.role === "assistant" ? (
                        !msg.content && isLoading && index === messages.length - 1 ? (
                          <div className="loading-dots">
                            <motion.div className="dot" animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} />
                            <motion.div className="dot" animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }} />
                            <motion.div className="dot" animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }} />
                          </div>
                        ) : (
                          <div className="markdown-body">
                            <ReactMarkdown
                              components={{
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                code({ inline, className, children, ...props }: any) {
                                  const match = /language-(\w+)/.exec(className || "");
                                  return !inline && match ? (
                                    <SyntaxHighlighter
                                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                      style={vscDarkPlus as any}
                                      language={match[1]}
                                      PreTag="div"
                                      {...props}
                                    >
                                      {String(children).replace(/\n$/, "")}
                                    </SyntaxHighlighter>
                                  ) : (
                                    <code {...props}>
                                      {children}
                                    </code>
                                  );
                                },
                                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                                a: ({ node, ...props }) => <a target="_blank" rel="noopener noreferrer" {...props} />
                              }}
                            >
                              {msg.content}
                            </ReactMarkdown>
                          </div>
                        )
                      ) : (
                        <p>{msg.content}</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="input-area">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage();
                }}
                className="input-form"
              >
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Hỏi MDA bất cứ điều gì về Sang..."
                  className="chat-input"
                  rows={input.split("\n").length > 1 ? Math.min(input.split("\n").length, 4) : 1}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="send-btn"
                >
                  <Send size={20} />
                </button>
              </form>
              <div className="disclaimer">
                <span>MDA có thể đưa ra thông tin chưa chính xác. Vui lòng kiểm tra lại.</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fab-button"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X size={24} />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ width: "100%", height: "100%", padding: 0 }}
            >
              <img 
                src={AVATARS.idle} 
                alt="Open Chat" 
                style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "contain", filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.3))" }} 
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
