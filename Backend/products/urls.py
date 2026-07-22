from django.urls import path

from . import views


urlpatterns = [

    path(
        '',
        views.get_all_products,
        name='get_all_products'
    ),

    path(
        'create/',
        views.create_product,
        name='create_product'
    ),

    path(
        '<int:product_id>/',
        views.get_product_by_id,
        name='get_product_by_id'
    ),

    path(
        '<int:product_id>/update/',
        views.update_product,
        name='update_product'
    ),

    path(
        '<int:product_id>/delete/',
        views.delete_product,
        name='delete_product'
    ),
]