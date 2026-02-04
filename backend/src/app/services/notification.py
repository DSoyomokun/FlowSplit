"""
Notification Service
Handles SMS and push notifications for user alerts

Story 82: Notification triggers
"""

import logging
from typing import Any

from twilio.rest import Client

from app.core.config import settings


logger = logging.getLogger(__name__)


class NotificationService:
    """
    Service for sending user notifications.

    Supports:
    - SMS via Twilio
    - Push notifications via Expo Push
    - In-app notifications (stored in database)
    """

    def __init__(self):
        self.twilio_client: Client | None = None
        self.expo_push_url = "https://exp.host/--/api/v2/push/send"
        self._init_twilio()

    def _init_twilio(self) -> None:
        """Initialize Twilio client if configured."""
        if settings.twilio_account_sid and settings.twilio_auth_token:
            try:
                self.twilio_client = Client(
                    settings.twilio_account_sid,
                    settings.twilio_auth_token,
                )
                logger.info("Twilio client initialized")
            except Exception as e:
                logger.warning(f"Failed to initialize Twilio: {e}")

    # -------------------------------------------------------------------------
    # SMS Notifications
    # -------------------------------------------------------------------------

    async def send_sms(self, to: str, message: str) -> bool:
        """Send an SMS notification."""
        if not self.twilio_client:
            logger.warning("Twilio not configured, skipping SMS")
            return False

        try:
            self.twilio_client.messages.create(
                body=message,
                from_=settings.twilio_phone_number,
                to=to,
            )
            logger.info(f"SMS sent to {to[:6]}...")
            return True
        except Exception as e:
            logger.error(f"Failed to send SMS: {e}")
            return False

    async def notify_deposit_detected(
        self,
        phone_number: str,
        amount: float,
        source: str | None = None,
    ) -> bool:
        """Notify user of a new deposit detection."""
        source_text = f" from {source}" if source else ""
        message = (
            f"FlowSplit: New deposit of ${amount:.2f}{source_text} detected. "
            f"Open the app to review and approve your split plan."
        )
        return await self.send_sms(phone_number, message)

    async def notify_split_completed(
        self,
        phone_number: str,
        amount: float,
        bucket_count: int,
    ) -> bool:
        """Notify user that a split has been completed."""
        message = (
            f"FlowSplit: Your ${amount:.2f} deposit has been split "
            f"across {bucket_count} buckets. View details in the app."
        )
        return await self.send_sms(phone_number, message)

    async def notify_split_partial_failure(
        self,
        phone_number: str,
        completed_amount: float,
        failed_amount: float,
    ) -> bool:
        """Notify user of partial split failure."""
        message = (
            f"FlowSplit: ${completed_amount:.2f} was successfully distributed. "
            f"${failed_amount:.2f} could not be transferred. "
            f"Open the app to retry or adjust your split."
        )
        return await self.send_sms(phone_number, message)

    async def notify_manual_action_required(
        self,
        phone_number: str,
        amount: float,
    ) -> bool:
        """Notify user that manual action is required."""
        message = (
            f"FlowSplit: Action needed! ${amount:.2f} is ready for giving. "
            f"Open the app to complete your tithe transfer."
        )
        return await self.send_sms(phone_number, message)

    # -------------------------------------------------------------------------
    # Push Notifications (Expo)
    # -------------------------------------------------------------------------

    async def send_push_notification(
        self,
        expo_push_token: str,
        title: str,
        body: str,
        data: dict[str, Any] | None = None,
    ) -> bool:
        """
        Send a push notification via Expo Push API.

        Args:
            expo_push_token: User's Expo push token
            title: Notification title
            body: Notification body
            data: Additional data payload for deep linking

        Returns:
            True if sent successfully
        """
        import httpx

        if not expo_push_token:
            logger.warning("No push token provided")
            return False

        try:
            payload = {
                "to": expo_push_token,
                "title": title,
                "body": body,
                "sound": "default",
                "priority": "high",
            }

            if data:
                payload["data"] = data

            async with httpx.AsyncClient() as client:
                response = await client.post(
                    self.expo_push_url,
                    json=payload,
                    headers={"Content-Type": "application/json"},
                )
                response.raise_for_status()

            logger.info(f"Push notification sent to {expo_push_token[:20]}...")
            return True

        except Exception as e:
            logger.error(f"Failed to send push notification: {e}")
            return False

    async def push_deposit_detected(
        self,
        push_token: str,
        deposit_id: str,
        amount: float,
        source: str | None = None,
    ) -> bool:
        """Send push notification for new deposit."""
        source_text = f" from {source}" if source else ""
        return await self.send_push_notification(
            expo_push_token=push_token,
            title="New Deposit Detected",
            body=f"${amount:.2f}{source_text} is ready to split",
            data={
                "type": "deposit_received",
                "deposit_id": deposit_id,
                "screen": "allocate",
            },
        )

    async def push_split_completed(
        self,
        push_token: str,
        deposit_id: str,
        amount: float,
        bucket_count: int,
    ) -> bool:
        """Send push notification for completed split."""
        return await self.send_push_notification(
            expo_push_token=push_token,
            title="Split Complete",
            body=f"${amount:.2f} distributed to {bucket_count} buckets",
            data={
                "type": "split_complete",
                "deposit_id": deposit_id,
                "screen": "complete",
            },
        )

    async def push_manual_action_required(
        self,
        push_token: str,
        deposit_id: str,
        amount: float,
    ) -> bool:
        """Send push notification for manual action required."""
        return await self.send_push_notification(
            expo_push_token=push_token,
            title="Action Required",
            body=f"Complete your ${amount:.2f} tithe transfer",
            data={
                "type": "manual_action_required",
                "deposit_id": deposit_id,
                "screen": "processing",
            },
        )

    async def push_split_failed(
        self,
        push_token: str,
        deposit_id: str,
        failed_amount: float,
    ) -> bool:
        """Send push notification for failed split."""
        return await self.send_push_notification(
            expo_push_token=push_token,
            title="Split Issue",
            body=f"${failed_amount:.2f} transfer needs attention",
            data={
                "type": "split_failed",
                "deposit_id": deposit_id,
                "screen": "processing",
            },
        )

    # -------------------------------------------------------------------------
    # Batch Notifications
    # -------------------------------------------------------------------------

    async def notify_user(
        self,
        phone_number: str | None,
        push_token: str | None,
        notification_type: str,
        **kwargs: Any,
    ) -> bool:
        """
        Send notification via best available channel.

        Tries push notification first, falls back to SMS.
        """
        success = False

        # Try push notification first (instant delivery)
        if push_token:
            push_method = getattr(self, f"push_{notification_type}", None)
            if push_method:
                success = await push_method(push_token, **kwargs)

        # Fall back to SMS if push failed or not available
        if not success and phone_number:
            sms_method = getattr(self, f"notify_{notification_type}", None)
            if sms_method:
                # Filter kwargs to match SMS method signature
                sms_kwargs = {
                    k: v for k, v in kwargs.items()
                    if k not in ("push_token", "deposit_id", "screen")
                }
                success = await sms_method(phone_number, **sms_kwargs)

        return success


# Global service instance
notification_service = NotificationService()
