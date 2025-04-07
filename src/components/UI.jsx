import { useRef, useState, useEffect } from "react";
import { useChat } from "../hooks/useChat";
import ChatDisplay from "./ChatDisplay";
import Carousel from "./Carousel.jsx";

export const UI = ({ hidden, ...props }) => {
  const input = useRef();
  const { chat, loading, cameraZoomed, setCameraZoomed, message } = useChat();
  const [messages, setMessages] = useState([]);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);
  const [carouselImages, setCarouselImages] = useState([]);
  const [keywordsData, setKeywordsData] = useState({});

  useEffect(() => {
    fetch("/keywords.json")
      .then((res) => res.json())
      .then((data) => {
        console.log("Keywords data loaded in UI:", data);
        setKeywordsData(data);
      })
      .catch((err) => console.error("Failed to load keywords.json:", err));
  }, []);

  useEffect(() => {
    if (message && message.text) {
      console.log("Incoming message in UI:", message.text); // Debugging
      const matchedKeyword = Object.entries(keywordsData).find(([keyword]) =>
        message.text.toLowerCase().includes(keyword.toLowerCase())
      );

      if (matchedKeyword) {
        const [keyword, keywordData] = matchedKeyword;
        console.log("Matched keyword in UI:", keyword); // Debugging
        console.log("Keyword data in UI:", keywordData); // Debugging

        if (keywordData.folder && keywordData.images) {
          const { folder, images } = keywordData;
          const imagePaths = images.map((img) => `${folder}/${img}`);
          console.log("Carousel image paths in UI:", imagePaths); // Debugging
          setCarouselImages(imagePaths);
        } else {
          console.log("No folder or images found for the matched keyword in UI."); // Debugging
          setCarouselImages([]);
        }
      } else {
        console.log("No keyword matched the message in UI."); // Debugging
        setCarouselImages([]);
      }
    }
  }, [message, keywordsData]);

  useEffect(() => {
    if (message && message.text) {
      const botMessage = { text: message.text, isUser: false };
      setMessages((prev) => [...prev, botMessage]);
    }
  }, [message]);

  useEffect(() => {
    console.log("Carousel images updated in UI:", carouselImages); // Debugging
  }, [carouselImages]);

  useEffect(() => {
    if ("SpeechRecognition" in window || "webkitSpeechRecognition" in window) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = "fr-FR"; // Set language to French
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        console.log("Speech recognition started");
        setListening(true);
      };

      recognition.onend = () => {
        console.log("Speech recognition ended");
        setListening(false);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        console.log("Recognized speech:", transcript);
        const userMessage = { text: transcript, isUser: true };
        setMessages((prev) => [...prev, userMessage]);
        chat(transcript); // Send the recognized text as a message
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      console.warn("SpeechRecognition API is not supported in this browser.");
    }
  }, [chat]);

  const sendMessage = async () => {
    const text = input.current.value.trim();
    if (text && !loading) {
      const userMessage = { text, isUser: true };
      setMessages((prev) => [...prev, userMessage]);
      chat(text);
      input.current.value = "";
    }
  };

  return (
    <>
      <div className="fixed top-0 left-0 bottom-0 z-10 flex flex-col justify-between p-4">
        {/* Header Section */}
        <div className="self-start backdrop-blur-md bg-black bg-opacity-50 p-4 rounded-lg w-[70%] lg:w-[400px] mb-2">
          <h1 className="font-black text-xl text-center" style={{ color: "#ebb207" }}>
            Bienvenue Sur Neemba.com
          </h1>
          <img
            src="/images/neemba.jpg"
            alt="Logo de Neemba"
            className="mx-auto mt-2 "
          />
        </div>

        {/* Large Screen Vertical Image Section */}
        <div className="hidden lg:block fixed top-0 right-0 bottom-0 w-[500px] p-4">
          <Carousel messages={messages} /> {/* Pass all messages to Carousel */}
        </div>

        {/* Chat Display and Input Section */}
        <div className="flex flex-col flex-grow justify-end w-full lg:w-[400px] mx-auto">
          <div className="chat-container h-[90px] lg:h-[calc(100vh-260px)] w-full mb-1 overflow-y-auto">
            <ChatDisplay messages={messages} />
          </div>

          <div className="flex items-center gap-2 pointer-events-auto w-full">
            {/* 🎤 Micro button */}
            <button
              onMouseDown={() => recognitionRef.current?.start()}
              onMouseUp={() => recognitionRef.current?.stop()}
              className={`bg-gray-200 bg-opacity-50 hover:bg-red-600 bg-opacity-50 text-white p-4 px-4 rounded-md ${
                listening ? "opacity-50" : ""
              }`}
            >
              🎤
            </button>

            <input
              className="w-full lg:w-[90%] placeholder:text-gray-800 placeholder:italic p-4 rounded-md bg-opacity-50 bg-white backdrop-blur-md"
              placeholder="Votre message..."
              ref={input}
              onKeyDown={(e) => {
                if (e.key === "Enter") sendMessage();
              }}
            />

            {/* Send button */}
            <button
              disabled={loading}
              onClick={sendMessage}
              className={`bg-yellow-500 hover:bg-yellow-600 text-white p-4 px-4 rounded-md ${
                loading ? "cursor-not-allowed opacity-30" : ""
              }`}
            >
              📤
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
