from django.shortcuts import render

from rest_framework.decorators import (api_view,permission_classes,parser_classes,)
from rest_framework.permissions import (AllowAny,IsAuthenticated,)
from rest_framework.parsers import (MultiPartParser,FormParser,)
from rest_framework.response import Response
from rest_framework import status

from users.permissions import IsAdminUserCustom

from .models import Brand
from .serializers import BrandSerializer

# Create Brand
@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUserCustom])
@parser_classes([MultiPartParser, FormParser])
def create_brand(request):

    serializer = BrandSerializer(
        data=request.data
    )

    if serializer.is_valid():

        brand = serializer.save()

        return Response({
            'success': True,
            'message': 'Brand created successfully',
            'brand': BrandSerializer(
                brand,
                context={'request': request}
            ).data
        }, status=status.HTTP_201_CREATED)

    return Response({
        'success': False,
        'message': 'Brand creation failed',
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)
    
# Get All Brands
@api_view(['GET'])
@permission_classes([AllowAny])
def get_all_brands(request):

    brands = Brand.objects.all()

    serializer = BrandSerializer(
        brands,
        many=True,
        context={'request': request}
    )

    return Response({
        'success': True,
        'message': 'Brands fetched successfully',
        'count': brands.count(),
        'brands': serializer.data
    }, status=status.HTTP_200_OK)
    
 # Get Brand by ID
@api_view(['GET'])
@permission_classes([AllowAny])
def get_brand_by_id(request, brand_id):

    try:
        brand = Brand.objects.get(id=brand_id)

    except Brand.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Brand not found'
        }, status=status.HTTP_404_NOT_FOUND)

    return Response({
        'success': True,
        'message': 'Brand fetched successfully',
        'brand': BrandSerializer(
            brand,
            context={'request': request}
        ).data
    }, status=status.HTTP_200_OK)
    
# Update Brand
@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated, IsAdminUserCustom])
@parser_classes([MultiPartParser, FormParser])
def update_brand(request, brand_id):

    try:
        brand = Brand.objects.get(id=brand_id)

    except Brand.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Brand not found'
        }, status=status.HTTP_404_NOT_FOUND)

    serializer = BrandSerializer(
        brand,
        data=request.data,
        partial=request.method == 'PATCH',
        context={'request': request}
    )

    if serializer.is_valid():

        updated_brand = serializer.save()

        return Response({
            'success': True,
            'message': 'Brand updated successfully',
            'brand': BrandSerializer(
                updated_brand,
                context={'request': request}
            ).data
        }, status=status.HTTP_200_OK)

    return Response({
        'success': False,
        'message': 'Brand update failed',
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)
    
# Delete Brand
@api_view(['DELETE'])
@permission_classes([IsAuthenticated, IsAdminUserCustom])
def delete_brand(request, brand_id):

    try:
        brand = Brand.objects.get(id=brand_id)

    except Brand.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Brand not found'
        }, status=status.HTTP_404_NOT_FOUND)

    brand.delete()

    return Response({
        'success': True,
        'message': 'Brand deleted successfully'
    }, status=status.HTTP_200_OK)





