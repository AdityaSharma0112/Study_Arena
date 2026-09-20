from django.db import models
import uuid

def generate_room_code():
    return uuid.uuid4().hex[:8].upper()

class Room(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.CharField(max_length=16, unique=True, default=generate_room_code, db_index=True)
    title = models.CharField(max_length=255, default="Arena Discussion Room")
    host_name = models.CharField(max_length=100, default="Host")
    max_participants = models.PositiveIntegerField(default=6)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} ({self.code})"

    @property
    def participant_count(self):
        return self.participants.filter(is_active=True).count()


class RoomParticipant(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    room = models.ForeignKey(Room, related_name='participants', on_delete=models.CASCADE)
    peer_id = models.CharField(max_length=100, db_index=True)
    username = models.CharField(max_length=100)
    is_active = models.BooleanField(default=True)
    is_muted = models.BooleanField(default=False)
    is_camera_off = models.BooleanField(default=False)
    is_screen_sharing = models.BooleanField(default=False)
    joined_at = models.DateTimeField(auto_now_add=True)
    left_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['joined_at']

    def __str__(self):
        return f"{self.username} in {self.room.code} ({'Active' if self.is_active else 'Left'})"


class ArenaSession(models.Model):
    STATUS_CHOICES = [
        ('IDLE', 'Idle'),
        ('ACTIVE', 'Active'),
        ('PAUSED', 'Paused'),
        ('FINISHED', 'Finished'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    room = models.ForeignKey(Room, related_name='sessions', on_delete=models.CASCADE)
    topic = models.CharField(max_length=100, default="System Design")
    question_text = models.TextField()
    current_speaker_peer_id = models.CharField(max_length=100, null=True, blank=True)
    current_turn_index = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='IDLE')
    round_number = models.PositiveIntegerField(default=1)
    duration_seconds = models.PositiveIntegerField(default=60)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Session for {self.room.code} - Round {self.round_number} ({self.status})"


class AnswerEvaluation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(ArenaSession, related_name='evaluations', on_delete=models.CASCADE)
    participant_name = models.CharField(max_length=100)
    peer_id = models.CharField(max_length=100)
    transcript = models.TextField()
    technical_score = models.FloatField(default=0.0)
    clarity_score = models.FloatField(default=0.0)
    relevance_score = models.FloatField(default=0.0)
    total_score = models.PositiveIntegerField(default=0)
    feedback_summary = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Eval for {self.participant_name} ({self.total_score}/100)"
