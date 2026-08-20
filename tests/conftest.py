import os
from dotenv import load_dotenv

load_dotenv()

# Ensure GOOGLE_GENAI_USE_VERTEXAI and GOOGLE_CLOUD_PROJECT are set if not present
if not os.getenv("GOOGLE_GENAI_USE_VERTEXAI"):
    os.environ["GOOGLE_GENAI_USE_VERTEXAI"] = "true"
if not os.getenv("GOOGLE_CLOUD_PROJECT"):
    os.environ["GOOGLE_CLOUD_PROJECT"] = "qwiklabs-gcp-03-873cc72896cf"
if not os.getenv("GOOGLE_CLOUD_LOCATION"):
    os.environ["GOOGLE_CLOUD_LOCATION"] = "global"
