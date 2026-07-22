from rest_framework import serializers

from .models import Brand


class BrandSerializer(serializers.ModelSerializer):

    class Meta:
        model = Brand

        fields = [
            'id',
            'name',
            'description',
            'logo',
            'is_active',
            'created_at',
            'updated_at',
        ]

        read_only_fields = [
            'id',
            'created_at',
            'updated_at',
        ]

    def validate_name(self, name):

        name = name.strip()

        if len(name) < 2:
            raise serializers.ValidationError(
                'Brand name must contain at least 2 characters'
            )

        current_brand = self.instance

        brands = Brand.objects.filter(
            name__iexact=name
        )

        if current_brand:
            brands = brands.exclude(
                id=current_brand.id
            )

        if brands.exists():
            raise serializers.ValidationError(
                'This brand already exists'
            )

        return name
# Using:
# name__iexact=name
# prevents duplicates such as:
# Nike
# nike
# NIKE