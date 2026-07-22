from django.utils.text import slugify

from rest_framework import serializers

from .models import Product


class ProductSerializer(serializers.ModelSerializer):

    class Meta:

        model = Product

        fields = [
            'id',
            'brand',
            'category',
            'name',
            'slug',
            'description',
            'image',
            'price',
            'stock',
            'sku',
            'is_featured',
            'is_active',
            'created_at',
            'updated_at',
        ]

        read_only_fields = [
            'id',
            'slug',
            'created_at',
            'updated_at',
        ]

    def validate_name(self, name):

        name = name.strip()

        if len(name) < 3:

            raise serializers.ValidationError(
                "Product name must contain at least 3 characters."
            )

        products = Product.objects.filter(
            name__iexact=name
        )

        if self.instance:

            products = products.exclude(
                id=self.instance.id
            )

        if products.exists():

            raise serializers.ValidationError(
                "A product with this name already exists."
            )

        return name

    def validate_price(self, price):

        if price <= 0:

            raise serializers.ValidationError(
                "Price must be greater than zero."
            )

        return price

    def validate_stock(self, stock):

        if stock < 0:

            raise serializers.ValidationError(
                "Stock cannot be negative."
            )

        return stock

    def validate_sku(self, sku):

        sku = sku.strip().upper()

        products = Product.objects.filter(
            sku=sku
        )

        if self.instance:

            products = products.exclude(
                id=self.instance.id
            )

        if products.exists():

            raise serializers.ValidationError(
                "SKU already exists."
            )

        return sku

    def create(self, validated_data):

        validated_data["slug"] = slugify(
            validated_data["name"]
        )

        return super().create(validated_data)
