from rest_framework import serializers
from .models import Category


class CategorySerializer(serializers.ModelSerializer):

    class Meta:
        model = Category
        fields = [
            "id",
            "name",
            "description",
            "image",
            "is_active",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]

    def validate_name(self, name):
        name = name.strip()

        if len(name) < 2:
            raise serializers.ValidationError(
                "Category name must contain at least 2 characters."
            )

        current_category = self.instance

        categories = Category.objects.filter(name__iexact=name)

        if current_category:
            categories = categories.exclude(id=current_category.id)

        if categories.exists():
            raise serializers.ValidationError(
                "This category already exists."
            )

        return name