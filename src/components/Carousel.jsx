import React, { useEffect, useState } from "react";

const Carousel = ({ messages }) => {
  const [keywordsData, setKeywordsData] = useState({});
  const [carouselItems, setCarouselItems] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Load keywords.json on mount
  useEffect(() => {
    fetch("/keywords.json")
      .then((res) => res.json())
      .then((data) => {
        console.log("✅ Keywords loaded:", data);
        setKeywordsData(data);
      })
      .catch((err) => console.error("❌ Error loading keywords.json:", err));
  }, []);

  // Process the last bot message and update carousel items
  useEffect(() => {
    if (!messages || messages.length === 0 || Object.keys(keywordsData).length === 0) {
      console.log("🔵 No messages or keywords to process.");
      return; // No messages or keywords to process
    }

    const lastBotMessage = [...messages].reverse().find((msg) => !msg.isUser);
    const lastText = lastBotMessage?.text || "";

    if (!lastText) {
      console.log("🔵 No valid bot message to process.");
      return; // No valid bot message to process
    }

    console.log("🔍 Processing last bot message:", lastText);

    const matchedKeyword = Object.entries(keywordsData).find(
      ([keyword, data]) =>
        data.target === "carousel" && // Ensure the keyword targets the carousel
        lastText.toLowerCase().includes(keyword.toLowerCase())
    );

    if (matchedKeyword) {
      const [keyword, keywordData] = matchedKeyword;
      console.log("🟡 Matched keyword for carousel:", keyword);

      if (keywordData.folder && Array.isArray(keywordData.images)) {
        // Multiple images with captions
        const items = keywordData.images.map((img) => ({
          src: `${keywordData.folder}/${img.src}`,
          caption: img.caption || "No caption available",
        }));
        console.log("🟢 Setting carousel items:", items);
        setCarouselItems(items);
        setCurrentImageIndex(0); // Reset to the first image
      } else if (keywordData.image) {
        // Single image
        const item = [{ src: keywordData.image, caption: keywordData.text || "No caption available" }];
        console.log("🟢 Setting single carousel item:", item);
        setCarouselItems(item);
        setCurrentImageIndex(0); // Reset to the first image
      }
    } else {
      console.log("🔵 No matching keyword for carousel.");
    }
  }, [messages, keywordsData]);

  const handleDotClick = (index) => {
    setCurrentImageIndex(index);
  };

  // Render the carousel
  if (!carouselItems || carouselItems.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 bg-opacity-20">
        No images to display
      </div>
    );
  }

  return (
    <div className="h-full rounded-lg backdrop-blur-md bg-white bg-opacity-20 overflow-hidden relative">
      <div className="h-3/4">
        <img
          src={carouselItems[currentImageIndex].src}
          alt={`Image ${currentImageIndex + 1}`}
          className="w-full h-full object-cover rounded-t-lg"
        />
      </div>
      <div className="p-4 text-center bg-opacity-20 text-black">
        {/* Render formatted captions */}
        {Array.isArray(carouselItems[currentImageIndex].caption) ? (
          carouselItems[currentImageIndex].caption.map((item, idx) => {
            if (item.type === "title") {
              return (
                <h2 key={idx} className="text-md font-bold mb-2">
                  {item.content}
                </h2>
              );
            }
            if (item.type === "paragraph") {
              return (
                <p key={idx} className="text-sm mb-2">
                  {item.content}
                </p>
              );
            }
            return null;
          })
        ) : (
          <p className="text-lg font-medium">{carouselItems[currentImageIndex].caption}</p>
        )}
      </div>
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
        {carouselItems.map((_, index) => (
          <button
            key={index}
            onClick={() => handleDotClick(index)}
            className={`w-3 h-3 rounded-full ${
              currentImageIndex === index ? "bg-blue-500" : "bg-gray-300"
            }`}
          ></button>
        ))}
      </div>
    </div>
  );
};

export default Carousel;
