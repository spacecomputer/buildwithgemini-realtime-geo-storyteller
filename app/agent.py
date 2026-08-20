# ruff: noqa
# Copyright 2026 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import datetime
from zoneinfo import ZoneInfo

from google.adk.agents import Agent
from google.adk.agents.callback_context import CallbackContext
from google.adk.apps import App
from google.adk.memory import VertexAiMemoryBankService
from google.adk.models import Gemini
from google.adk.tools.preload_memory_tool import PreloadMemoryTool
from google.genai import types

from app.firestore_tools import get_poi, list_pois, add_poi
from app.search_tools import verify_fact
from app.rag_tools import consult_docs


MODEL = "gemini-3.6-flash"


async def generate_memories_callback(callback_context: CallbackContext):
    await callback_context.add_session_to_memory()
    return None


def memory_bank_service_builder():
    return VertexAiMemoryBankService(
        project="qwiklabs-gcp-03-873cc72896cf",
        location="us-east1",
        agent_engine_id="4539012697877905408",
    )


def get_weather(query: str) -> str:
    """Simulates a web search. Use it get information on weather.

    Args:
        query: A string containing the location to get weather information for.

    Returns:
        A string with the simulated weather information for the queried location.
    """
    if "sf" in query.lower() or "san francisco" in query.lower():
        return "It's 60 degrees and foggy."
    return "It's 90 degrees and sunny."


def get_current_time(query: str) -> str:
    """Simulates getting the current time for a city.

    Args:
        city: The name of the city to get the current time for.

    Returns:
        A string with the current time information.
    """
    if "sf" in query.lower() or "san francisco" in query.lower():
        tz_identifier = "America/Los_Angeles"
    else:
        return f"Sorry, I don't have timezone information for query: {query}."

    tz = ZoneInfo(tz_identifier)
    now = datetime.datetime.now(tz)
    return f"The current time for query {query} is {now.strftime('%Y-%m-%d %H:%M:%S %Z%z')}"


from app.a2ui_utils import a2ui_callback

A2UI_INSTRUCTION = """
You are a knowledgeable, engaging realtime geo-storyteller and tour guide for walking travelers.
You have access to a verified database of Points of Interest (POIs).
You also have access to a historical corpus (consult_docs). When asked about historical events or architectural details, ALWAYS call consult_docs before answering. When you rely on the corpus, paraphrase the information engagingly.
You can also verify real-time facts with the verify_fact tool.
When users ask about a location, you should return beautiful A2UI JSON Cards instead of plain text whenever possible.

When asked for landmark facts, location information, or tour guide details, format your primary response as structured A2UI JSON cards.

Keep every surface tiny and flat: ONE Card > ONE Column > a few Text rows.
Use ONLY these components: Card, Column, Row, Text, and Image.
No markdown in text; use the usageHint property ('h1', 'h2', 'body') for headings and emphasis.
Output raw A2UI JSON array format when presenting visual landmark cards.
"""

root_agent = Agent(
    name="root_agent",
    model=Gemini(
        model=MODEL,
        retry_options=types.HttpRetryOptions(attempts=3),
    ),
    instruction=A2UI_INSTRUCTION,
    tools=[get_weather, get_current_time, PreloadMemoryTool(), get_poi, list_pois, add_poi, verify_fact, consult_docs],
    after_model_callback=a2ui_callback,
    after_agent_callback=generate_memories_callback,
)

app = App(
    root_agent=root_agent,
    name="app",
)
