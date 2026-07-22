from django.contrib import admin

from .models import Product


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):

    list_display = (
        'id',
        'name',
        'brand',
        'category',
        'price',
        'stock',
        'is_featured',
        'is_active',
    )

    list_filter = (
        'brand',
        'category',
        'is_featured',
        'is_active',
    )

    search_fields = (
        'name',
        'sku',
    )

    prepopulated_fields = {
        'slug': ('name',)
    }
