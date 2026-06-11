from dotenv import load_dotenv
load_dotenv()
import os
from pymongo import MongoClient

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
mongo_client = MongoClient(MONGO_URI)
db = mongo_client["corpus_mind"]

documents_col = db["documents"]   # document metadata
chunks_col    = db["chunks"]      # chunks + embeddings (vector search)
history_col   = db["history"]     # query history
relations_col = db["relations"]   # document relationships
