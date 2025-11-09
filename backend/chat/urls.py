from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_nested import routers
from . import views

# Main router for the API
router = DefaultRouter()
router.register(r'conversations', views.ConversationViewSet, basename='conversation')

# Nested router for messages within a conversation
conversation_router = routers.NestedSimpleRouter(
    router, r'conversations', lookup='conversation'
)
conversation_router.register(
    r'messages', 
    views.MessageViewSet, 
    basename='conversation-messages'
)

urlpatterns = [
    # Include the router URLs
    path('', include(router.urls)),
    path('', include(conversation_router.urls)),
    
    # Chat endpoints
    path('chat/', views.ChatView.as_view(), name='chat'),
    path('chat/stream/', views.StreamingChatView.as_view(), name='chat-stream'),
    
    # Search
    path('search/', views.SearchView.as_view(), name='search'),
    
    # AI Services
    path('ai/summarize/', views.SummarizeView.as_view(), name='summarize'),
    path('ai/suggestions/', views.SuggestionView.as_view(), name='suggestions'),
]
