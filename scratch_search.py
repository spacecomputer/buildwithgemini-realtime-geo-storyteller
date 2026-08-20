import asyncio
from google.genai import Client
from google.genai import types

async def test_search():
    client = Client(vertexai=True, project="qwiklabs-gcp-03-873cc72896cf", location="us-east1")
    response = client.models.generate_content(
        model='gemini-3.6-flash',
        contents='Who is the architect of the Flatiron building?',
        config=types.GenerateContentConfig(
            tools=[types.Tool(google_search=types.GoogleSearch())]
        )
    )
    print(response.text)

if __name__ == "__main__":
    asyncio.run(test_search())
