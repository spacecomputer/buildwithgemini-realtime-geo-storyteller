/* ==========================================================================
   Gemini Live Spatial Audio Tour Guide — Core Application Engine & Simulator
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  // --- 1. Mock Trajectories & POI Data ---
  const TRAJECTORIES = {
    bellevue: {
      name: "Bellevue Downtown & Waterfront Park",
      coords: [
        [47.6101, -122.2015], // Downtown Bellevue
        [47.6118, -122.2064], // Bellevue Downtown Park
        [47.6151, -122.2017], // Bellevue Arts Museum
        [47.6111, -122.2106]  // Meydenbauer Bay Park
      ],
      pois: [
        {
          name: "Bellevue Downtown Park",
          coords: [47.6118, -122.2064],
          year: "Est. 1987",
          type: "Urban Park",
          image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
          snippet: "A 21-acre urban oasis featuring a 240-foot waterfall, reflection canal, and circular promenade in downtown Bellevue.",
          hash: "#bdp1987",
          factoid: "Bellevue Downtown Park was dedicated in 1987. Its signature 240-foot wide waterfall cascades into a 10-acre lawn."
        },
        {
          name: "Bellevue Arts Museum (BAM)",
          coords: [47.6151, -122.2017],
          year: "Est. 1947 / 2001",
          type: "Art Museum",
          image: "https://images.unsplash.com/photo-1561214115-f2f134cc4912?auto=format&fit=crop&w=800&q=80",
          snippet: "Pacific Northwest's premier center for art, craft, and design housed in Steven Holl's iconic architectural building.",
          hash: "#bam2001",
          factoid: "Originally founded as an outdoor arts fair in 1947, BAM opened its current red-pigmented concrete building designed by Steven Holl in 2001."
        },
        {
          name: "Meydenbauer Bay Park",
          coords: [47.6111, -122.2106],
          year: "Est. 1953",
          type: "Waterfront Park",
          image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80",
          snippet: "Historic Lake Washington waterfront park connecting downtown Bellevue directly to Meydenbauer shoreline.",
          hash: "#mbp1953",
          factoid: "Meydenbauer Bay was the landing site for ferries connecting Bellevue to Seattle before the floating bridges were built."
        }
      ]
    },
    boston: {
      name: "Boston Freedom Trail",
      coords: [
        [42.3581, -71.0578], // Faneuil Hall
        [42.3588, -71.0570], // Paul Revere House
        [42.3602, -71.0548]  // Old North Church
      ],
      pois: [
        {
          name: "Faneuil Hall & Quincy Market",
          coords: [42.3581, -71.0578],
          year: "Est. 1742",
          type: "Historical Landmark",
          image: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=800&q=80",
          snippet: "Known as 'The Cradle of Liberty', Faneuil Hall hosted speeches by Samuel Adams encouraging independence.",
          hash: "#fh78a2",
          factoid: "Faneuil Hall was built in 1742 by merchant Peter Faneuil."
        }
      ]
    }
  };

  // --- 2. Application State ---
  let currentState = "IDLE_LISTENING";
  let currentRouteKey = "bellevue";
  let isSimPlaying = false;
  let simSpeed = 2; // 1x, 2x, 5x, 10x
  let simProgressIndex = 0;
  let simIntervalId = null;
  let visitedPoiHashes = new Set(["#bdp1987"]);

  // --- 3. Leaflet Map Setup ---
  const map = L.map('leafletMap', {
    zoomControl: false,
    attributionControl: false
  }).setView([47.6101, -122.2015], 16);

  // Dark Map Tiles (CartoDB Dark Matter)
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19
  }).addTo(map);

  // Custom User Marker Icon (Pulsing Neon Green)
  const userIcon = L.divIcon({
    className: 'custom-user-marker',
    html: `<div style="
      width: 20px;
      height: 20px;
      background: #00e676;
      border: 3px solid #ffffff;
      border-radius: 50%;
      box-shadow: 0 0 15px #00e676;
    "></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });

  let userMarker = L.marker([47.6101, -122.2015], { icon: userIcon }).addTo(map);

  // Geofence Radius Circle (150m walking radius)
  let geofenceCircle = L.circle([47.6101, -122.2015], {
    color: '#00e5ff',
    fillColor: '#00e5ff',
    fillOpacity: 0.08,
    radius: 150
  }).addTo(map);

  // Route Polyline
  let routePolyline = L.polyline(TRAJECTORIES.bellevue.coords, {
    color: '#4285f4',
    weight: 4,
    opacity: 0.8,
    dashArray: '8, 8'
  }).addTo(map);

  // POI Map Markers
  let poiMarkersGroup = L.layerGroup().addTo(map);

  function renderPoiMapMarkers(routeData) {
    poiMarkersGroup.clearLayers();
    routeData.pois.forEach(poi => {
      const poiMarker = L.circleMarker(poi.coords, {
        radius: 8,
        color: '#ffaa00',
        fillColor: '#ffaa00',
        fillOpacity: 0.8
      }).addTo(poiMarkersGroup);

      poiMarker.bindTooltip(`<b>${poi.name}</b><br>${poi.type}`, {
        permanent: false,
        direction: 'top'
      });
    });
  }
  renderPoiMapMarkers(TRAJECTORIES.bellevue);

  // --- 4. Web Audio Waveform Canvas Visualizer ---
  const canvas = document.getElementById('audioVisualizerCanvas');
  const ctx = canvas.getContext('2d');
  let animationFrameId = null;

  function resizeCanvas() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  let phase = 0;
  function drawVisualizer() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const width = canvas.width;
    const height = canvas.height;
    const centerY = height / 2;

    ctx.beginPath();
    ctx.lineWidth = 2;

    if (currentState === 'STREAMING_FACT') {
      ctx.strokeStyle = '#9b51e0';
      // Multi-sine wave output animation
      for (let x = 0; x < width; x++) {
        const y = centerY +
          Math.sin(x * 0.03 + phase) * 18 * Math.sin(x * 0.01) +
          Math.sin(x * 0.08 - phase) * 10;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
    } else if (currentState === 'USER_INTERRUPTING') {
      ctx.strokeStyle = '#ff3d71';
      // Jagged interruption wave
      for (let x = 0; x < width; x++) {
        const y = centerY + (Math.random() - 0.5) * 35;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
    } else {
      ctx.strokeStyle = '#00e5ff';
      // Gentle ambient wave
      for (let x = 0; x < width; x++) {
        const y = centerY + Math.sin(x * 0.02 + phase) * 6;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
    }

    ctx.stroke();
    phase += 0.08;
    animationFrameId = requestAnimationFrame(drawVisualizer);
  }
  drawVisualizer();

  // --- 5. UI State Machine Engine ---
  function setState(newState) {
    currentState = newState;
    const badge = document.getElementById('stateMachineBadge');
    const badgeText = document.getElementById('stateMachineText');

    badge.className = 'state-badge';

    if (newState === 'IDLE_LISTENING') {
      badge.classList.add('state-idle');
      badgeText.innerText = 'IDLE_LISTENING';
      document.getElementById('audioDirectionBadge').className = 'audio-dir-badge dir-output';
      document.getElementById('audioDirectionBadge').innerHTML = '<i class="fa-solid fa-microphone"></i> CLIENT MIC (16kHz PCM)';
    } else if (newState === 'STREAMING_FACT') {
      badge.classList.add('state-streaming');
      badgeText.innerText = 'STREAMING_FACT';
      document.getElementById('audioDirectionBadge').className = 'audio-dir-badge dir-output';
      document.getElementById('audioDirectionBadge').innerHTML = '<i class="fa-solid fa-volume-high"></i> SERVER STREAMING (24kHz PCM)';
    } else if (newState === 'USER_INTERRUPTING') {
      badge.classList.add('state-interrupt');
      badgeText.innerText = 'USER_INTERRUPTING';
      document.getElementById('audioDirectionBadge').className = 'audio-dir-badge dir-output';
      document.getElementById('audioDirectionBadge').innerHTML = '<i class="fa-solid fa-bolt"></i> FLUSHING AUDIO QUEUE';
    }

    updateSchemas();
  }

  // --- 6. Transcripts, Context Injections Feed & A2UI Renderer ---
  const transcriptFeed = document.getElementById('transcriptFeed');

  function addFeedBubble(type, text, label = '') {
    const bubble = document.createElement('div');
    bubble.className = `feed-bubble ${type}`;
    if (label) {
      bubble.innerHTML = `<strong>${label}</strong><br>${text}`;
    } else {
      bubble.innerText = text;
    }
    transcriptFeed.appendChild(bubble);
    transcriptFeed.scrollTop = transcriptFeed.scrollHeight;
  }

  // Render A2UI Card inside the session feed
  function renderA2UICard(title, text, year, image) {
    const card = document.createElement('div');
    card.className = 'feed-bubble agent a2ui-rendered-card';
    card.style.background = 'rgba(28, 36, 56, 0.9)';
    card.style.border = '1px solid rgba(155, 81, 224, 0.5)';
    card.style.borderRadius = '12px';
    card.style.padding = '10px 12px';
    card.style.marginTop = '6px';

    card.innerHTML = `
      <div style="font-size:0.68rem; color:#9b51e0; font-weight:700; letter-spacing:0.5px; margin-bottom:4px;">
        <i class="fa-solid fa-shapes"></i> A2UI CARD
      </div>
      <div style="font-size:0.95rem; font-weight:700; color:#fff; margin-bottom:2px;">${title} <span style="font-size:0.7rem; color:#ffaa00; background:rgba(255,170,0,0.15); padding:1px 6px; border-radius:4px;">${year}</span></div>
      <div style="font-size:0.8rem; color:#b0c2de; line-height:1.4;">${text}</div>
    `;
    transcriptFeed.appendChild(card);
    transcriptFeed.scrollTop = transcriptFeed.scrollHeight;
  }

  // Initial Welcome Bubbles
  addFeedBubble('system-context', '[SYSTEM CONTEXT INJECTION]: User connected at Boston Freedom Trail. Grounding Tools Active.');
  addFeedBubble('agent', 'Hello! I am Kore, your Gemini Live tour guide. As we walk along the Freedom Trail, I will share historic stories about the landmarks around us.', 'Gemini Live (Kore)');

  // --- 7. POI Fact Card Updater ---
  function updatePoiCard(poi) {
    document.getElementById('poiTitle').innerText = poi.name;
    document.getElementById('poiYear').innerText = poi.year;
    document.getElementById('poiFactSnippet').innerText = poi.snippet;
    document.getElementById('poiFactHash').innerText = `FactHash: ${poi.hash}`;
    document.querySelector('.poi-type-tag').innerHTML = `<i class="fa-solid fa-landmark"></i> ${poi.type}`;
    document.querySelector('.poi-card-image').style.backgroundImage = `url('${poi.image}')`;

    // Trigger state change & voice audio stream response
    setState('STREAMING_FACT');
    addFeedBubble('system-context', `[SYSTEM CONTEXT INJECTION]: User moved near ${poi.name}. Distance: 45m. Generate 2-sentence audio fact.`);
    renderA2UICard(poi.name, poi.snippet, poi.year, poi.image);
    addFeedBubble('agent', poi.factoid, `Gemini Live (${document.getElementById('voiceSelect').value})`);

    // Reset to IDLE_LISTENING after 6 seconds
    setTimeout(() => {
      if (currentState === 'STREAMING_FACT') {
        setState('IDLE_LISTENING');
      }
    }, 6000);
  }

  // --- 8. GPX Simulator Engine ---
  function stepSimulation() {
    const route = TRAJECTORIES[currentRouteKey];
    if (simProgressIndex >= route.coords.length) {
      simProgressIndex = 0; // Loop around
    }

    const currentCoord = route.coords[simProgressIndex];
    userMarker.setLatLng(currentCoord);
    geofenceCircle.setLatLng(currentCoord);
    map.panTo(currentCoord);

    // Calculate progress %
    const progressPct = Math.round(((simProgressIndex + 1) / route.coords.length) * 100);
    document.getElementById('simProgressBar').style.width = `${progressPct}%`;
    document.getElementById('simProgressPercentage').innerText = `${progressPct}%`;

    // Update Telemetry HUD
    document.getElementById('hudCoords').innerText = `${currentCoord[0].toFixed(4)}° N, ${currentCoord[1].toFixed(4)}° W`;

    // Check if near POI
    const currentPoi = route.pois[simProgressIndex % route.pois.length];
    if (currentPoi && !visitedPoiHashes.has(currentPoi.hash)) {
      visitedPoiHashes.add(currentPoi.hash);
      document.getElementById('simCurrentPoi').innerText = `Nearby POI: ${currentPoi.name}`;
      updatePoiCard(currentPoi);
    }

    simProgressIndex++;
  }

  document.getElementById('btnPlaySim').addEventListener('click', () => {
    if (!isSimPlaying) {
      isSimPlaying = true;
      document.getElementById('btnPlaySim').disabled = true;
      document.getElementById('btnPauseSim').disabled = false;
      simIntervalId = setInterval(stepSimulation, 3000 / simSpeed);
    }
  });

  document.getElementById('btnPauseSim').addEventListener('click', () => {
    if (isSimPlaying) {
      isSimPlaying = false;
      document.getElementById('btnPlaySim').disabled = false;
      document.getElementById('btnPauseSim').disabled = true;
      clearInterval(simIntervalId);
    }
  });

  document.getElementById('btnResetSim').addEventListener('click', () => {
    isSimPlaying = false;
    clearInterval(simIntervalId);
    document.getElementById('btnPlaySim').disabled = false;
    document.getElementById('btnPauseSim').disabled = true;
    simProgressIndex = 0;
    document.getElementById('simProgressBar').style.width = '0%';
    document.getElementById('simProgressPercentage').innerText = '0%';
    stepSimulation();
  });

  // Speed multiplier buttons
  document.querySelectorAll('.speed-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      simSpeed = parseInt(e.target.dataset.speed);
      if (isSimPlaying) {
        clearInterval(simIntervalId);
        simIntervalId = setInterval(stepSimulation, 3000 / simSpeed);
      }
    });
  });

  // Route selector
  document.getElementById('routeSelect').addEventListener('change', (e) => {
    currentRouteKey = e.target.value;
    const route = TRAJECTORIES[currentRouteKey];
    routePolyline.setLatLngs(route.coords);
    renderPoiMapMarkers(route);
    visitedPoiHashes.clear();
    simProgressIndex = 0;
    stepSimulation();
  });

  // --- 9. Audio Controls & Interruption Triggers ---
  document.getElementById('btnSimulateInterrupt').addEventListener('click', () => {
    setState('USER_INTERRUPTING');
    addFeedBubble('user', 'Wait, who built Faneuil Hall?', 'User Speech Over Stream (VAD)');

    setTimeout(() => {
      setState('STREAMING_FACT');
      addFeedBubble('agent', 'Faneuil Hall was built by merchant Peter Faneuil in 1742 as a gift to the city.', 'Gemini Live');
    }, 1500);
  });

  document.getElementById('btnManualPoiTrigger').addEventListener('click', () => {
    const route = TRAJECTORIES[currentRouteKey];
    const poi = route.pois[Math.floor(Math.random() * route.pois.length)];
    updatePoiCard(poi);
  });

  document.getElementById('btnClearFeed').addEventListener('click', () => {
    transcriptFeed.innerHTML = '';
  });

  // --- 10. View Mode Switcher ---
  document.getElementById('btnModeMobile').addEventListener('click', () => {
    document.body.className = 'dark-theme mode-mobile';
    document.getElementById('btnModeMobile').classList.add('active');
    document.getElementById('btnModeDev').classList.remove('active');
  });

  document.getElementById('btnModeDev').addEventListener('click', () => {
    document.body.className = 'dark-theme mode-dev';
    document.getElementById('btnModeDev').classList.add('active');
    document.getElementById('btnModeMobile').classList.remove('active');
  });

  // --- 11. Dev Deck Tabs & Schema Inspectors ---
  document.querySelectorAll('.tab-btn').forEach(tab => {
    tab.addEventListener('click', (e) => {
      document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

      const targetTab = e.currentTarget.dataset.tab;
      e.currentTarget.classList.add('active');
      document.getElementById(targetTab).classList.add('active');
    });
  });

  function updateSchemas() {
    const sampleGps = {
      sessionId: "8f3b-412e-990a-faneuil-tour",
      timestamp: new Date().toISOString(),
      coords: {
        latitude: userMarker.getLatLng().lat,
        longitude: userMarker.getLatLng().lng,
        altitude: 12.4,
        accuracy: 4.2,
        heading: 142.0,
        speed: 1.3
      },
      movementState: "WALKING",
      triggerReason: "DISTANCE_DELTA"
    };

    const samplePlaces = {
      locationRestriction: {
        circle: {
          center: { latitude: userMarker.getLatLng().lat, longitude: userMarker.getLatLng().lng },
          radius: 150.0
        }
      },
      includedTypes: ["historical_landmark", "museum", "park"],
      maxResultCount: 5,
      languageCode: "en-US"
    };

    const sampleBidiWs = {
      clientContent: {
        turns: [{
          role: "user",
          parts: [{ text: "[SYSTEM CONTEXT INJECTION]: User moved near Faneuil Hall. Nearby POI: Faneuil Hall & Quincy Market. Built: 1742. Generate audio factoid." }]
        }],
        turnComplete: true
      }
    };

    const samplePoiCache = {
      visitedPoiIds: Array.from(visitedPoiHashes),
      deliveredFactHashes: Array.from(visitedPoiHashes),
      sessionDurationSec: 240
    };

    document.getElementById('jsonTelemetry').innerText = JSON.stringify(sampleGps, null, 2);
    document.getElementById('jsonPlaces').innerText = JSON.stringify(samplePlaces, null, 2);
    document.getElementById('jsonWebSocket').innerText = JSON.stringify(sampleBidiWs, null, 2);
    document.getElementById('jsonPoiCache').innerText = JSON.stringify(samplePoiCache, null, 2);
  }

  updateSchemas();
});
