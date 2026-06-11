# MongoDB Atlas Vector Search Setup

## Steps

1. Go to https://cloud.mongodb.com → your cluster → Atlas Search
2. Click Create Search Index → Vector Search → Bring your own embeddings
3. Name: `chunk_vector_index`
4. Database: `corpus_mind`, Collection: `chunks`
5. Choose JSON Editor and paste:

```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 3072,
      "similarity": "cosine"
    }
  ]
}
```

6. Click Create. Done!
