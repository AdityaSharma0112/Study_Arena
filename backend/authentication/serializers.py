from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework.authtoken.models import Token

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'is_staff', 'date_joined']
        read_only_fields = ['id', 'is_staff', 'date_joined']

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(required=True)
    password = serializers.CharField(required=True, write_only=True)

    def validate(self, data):
        username = data.get('username', '').strip()
        password = data.get('password', '').strip()

        if not username or not password:
            raise serializers.ValidationError('Both username and password are required.')

        user = authenticate(username=username, password=password)
        if not user:
            # Check if user exists but wrong password, or user doesn't exist
            if not User.objects.filter(username=username).exists():
                raise serializers.ValidationError('No account found with this username. Please contact your administrator.')
            raise serializers.ValidationError('Invalid password. Please try again.')

        if not user.is_active:
            raise serializers.ValidationError('This account has been deactivated.')

        token, _ = Token.objects.get_or_create(user=user)
        return {
            'user': user,
            'token': token.key
        }
