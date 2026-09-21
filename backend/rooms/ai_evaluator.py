"""
Pluggable AI Evaluation Service for Study Arena Answers
Evaluates technical depth, communication clarity, relevance, and constructive advice.
Works offline with heuristic engine or online with Google Gemini / OpenAI.
"""

import os
import json
import logging
import urllib.request
import urllib.error

logger = logging.getLogger(__name__)

def get_gemini_api_key():
    return os.getenv("GEMINI_API_KEY", "").strip()


async def evaluate_transcript(question_data, transcript, speaker_name="Participant"):
    """
    Evaluates speech transcript against question requirements.
    Returns structured evaluation dict.
    """
    if not transcript or len(transcript.strip().split()) < 5:
        return {
            "speakerName": speaker_name,
            "technicalScore": 2.0,
            "clarityScore": 3.0,
            "relevanceScore": 2.0,
            "totalScore": 25,
            "strengths": ["Attempted to answer the prompt"],
            "improvements": ["Answer was too short to evaluate properly. Speak with more detail next time."],
            "summary": "Minimal answer provided.",
            "isAiGenerated": False
        }

    api_key = get_gemini_api_key()
    # If Gemini API Key is provided, call Gemini Flash API
    if api_key:
        try:
            gemini_result = call_gemini_evaluator(question_data, transcript, speaker_name, api_key)
            if gemini_result:
                return gemini_result
        except Exception as e:
            logger.warning(f"Gemini API evaluation failed ({e}); falling back to heuristic engine.")

    # Default: High-accuracy heuristic evaluation engine
    return run_heuristic_evaluation(question_data, transcript, speaker_name)


def run_heuristic_evaluation(question_data, transcript, speaker_name):
    words = transcript.lower().split()
    word_count = len(words)
    transcript_lower = transcript.lower()

    # 1. Relevance & Keyword Matching
    expected_keywords = question_data.get("keywords", [])
    matched_keywords = [kw for kw in expected_keywords if kw.lower() in transcript_lower]
    keyword_coverage = len(matched_keywords) / max(1, len(expected_keywords))

    # Base scores
    technical_score = min(9.8, round(3.5 + (keyword_coverage * 5.5) + (min(word_count, 120) / 120 * 1.0), 1))
    
    # 2. Clarity & Articulation
    clarity_base = 6.0
    if word_count > 40: clarity_base += 1.5
    if any(phrase in transcript_lower for phrase in ["because", "for example", "trade-off", "first", "second", "however", "therefore"]):
        clarity_base += 1.5
    clarity_score = min(9.5, round(clarity_base, 1))

    # 3. Relevance
    relevance_score = min(9.8, round(4.0 + (keyword_coverage * 5.0), 1))
    
    total_score = int((technical_score * 0.45 + clarity_score * 0.30 + relevance_score * 0.25) * 10)

    # Generate constructive feedback
    strengths = []
    improvements = []

    if matched_keywords:
        strengths.append(f"Correctly identified key concepts: {', '.join(matched_keywords[:3])}")
    if word_count >= 50:
        strengths.append(f"Good speaking pace and coverage (~{word_count} words articulated in the round)")
    if any(phrase in transcript_lower for phrase in ["for example", "such as", "case"]):
        strengths.append("Provided concrete examples to support the explanation")
    if not strengths:
        strengths.append("Addressed the core question directly")

    # Improvements
    missing_keywords = [kw for kw in expected_keywords if kw.lower() not in transcript_lower]
    if missing_keywords:
        improvements.append(f"Could explore: {', '.join(missing_keywords[:2])}")
    if word_count < 45:
        improvements.append("Elaborate further on trade-offs and edge cases to demonstrate deeper mastery")
    if not any(phrase in transcript_lower for phrase in ["trade-off", "versus", "compare", "advantage"]):
        improvements.append("Mention technical trade-offs (e.g., latency vs throughput, memory vs compute)")

    return {
        "speakerName": speaker_name,
        "technicalScore": technical_score,
        "clarityScore": clarity_score,
        "relevanceScore": relevance_score,
        "totalScore": total_score,
        "matchedKeywords": matched_keywords,
        "strengths": strengths[:3],
        "improvements": improvements[:2],
        "summary": f"Solid answer touching on {len(matched_keywords)} core domain concepts with clear pacing.",
        "isAiGenerated": False
    }


def call_gemini_evaluator(question_data, transcript, speaker_name, api_key):
    # Official Google Gemini models on v1beta
    models = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-1.5-pro", "gemini-1.0-pro"]
    
    prompt = f"""
You are an expert technical interviewer and AI moderator evaluating a candidate's verbal response in a discussion round.

Question: {question_data.get('question')}
Topic: {question_data.get('topic')}
Candidate Transcript: "{transcript}"

Evaluate the answer and respond strictly in valid JSON with these exact keys:
{{
  "speakerName": "{speaker_name}",
  "technicalScore": <float from 1.0 to 10.0>,
  "clarityScore": <float from 1.0 to 10.0>,
  "relevanceScore": <float from 1.0 to 10.0>,
  "totalScore": <integer from 10 to 100>,
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<actionable tip 1>", "<actionable tip 2>"],
  "summary": "<1-2 sentence overall verdict>"
}}
"""
    payload = json.dumps({
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"response_mime_type": "application/json"}
    }).encode("utf-8")

    last_error = None
    for model in models:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
        headers = {
            "Content-Type": "application/json",
            "x-goog-api-key": api_key
        }
        try:
            req = urllib.request.Request(url, data=payload, headers=headers)
            with urllib.request.urlopen(req, timeout=8) as response:
                res_data = json.loads(response.read().decode("utf-8"))
                text = res_data["candidates"][0]["content"]["parts"][0]["text"].strip()
                # Clean markdown backticks if present
                if text.startswith("```"):
                    lines = text.split("\n")
                    text = "\n".join(lines[1:-1]) if lines[-1].startswith("```") else "\n".join(lines[1:])
                parsed = json.loads(text)
                parsed["isAiGenerated"] = True
                return parsed
        except Exception as err:
            last_error = err
            continue

    if last_error:
        raise last_error
    return None

