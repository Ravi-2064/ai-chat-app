import json
import logging
from datetime import datetime
from django.conf import settings
from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets, generics
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import JSONParser
from openai import OpenAI

from .models import Conversation, Message
from .serializers import (
    ChatMessageSerializer,
    ConversationDetailSerializer,
    ConversationListSerializer,
    MessageSerializer,
)
from .services import generate_ai_response, generate_conversation_summary, semantic_search
from .auth_views import UserRegistrationView

# Set up logging
logger = logging.getLogger(__name__)

# Configure OpenAI client
client = OpenAI(api_key=settings.OPENAI_API_KEY) if hasattr(settings, 'OPENAI_API_KEY') else None


class ConversationViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing conversations.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = ConversationListSerializer

    def get_queryset(self):
        """
        Return only active conversations for the current user.
        """
        return Conversation.objects.filter(
            user=self.request.user,
            is_active=True
        ).prefetch_related('messages').order_by('-updated_at')

    def get_serializer_class(self):
        """
        Use different serializers for list and retrieve actions.
        """
        if self.action == 'retrieve':
            return ConversationDetailSerializer
        return self.serializer_class

    def perform_create(self, serializer):
        """
        Set the current user as the conversation owner.
        """
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def archive(self, request, pk=None):
        """
        Archive a conversation (soft delete).
        """
        conversation = self.get_object()
        conversation.is_active = False
        conversation.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ChatView(APIView):
    """
    API endpoint for handling chat messages with AI integration.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        """
        Handle incoming chat messages and generate AI responses.
        """
        serializer = ChatMessageSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        message_content = serializer.validated_data['content']
        conversation_id = serializer.validated_data.get('conversation_id')
        search_query = serializer.validated_data.get('search_query')
        
        try:
            # Handle search query if provided
            if search_query and conversation_id:
                conversation = get_object_or_404(Conversation, id=conversation_id, user=user)
                messages = [
                    {'role': msg.role, 'content': msg.content, 'timestamp': msg.timestamp.isoformat()}
                    for msg in conversation.messages.all().order_by('timestamp')
                ]
                search_results = semantic_search(search_query, messages)
                return Response({
                    'search_results': search_results,
                    'conversation_id': conversation.id
                })
            
            # Get or create conversation
            if conversation_id:
                conversation = get_object_or_404(Conversation, id=conversation_id, user=user)
            else:
                conversation = Conversation.objects.create(
                    user=user,
                    title=f"Conversation {Conversation.objects.filter(user=user).count() + 1}"
                )
            
            # Save user message
            user_message = Message.objects.create(
                conversation=conversation,
                role='user',
                content=message_content
            )
            
            # Prepare conversation history
            messages = [
                {
                    'role': msg.role,
                    'content': msg.content,
                    'timestamp': msg.timestamp.isoformat()
                }
                for msg in conversation.messages.all().order_by('timestamp')
            ]
            
            # Generate AI response
            try:
                # Add system message if this is a new conversation
                if len(messages) == 1:  # Only the user's first message
                    system_message = {
                        'role': 'system',
                        'content': 'You are a helpful AI assistant. Provide clear, concise, and accurate responses.'
                    }
                    messages.insert(0, system_message)
                
                # Generate response using the AI service
                ai_content = generate_ai_response(messages)
                
                # Save AI response
                ai_message = Message.objects.create(
                    conversation=conversation,
                    role='assistant',
                    content=ai_content
                )
                
                # Update conversation summary if needed
                if conversation.messages.count() % 5 == 0:  # Update summary every 5 messages
                    conversation.summary = generate_conversation_summary(messages)
                
                # Update conversation timestamp
                conversation.save()
                
                return Response({
                    'conversation_id': conversation.id,
                    'response': ai_content,
                    'summary': conversation.summary
                })
                
            except Exception as e:
                logger.error(f"Error generating AI response: {str(e)}", exc_info=True)
                return Response(
                    {'error': 'Sorry, I encountered an error processing your request.'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
                
        except Exception as e:
            logger.error(f"Error processing chat message: {str(e)}", exc_info=True)
            return Response(
                {'error': 'An error occurred while processing your message.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class MessageViewSet(viewsets.ModelViewSet):
    """
    API endpoint for viewing messages in a conversation.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = MessageSerializer

    def get_queryset(self):
        """
        Return messages for the specified conversation that the user has access to.
        """
        conversation_id = self.kwargs.get('conversation_id')
        return Message.objects.filter(
            conversation_id=conversation_id,
            conversation__user=self.request.user
        ).order_by('created_at')

    def get_serializer_context(self):
        """
        Add the request to the serializer context.
        """
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


class StreamingChatView(APIView):
    """
    API endpoint for streaming chat responses.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """
        Handle streaming chat messages.
        """
        serializer = ChatMessageSerializer(data=request.data, context={'request': request})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        # Implement streaming response
        # This is a placeholder - actual implementation will depend on your streaming setup
        def event_stream():
            yield f"data: {json.dumps({'status': 'processing'})}\n\n"
            # Simulate streaming response
            response_text = "This is a simulated streaming response."
            for word in response_text.split():
                yield f"data: {json.dumps({'content': word + ' '})}\n\n"
                import time
                time.sleep(0.1)
        
        return Response(event_stream(), content_type='text/event-stream')


class SearchView(APIView):
    """
    API endpoint for searching through conversations.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        query = request.query_params.get('q', '')
        if not query:
            return Response(
                {'error': 'Search query is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Use the semantic search service
            results = semantic_search(
                user=request.user,
                query=query,
                limit=10
            )
            return Response({
                'query': query,
                'results': results
            })
        except Exception as e:
            logger.error(f"Search error: {str(e)}")
            return Response(
                {'error': 'An error occurred during search'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class SummarizeView(APIView):
    """
    API endpoint for generating conversation summaries.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        conversation_id = request.data.get('conversation_id')
        if not conversation_id:
            return Response(
                {'error': 'conversation_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            conversation = get_object_or_404(
                Conversation,
                id=conversation_id,
                user=request.user
            )
            
            summary = generate_conversation_summary(conversation)
            conversation.summary = summary
            conversation.save()
            
            return Response({
                'conversation_id': conversation_id,
                'summary': summary
            })
            
        except Exception as e:
            logger.error(f"Summary generation error: {str(e)}")
            return Response(
                {'error': 'Failed to generate summary'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class SuggestionView(APIView):
    """
    API endpoint for getting AI suggestions based on conversation context.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        conversation_id = request.data.get('conversation_id')
        context = request.data.get('context', '')
        
        if not conversation_id and not context:
            return Response(
                {'error': 'Either conversation_id or context is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Get conversation messages if conversation_id is provided
            messages = []
            if conversation_id:
                conversation = get_object_or_404(
                    Conversation,
                    id=conversation_id,
                    user=request.user
                )
                messages = Message.objects.filter(
                    conversation=conversation
                ).order_by('-created_at')[:10]  # Get last 10 messages
                
                messages = [{
                    'role': msg.sender,
                    'content': msg.content
                } for msg in messages]
            
            # Add current context if provided
            if context:
                messages.append({
                    'role': 'user',
                    'content': context
                })
            
            # Generate suggestions using AI
            # This is a placeholder - implement based on your AI service
            suggestions = [
                "Here's a suggested response...",
                "You might want to ask about...",
                "Consider discussing..."
            ]
            
            return Response({
                'suggestions': suggestions
            })
            
        except Exception as e:
            logger.error(f"Suggestion generation error: {str(e)}")
            return Response(
                {'error': 'Failed to generate suggestions'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
