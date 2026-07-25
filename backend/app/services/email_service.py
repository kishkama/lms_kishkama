import logging

logger = logging.getLogger("learnflow.email")


class EmailService:
    """Stubbed email sender. Swap this out for a real SMTP/SES/etc. client in production —
    every call site in this codebase only depends on the `send_password_reset_email` method."""

    async def send_password_reset_email(self, to_email: str, reset_link: str) -> None:
        logger.info("Password reset link for %s: %s", to_email, reset_link)


email_service = EmailService()
