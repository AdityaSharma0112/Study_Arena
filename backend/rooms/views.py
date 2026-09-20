from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import Room, RoomParticipant
from .serializers import RoomSerializer, CreateRoomSerializer

class CreateRoomView(APIView):
    def post(self, request):
        serializer = CreateRoomSerializer(data=request.data)
        if serializer.is_valid():
            room = serializer.save()
            return Response(RoomSerializer(room).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class RoomDetailView(APIView):
    def get(self, request, code):
        room = get_object_or_404(Room, code=code.upper())
        return Response(RoomSerializer(room).data)

class VerifyRoomView(APIView):
    def get(self, request, code):
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
                'room': RoomSerializer(room).data
            }, status=status.HTTP_200_OK)

        except Room.DoesNotExist:
            return Response({
                'valid': False,
                'error': 'Room not found. Please check your code.'
            }, status=status.HTTP_404_NOT_FOUND)

class ActiveRoomsView(APIView):
    def get(self, request):
        rooms = Room.objects.filter(is_active=True).order_by('-created_at')[:20]
        return Response(RoomSerializer(rooms, many=True).data)

class DeleteRoomView(APIView):
    def delete(self, request, code):
        code = code.upper()
        try:
            room = Room.objects.get(code=code)
            room.delete()
            return Response({'success': True, 'message': f'Room {code} deleted successfully.'}, status=status.HTTP_200_OK)
        except Room.DoesNotExist:
            return Response({'success': False, 'error': 'Room not found.'}, status=status.HTTP_404_NOT_FOUND)

class ClearAllRoomsView(APIView):
    def post(self, request):
        count, _ = Room.objects.all().delete()
        return Response({'success': True, 'deleted_count': count}, status=status.HTTP_200_OK)
