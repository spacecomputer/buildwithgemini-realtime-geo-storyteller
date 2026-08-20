/* ==========================================================================
   Gemini Agent Architecture & Pipeline Visualizer Script
   ========================================================================== */

function logStep(msg) {
  const terminal = document.getElementById('archLogTerminal');
  const timestamp = new Date().toISOString().substring(11, 19);
  terminal.innerHTML += `<br>[${timestamp}]: ${msg}`;
  terminal.scrollTop = terminal.scrollHeight;
}

function triggerPipelineFlow(scenario) {
  // Update button active state
  document.querySelectorAll('.flow-btn').forEach(btn => btn.classList.remove('active'));

  const terminal = document.getElementById('archLogTerminal');
  terminal.innerHTML = `[SCENARIO STARTED]: Tracing sequence for '${scenario.toUpperCase()}'...`;

  if (scenario === 'geofence') {
    document.getElementById('btnFlow1').classList.add('active');
    setTimeout(() => logStep('1. Mobile Client detects GPS movement to Bellevue Downtown Park (47.6118, -122.2064).'), 300);
    setTimeout(() => logStep('2. GPS Telemetry frame sent over WebSocket to FastAPI Proxy (fast_api_app.py).'), 700);
    setTimeout(() => logStep('3. Proxy forwards telemetry to ADK root_agent in agent.py.'), 1100);
    setTimeout(() => logStep('4. ADK Agent executes `get_poi(poi_id="bellevue_downtown_park")` on Firestore.'), 1500);
    setTimeout(() => logStep('5. Gemini 3.6 Flash generates audio factoid + structured A2UI card JSON.'), 1900);
    setTimeout(() => logStep('6. `a2ui_callback` interceptor wraps response into A2UI v0.8 surface update.'), 2300);
    setTimeout(() => logStep('7. Mobile Client renders A2UI Card & plays 24kHz PCM audio stream!'), 2700);
  }
  else if (scenario === 'rag') {
    document.getElementById('btnFlow2').classList.add('active');
    setTimeout(() => logStep('1. User asks audio question: "What is the architectural history of Bellevue Arts Museum?"'), 300);
    setTimeout(() => logStep('2. ADK root_agent receives query and invokes tool `consult_docs(query="Bellevue Arts Museum history")`.'), 800);
    setTimeout(() => logStep('3. Vertex AI RAG Engine searches serverless vector corpus & returns grounded passages.'), 1300);
    setTimeout(() => logStep('4. Gemini 3.6 Flash paraphrases Steven Holl architectural facts into engaging audio output.'), 1800);
    setTimeout(() => logStep('5. `a2ui_callback` formats citations and image into A2UI Card display.'), 2300);
    setTimeout(() => logStep('6. Response streamed back to user via WebSocket Bidi audio.'), 2700);
  }
  else if (scenario === 'search') {
    document.getElementById('btnFlow3').classList.add('active');
    setTimeout(() => logStep('1. User asks: "Are there any active events happening at Bellevue Downtown Park right now?"'), 300);
    setTimeout(() => logStep('2. ADK root_agent identifies real-time query and invokes tool `verify_fact`.'), 800);
    setTimeout(() => logStep('3. Google Search Grounding queries real-time Google Search index.'), 1300);
    setTimeout(() => logStep('4. Verified search sources returned and fed to Gemini 3.6 Flash model.'), 1800);
    setTimeout(() => logStep('5. Agent generates grounded response with search badges.'), 2300);
  }
  else if (scenario === 'memory') {
    document.getElementById('btnFlow4').classList.add('active');
    setTimeout(() => logStep('1. User says: "I love architectural history, especially modern 20th-century design."'), 300);
    setTimeout(() => logStep('2. Conversation ends. `generate_memories_callback` executes in background.'), 800);
    setTimeout(() => logStep('3. Fact extracted and saved to Vertex AI Memory Bank.'), 1300);
    setTimeout(() => logStep('4. Next Session: `PreloadMemoryTool` automatically retrieves user preference!'), 1800);
    setTimeout(() => logStep('5. Tour Guide automatically customizes future narration to highlight modern architecture!'), 2300);
  }
}

// Initial default flow log
document.addEventListener('DOMContentLoaded', () => {
  triggerPipelineFlow('geofence');
});
