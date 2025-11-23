import time
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
from collections import deque

class BuddyCore:
    def __init__(self):
        # Force CPU-only operation
        self.device = torch.device("cpu")
        torch.set_num_threads(8)  # Use 8 threads

        # Load model with strict CPU config
        self.tokenizer = AutoTokenizer.from_pretrained(
            "microsoft/phi-2",
            trust_remote_code=True,
            padding_side="left"
        )
        self.model = AutoModelForCausalLM.from_pretrained(
            "microsoft/phi-2",
            dtype=torch.float32,
            device_map={"": self.device},
            trust_remote_code=True
        )

        # Initialize components
        self.response_history = deque(maxlen=3)
        self.typing_active = False

        # Optimized template for Windows
        self.personality_template = """<|system|>
        You are Buddy, a Windows AI assistant. Follow these rules:
        1. Max 2 sentences
        2. Technical troubleshooting focus
        3. Clear error explanations</s>
        """

    def typing_indicator(self):
        """Windows-terminal optimized animation"""
        states = ["-", "\\", "|", "/"]
        while self.typing_active:
            for state in states:
                if not self.typing_active:
                    break
                print(f"\rProcessing {state}", end="", flush=True)
                time.sleep(0.15)
        print("\r" + " " * 30 + "\r", end="")

    def generate_response(self, user_input: str) -> tuple[str, float]:
        start_time = time.time()

        prompt = f"{self.personality_template}<|user|>{user_input}</s><|assistant|>"

        inputs = self.tokenizer(
            prompt,
            return_tensors="pt",
            max_length=256,
            truncation=True
        ).to(self.device)

        with torch.inference_mode():
            outputs = self.model.generate(
                **inputs,
                max_new_tokens=64,
                temperature=0.6,
                top_p=0.9,
                repetition_penalty=1.1
            )

        decoded = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
        assistant_output = decoded.split("<|assistant|>")[-1].split("</s>")[0].strip()
        return assistant_output, time.time() - start_time
