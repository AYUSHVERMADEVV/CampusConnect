import React, { useEffect, useRef, useState } from "react";
import API from "./api";
import "./chat.css";

function formatMessageTime(dateStr) {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function ChatPage({ chatUser, currentUser, onBack }) {
  const chatUserId = chatUser?._id || chatUser?.id;
  const currentUserId = currentUser?._id || currentUser?.id;

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(() => Boolean(chatUserId));
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const scrollToBottom = (behavior = "smooth") => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior });
    }
  };

  // Fetch conversation on mount or when chatUser changes
  useEffect(() => {
    let isMounted = true;

    if (!chatUserId) {
      return;
    }

    const fetchConversation = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await API.get(`/messages/${chatUserId}`);
        if (isMounted) {
          setMessages(response.data?.messages || []);
          setTimeout(() => scrollToBottom("auto"), 50);
        }
      } catch (err) {
        if (isMounted) {
          console.error("Failed to fetch conversation:", err);
          setError(
            err.response?.data?.message ||
              "Unable to load conversation. Please try again."
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchConversation();

    return () => {
      isMounted = false;
    };
  }, [chatUserId]);

  // Scroll to bottom when messages list changes
  useEffect(() => {
    scrollToBottom("smooth");
  }, [messages.length]);

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();

    const trimmed = inputText.trim();
    if (!trimmed || sending || !chatUserId) return;

    setSending(true);
    setError("");

    try {
      const response = await API.post("/messages", {
        receiver: chatUserId,
        content: trimmed,
      });

      const newMsg =
        response.data?.data ||
        response.data?.messageDoc || {
          _id: "temp_" + Date.now(),
          sender: currentUser,
          receiver: chatUser,
          content: trimmed,
          createdAt: new Date().toISOString(),
        };

      setMessages((prev) => [...prev, newMsg]);
      setInputText("");

      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }

      setTimeout(() => scrollToBottom("smooth"), 50);
    } catch (err) {
      console.error("Failed to send message:", err);
      setError(
        err.response?.data?.message ||
          "Could not send message. Please check your connection."
      );
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTextChange = (e) => {
    setInputText(e.target.value);
    // Auto adjust height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        120
      )}px`;
    }
  };

  const isSentByMe = (msg) => {
    const senderId = (msg.sender?._id || msg.sender)?.toString();
    if (currentUserId && senderId) {
      return senderId === currentUserId.toString();
    }
    if (chatUserId && senderId) {
      return senderId !== chatUserId.toString();
    }
    return false;
  };

  if (!chatUser) {
    return (
      <section className="chat-page">
        <div className="chat-header">
          <button type="button" className="chat-back-button" onClick={onBack}>
            ← Back
          </button>
        </div>
        <div className="chat-empty-state">
          <p>No user selected for messaging.</p>
        </div>
      </section>
    );
  }

  const initialLetter = (chatUser.name || "U").charAt(0).toUpperCase();

  return (
    <section className="chat-page">
      {/* Header */}
      <header className="chat-header">
        <div className="chat-header-left">
          <button
            type="button"
            className="chat-back-button"
            onClick={onBack}
            aria-label="Back to Profile"
          >
            ← Back
          </button>

          <div className="chat-user-profile">
            <div className="chat-avatar">{initialLetter}</div>

            <div className="chat-user-meta">
              <h2>{chatUser.name}</h2>
              <div className="chat-user-subtitle">
                {chatUser.college && <span>{chatUser.college}</span>}
                {chatUser.role && (
                  <span className="chat-user-badge">{chatUser.role}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Messages Feed */}
      <div className="chat-messages-container">
        {error && (
          <div className="chat-error-banner">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        )}

        {loading ? (
          <div className="chat-loading-state">
            <div className="chat-spinner" />
            <p>Loading conversation...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="chat-empty-state">
            <div className="chat-empty-icon">💬</div>
            <h3>No messages yet. Start the conversation.</h3>
            <p>
              Say hello to {chatUser.name} to connect and collaborate on campus
              projects.
            </p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const sent = isSentByMe(msg);
            const key = msg._id || index;
            const time = formatMessageTime(msg.createdAt);

            return (
              <div
                key={key}
                className={`chat-message-row ${sent ? "sent" : "received"}`}
              >
                <div className="chat-bubble">{msg.content}</div>
                {time && <span className="chat-timestamp">{time}</span>}
              </div>
            );
          })
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Composer */}
      <div className="chat-composer-container">
        <form className="chat-form" onSubmit={handleSendMessage}>
          <div className="chat-textarea-wrapper">
            <textarea
              ref={textareaRef}
              rows={1}
              value={inputText}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              placeholder={`Write a message to ${chatUser.name || "peer"}...`}
              className="chat-input"
              disabled={sending}
            />
          </div>

          <button
            type="submit"
            className="chat-send-button"
            disabled={!inputText.trim() || sending}
            aria-label="Send message"
          >
            {sending ? (
              "Sending..."
            ) : (
              <>
                <span>Send</span>
                <svg viewBox="0 0 24 24">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </>
            )}
          </button>
        </form>
      </div>
    </section>
  );
}

export default ChatPage;
