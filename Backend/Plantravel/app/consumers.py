import json
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken

User = get_user_model()

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.accept()
        # Join global notifications group
        await self.channel_layer.group_add("notifications_global", self.channel_name)

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard("notifications_global", self.channel_name)
        if hasattr(self, 'user_group_name'):
            await self.channel_layer.group_discard(self.user_group_name, self.channel_name)

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            action = data.get('action')

            # Authenticate via JWT token sent by client after connection
            if action == 'authenticate':
                token = data.get('token')
                access_token = AccessToken(token)
                user_id = access_token.payload.get('user_id')
                if user_id:
                    self.user_group_name = f"user_{user_id}"
                    await self.channel_layer.group_add(self.user_group_name, self.channel_name)
                    await self.send(text_data=json.dumps({'message': 'Authenticated successfully', 'type': 'auth_success'}))
        except Exception as e:
            print("WebSocket Receive Error:", e)

    async def send_notification(self, event):
        await self.send(text_data=json.dumps({
            'message': event['message'],
            'type': event.get('type_id', 'info'),
            'title': event.get('title', 'Notification')
        }))
