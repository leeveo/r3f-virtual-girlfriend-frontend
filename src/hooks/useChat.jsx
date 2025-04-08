import { createContext, useContext, useEffect, useState } from "react";

const backendUrl =
  import.meta.env.VITE_API_URL || (window.location.hostname === "localhost"
    ? "http://localhost:3000"
    : "https://neemba-backend.vercel.app");

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const chat = async (message) => {
    setLoading(true);
    try {
      const data = await fetch(`${backendUrl}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      });
      const resp = (await data.json()).messages;
      setMessages((prevMessages) => [...prevMessages, ...resp]); // Append new messages
    } catch (error) {
      console.error("Error fetching chat response:", error);
    } finally {
      setLoading(false);
    }
  };
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState();
  const [loading, setLoading] = useState(false);
  const [cameraZoomed, setCameraZoomed] = useState(true);
  const onMessagePlayed = () => {
    setMessages((messages) => messages.slice(1));
  };

  useEffect(() => {
    if (messages.length > 0) {
      setMessage(messages[messages.length - 1]); // Update with the latest message
    } else {
      setMessage(null);
    }
  }, [messages]);

  // Vérifiez si le backend est accessible
  useEffect(() => {
    fetch(`${backendUrl}/`)
      .then((res) => {
        if (!res.ok) {
          console.error("Backend inaccessible. Vérifiez l'URL ou le port.");
        }
      })
      .catch((err) => {
        console.error("Erreur de connexion au backend :", err);
      });
  }, []);

  return (
    <ChatContext.Provider
      value={{
        chat,
        message,
        onMessagePlayed,
        loading,
        cameraZoomed,
        setCameraZoomed,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};
