try:
    import os
    from getpass import getpass

    import backoff
    from openai import OpenAI
    from pinecone import Pinecone
    from tqdm import tqdm
    from supabase import create_client, Client
except ImportError as e:
    raise ImportError(f"Required packages not found: {e}")



