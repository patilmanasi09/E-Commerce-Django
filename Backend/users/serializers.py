from rest_framework import serializers
from .models import User
from django.contrib.auth import authenticate

class UserRegisterSerializer(serializers.ModelSerializer):

    confirm_password = serializers.CharField(
        write_only =True
    )

    class Meta:
        model = User
        fields = [
            'id','name','email','password', 'confirm_password'
        ]

        extra_kwargs = {
            'password':{
                'write_only':True
            }
        }

    def validate(self, data):
        password = data.get('password')
        confirm_password = data.get('password')

        if password != confirm_password:
            raise serializers.ValidationError({
                'confirm_password': 'Passwords does not match'
            })

        return data
    
    def validate_email(self, email):
        email = email.lower().strip()

        if User.objects.filter(email = email).exists():
            raise serializers.ValidationError(
                'Email already exists...'
            )
        return email
    
    def validate_name(self, name):
        name = name.strip()

        if len(name) < 3:
            raise serializers.ValidationError(
                'Name must containes at least 3 Characters'
            )
        return name

    def validate_password(self, password):

        if len(password) < 6:
            raise serializers.ValidationError(
                'Password must containes at least 6 Characters'
            )
        return password

    def create(self, validate_data):
        validate_data.pop('confirm_password')

        user = User.objects.create_user(
            name=validate_data['name'],
            email=validate_data['email'],
            password=validate_data['password']
        )
        return user


class UserLoginSerializer(serializers.Serializer):

    email = serializers.EmailField()

    password = serializers.CharField(
        write_only=True
    )

    def validate(self, data):

        email = data.get('email')
        password = data.get('password')

        user = authenticate(
            email=email,
            password=password
        )

        if user is None:
            raise serializers.ValidationError(
                'Invalid email or password'
            )

        if not user.is_active:
            raise serializers.ValidationError(
                'Your account is inactive'
            )

        data['user'] = user

        return data


class UserDetailSerializer(serializers.ModelSerializer):

    class Meta:
        model = User

        fields = [
            'id',
            'name',
            'email',
            'is_admin',
            'is_staff',
            'is_active',
            'created_at',
        ]

class UserProfileUpdateSerializer(serializers.ModelSerializer):

    class Meta:
        model = User

        fields = [
            'name',
            'email',
        ]

    def validate_name(self, name):

        name = name.strip()

        if len(name) < 3:
            raise serializers.ValidationError(
                'Name must contain at least 3 characters'
            )

        return name

    def validate_email(self, email):

        email = email.lower().strip()

        user = self.instance

        if User.objects.filter(
            email=email
        ).exclude(id=user.id).exists():

            raise serializers.ValidationError(
                'A user with this email already exists'
            )

        return email

class AdminUserUpdateSerializer(serializers.ModelSerializer):

    class Meta:
        model = User

        fields = [
            'name',
            'email',
            'is_admin',
            'is_staff',
            'is_active',
        ]

    def validate_email(self, email):

        email = email.lower().strip()

        current_user = self.instance

        email_exists = User.objects.filter(
            email=email
        ).exclude(
            id=current_user.id
        ).exists()

        if email_exists:
            raise serializers.ValidationError(
                'A user with this email already exists'
            )

        return email