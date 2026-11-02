from rest_framework.throttling import SimpleRateThrottle


class IPAddressRateThrottle(SimpleRateThrottle):
    """Counts requests per IP address, even if the caller is logged in."""

    def get_cache_key(self, request, view):
        return self.cache_format % {
            "scope": self.scope,
            "ident": self.get_ident(request),
        }


class LoginRateThrottle(IPAddressRateThrottle):
    scope = 'login'


class SignupRateThrottle(IPAddressRateThrottle):
    scope = 'signup'


class ContactRateThrottle(IPAddressRateThrottle):
    scope = 'contact'


class PasswordChangeRateThrottle(SimpleRateThrottle):
    """Limits each logged-in user. Falls back to the IP address if there is no user."""
    scope = 'password_change'

    def get_cache_key(self, request, view):
        if request.user and request.user.is_authenticated:
            ident = request.user.pk
        else:
            ident = self.get_ident(request)

        return self.cache_format % {
            "scope": self.scope,
            "ident": ident
        }
