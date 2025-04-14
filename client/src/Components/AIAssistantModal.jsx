import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Send, X } from 'lucide-react';
import axios from '../axios';
import toast from 'react-hot-toast';

const AIAssistantModal = ({ isOpen, onClose }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { sender: 'ai', text: t('welcome') },
  ]);
  const [isListening, setIsListening] = useState(false);
  const [language, setLanguage] = useState(i18n.language || 'en');
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);

  // Initialize Speech Recognition (Web Speech API)
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = SpeechRecognition ? new SpeechRecognition() : null;

  useEffect(() => {
    // Check if Speech Recognition is supported in the browser
    if (SpeechRecognition) {
      setIsSpeechSupported(true);
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = language === 'hi' ? 'hi-IN' : 'en-US';

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        handleSendMessage(transcript);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error); // Line 41
        let errorMessage = '';
        if (event.error === 'network') {
          errorMessage = language === 'hi'
            ? 'इंटरनेट कनेक्शन की समस्या। कृपया टेक्स्ट इनपुट का उपयोग करें।'
            : 'Network issue. Please use text input instead.';
        } else {
          errorMessage = language === 'hi'
            ? 'वॉयस रिकग्निशन में त्रुटि। कृपया फिर से कोशिश करें।'
            : 'Error recognizing speech. Please try again.';
        }
        toast.error(errorMessage);
        speak(errorMessage);
        setIsListening(false);
      };
    } else {
      console.warn('Speech recognition is not supported in this browser.');
      setIsSpeechSupported(false);
    }
  }, [language, recognition]);

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    i18n.changeLanguage(lang);
    if (recognition) {
      recognition.lang = lang === 'hi' ? 'hi-IN' : 'en-US';
    }
  };

  const speak = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'hi' ? 'hi-IN' : 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  const handleVoiceInput = () => {
    if (!isSpeechSupported) {
      const errorMessage = language === 'hi'
        ? 'यह ब्राउज़र वॉयस रिकग्निशन का समर्थन नहीं करता। कृपया टेक्स्ट इनपुट का उपयोग करें।'
        : 'This browser does not support speech recognition. Please use text input.';
      toast.error(errorMessage);
      speak(errorMessage);
      return;
    }

    if (!navigator.onLine) {
      const errorMessage = language === 'hi'
        ? 'कोई इंटरनेट कनेक्शन नहीं है। कृपया टेक्स्ट इनपुट का उपयोग करें।'
        : 'No internet connection. Please use text input instead.';
      toast.error(errorMessage);
      speak(errorMessage);
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      recognition.start();
      speak(t('speak'));
    }
  };

  const handleSendMessage = async (messageText) => {
    const text = messageText || input;
    if (!text) return;

    // Add user message to chat
    setMessages((prev) => [...prev, { sender: 'user', text }]);
    setInput('');

    try {
      const res = await axios.post('/api/ai/assist', { input: text, language });
      const { response, action } = res.data;

      // Add AI response to chat
      setMessages((prev) => [...prev, { sender: 'ai', text: response }]);
      speak(response); // Speak the response

      // Execute action if provided (e.g., navigation)
      if (action?.type === 'navigate') {
        navigate(action.path);
        onClose(); // Close the modal after navigation
      }
    } catch (error) {
      console.error('AI Assist Error:', error);
      const errorMessage = language === 'hi'
        ? 'क्षमा करें, कुछ गलत हो गया। कृपया फिर से कोशिश करें।'
        : 'Sorry, something went wrong. Please try again.';
      setMessages((prev) => [...prev, { sender: 'ai', text: errorMessage }]);
      speak(errorMessage);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-white/10 backdrop-blur-md bg-opacity-50 flex items-center justify-center z-50"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="bg-white p-6 rounded-3xl shadow-xl max-w-md w-[90%] max-h-[80vh] flex flex-col"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">AI Assistant</h2>
            <button onClick={onClose} className="text-gray-600 hover:text-gray-800">
              <X size={24} />
            </button>
          </div>

          {/* Language Selector */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('selectLanguage')}
            </label>
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="w-full p-2 border rounded-md"
            >
              <option value="en">English</option>
              <option value="hi">हिन्दी (Hindi)</option>
            </select>
          </div>

          {/* Chat Area */}
          <div className="flex-1 overflow-y-auto mb-4 p-4 border rounded-md bg-gray-50">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`mb-2 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}
              >
                <span
                  className={`inline-block p-2 rounded-lg ${
                    msg.sender === 'user' ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-800'
                  }`}
                >
                  {msg.text}
                </span>
              </div>
            ))}
          </div>

          {/* Input Area */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleVoiceInput}
              className={`p-2 rounded-md ${
                isListening ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-800'
              }`}
              disabled={!isSpeechSupported || !navigator.onLine}
            >
              {isListening ? t('stop') : <Mic size={20} />}
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('typeHere')}
              className="flex-1 p-2 border rounded-md"
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <button
              onClick={() => handleSendMessage()}
              className="p-2 bg-emerald-600 text-white rounded-md"
            >
              <Send size={20} />
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AIAssistantModal;