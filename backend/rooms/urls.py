from django.urls import path
from .views import (
    CreateRoomView,
    RoomDetailView,
    VerifyRoomView,
    ActiveRoomsView,
    DeleteRoomView,
    ClearAllRoomsView,
)

urlpatterns = [
    path('create/', CreateRoomView.as_view(), name='room-create'),
    path('active/', ActiveRoomsView.as_view(), name='rooms-active'),
    path('clear-all/', ClearAllRoomsView.as_view(), name='rooms-clear-all'),
    path('<str:code>/', RoomDetailView.as_view(), name='room-detail'),
    path('<str:code>/verify/', VerifyRoomView.as_view(), name='room-verify'),
    path('<str:code>/delete/', DeleteRoomView.as_view(), name='room-delete'),
]
