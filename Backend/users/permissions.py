from rest_framework.permissions import BasePermission


class IsAdminUserCustom(BasePermission):

    message = 'Only admin users can perform this action.'

    def has_permission(self, request, view):

        return (
            request.user
            and request.user.is_authenticated
            and request.user.is_admin
        )