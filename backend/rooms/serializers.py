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
    creator_username = serializers.SerializerMethodField()
    is_creator = serializers.SerializerMethodField()
    is_joined = serializers.SerializerMethodField()

    class Meta:
        model = Room
        fields = [
            'id', 'code', 'title', 'host_name', 'creator_username',
            'is_creator', 'is_joined', 'max_participants', 'is_active',
            'active_count', 'participants', 'created_at'
        ]

    def get_creator_username(self, obj):
        if obj.creator:
            return obj.creator.username
        return obj.host_name

    def get_is_creator(self, obj):
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            return obj.creator == request.user or obj.host_name == request.user.username
        return False

    def get_is_joined(self, obj):
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            return obj.participants.filter(user=request.user).exists() or obj.participants.filter(username=request.user.username).exists()
        return False

    def get_participants(self, obj):
        active_participants = obj.participants.filter(is_active=True)
        return ParticipantSerializer(active_participants, many=True).data

class CreateRoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = ['title', 'host_name', 'max_participants']
