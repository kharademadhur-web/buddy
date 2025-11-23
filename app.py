import threading
import keyboard
from core import BuddyCore
from speech import VoiceInput, TTS

def main():
    buddy = BuddyCore()
    voice = VoiceInput()
    tts = TTS()

    print("\n🌟 Buddy AI Assistant 🌟")
    print("Choose input method:\n1. Voice\n2. Text")
    while (choice := input("Selection (1/2): ").strip()) not in {"1", "2"}:
        pass

    print("\nType 'exit' or 'quit' to end session.\n")

    while True:
        try:
            # Get user input
            if choice == "1":
                audio = voice.listen()
                user_input = voice.recognize(audio)
                if not user_input:
                    print("❌ Voice input failed")
                    continue
                print(f"You: {user_input}")
            else:
                user_input = input("You: ").strip()

            # Exit condition
            if user_input.lower() in {"exit", "quit"}:
                print("\n👋 Session ended")
                break

            # Start typing indicator
            buddy.typing_active = True
            typing_thread = threading.Thread(target=buddy.typing_indicator)
            typing_thread.start()

            # Generate and display response
            response, rt = buddy.generate_response(user_input)
            buddy.typing_active = False
            typing_thread.join()

            # Format list responses
            if '\n' in response:
                print(f"\nBuddy:\n{response}")
            else:
                print(f"\nBuddy: {response}")
            print(f"(Responded in {rt:.2f}s)")

            # Speak response
            tts.speak(response)

        except KeyboardInterrupt:
            print("\n👋 Session ended")
            break

if __name__ == "__main__":
    main()
