from django.urls import re_path
from .consumers import SignalingConsumer

websocket_urlpatterns = [
    re_path(r'ws/rooms/(?P<room_code>\w+)/$', SignalingConsumer.as_asgi()),
]
