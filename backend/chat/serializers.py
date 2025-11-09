from rest_framework import serializers
from django.utils import timezone
from .models import Conversation, Message


class MessageSerializer(serializers.ModelSerializer):
    """
    Serializer for the Message model.
    """
    class Meta:
        model = Message
        fields = ['id', 'content', 'sender', 'created_at', 'metadata']
        read_only_fields = ['id', 'created_at']


class ConversationListSerializer(serializers.ModelSerializer):
    """
    Serializer for listing conversations with a preview of the last message.
    """
    last_message = serializers.SerializerMethodField()
    message_count = serializers.SerializerMethodField()
    summary = serializers.SerializerMethodField()
    last_updated = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = [
            'id', 'title', 'created_at', 'updated_at', 'last_updated',
            'last_message', 'message_count', 'summary', 'is_active'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'last_updated']

    def get_last_message(self, obj):
        last_message = obj.messages.last()
        if last_message:
            return MessageSerializer(last_message).data
        return None

    def get_message_count(self, obj):
        return obj.messages.count()
        
    def get_summary(self, obj):
        return obj.summary or "No summary available"
        
    def get_last_updated(self, obj):
        return (timezone.now() - obj.updated_at).days


class ConversationDetailSerializer(serializers.ModelSerializer):
    """
    Serializer for detailed conversation view with all messages.
    """
    messages = MessageSerializer(many=True, read_only=True)

    class Meta:
        model = Conversation
        fields = ['id', 'title', 'created_at', 'updated_at', 'messages']
        read_only_fields = ['id', 'created_at', 'updated_at', 'messages']


class SearchResultSerializer(serializers.Serializer):
    """
    Serializer for search results.
    """
    content = serializers.CharField()
    similarity = serializers.FloatField()
    timestamp = serializers.DateTimeField()
    context = serializers.CharField(required=False)


class ChatMessageSerializer(serializers.Serializer):
    """
    Serializer for handling incoming chat messages.
    """
    content = serializers.CharField(required=False, allow_blank=True)
    conversation_id = serializers.UUIDField(required=False)
    search_query = serializers.CharField(required=False, allow_blank=True)
    metadata = serializers.JSONField(required=False, default=dict)
    
    def validate(self, data):
        """
        Validate that either content or search_query is provided.
        """
        if not data.get('content') and not data.get('search_query'):
            raise serializers.ValidationError("Either content or search_query must be provided.")
        return data

    def validate(self, data):
        """
        Check that if conversation_id is provided, it exists and belongs to the user.
        """
        conversation_id = data.get('conversation_id')
        user = self.context['request'].user

        if conversation_id:
            try:
                conversation = Conversation.objects.get(
                    id=conversation_id,
                    user=user,
                    is_active=True
                )
                data['conversation'] = conversation
            except Conversation.DoesNotExist:
                raise serializers.ValidationError("Conversation not found or access denied.")
        
        return data
