import speech_recognition as sr
import keyboard
import pyttsx3
import threading

class VoiceInput:
    def __init__(self):
        self.recognizer = sr.Recognizer()
    
    def recognize(self, audio):
        """Convert audio to text"""
        if audio is None:
            return None
        try:
            return self.recognizer.recognize_google(audio)
        except sr.UnknownValueError:
            print("❌ Could not understand audio")
            return None
        except sr.RequestError as e:
            print(f"❌ Recognition error: {e}")
            return None
        
    def listen(self, timeout=5, phrase_time_limit=10):
        with sr.Microphone() as source:
            print("\n🎤 Listening... (Press ESC to cancel)")
            self.recognizer.adjust_for_ambient_noise(source)
            stop_event = threading.Event()
            threading.Thread(target=self.listen_for_escape, args=(stop_event,)).start()
            
            try:
                audio = self.recognizer.listen(source, timeout=timeout, 
                                            phrase_time_limit=phrase_time_limit)
                return audio if not stop_event.is_set() else None
            except:
                return None

    @staticmethod
    def listen_for_escape(stop_event: threading.Event):
        keyboard.wait('esc')
        stop_event.set()
        print("\n⚠️ Input canceled")

class TTS:
    def __init__(self):
        self.engine = pyttsx3.init()
        self.engine.setProperty('rate', 160)

    def speak(self, text):
        self.engine.say(text)
        self.engine.runAndWait()