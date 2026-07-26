from rest_framework import serializers

from products.models import Product

from .models import Cart, CartItem


class ProductMiniSerializer(serializers.ModelSerializer):

    class Meta:
        model = Product

        fields = [
            'id',
            'name',
            'slug',
            'image',
            'price',
            'stock',
            'sku',
            'is_active',
        ]


class CartItemSerializer(serializers.ModelSerializer):

    product = ProductMiniSerializer(
        read_only=True
    )

    subtotal = serializers.SerializerMethodField()

    class Meta:
        model = CartItem

        fields = [
            'id',
            'product',
            'quantity',
            'subtotal',
            'created_at',
            'updated_at',
        ]

    def get_subtotal(self, item):
        return str(item.subtotal)


class CartSerializer(serializers.ModelSerializer):

    items = CartItemSerializer(
        many=True,
        read_only=True
    )

    total_items = serializers.SerializerMethodField()

    total_price = serializers.SerializerMethodField()

    class Meta:
        model = Cart

        fields = [
            'id',
            'items',
            'total_items',
            'total_price',
            'updated_at',
        ]

    def get_total_items(self, cart):
        return cart.total_items

    def get_total_price(self, cart):
        return str(cart.total_price)


class AddToCartSerializer(serializers.Serializer):

    product_id = serializers.IntegerField()

    quantity = serializers.IntegerField(
        default=1
    )

    def validate_product_id(self, product_id):

        try:
            product = Product.objects.get(
                id=product_id,
                is_active=True
            )

        except Product.DoesNotExist:
            raise serializers.ValidationError(
                'Product not found or is unavailable.'
            )

        self.product = product

        return product_id

    def validate_quantity(self, quantity):

        if quantity < 1:
            raise serializers.ValidationError(
                'Quantity must be at least 1.'
            )

        return quantity

    def validate(self, data):

        product = self.product

        cart = self.context['cart']

        existing_item = CartItem.objects.filter(
            cart=cart,
            product=product
        ).first()

        already_in_cart = existing_item.quantity if existing_item else 0

        requested_total = already_in_cart + data['quantity']

        if requested_total > product.stock:

            raise serializers.ValidationError({
                'quantity': f'Only {product.stock} in stock. '
                            f'You already have {already_in_cart} in your cart.'
            })

        data['product'] = product

        data['existing_item'] = existing_item

        return data


class UpdateCartItemSerializer(serializers.Serializer):

    quantity = serializers.IntegerField()

    def validate_quantity(self, quantity):

        if quantity < 1:
            raise serializers.ValidationError(
                'Quantity must be at least 1. Use the remove endpoint to delete this item.'
            )

        item = self.context['item']

        if quantity > item.product.stock:
            raise serializers.ValidationError(
                f'Only {item.product.stock} in stock.'
            )

        return quantity
