from django.contrib import admin

from .models import Cart, CartItem


class CartItemInline(admin.TabularInline):

    model = CartItem

    extra = 0

    readonly_fields = [
        'product',
        'quantity',
        'created_at',
        'updated_at',
    ]


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):

    list_display = [
        'id',
        'user',
        'total_items',
        'total_price',
        'updated_at',
    ]

    search_fields = [
        'user__email',
        'user__name',
    ]

    inlines = [
        CartItemInline,
    ]
