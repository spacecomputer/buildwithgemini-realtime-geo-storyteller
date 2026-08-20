import asyncio
from google.adk.runners import Runner
from google.adk.apps import App
from google.adk.sessions import InMemorySessionService
from app.agent import root_agent

async def test_rag():
    app = App(name="app", root_agent=root_agent, session_service=InMemorySessionService())
    runner = Runner(app=app)
    
    response = await runner.run_async(
        user_input="Tell me about the Flatiron building's architecture based on the historical corpus.",
        user_id="test_user",
        session_id="test_session"
    )
    print("Agent Response:", response.text)

if __name__ == "__main__":
    asyncio.run(test_rag())
