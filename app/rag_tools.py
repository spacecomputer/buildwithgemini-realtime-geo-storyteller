def consult_docs(query: str) -> str:
    """Search the historical corpus and return matched passages.

    Args:
        query: What to look up (e.g. historical facts, architectural details).
    Returns:
        The matched passages, or a note that none was found.
    """
    from vertexai.preview import rag
    import vertexai
    
    # RAG backend is in us-central1 (Serverless mode)
    vertexai.init(project="qwiklabs-gcp-03-873cc72896cf", location="us-central1")
    
    CORPUS_NAME = "projects/772062807101/locations/us-central1/ragCorpora/883453194871504896"
    
    try:
        resp = rag.retrieval_query(
            text=query,
            rag_resources=[rag.RagResource(rag_corpus=CORPUS_NAME)],
            rag_retrieval_config=rag.RagRetrievalConfig(top_k=5),
        )
    except Exception as e:
        return f"Retrieval failed: {e}"
        
    contexts = getattr(resp.contexts, "contexts", [])
    passages = [c.text.strip() for c in contexts if getattr(c, "text", "").strip()]
    return "\n\n---\n\n".join(passages) or "No relevant passage found."
