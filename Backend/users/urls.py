from django.urls import path
from . import views
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('register/', views.register_user, name='register_user'),
    path('login/', views.login_user, name='login_user'),
    path('profile/',views.user_profile,name='user_profile'),
    path('token/refresh/', TokenRefreshView.as_view(),name='token_refresh'),
    path('profile/update/', views.update_user_profile, name='update_user_profile'),
    path('all/', views.get_all_users, name='get_all_users'),
    path('<int:user_id>/', views.get_user_by_id, name='get_user_by_id'),
    path('<int:user_id>/update/', views.update_user_by_admin, name='update_user_by_admin'),
    path('<int:user_id>/delete/', views.delete_user_by_admin, name='delete_user_by_admin'),

]