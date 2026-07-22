from django.urls import path
from . import views

urlpatterns = [

    # Get All Categories
    path(
        "",views.get_all_categories,name="get_all_categories",),

    # Create Category
    path("create/",views.create_category,name="create_category",),

    # Get Category By ID
    path("<int:category_id>/",views.get_category_by_id,name="get_category_by_id",),

    # Update Category
    path("<int:category_id>/update/",views.update_category,name="update_category",),

    # Delete Category
    path("<int:category_id>/delete/",views.delete_category,name="delete_category",),
]