import React from "react";
import { useChat } from "../hooks/useChat"; // Corrected import path

const ChatDisplay = () => {
  const { message, loading } = useChat();

  if (loading) {
    return <div>laisser moi un instant ...</div>;
  }

  if (!message) {
    return <div>BIenvenue sur Neemba.com !</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.textContainer}>
        <p style={styles.text}>{message.text}</p>
      </div>
      {message.Image && (
        <div style={styles.imageContainer}>
          <img src={message.Image} alt="Message visual" style={styles.image} /> {/* Display  image */}
        </div>
      )}
      {message.Source && (
        <div style={styles.sourceContainer}>
          <a
            href={message.Source}
            target="_blank"
            rel="noopener noreferrer"
            style={styles.source}
          >
            {message.Source} {/* Display  source URL */}
          </a>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    border: "1px solid #ccc",
    borderRadius: "8px",
    padding: "16px",
    margin: "16px 0",
    backgroundColor: "#f9f9f9",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
  },
  textContainer: {
    marginBottom: "12px",
  },
  text: {
    fontSize: "16px",
    color: "#333",
  },
  imageContainer: {
    textAlign: "center",
    marginBottom: "12px",
  },
  image: {
    maxWidth: "100%",
    borderRadius: "8px",
  },
  sourceContainer: {
    textAlign: "right",
    pointerEvents: "auto", // Ensure pointer events are enabled
  },
  source: {
    fontSize: "14px",
    color: "#007BFF",
    textDecoration: "underline", // Ensure the link is visually distinct
    cursor: "pointer", // Add pointer cursor for better UX
    wordBreak: "break-word", // Handle long URLs gracefully
  },
};

export default ChatDisplay;