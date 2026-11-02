from rest_framework.permissions import SAFE_METHODS, BasePermission


def can_edit_projects_and_blog(user):
    return user.is_authenticated and user.can_edit_projects_and_blog


def can_edit_company_content(user):
    return user.is_authenticated and user.can_edit_company_content


def can_manage_users(user):
    return user.is_authenticated and user.can_manage_users


class CanEditProjectsAndBlogOrReadOnly(BasePermission):
    """Public reads. Admins, managers and engineers can write."""

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True

        return can_edit_projects_and_blog(request.user)


class CanEditCompanyContentOrReadOnly(BasePermission):
    """Public reads. Admins and managers can write."""

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True

        return can_edit_company_content(request.user)


class CanManageUsersOrReadOnly(BasePermission):
    """Public reads. Only admins can write."""

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True

        return can_manage_users(request.user)


class CanEditCompanyContentOrCreateOnly(BasePermission):
    """Anyone can send an inquiry. Only admins and managers can read or change them."""

    def has_permission(self, request, view):
        if request.method == "POST":
            return True

        return can_edit_company_content(request.user)


class CanManageUsers(BasePermission):
    def has_permission(self, request, view):
        return can_manage_users(request.user)


class CanUseDashboard(BasePermission):
    def has_permission(self, request, view):
        return can_edit_projects_and_blog(request.user)
