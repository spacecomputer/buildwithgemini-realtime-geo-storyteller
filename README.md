# 🌍 Realtime Geo-Storyteller

A conversational AI agent that helps walking travelers explore cities through immersive, location-aware storytelling, delivered via real-time bidirectional audio using the Gemini Live API. 

## 🌟 Why it's helpful

When exploring a new city, travelers often find themselves glued to their phone screens, missing the sights right in front of them while trying to read about them. Realtime Geo-Storyteller solves this by acting as your personal, hands-free tour guide. 

As you walk, the agent seamlessly narrates verified, fascinating facts about the points of interest (POIs) around you. It understands your pace and location, ensuring it only delivers fresh, relevant trivia without repeating itself or interrupting your natural conversation. Keep your eyes on the city, and let the agent tell its story.

## ⚙️ How it works

The Realtime Geo-Storyteller is built on a robust architecture designed for contextual awareness and real-time interaction:

* **Real-time Bidirectional Audio:** Powered by the Gemini Live API, it supports natural, conversational interactions, ensuring the agent doesn't interrupt your ongoing speech.
* **Contextual Memory:** Tracks `visitedPoiIds` and `deliveredFactHashes` per session. This ensures the agent knows where you've been and what it has already told you, preventing repetitive trivia when you are stationary.
* **Location & Verification Tools:** Utilizes the Google Places API for accurate location lookups and leverages Google Search Grounding to ensure all historical and cultural facts are verified and hallucination-free.
* **Rich UI & Mapping:** While primarily audio-first, it also generates verified POI cards (using A2UI) and renders custom GeoJSON on a live map in the frontend for when you want to look deeper into your surroundings.

## Project Structure

```
simple-agent/
├── app/         # Core agent code
│   ├── agent.py               # Main agent logic
│   ├── fast_api_app.py        # FastAPI Backend server
│   └── app_utils/             # App utilities and helpers
├── tests/                     # Unit, integration, and load tests
├── GEMINI.md                  # AI-assisted development guide
└── pyproject.toml             # Project dependencies
```

> 💡 **Tip:** Use [Antigravity CLI](https://antigravity.google/) for AI-assisted development - project context is pre-configured in `GEMINI.md`.

## Requirements

Before you begin, ensure you have:
- **uv**: Python package manager (used for all dependency management in this project) - [Install](https://docs.astral.sh/uv/getting-started/installation/) ([add packages](https://docs.astral.sh/uv/concepts/dependencies/) with `uv add <package>`)
- **agents-cli**: Agents CLI - Install with `uv tool install google-agents-cli`
- **Google Cloud SDK**: For GCP services - [Install](https://cloud.google.com/sdk/docs/install)


## Quick Start

Install `agents-cli` and its skills if not already installed:

```bash
uvx google-agents-cli setup
```

Install required packages:

```bash
agents-cli install
```

Test the agent with a local web server:

```bash
agents-cli playground
```

You can also use features from the [ADK](https://adk.dev/) CLI with `uv run adk`.

## Commands

| Command              | Description                                                                                 |
| -------------------- | ------------------------------------------------------------------------------------------- |
| `agents-cli install` | Install dependencies using uv                                                         |
| `agents-cli playground` | Launch local development environment                                                  |
| `agents-cli lint`    | Run code quality checks                                                               |
| `agents-cli eval`    | Evaluate agent behavior (generate, grade, analyze, and more — see `agents-cli eval --help`) |
| `uv run pytest tests/unit tests/integration` | Run unit and integration tests                                                        |
| `agents-cli deploy`  | Deploy agent to Agent Runtime                                                                |
| `agents-cli publish gemini-enterprise` | Register deployed agent to Gemini Enterprise                    || [A2A Inspector](https://github.com/a2aproject/a2a-inspector) | Launch A2A Protocol Inspector                                                        |

## 🛠️ Project Management

| Command | What It Does |
|---------|--------------|
| `agents-cli scaffold enhance` | Add CI/CD pipelines and Terraform infrastructure |
| `agents-cli infra cicd` | One-command setup of entire CI/CD pipeline + infrastructure |
| `agents-cli scaffold upgrade` | Auto-upgrade to latest version while preserving customizations |

---

## Development

Edit your agent logic in `app/agent.py` and test with `agents-cli playground` - it auto-reloads on save.

## Deployment

```bash
gcloud config set project <your-project-id>
agents-cli deploy
```

To add CI/CD and Terraform, run `agents-cli scaffold enhance`.
To set up your production infrastructure, run `agents-cli infra cicd`.

## Observability

Built-in telemetry exports to Cloud Trace, BigQuery, and Cloud Logging.

## A2A Inspector

This agent supports the [A2A Protocol](https://a2a-protocol.org/). Use the [A2A Inspector](https://github.com/a2aproject/a2a-inspector) to test interoperability.
See the [A2A Inspector docs](https://github.com/a2aproject/a2a-inspector) for details.
