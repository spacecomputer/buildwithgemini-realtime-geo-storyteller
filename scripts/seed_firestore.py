import asyncio
from google.cloud import firestore

PROJECT_ID = "qwiklabs-gcp-03-873cc72896cf"

async def seed_db():
    print(f"Connecting to Firestore for project {PROJECT_ID}...")
    db = firestore.AsyncClient(project=PROJECT_ID)
    pois_ref = db.collection("pois")
    
    seed_data = [
        {
            "id": "flatiron-building",
            "name": "Flatiron Building",
            "description": "A triangular 22-story steel-framed landmarked building located at 175 Fifth Avenue.",
            "city": "New York",
            "location": firestore.GeoPoint(40.741060, -73.989698)
        },
        {
            "id": "empire-state-building",
            "name": "Empire State Building",
            "description": "A 102-story Art Deco skyscraper in Midtown Manhattan.",
            "city": "New York",
            "location": firestore.GeoPoint(40.7484, -73.9857)
        },
        {
            "id": "central-park",
            "name": "Central Park",
            "description": "An urban park in New York City located between the Upper West and Upper East Sides of Manhattan.",
            "city": "New York",
            "location": firestore.GeoPoint(40.7812, -73.9665)
        }
    ]

    for poi in seed_data:
        poi_id = poi.pop("id")
        doc_ref = pois_ref.document(poi_id)
        await doc_ref.set(poi)
        print(f"Seeded POI: {poi_id}")
        
    print("Seeding complete.")

if __name__ == "__main__":
    asyncio.run(seed_db())
