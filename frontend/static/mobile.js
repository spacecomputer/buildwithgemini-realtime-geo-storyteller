/* ==========================================================================
   Gemini Live Mobile Spatial Audio Tour Guide — Realtime Geolocation Engine
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  // --- 1. Landmark POI Database (Bellevue, WA) ---
  const POIS = [
    {
      id: "bellevue_downtown_park",
      name: "Bellevue Downtown Park",
      coords: [47.6118, -122.2064],
      year: "Est. 1987",
      image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80",
      snippet: "A 21-acre urban oasis featuring a 240-foot waterfall, reflection canal, and circular promenade in downtown Bellevue.",
      factoid: "Bellevue Downtown Park was dedicated in 1987. Its signature 240-foot wide waterfall cascades into a 10-acre lawn surrounded by a half-mile promenade."
    },
    {
      id: "bellevue_arts_museum",
      name: "Bellevue Arts Museum (BAM)",
      coords: [47.6151, -122.2017],
      year: "Est. 1947 / 2001",
      image: "https://images.unsplash.com/photo-1561214115-f2f134cc4912?auto=format&fit=crop&w=400&q=80",
      snippet: "Pacific Northwest's premier center for art, craft, and design housed in Steven Holl's iconic architectural building.",
      factoid: "Originally founded as an outdoor arts fair in 1947, BAM opened its current red-pigmented concrete building designed by architect Steven Holl in 2001."
    },
    {
      id: "meydenbauer_bay_park",
      name: "Meydenbauer Bay Park",
      coords: [47.6111, -122.2106],
      year: "Est. 1953",
      image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80",
      snippet: "Historic Lake Washington waterfront park connecting downtown Bellevue directly to Meydenbauer shoreline.",
      factoid: "Meydenbauer Bay was the landing site for ferries connecting Bellevue to Seattle before the Lake Washington floating bridges were built."
    }
  ];

  // --- 2. Haversine Distance Formula (Meters) ---
  function getDistanceMeters(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Earth radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // --- 3. State Management (Bellevue, WA Default) ---
  let isDeviceGps = true;
  let currentLat = 47.6101;
  let currentLng = -122.2015;
  let userHeading = 0;
  let userSpeed = 0;
  let userAccuracy = 5;
  let visitedPoiIds = new Set();
  let watchPositionId = null;

  // --- 4. Leaflet Map Setup ---
  const map = L.map('mobileMap', {
    zoomControl: false,
    attributionControl: false
  }).setView([currentLat, currentLng], 17);

  // CartoDB Dark Tiles
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19
  }).addTo(map);

  // Pulse User Icon
  const userMarkerIcon = L.divIcon({
    className: 'mobile-user-marker',
    html: `<div style="
      width: 22px;
      height: 22px;
      background: #00e676;
      border: 3px solid #ffffff;
      border-radius: 50%;
      box-shadow: 0 0 20px #00e676;
    "></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11]
  });

  let userMarker = L.marker([currentLat, currentLng], { icon: userMarkerIcon }).addTo(map);

  // GPS Accuracy Circle
  let accuracyCircle = L.circle([currentLat, currentLng], {
    color: '#00e5ff',
    fillColor: '#00e5ff',
    fillOpacity: 0.1,
    radius: userAccuracy
  }).addTo(map);

  // Render POI Map Markers
  POIS.forEach(poi => {
    L.circleMarker(poi.coords, {
      radius: 8,
      color: '#ffaa00',
      fillColor: '#ffaa00',
      fillOpacity: 0.9
    }).addTo(map).bindTooltip(`<b>${poi.name}</b>`, { permanent: false, direction: 'top' });
  });

  // --- 5. Real-Time Location Update Handler ---
  function onLocationUpdate(lat, lng, accuracy, speed, heading) {
    currentLat = lat;
    currentLng = lng;
    userAccuracy = accuracy || 5;
    userSpeed = speed || 0;
    userHeading = heading || 0;

    userMarker.setLatLng([lat, lng]);
    accuracyCircle.setLatLng([lat, lng]);
    accuracyCircle.setRadius(userAccuracy);

    // Update Telemetry HUD
    document.getElementById('mobileCoords').innerText = `${lat.toFixed(4)}°, ${lng.toFixed(4)}°`;
    document.getElementById('mobileSpeed').innerText = `${userSpeed.toFixed(1)} m/s`;
    document.getElementById('mobileAccuracy').innerText = `± ${Math.round(userAccuracy)}m`;

    // Update GPS Status Pill
    const gpsPill = document.getElementById('gpsPill');
    gpsPill.className = 'gps-status-pill active';
    document.getElementById('gpsPillText').innerText = 'GPS LIVE';

    // Find Closest POI & Check Geofence
    let closestPoi = null;
    let minDistance = Infinity;

    POIS.forEach(poi => {
      const dist = getDistanceMeters(lat, lng, poi.coords[0], poi.coords[1]);
      if (dist < minDistance) {
        minDistance = dist;
        closestPoi = poi;
      }
    });

    if (closestPoi) {
      document.getElementById('mobilePoiTitle').innerText = closestPoi.name;
      document.getElementById('mobilePoiSnippet').innerText = closestPoi.snippet;
      document.getElementById('mobilePoiDistance').innerHTML = `<i class="fa-solid fa-walking"></i> ${Math.round(minDistance)}m away`;
      document.getElementById('mobilePoiThumb').style.backgroundImage = `url('${closestPoi.image}')`;

      // Trigger automatic audio narration if within 50m geofence
      if (minDistance <= 50 && !visitedPoiIds.has(closestPoi.id)) {
        visitedPoiIds.add(closestPoi.id);
        triggerPoiAudioNarration(closestPoi);
      }
    }
  }

  function triggerPoiAudioNarration(poi) {
    // Pulse POI card border
    const poiCard = document.getElementById('mobilePoiCard');
    poiCard.style.borderColor = '#00e5ff';
    poiCard.style.boxShadow = '0 0 20px rgba(0, 229, 255, 0.4)';

    setTimeout(() => {
      poiCard.style.borderColor = 'rgba(66, 133, 244, 0.3)';
      poiCard.style.boxShadow = 'none';
    }, 5000);
  }

  // --- 6. HTML5 Geolocation Watcher ---
  function startGeolocationWatch() {
    if ('geolocation' in navigator) {
      watchPositionId = navigator.geolocation.watchPosition(
        (position) => {
          const coords = position.coords;
          onLocationUpdate(
            coords.latitude,
            coords.longitude,
            coords.accuracy,
            coords.speed,
            coords.heading
          );
        },
        (error) => {
          console.warn('GPS Error or Permission Denied:', error.message);
          const gpsPill = document.getElementById('gpsPill');
          gpsPill.className = 'gps-status-pill seeking';
          document.getElementById('gpsPillText').innerText = 'GPS SIMULATED';
          // Fallback to default Bellevue WA position
          onLocationUpdate(47.6101, -122.2015, 10, 1.2, 90);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 10000
        }
      );
    }
  }

  startGeolocationWatch();

  // Recenter Button
  document.getElementById('btnRecenter').addEventListener('click', () => {
    map.flyTo([currentLat, currentLng], 17, { duration: 1 });
  });

  // Toggle GPS Mode (Device vs Simulated)
  let simStep = 0;
  let simInterval = null;
  document.getElementById('btnToggleSim').addEventListener('click', () => {
    isDeviceGps = !isDeviceGps;
    const fab = document.getElementById('btnToggleSim');

    if (!isDeviceGps) {
      fab.classList.add('active');
      if (watchPositionId) navigator.geolocation.clearWatch(watchPositionId);

      // Start simulated walk in Bellevue towards Downtown Park
      simInterval = setInterval(() => {
        simStep++;
        const simLat = 47.6101 + (simStep * 0.0001);
        const simLng = -122.2015 + (simStep * 0.0001);
        onLocationUpdate(simLat, simLng, 4, 1.4, 45);
      }, 2000);
    } else {
      fab.classList.remove('active');
      if (simInterval) clearInterval(simInterval);
      startGeolocationWatch();
    }
  });

  // --- 7. Canvas Waveform Audio Visualizer ---
  const canvas = document.getElementById('mobileCanvas');
  const ctx = canvas.getContext('2d');
  let phase = 0;

  function resizeCanvas() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  function drawMobileWave() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const width = canvas.width;
    const height = canvas.height;
    const centerY = height / 2;

    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#00e5ff';

    for (let x = 0; x < width; x++) {
      const y = centerY + Math.sin(x * 0.04 + phase) * 8 * Math.sin(x * 0.02);
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }

    ctx.stroke();
    phase += 0.08;
    requestAnimationFrame(drawMobileWave);
  }
  drawMobileWave();

  // Push to Talk Mic Button
  document.getElementById('btnMobileMic').addEventListener('click', () => {
    const btn = document.getElementById('btnMobileMic');
    btn.style.transform = 'scale(0.9)';
    setTimeout(() => { btn.style.transform = 'scale(1)'; }, 200);
  });

});
