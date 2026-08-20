from google.adk.models import Gemini
from google.adk.models.llm_request import LlmRequest
from google.genai import types

async def verify_fact(query: str) -> str:
    """Verifies a fact, historical trivia, or real-time event using Google Search.
    
    Args:
        query: The specific question or fact to look up.
        
    Returns:
        A grounded, concise summary of the search results.
    """
    model = Gemini(model="gemini-3.6-flash")
    
    request = LlmRequest(
        contents=[types.Content(role="user", parts=[types.Part.from_text(text=query)])],
        config=types.GenerateContentConfig(
            tools=[types.Tool(google_search=types.GoogleSearch())]
        )
    )
    
    try:
        response_text = ""
        async for chunk in model.generate_content_async(request):
            if chunk.contents and chunk.contents[0].parts:
                response_text += chunk.contents[0].parts[0].text
        return response_text or "No result found."
    except Exception as e:
        return f"Search failed: {str(e)}"
