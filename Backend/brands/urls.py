from django.urls import path

from . import views


urlpatterns = [
    path(
        '',views.get_all_brands,name='get_all_brands'),
    path('create/',views.create_brand,name='create_brand'),

    path('<int:brand_id>/',views.get_brand_by_id,name='get_brand_by_id'),

    path('<int:brand_id>/update/',views.update_brand,name='update_brand'),

    path('<int:brand_id>/delete/',views.delete_brand,name='delete_brand'),
]
