from django.contrib import admin
from .models import Room, RoomParticipant, ArenaSession, AnswerEvaluation

@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ('code', 'title', 'host_name', 'creator', 'is_active', 'created_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('code', 'title', 'host_name', 'creator__username')

@admin.register(RoomParticipant)
class RoomParticipantAdmin(admin.ModelAdmin):
    list_display = ('username', 'user', 'room', 'peer_id', 'is_active', 'joined_at', 'left_at')
    list_filter = ('is_active', 'joined_at')
    search_fields = ('username', 'user__username', 'room__code', 'peer_id')

@admin.register(ArenaSession)
class ArenaSessionAdmin(admin.ModelAdmin):
    list_display = ('room', 'topic', 'status', 'current_turn_index', 'created_at')
    list_filter = ('status', 'topic')
    search_fields = ('room__code', 'topic')

@admin.register(AnswerEvaluation)
class AnswerEvaluationAdmin(admin.ModelAdmin):
    list_display = ('participant_name', 'session', 'total_score', 'technical_score', 'clarity_score', 'relevance_score', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('participant_name', 'session__room__code')
