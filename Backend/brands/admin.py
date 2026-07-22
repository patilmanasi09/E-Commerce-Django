from django.contrib import admin

from django.contrib import admin

from .models import Brand


@admin.register(Brand)
class BrandAdmin(admin.ModelAdmin):

    list_display = [
        'id',
        'name',
        'is_active',
        'created_at',
    ]

    list_filter = [
        'is_active',
    ]

    search_fields = [
        'name',
    ]

