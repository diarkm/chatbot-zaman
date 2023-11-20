import "./App.css";
import OpenAI from "openai";
import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import DOMPurify from "dompurify";

import zamanInfo from "./Prompts/mainInfo";

const openai = new OpenAI({
  organization: process.env.REACT_APP_ORGANIZATION,
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

const MessageUser = ({ img, message, title }) => {
  const sanitizedHTML = DOMPurify.sanitize(message);

  return (
    <div className="message">
      <div className="messageUserIcon">
        <img src={img} alt="" />
      </div>
      <div className="messageContent">
        <p className="messageTitle">{title}</p>
        <div dangerouslySetInnerHTML={{ __html: sanitizedHTML }} />
      </div>
    </div>
  );
};

function App() {
  const [text, setText] = useState("");
  const [messages, setMessages] = useState([]);

  const handleTextChange = (event) => {
    setText(event.target.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Add the user's message to the messages state
    setMessages((prev) => [...prev, { role: "user", content: text }]);

    const stream = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content:
            "(Answer only in HTML markup! Do not mension about all within this brackets in your response)" +
            "Ты помощник школы Zaman, отвечай только на вопросы связанные с этой школой. Ограничь свой ответ максимум в 100 слов. Вот вся информация, которую ты должен знать о школе. Отвечай коротко, но продающе. Если вопрос не связан со школы, напиши: 'Я могу помочь вам, только с тем, чтобы узнать получше школу Zaman'. Вот информация про школу: " +
            zamanInfo +
            text,
        },
      ],
      stream: true,
    });

    for await (const part of stream) {
      if (part.choices[0].delta.content) {
        setMessages((prev) => {
          // Check if the last message is from the assistant
          const lastMessage = prev[prev.length - 1];
          if (lastMessage && lastMessage.role === "assistant") {
            // Update the last message
            return prev.slice(0, -1).concat({
              ...lastMessage,
              content: lastMessage.content + part.choices[0].delta.content,
            });
          } else {
            // Add a new message
            return prev.concat({
              role: "assistant",
              content: part.choices[0].delta.content,
            });
          }
        });
      }
    }
    setText("");
  };

  return (
    <div className="App">
      <div className="chatBody" id="style-4">
        <img src="assistant.png" alt="assistant" className="imgAssistant" />
        <h1>Виртуальный помощник Zaman</h1>
        <div className="chatMessages">
          {messages.map((msg, index) => {
            return (
              <MessageUser
                key={index}
                img={msg.role === "user" ? "teacher.png" : "assistant.png"}
                message={msg.content}
                title={msg.role === "user" ? "You" : "AI Ассистент Zaman"}
              />
            );
          })}
        </div>
      </div>
      <div className="form">
        <input
          type="text"
          value={text}
          onChange={handleTextChange}
          placeholder="Чем я могу вам помочь?"
        />
        <FontAwesomeIcon
          className="iconSend"
          icon={faPaperPlane}
          onClick={handleSubmit}
        />
      </div>
    </div>
  );
}

export default App;
