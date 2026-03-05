import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Send, Sparkles, AlertTriangle, Fuel, MoreVertical, Trash2, Mic, MicOff, Volume2, VolumeX, Car } from 'lucide-react';
import { fetchVehicles } from '../services/firestoreService';
import { chatWithVehicle } from '../services/geminiService';
import { Vehicle } from '../types';
import { toast } from '../services/toast';

interface Message {
  id: string;
  sender: 'user' | 'car';
  text: string;
  timestamp: Date;
}

export const CarChat: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const { t, i18n } = useTranslation();
  
  const [vehicle, setVehicle] = useState<Vehicle | undefined>(undefined);
  
  useEffect(() => {
      fetchVehicles().then(vehicles => {
          setVehicle(vehicles.find(v => v.id === id));
      });
  }, [id]);
  
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  
  // Voice State
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Text-to-Speech Helper
  const speakText = (text: string) => {
      if (!isSpeakerOn || !window.speechSynthesis) return;
      
      // Stop previous speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = i18n.language === 'en' ? 'en-US' : 'tr-TR';
      
      // Adjust voice pitch/rate based on vehicle type roughly
      if (vehicle?.year && vehicle.year < 2000) {
           utterance.pitch = 0.8; // Deeper voice for older cars
           utterance.rate = 0.9;
      } else {
           utterance.pitch = 1.0;
           utterance.rate = 1.1; // Faster for modern cars
      }

      window.speechSynthesis.speak(utterance);
  };

  // Initialize with a greeting if empty
  useEffect(() => {
    if (vehicle && messages.length === 0) {
       setIsTyping(true);
       setTimeout(() => {
           const initialGreeting = vehicle.status === 'Servis Gerekli' 
             ? t('car_chat.greeting_maint', { mileage: vehicle.mileage.toLocaleString() })
             : t('car_chat.greeting_ok');
           
           setMessages([{
               id: 'init',
               sender: 'car',
               text: initialGreeting,
               timestamp: new Date()
           }]);
           
           setIsTyping(false);
       }, 1000);
    }
  }, [vehicle]);

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  if (!vehicle) return <div>{t('car_chat.not_found')}</div>;

  const startRecording = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;
        audioChunksRef.current = [];

        recorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunksRef.current.push(event.data);
            }
        };

        recorder.onstop = () => {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            const reader = new FileReader();
            reader.readAsDataURL(audioBlob);
            reader.onloadend = () => {
                const base64Audio = (reader.result as string).split(',')[1];
                handleSend(undefined, base64Audio);
            };
            // Stop all tracks to release mic
            stream.getTracks().forEach(track => track.stop());
        };

        recorder.start();
        setIsRecording(true);
    } catch (err) {
        console.error("Error accessing microphone:", err);
        toast.error(t('car_chat.mic_error'));
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
    }
  };

  const handleSend = async (textOverride?: string, audioBase64?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim() && !audioBase64) return;

    const userMsg: Message = {
        id: Date.now().toString(),
        sender: 'user',
        text: audioBase64 ? t('car_chat.voice_msg') : textToSend,
        timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Prepare history (using text representation for chat context)
    const history = messages.map(m => ({
        role: m.sender === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
    }));

    try {
        const responseText = await chatWithVehicle(
            audioBase64 ? '' : textToSend, 
            vehicle, 
            history,
            audioBase64
        );
        
        const carMsg: Message = {
            id: (Date.now() + 1).toString(),
            sender: 'car',
            text: responseText || '...',
            timestamp: new Date()
        };
        setMessages(prev => [...prev, carMsg]);
        
        // Speak the response
        if (responseText) speakText(responseText);

    } catch (error) {
        console.error(error);
    } finally {
        setIsTyping(false);
    }
  };

  const clearChat = () => {
      if(window.confirm(t('car_chat.confirm_clear'))) {
          setMessages([]);
          navigate(-1);
      }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950">
      {/* Header */}
      <header className="flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800 shadow-lg z-10">
         <div className="flex items-center space-x-3">
             <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-slate-800 text-slate-300 transition">
                 <ChevronLeft size={24} />
             </button>
             <div className="relative">
                 <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)] flex items-center justify-center bg-slate-800">
                     {vehicle.image ? (
                         <img src={vehicle.image} alt={vehicle.model} className="w-full h-full object-cover" />
                     ) : (
                         <Car size={20} className="text-slate-600" />
                     )}
                 </div>
                 <div className="absolute -bottom-1 -right-1 bg-green-500 w-3.5 h-3.5 rounded-full border-2 border-slate-900"></div>
             </div>
             <div>
                 <h1 className="font-bold text-white text-base leading-tight">{vehicle.model}</h1>
                 <div className="flex items-center text-[10px] space-x-1.5">
                     <span className="text-blue-400 font-medium">{t('car_chat.ai')}</span>
                     <span className="text-slate-600">•</span>
                     <span className="text-slate-400">{vehicle.mileage.toLocaleString()} km</span>
                 </div>
             </div>
         </div>
         <div className="flex items-center space-x-1">
             <button onClick={() => setIsSpeakerOn(!isSpeakerOn)} className="p-2 text-slate-400 hover:text-white transition">
                 {isSpeakerOn ? <Volume2 size={20} /> : <VolumeX size={20} />}
             </button>
             <button onClick={clearChat} className="p-2 text-slate-500 hover:text-red-400 transition">
                 <Trash2 size={20} />
             </button>
         </div>
      </header>

      {/* Chat Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] bg-fixed relative"
      >
          <div className="text-center py-4">
              <span className="bg-slate-800/80 text-slate-400 text-[10px] px-3 py-1 rounded-full border border-slate-700">
                  Konuşma uçtan uca şifrelenmiştir. Araba sır tutar. 🤫
              </span>
          </div>

          {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                  <div className={`max-w-[80%] rounded-2xl p-4 shadow-md text-sm leading-relaxed relative group ${
                      msg.sender === 'user' 
                      ? 'bg-blue-600 text-white rounded-tr-none' 
                      : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-none'
                  }`}>
                      {msg.text}
                      <span className={`text-[9px] absolute bottom-1 ${msg.sender === 'user' ? 'left-2 text-blue-200' : 'right-2 text-slate-500'} opacity-0 group-hover:opacity-100 transition-opacity`}>
                          {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                  </div>
              </div>
          ))}

          {isTyping && (
              <div className="flex justify-start">
                  <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-tl-none p-4 flex items-center space-x-1.5 w-16 h-12 shadow-md">
                      <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-75"></div>
                      <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-150"></div>
                  </div>
              </div>
          )}

          {/* Listening Overlay */}
          {isRecording && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
                  <div className="flex flex-col items-center">
                      <div className="relative">
                          <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mb-6 border-2 border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.5)] z-10 relative">
                              <Mic size={40} className="text-red-500" />
                          </div>
                          <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-30"></div>
                      </div>
                      <span className="text-white font-bold text-lg animate-pulse">{t('car_chat.recording')}</span>
                      <p className="text-slate-400 text-xs mt-2">{t('car_chat.release_to_send')}</p>
                  </div>
              </div>
          )}
      </div>

      {/* Input Area */}
      <div className="p-3 bg-slate-900 border-t border-slate-800 pb-safe">
          <div className="flex items-center space-x-2 bg-slate-800 p-1.5 rounded-full border border-slate-700 focus-within:border-blue-500/50 transition-colors shadow-lg">
              <div className="p-2 bg-slate-700/50 rounded-full text-slate-400 cursor-not-allowed">
                  <Sparkles size={20} />
              </div>
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={isRecording ? t('car_chat.listening') : t('car_chat.chat_ph', { model: vehicle.model })}
                className="flex-1 bg-transparent text-white placeholder-slate-500 text-sm outline-none px-2"
                disabled={isRecording}
              />
              
              {input.trim() ? (
                  <button 
                    onClick={() => handleSend()}
                    disabled={isTyping}
                    className="p-3 rounded-full transition-all transform active:scale-95 bg-blue-600 text-white shadow-lg shadow-blue-900/40"
                  >
                      <Send size={18} className="translate-x-0.5" />
                  </button>
              ) : (
                  <button 
                    onMouseDown={startRecording}
                    onMouseUp={stopRecording}
                    onTouchStart={(e) => { e.preventDefault(); startRecording(); }}
                    onTouchEnd={(e) => { e.preventDefault(); stopRecording(); }}
                    onContextMenu={(e) => e.preventDefault()}
                    className={`p-3 rounded-full transition-all transform active:scale-95 ${
                        isRecording ? 'bg-red-500 text-white shadow-lg shadow-red-900/40 scale-110' : 'bg-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                      <Mic size={18} />
                  </button>
              )}
          </div>
      </div>
    </div>
  );
};