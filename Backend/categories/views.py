from django.shortcuts import render

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
)
from rest_framework.response import Response
from rest_framework import status

from users.permissions import IsAdminUserCustom

from .models import Category
from .serializers import CategorySerializer


# ===========================
# Create Category
# ===========================
@api_view(["POST"])
@permission_classes([IsAuthenticated, IsAdminUserCustom])
@parser_classes([MultiPartParser, FormParser])
def create_category(request):

    serializer = CategorySerializer(
        data=request.data,
        context={"request": request},
    )

    if serializer.is_valid():

        category = serializer.save()

        return Response(
            {
                "success": True,
                "message": "Category created successfully",
                "category": CategorySerializer(
                    category,
                    context={"request": request},
                ).data,
            },
            status=status.HTTP_201_CREATED,
        )

    return Response(
        {
            "success": False,
            "message": "Category creation failed",
            "errors": serializer.errors,
        },
        status=status.HTTP_400_BAD_REQUEST,
    )


# ===========================
# Get All Categories
# ===========================
@api_view(["GET"])
@permission_classes([AllowAny])
def get_all_categories(request):

    categories = Category.objects.all()

    serializer = CategorySerializer(
        categories,
        many=True,
        context={"request": request},
    )

    return Response(
        {
            "success": True,
            "message": "Categories fetched successfully",
            "count": categories.count(),
            "categories": serializer.data,
        }
    )


# ===========================
# Get Category By ID
# ===========================
@api_view(["GET"])
@permission_classes([AllowAny])
def get_category_by_id(request, category_id):

    try:
        category = Category.objects.get(id=category_id)

    except Category.DoesNotExist:
        return Response(
            {
                "success": False,
                "message": "Category not found",
            },
            status=status.HTTP_404_NOT_FOUND,
        )

    return Response(
        {
            "success": True,
            "message": "Category fetched successfully",
            "category": CategorySerializer(
                category,
                context={"request": request},
            ).data,
        }
    )


# ===========================
# Update Category
# ===========================
@api_view(["PUT", "PATCH"])
@permission_classes([IsAuthenticated, IsAdminUserCustom])
@parser_classes([MultiPartParser, FormParser])
def update_category(request, category_id):

    try:
        category = Category.objects.get(id=category_id)

    except Category.DoesNotExist:
        return Response(
            {
                "success": False,
                "message": "Category not found",
            },
            status=status.HTTP_404_NOT_FOUND,
        )

    serializer = CategorySerializer(
        category,
        data=request.data,
        partial=request.method == "PATCH",
        context={"request": request},
    )

    if serializer.is_valid():

        updated_category = serializer.save()

        return Response(
            {
                "success": True,
                "message": "Category updated successfully",
                "category": CategorySerializer(
                    updated_category,
                    context={"request": request},
                ).data,
            }
        )

    return Response(
        {
            "success": False,
            "message": "Category update failed",
            "errors": serializer.errors,
        },
        status=status.HTTP_400_BAD_REQUEST,
    )


# ===========================
# Delete Category
# ===========================
@api_view(["DELETE"])
@permission_classes([IsAuthenticated, IsAdminUserCustom])
def delete_category(request, category_id):

    try:
        category = Category.objects.get(id=category_id)

    except Category.DoesNotExist:
        return Response(
            {
                "success": False,
                "message": "Category not found",
            },
            status=status.HTTP_404_NOT_FOUND,
        )

    category.delete()

    return Response(
        {
            "success": True,
            "message": "Category deleted successfully",
        }
    )
