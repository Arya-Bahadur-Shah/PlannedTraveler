import json
from celery import shared_task
from django.conf import settings
from .models import Trip, ItineraryActivity
from openai import OpenAI
import time

@shared_task(bind=True, max_retries=3)
def generate_itinerary_task(self, trip_id):
    try:
        trip = Trip.objects.get(id=trip_id)
    except Trip.DoesNotExist:
        return {"status": "error", "message": "Trip not found"}

    client = OpenAI(api_key=settings.OPENAI_API_KEY)
    
    prompt = f"""
    Act as an expert travel planner. Create a day-by-day itinerary for a trip to {trip.destination}.
    Start Date: {trip.start_date}, End Date: {trip.end_date}. Budget: {trip.budget}. Group: {trip.group_size}.
    Provide real approximate latitude and longitude coordinates for activities.
    Output MUST be valid JSON matching this schema:
    {{
        "days": [
            {{
                "day_number": 1,
                "activities": [
                    {{
                        "time_of_day": "Morning", 
                        "title": "Visit Site", 
                        "description": "Details...", 
                        "estimated_cost": "...",
                        "latitude": 28.2096,
                        "longitude": 83.9856
                    }}
                ]
            }}
        ]
    }}
    """

    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            response_format={ "type": "json_object" }
        )
        content = response.choices[0].message.content
        ai_data = json.loads(content)
        
        # Save Activities to Database
        activities_to_create = []
        for day in ai_data.get('days', []):
            for act in day.get('activities', []):
                activities_to_create.append(ItineraryActivity(
                    trip=trip, 
                    day_number=day['day_number'], 
                    time_of_day=act['time_of_day'],
                    title=act['title'], 
                    description=act['description'],
                    estimated_cost=act.get('estimated_cost', ''),
                    latitude=act.get('latitude'), 
                    longitude=act.get('longitude')
                ))
        
        ItineraryActivity.objects.bulk_create(activities_to_create)
        trip.is_completed = True
        trip.save()

        return {"status": "success", "message": "Itinerary generated"}

    except Exception as exc:
        trip.is_completed = False
        trip.save()
        raise self.retry(exc=exc, countdown=10)
