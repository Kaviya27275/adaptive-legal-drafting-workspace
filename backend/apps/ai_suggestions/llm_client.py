import requests
import os
import json
from dotenv import load_dotenv

load_dotenv()

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "mistral")  # change if needed


def call_llm(prompt: str) -> dict:
    """
    Calls Ollama LLM and returns parsed JSON response safely.
    """

    try:
        response = requests.post(
            f"{OLLAMA_URL}/api/generate",
            json={
                "model": OLLAMA_MODEL,
                "prompt": prompt,
                "stream": False
            },
            timeout=120
        )

        response.raise_for_status()

        raw_output = response.json().get("response", "").strip()

        # Try parsing JSON strictly
        try:
            return json.loads(raw_output)

        except json.JSONDecodeError:
            return {
                "error": "Invalid JSON returned by LLM",
                "raw_response": raw_output
            }

    except requests.exceptions.RequestException as e:
        return {
            "error": "LLM Connection Error",
            "details": str(e)
        }