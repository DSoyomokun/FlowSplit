import logging

from twilio.rest import Client

from app.core.config import settings

logger = logging.getLogger(__name__)


class NotificationService:
    def __init__(self):
        self.client: Client | None = None
        if settings.twilio_account_sid and settings.twilio_auth_token:
            self.client = Client(settings.twilio_account_sid, settings.twilio_auth_token)

    async def send_sms(self, to: str, message: str) -> bool:
        """Send an SMS notification."""
        if not self.client:
            logger.warning("Twilio not configured, skipping SMS")
            return False

        try:
            self.client.messages.create(
                body=message,
                from_=settings.twilio_phone_number,
                to=to,
            )
            return True
        except Exception as e:
            logger.error(f"Failed to send SMS: {e}")
            return False

    async def notify_deposit_detected(
        self, phone_number: str, amount: float, source: str | None
    ) -> bool:
        """Notify user of a new deposit."""
        source_text = f" from {source}" if source else ""
        message = (
            f"FlowSplit: New deposit of ${amount:.2f}{source_text} detected. "
            f"Open the app to review and approve your split plan."
        )
        return await self.send_sms(phone_number, message)

    async def notify_split_completed(
        self, phone_number: str, amount: float, bucket_count: int
    ) -> bool:
        """Notify user that a split has been completed."""
        message = (
            f"FlowSplit: Your ${amount:.2f} deposit has been split "
            f"across {bucket_count} buckets."
        )
        return await self.send_sms(phone_number, message)


notification_service = NotificationService()
