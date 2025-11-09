import os
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
from openai import OpenAI
from django.conf import settings

# Set up logging
logger = logging.getLogger(__name__)

# Initialize OpenAI client
client = OpenAI(api_key=settings.OPENAI_API_KEY)
DEFAULT_MODEL = "gpt-3.5-turbo-1106"  # Updated to a more recent model

def generate_ai_response(
    messages: List[Dict[str, str]], 
    model: Optional[str] = None,
    temperature: float = 0.7,
    max_tokens: int = 1000
) -> str:
    """
    Generate a response from the AI model based on the conversation history
    
    Args:
        messages: List of message dictionaries with 'role' and 'content' keys
        model: The AI model to use (defaults to gpt-3.5-turbo-1106)
        temperature: Controls randomness (0.0 to 2.0)
        max_tokens: Maximum number of tokens to generate
        
    Returns:
        str: The generated response text
    """
    if not model:
        model = DEFAULT_MODEL
    
    try:
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
            n=1,
            stop=None
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        logger.error(f"Error generating AI response: {str(e)}", exc_info=True)
        return "I'm sorry, I encountered an error while processing your request."

def generate_conversation_summary(messages: List[Dict[str, str]]) -> str:
    """
    Generate a summary of the conversation
    
    Args:
        messages: List of message dictionaries with 'role' and 'content' keys
        
    Returns:
        str: A summary of the conversation
    """
    if not messages:
        return "No messages in conversation"
        
    # Extract the most recent messages (last 10 messages) for summarization
    recent_messages = messages[-10:]
    
    system_prompt = """
    You are a helpful assistant that summarizes conversations concisely.
    Create a brief, informative summary of the key points discussed in the conversation.
    Focus on the main topics, decisions, and action items.
    Keep the summary under 3 sentences.
    """
    
    summary_prompt = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": f"Please summarize this conversation:\n{recent_messages}"}
    ]
    
    return generate_ai_response(summary_prompt)

def get_embedding(text: str, model: str = "text-embedding-ada-002") -> List[float]:
    """
    Get the embedding for a given text using the specified model.
    
    Args:
        text: The input text to embed
        model: The embedding model to use
        
    Returns:
        List of floats representing the embedding
    """
    try:
        response = client.embeddings.create(
            input=text,
            model=model
        )
        return response.data[0].embedding
    except Exception as e:
        logger.error(f"Error getting embedding: {str(e)}", exc_info=True)
        return []


def semantic_search(
    query: str, 
    conversation_context: List[Dict[str, Any]],
    threshold: float = 0.7,
    top_k: int = 5
) -> List[Dict[str, Any]]:
    """
    Perform semantic search on the conversation history
    
    Args:
        query: The search query
        conversation_context: List of previous messages in the conversation
        threshold: Minimum similarity score to include results (0.0 to 1.0)
        top_k: Maximum number of results to return
        
    Returns:
        List of relevant messages with relevance scores and metadata
    """
    if not conversation_context or not query:
        return []
    
    try:
        import numpy as np
        
        def cosine_similarity(a: List[float], b: List[float]) -> float:
            """Calculate cosine similarity between two vectors."""
            if not a or not b:
                return 0.0
            a_norm = np.linalg.norm(a)
            b_norm = np.linalg.norm(b)
            if a_norm == 0 or b_norm == 0:
                return 0.0
            return np.dot(a, b) / (a_norm * b_norm)
        
        # Get embedding for the query
        query_embedding = get_embedding(query)
        if not query_embedding:
            return []
        
        # Calculate similarity for each message with content
        results = []
        for msg in conversation_context:
            if not msg.get('content'):
                continue
                
            # Get or create embedding for the message
            if 'embedding' not in msg:
                msg_embedding = get_embedding(msg['content'])
                if not msg_embedding:
                    continue
                msg['embedding'] = msg_embedding
            else:
                msg_embedding = msg['embedding']
            
            # Calculate similarity
            similarity = cosine_similarity(query_embedding, msg_embedding)
            
            if similarity >= threshold:
                results.append({
                    'content': msg['content'],
                    'role': msg.get('role', 'unknown'),
                    'timestamp': msg.get('timestamp', datetime.utcnow().isoformat()),
                    'similarity': float(similarity)  # Convert numpy float to Python float
                })
        
        # Sort by similarity score (highest first) and return top_k
        results.sort(key=lambda x: x['similarity'], reverse=True)
        return results[:top_k]
        
    except Exception as e:
        logger.error(f"Error in semantic search: {str(e)}", exc_info=True)
        return []
