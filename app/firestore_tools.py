from google.cloud import firestore

PROJECT_ID = "qwiklabs-gcp-03-873cc72896cf"

# Use the explicitly initialized async client
db = firestore.AsyncClient(project=PROJECT_ID)

async def get_poi(poi_id: str) -> dict:
    """Fetch details for a specific Point of Interest (POI) from the catalog.
    
    Args:
        poi_id: The unique identifier for the POI.
        
    Returns:
        A dictionary containing the POI details.
    """
    doc_ref = db.collection("pois").document(poi_id)
    doc = await doc_ref.get()
    if doc.exists:
        data = doc.to_dict()
        if "location" in data and isinstance(data["location"], firestore.GeoPoint):
            data["location"] = {"latitude": data["location"].latitude, "longitude": data["location"].longitude}
        return data
    else:
        return {"error": f"POI {poi_id} not found."}

async def list_pois(city: str = "New York") -> list[dict]:
    """Fetch all verified Points of Interest (POIs) for a given city from the catalog.
    
    Args:
        city: The city to list POIs for. Defaults to "New York".
        
    Returns:
        A list of dictionaries, each containing POI details.
    """
    query = db.collection("pois").where(filter=firestore.FieldFilter("city", "==", city))
    pois = []
    async for doc in query.stream():
        data = doc.to_dict()
        data["id"] = doc.id
        if "location" in data and isinstance(data["location"], firestore.GeoPoint):
            data["location"] = {"latitude": data["location"].latitude, "longitude": data["location"].longitude}
        pois.append(data)
    return pois

async def add_poi(poi_id: str, name: str, description: str, city: str, latitude: float, longitude: float) -> dict:
    """Persist a new user-discovered or verified Point of Interest (POI) to the database.
    
    Args:
        poi_id: The unique identifier for the POI (e.g. 'empire-state-building').
        name: The human-readable name of the POI.
        description: A short, verified audio-ready summary of the POI.
        city: The city where the POI is located.
        latitude: The GPS latitude of the POI.
        longitude: The GPS longitude of the POI.
        
    Returns:
        A success message or error dictionary.
    """
    try:
        doc_ref = db.collection("pois").document(poi_id)
        await doc_ref.set({
            "name": name,
            "description": description,
            "city": city,
            "location": firestore.GeoPoint(latitude, longitude),
        })
        return {"status": "success", "message": f"POI {poi_id} added successfully."}
    except Exception as e:
        return {"status": "error", "message": str(e)}
