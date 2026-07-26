from rest_framework.decorators import (
    api_view,
    permission_classes,
)
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .models import Cart, CartItem
from .serializers import (
    CartSerializer,
    CartItemSerializer,
    AddToCartSerializer,
    UpdateCartItemSerializer,
)


def get_or_create_cart(user):

    cart, created = Cart.objects.get_or_create(
        user=user
    )

    return cart


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_cart(request):

    cart = get_or_create_cart(request.user)

    serializer = CartSerializer(
        cart,
        context={'request': request}
    )

    return Response({
        'success': True,
        'message': 'Cart fetched successfully',
        'cart': serializer.data
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_to_cart(request):

    cart = get_or_create_cart(request.user)

    serializer = AddToCartSerializer(
        data=request.data,
        context={'cart': cart}
    )

    if serializer.is_valid():

        product = serializer.validated_data['product']

        quantity = serializer.validated_data['quantity']

        existing_item = serializer.validated_data['existing_item']

        if existing_item:

            existing_item.quantity += quantity

            existing_item.save()

            item = existing_item

        else:

            item = CartItem.objects.create(
                cart=cart,
                product=product,
                quantity=quantity
            )

        return Response({
            'success': True,
            'message': 'Item added to cart',
            'cart': CartSerializer(cart, context={'request': request}).data
        }, status=status.HTTP_201_CREATED)

    return Response({
        'success': False,
        'message': 'Could not add item to cart',
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_cart_item(request, item_id):

    cart = get_or_create_cart(request.user)

    try:
        item = CartItem.objects.get(
            id=item_id,
            cart=cart
        )

    except CartItem.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Cart item not found'
        }, status=status.HTTP_404_NOT_FOUND)

    serializer = UpdateCartItemSerializer(
        data=request.data,
        context={'item': item}
    )

    if serializer.is_valid():

        item.quantity = serializer.validated_data['quantity']

        item.save()

        return Response({
            'success': True,
            'message': 'Cart item updated',
            'cart': CartSerializer(cart, context={'request': request}).data
        }, status=status.HTTP_200_OK)

    return Response({
        'success': False,
        'message': 'Cart item update failed',
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def remove_cart_item(request, item_id):

    cart = get_or_create_cart(request.user)

    try:
        item = CartItem.objects.get(
            id=item_id,
            cart=cart
        )

    except CartItem.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Cart item not found'
        }, status=status.HTTP_404_NOT_FOUND)

    item.delete()

    return Response({
        'success': True,
        'message': 'Item removed from cart',
        'cart': CartSerializer(cart, context={'request': request}).data
    }, status=status.HTTP_200_OK)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def clear_cart(request):

    cart = get_or_create_cart(request.user)

    cart.items.all().delete()

    return Response({
        'success': True,
        'message': 'Cart cleared',
        'cart': CartSerializer(cart, context={'request': request}).data
    }, status=status.HTTP_200_OK)
