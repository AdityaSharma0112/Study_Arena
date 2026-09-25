from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

def health_check(request):
    return JsonResponse({
        'status': 'healthy',
        'service': 'Study Arena WebRTC Signaling & REST API',
        'cost': '₹0',
        'version': '1.0.0'
    })

urlpatterns = [
    path('', health_check, name='root-health'),
    path('health/', health_check, name='health-check'),
    path('api/health/', health_check, name='api-health-check'),
    path('admin/', admin.site.urls),
    path('api/auth/', include('authentication.urls')),
    path('api/rooms/', include('rooms.urls')),
]
