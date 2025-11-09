from django.db import models
from django.conf import settings
from django.utils import timezone


class Conversation(models.Model):
    """
    Represents a conversation between a user and the AI.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='conversations'
    )
    title = models.CharField(max_length=200)
    summary = models.TextField(blank=True, null=True, help_text="AI-generated summary of the conversation")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    search_vector = models.JSONField(null=True, blank=True, help_text="Vector representation for semantic search")

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return f"{self.title or 'Untitled'} - {self.user.email}"

    def save(self, *args, **kwargs):
        # Auto-generate title from first message if not provided
        if not self.title and not self.pk:
            super().save(*args, **kwargs)
            first_message = self.messages.first()
            if first_message:
                self.title = first_message.content[:50] + ('...' if len(first_message.content) > 50 else '')
                super().save(update_fields=['title'])
        else:
            super().save(*args, **kwargs)


class Message(models.Model):
    """
    Represents a message in a conversation with vector embeddings for semantic search.
    """
    ROLE_CHOICES = [
        ('system', 'System'),
        ('user', 'User'),
        ('assistant', 'Assistant'),
    ]
    
    VECTOR_DIMENSION = 1536  # OpenAI's text-embedding-ada-002 vector dimension

    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name='messages'
    )
    content = models.TextField()
    sender = models.CharField(max_length=10, choices=ROLE_CHOICES)
    embedding = models.JSONField(
        null=True,
        blank=True,
        help_text="Vector embedding of the message content for semantic search"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    metadata = models.JSONField(default=dict, blank=True)
    
    def save(self, *args, **kwargs):
        # Update parent conversation's updated_at timestamp
        if self.conversation_id:
            self.conversation.updated_at = timezone.now()
            self.conversation.save(update_fields=['updated_at'])
        super().save(*args, **kwargs)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.sender}: {self.content[:50]}{'...' if len(self.content) > 50 else ''}"
