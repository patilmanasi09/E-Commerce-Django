from django.shortcuts import render

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import UserRegisterSerializer, UserLoginSerializer, UserDetailSerializer, UserProfileUpdateSerializer, AdminUserUpdateSerializer

from .permissions import IsAdminUserCustom
from .models import User


@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):

    serializer = UserRegisterSerializer(
        data = request.data
    )

    if serializer.is_valid():

        user = serializer.save()

        return Response({
            'success':True,
            'message':'User Registered Successfully',
            'user':{
                'id':user.id,
                'name':user.name,
                'email':user.email,
                'is_admin':user.is_admin
            }
        }, status = status.HTTP_201_CREATED)
    return Response({
            'success':False,
            'message':'User Registered Failed',
            'error': serializer.errors
    },status = status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def login_user(request):

    serializer = UserLoginSerializer(
        data=request.data,
        context={'request': request}
    )

    if serializer.is_valid():

        user = serializer.validated_data['user']

        refresh = RefreshToken.for_user(user)

        return Response({
            'success': True,
            'message': 'Login successful',
            'user': UserDetailSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_200_OK)

    return Response({
        'success': False,
        'message': 'Login failed',
        'errors': serializer.errors,
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_profile(request):

    user = request.user

    user_data = UserDetailSerializer(user).data

    return Response({
        'success': True,
        'message': 'User profile fetched successfully',
        'user': user_data
    }, status=status.HTTP_200_OK)

@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def update_user_profile(request):

    serializer = UserProfileUpdateSerializer(
        request.user,
        data=request.data,
        partial=request.method == 'PATCH'
    )

    if serializer.is_valid():

        user = serializer.save()

        return Response({
            'success': True,
            'message': 'Profile updated successfully',
            'user': UserDetailSerializer(user).data
        }, status=status.HTTP_200_OK)

    return Response({
        'success': False,
        'message': 'Profile update failed',
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUserCustom])
def get_all_users(request):

    users = User.objects.all().order_by('-created_at')

    serializer = UserDetailSerializer(
        users,
        many=True
    )

    return Response({
        'success': True,
        'message': 'Users fetched successfully',
        'count': users.count(),
        'users': serializer.data
    }, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUserCustom])
def get_user_by_id(request, user_id):

    try:
        user = User.objects.get(id=user_id)

    except User.DoesNotExist:
        return Response({
            'success': False,
            'message': 'User not found'
        }, status=status.HTTP_404_NOT_FOUND)

    serializer = UserDetailSerializer(user)

    return Response({
        'success': True,
        'message': 'User fetched successfully',
        'user': serializer.data
    }, status=status.HTTP_200_OK)

@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated, IsAdminUserCustom])
def update_user_by_admin(request, user_id):

    try:
        user = User.objects.get(id=user_id)

    except User.DoesNotExist:
        return Response({
            'success': False,
            'message': 'User not found'
        }, status=status.HTTP_404_NOT_FOUND)

    serializer = AdminUserUpdateSerializer(
        user,
        data=request.data,
        partial=request.method == 'PATCH'
    )

    if serializer.is_valid():

        updated_user = serializer.save()

        return Response({
            'success': True,
            'message': 'User updated successfully',
            'user': UserDetailSerializer(updated_user).data
        }, status=status.HTTP_200_OK)

    return Response({
        'success': False,
        'message': 'User update failed',
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated, IsAdminUserCustom])
def delete_user_by_admin(request, user_id):

    try:
        user = User.objects.get(id=user_id)

    except User.DoesNotExist:
        return Response({
            'success': False,
            'message': 'User not found'
        }, status=status.HTTP_404_NOT_FOUND)

    if user.id == request.user.id:
        return Response({
            'success': False,
            'message': 'You cannot delete your own admin account'
        }, status=status.HTTP_400_BAD_REQUEST)

    user.delete()

    return Response({
        'success': True,
        'message': 'User deleted successfully'
    }, status=status.HTTP_200_OK)