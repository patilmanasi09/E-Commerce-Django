from django.urls import path

from . import views


urlpatterns = [

    path(
        '',
        views.get_cart,
        name='get_cart'
    ),

    path(
        'add/',
        views.add_to_cart,
        name='add_to_cart'
    ),

    path(
        'clear/',
        views.clear_cart,
        name='clear_cart'
    ),

    path(
        'items/<int:item_id>/update/',
        views.update_cart_item,
        name='update_cart_item'
    ),

    path(
        'items/<int:item_id>/remove/',
        views.remove_cart_item,
        name='remove_cart_item'
    ),

]
