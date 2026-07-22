from rest_framework.decorators import (
    api_view,
    permission_classes,
    parser_classes,
)

from rest_framework.permissions import (
    AllowAny,
    IsAuthenticated,
)

from rest_framework.parsers import (
    MultiPartParser,
    FormParser,
    JSONParser,
)

from rest_framework.response import Response
from rest_framework import status

from users.permissions import IsAdminUserCustom

from .models import Product
from .serializers import ProductSerializer
@api_view(['POST'])
@permission_classes([
    IsAuthenticated,
    IsAdminUserCustom
])
@parser_classes([
    MultiPartParser,
    FormParser,
    JSONParser
])
def create_product(request):

    serializer = ProductSerializer(
        data=request.data,
        context={'request': request}
    )

    if serializer.is_valid():

        product = serializer.save()

        return Response({
            "success": True,
            "message": "Product created successfully.",
            "product": ProductSerializer(
                product,
                context={'request': request}
            ).data
        }, status=status.HTTP_201_CREATED)

    return Response({
        "success": False,
        "message": "Product creation failed.",
        "errors": serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([AllowAny])
def get_all_products(request):

    products = Product.objects.filter(
        is_active=True
    )

    serializer = ProductSerializer(
        products,
        many=True,
        context={'request': request}
    )

    return Response({
        "success": True,
        "message": "Products fetched successfully.",
        "count": products.count(),
        "products": serializer.data
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_product_by_id(request, product_id):

    try:

        product = Product.objects.get(
            id=product_id,
            is_active=True
        )

    except Product.DoesNotExist:

        return Response({
            "success": False,
            "message": "Product not found."
        }, status=status.HTTP_404_NOT_FOUND)

    serializer = ProductSerializer(
        product,
        context={'request': request}
    )

    return Response({
        "success": True,
        "message": "Product fetched successfully.",
        "product": serializer.data
    }, status=status.HTTP_200_OK)

@api_view(['PUT', 'PATCH'])
@permission_classes([
    IsAuthenticated,
    IsAdminUserCustom
])
@parser_classes([
    MultiPartParser,
    FormParser,
    JSONParser
])
def update_product(request, product_id):

    try:

        product = Product.objects.get(
            id=product_id
        )

    except Product.DoesNotExist:

        return Response({
            "success": False,
            "message": "Product not found."
        }, status=status.HTTP_404_NOT_FOUND)

    serializer = ProductSerializer(
        product,
        data=request.data,
        partial=request.method == "PATCH",
        context={'request': request}
    )

    if serializer.is_valid():

        product = serializer.save()

        return Response({
            "success": True,
            "message": "Product updated successfully.",
            "product": ProductSerializer(
                product,
                context={'request': request}
            ).data
        }, status=status.HTTP_200_OK)

    return Response({
        "success": False,
        "message": "Product update failed.",
        "errors": serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
@permission_classes([
    IsAuthenticated,
    IsAdminUserCustom
])
def delete_product(request, product_id):

    try:

        product = Product.objects.get(
            id=product_id
        )

    except Product.DoesNotExist:

        return Response({
            "success": False,
            "message": "Product not found."
        }, status=status.HTTP_404_NOT_FOUND)

    product.delete()

    return Response({
        "success": True,
        "message": "Product deleted successfully."
    }, status=status.HTTP_200_OK)
