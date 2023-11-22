import "./App.css";
import OpenAI from "openai";
import React, { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane, faStop } from "@fortawesome/free-solid-svg-icons";
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
  const [isGenerating, setGenerating] = useState(false);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleTextChange = (event) => {
    setText(event.target.value);
  };

  /*const handleStop = () => {
    setGenerating(false);
  };*/

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isGenerating) return;
    // Add the user's message to the messages state
    setMessages((prev) => [...prev, { role: "user", content: text }]);

    setGenerating(true);
    setText("");

    try {
      const stream = await openai.chat.completions.create({
        model: "gpt-3.5-turbo-16k",
        messages: [
          {
            role: "system",
            content:
              "Ты помощник школы Zaman, тебя зовут 'ZamanAI'. Сейчас я дам тебе полную информацию о школе. Проанализируй и запомни всё что тут написано и отвечай мне исходя из этого текста. Ограничь свой ответ максимум в 100 слов. Вот вся информация, которую ты должен знать о школе. Отвечай коротко, но продающе. Дальше я буду спрашивать у тебя вопросы про эту школу и ты должен мне отвечать. Отвечай только об этой школе, её деятельности, сотрудниках и т.п. Если спросят контакты или контакты отдела продаж: Адрес: мкр. “Каргалы” Кенесары хана 56/1, г. Алматы, Республика Казахстан. Контакты: Отдел продаж - +7 (747) 111-26-05, Почта - info@zaman-school.kz, сайт - zaman-school.kz.",
          },
          {
            role: "assistant",
            content: zamanInfo,
          },
          ...messages.slice(-10),
          {
            role: "user",
            content: text,
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
    } catch {
      alert("Что-то пошло не так, попробуйте еще раз");
      setGenerating(false);
    }
    setGenerating(false);
  };

  const handleKeyPress = (event) => {
    if (event.key === "Enter" && !isGenerating) {
      setText("");
      handleSubmit(event);
    }
  };

  return (
    <div className="App">
      <div className="chatBody" id="style-4">
        <img src="assistant.png" alt="assistant" className="imgAssistant" />
        <h1>Виртуальный помощник ZamanAI</h1>
        <div className="chatMessages">
          {messages.map((msg, index) => {
            return (
              <MessageUser
                key={index}
                img={msg.role === "user" ? "teacher.png" : "assistant.png"}
                message={msg.content}
                title={msg.role === "user" ? "You" : "AI Ассистент ZamanAI"}
              />
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <div className="form">
        <input
          type="text"
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyPress}
          placeholder="Чем я могу вам помочь?"
        />
        {isGenerating ? (
          <FontAwesomeIcon className="iconDisabled" icon={faStop} />
        ) : (
          <FontAwesomeIcon
            className="iconSend"
            icon={faPaperPlane}
            onClick={handleSubmit}
          />
        )}
      </div>
    </div>
  );
}

export default App;
