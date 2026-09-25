from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.authtoken.models import Token
from .serializers import UserSerializer, LoginSerializer

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            token = serializer.validated_data['token']
            return Response({
                'success': True,
                'token': token,
                'user': UserSerializer(user).data
            }, status=status.HTTP_200_OK)
        
        # Flatten errors
        errors = serializer.errors
        error_msg = 'Invalid credentials.'
        if 'non_field_errors' in errors and errors['non_field_errors']:
            error_msg = str(errors['non_field_errors'][0])
        elif 'username' in errors:
            error_msg = str(errors['username'][0])
        elif 'password' in errors:
            error_msg = str(errors['password'][0])

        return Response({
            'success': False,
            'error': error_msg,
            'details': errors
        }, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            # Delete user's token
            Token.objects.filter(user=request.user).delete()
            return Response({'success': True, 'message': 'Logged out successfully.'}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'success': False, 'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({
            'success': True,
            'user': UserSerializer(request.user).data
        }, status=status.HTTP_200_OK)
