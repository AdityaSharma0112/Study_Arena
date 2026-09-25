from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import Room, RoomParticipant
from .serializers import RoomSerializer, CreateRoomSerializer

class CreateRoomView(APIView):
    def post(self, request):
        if not request.user or not request.user.is_authenticated:
            return Response({'error': 'Authentication required. Please sign in to create a room.'}, status=status.HTTP_401_UNAUTHORIZED)

        serializer = CreateRoomSerializer(data=request.data)
        if serializer.is_valid():
            creator = request.user
            host_name = request.data.get('host_name') or creator.username

            room = serializer.save(
                creator=creator,
                host_name=host_name
            )
            return Response(RoomSerializer(room, context={'request': request}).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class RoomDetailView(APIView):
    def get(self, request, code):
        if not request.user or not request.user.is_authenticated:
            return Response({'error': 'Authentication required. Please sign in.'}, status=status.HTTP_401_UNAUTHORIZED)
        room = get_object_or_404(Room, code=code.upper())
        return Response(RoomSerializer(room, context={'request': request}).data)

class VerifyRoomView(APIView):
    def get(self, request, code):
        if not request.user or not request.user.is_authenticated:
            return Response({
                'valid': False,
                'error': 'Authentication required. Please sign in to enter this arena.'
            }, status=status.HTTP_401_UNAUTHORIZED)

        code = code.upper()
        try:
            room = Room.objects.get(code=code)
            if not room.is_active:
                return Response({
                    'valid': False,
                    'error': 'This room has ended or is inactive.'
                }, status=status.HTTP_200_OK)

            if room.participant_count >= room.max_participants:
                return Response({
                    'valid': False,
                    'error': f'Room is full (max {room.max_participants} participants).'
                }, status=status.HTTP_200_OK)

            return Response({
                'valid': True,
                'room': RoomSerializer(room, context={'request': request}).data
            }, status=status.HTTP_200_OK)

        except Room.DoesNotExist:
            return Response({
                'valid': False,
                'error': 'Room not found. Please check your code.'
            }, status=status.HTTP_404_NOT_FOUND)

class ActiveRoomsView(APIView):
    def get(self, request):
        user = request.user
        if not user or not user.is_authenticated:
            return Response({
                'isAuthenticated': False,
                'created_rooms': [],
                'joined_rooms': [],
                'all_rooms': []
            }, status=status.HTTP_200_OK)

        from django.db.models import Q
        # 1. Rooms created by this user
        created_qs = Room.objects.filter(
            Q(creator=user) | Q(host_name=user.username),
            is_active=True
        ).distinct().order_by('-created_at')

        # 2. Rooms this user joined previously (excluding ones they created)
        joined_qs = Room.objects.filter(
            Q(participants__user=user) | Q(participants__username=user.username),
            is_active=True
        ).exclude(id__in=created_qs.values_list('id', flat=True)).distinct().order_by('-created_at')

        created_data = RoomSerializer(created_qs, many=True, context={'request': request}).data
        joined_data = RoomSerializer(joined_qs, many=True, context={'request': request}).data

        return Response({
            'isAuthenticated': True,
            'created_rooms': created_data,
            'joined_rooms': joined_data,
            'all_rooms': created_data + joined_data
        }, status=status.HTTP_200_OK)

class DeleteRoomView(APIView):
    def delete(self, request, code):
        if not request.user or not request.user.is_authenticated:
            return Response({'error': 'Authentication required.'}, status=status.HTTP_401_UNAUTHORIZED)

        code = code.upper()
        try:
            room = Room.objects.get(code=code)
            if room.creator and room.creator != request.user and room.host_name != request.user.username:
                return Response({'success': False, 'error': 'You do not have permission to delete this room.'}, status=status.HTTP_403_FORBIDDEN)
            room.delete()
            return Response({'success': True, 'message': f'Room {code} deleted successfully.'}, status=status.HTTP_200_OK)
        except Room.DoesNotExist:
            return Response({'success': False, 'error': 'Room not found.'}, status=status.HTTP_404_NOT_FOUND)

class ClearAllRoomsView(APIView):
    def post(self, request):
        if not request.user or not request.user.is_authenticated or not request.user.is_staff:
            return Response({'error': 'Admin authorization required.'}, status=status.HTTP_403_FORBIDDEN)
        count, _ = Room.objects.all().delete()
        return Response({'success': True, 'deleted_count': count}, status=status.HTTP_200_OK)

class QuestionListView(APIView):
    def get(self, request):
        from .questions import get_all_topics, search_questions
        topic = request.query_params.get('topic', 'All')
        query = request.query_params.get('q', '')
        
        topics = get_all_topics()
        questions = search_questions(query, topic if topic != 'All' else None)
        
        return Response({
            'topics': ['All'] + topics,
            'total': len(questions),
            'questions': questions
        }, status=status.HTTP_200_OK)
