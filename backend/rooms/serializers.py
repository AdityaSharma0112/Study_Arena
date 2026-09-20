from rest_framework import serializers
from .models import Room, RoomParticipant

class ParticipantSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoomParticipant
        fields = [
            'id', 'peer_id', 'username', 'is_active',
            'is_muted', 'is_camera_off', 'is_screen_sharing',
            'joined_at'
        ]

class RoomSerializer(serializers.ModelSerializer):
    participants = serializers.SerializerMethodField()
    active_count = serializers.IntegerField(source='participant_count', read_only=True)

    class Meta:
        model = Room
        fields = [
            'id', 'code', 'title', 'host_name',
            'max_participants', 'is_active', 'active_count',
            'participants', 'created_at'
        ]

    def get_participants(self, obj):
        active_participants = obj.participants.filter(is_active=True)
        return ParticipantSerializer(active_participants, many=True).data

class CreateRoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = ['title', 'host_name', 'max_participants']
