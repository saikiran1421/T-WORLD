from datetime import date, timedelta
from typing import List, Optional
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(
    title="T-WORLD API",
    description="Budget-aware trip planning and simulated adventure events for the T-WORLD MVP.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For a public demo. Restrict to your deployed frontend domain for production.
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

DESTINATIONS = {
    "Tirupati": {
        "tagline": "Temple trails & hill-country calm",
        "transport": 900, "stay_per_night": 900, "food_per_day": 450, "activities": 550,
        "outdoor": [
            {"time": "07:00", "title": "Kapila Theertham", "kind": "Nature", "cost": 0, "duration": "1 hr", "outdoor": True},
            {"time": "10:00", "title": "Tirumala viewpoint trail", "kind": "Adventure", "cost": 100, "duration": "2 hrs", "outdoor": True},
            {"time": "16:00", "title": "Sri Vari Padalu viewpoint", "kind": "Scenic", "cost": 50, "duration": "1 hr", "outdoor": True},
        ],
        "indoor": [
            {"time": "09:00", "title": "Sri Venkateswara Museum", "kind": "Culture", "cost": 0, "duration": "1 hr", "outdoor": False},
            {"time": "11:00", "title": "Local craft & heritage walk (covered areas)", "kind": "Culture", "cost": 100, "duration": "1 hr", "outdoor": False},
            {"time": "15:00", "title": "Taste local Andhra snacks", "kind": "Food", "cost": 180, "duration": "1 hr", "outdoor": False},
        ],
    },
    "Hyderabad": {
        "tagline": "Old-city stories & modern energy",
        "transport": 650, "stay_per_night": 1100, "food_per_day": 500, "activities": 700,
        "outdoor": [
            {"time": "09:00", "title": "Charminar & Laad Bazaar", "kind": "Heritage", "cost": 100, "duration": "2 hrs", "outdoor": True},
            {"time": "12:00", "title": "Chowmahalla Palace gardens", "kind": "Culture", "cost": 150, "duration": "2 hrs", "outdoor": True},
            {"time": "17:00", "title": "Hussain Sagar lakeside", "kind": "Scenic", "cost": 0, "duration": "1 hr", "outdoor": True},
        ],
        "indoor": [
            {"time": "10:00", "title": "Salar Jung Museum", "kind": "Culture", "cost": 100, "duration": "2 hrs", "outdoor": False},
            {"time": "13:00", "title": "Try a local biryani lunch", "kind": "Food", "cost": 220, "duration": "1 hr", "outdoor": False},
            {"time": "16:00", "title": "Indoor art or craft experience", "kind": "Culture", "cost": 180, "duration": "1 hr", "outdoor": False},
        ],
    },
    "Visakhapatnam": {
        "tagline": "Blue coast, green hills",
        "transport": 1000, "stay_per_night": 1000, "food_per_day": 450, "activities": 600,
        "outdoor": [
            {"time": "08:00", "title": "RK Beach sunrise", "kind": "Nature", "cost": 0, "duration": "1 hr", "outdoor": True},
            {"time": "11:00", "title": "Kailasagiri hilltop", "kind": "Scenic", "cost": 150, "duration": "2 hrs", "outdoor": True},
            {"time": "16:00", "title": "Coastal viewpoint", "kind": "Scenic", "cost": 0, "duration": "1 hr", "outdoor": True},
        ],
        "indoor": [
            {"time": "10:00", "title": "Submarine museum", "kind": "Museum", "cost": 100, "duration": "1 hr", "outdoor": False},
            {"time": "12:00", "title": "Local seafood or vegetarian thali", "kind": "Food", "cost": 220, "duration": "1 hr", "outdoor": False},
            {"time": "15:00", "title": "Browse local handicrafts", "kind": "Culture", "cost": 120, "duration": "1 hr", "outdoor": False},
        ],
    },
    "Bengaluru": {
        "tagline": "Garden escapes & creative corners",
        "transport": 700, "stay_per_night": 1200, "food_per_day": 550, "activities": 650,
        "outdoor": [
            {"time": "08:00", "title": "Cubbon Park stroll", "kind": "Nature", "cost": 0, "duration": "1 hr", "outdoor": True},
            {"time": "11:00", "title": "Bengaluru Palace grounds", "kind": "Heritage", "cost": 250, "duration": "2 hrs", "outdoor": True},
            {"time": "16:00", "title": "Lalbagh gardens", "kind": "Nature", "cost": 60, "duration": "1 hr", "outdoor": True},
        ],
        "indoor": [
            {"time": "10:00", "title": "Visvesvaraya Industrial & Technological Museum", "kind": "Science", "cost": 100, "duration": "2 hrs", "outdoor": False},
            {"time": "13:00", "title": "Affordable South Indian lunch", "kind": "Food", "cost": 160, "duration": "1 hr", "outdoor": False},
            {"time": "16:00", "title": "Independent bookstore café", "kind": "Chill", "cost": 180, "duration": "1 hr", "outdoor": False},
        ],
    },
}

class TripRequest(BaseModel):
    destination: str = "Tirupati"
    days: int = Field(default=3, ge=1, le=14)
    budget: int = Field(default=5000, ge=500, le=1000000)
    interests: List[str] = ["Culture", "Food", "Nature"]
    start_date: Optional[str] = None

class WeatherRequest(BaseModel):
    destination: str = "Tirupati"
    days: int = 3
    budget: int = 5000
    interests: List[str] = ["Culture", "Food", "Nature"]

class ChatRequest(BaseModel):
    message: str
    destination: str = "Tirupati"
    budget: int = 5000
    remaining: Optional[int] = None

class QuestRequest(BaseModel):
    quest_id: str
    current_xp: int = 0
    current_coins: int = 0

def make_trip(req: TripRequest, rainy: bool = False):
    destination = req.destination if req.destination in DESTINATIONS else "Tirupati"
    d = DESTINATIONS[destination]
    days = req.days
    transport = d["transport"]
    stay = d["stay_per_night"] * max(0, days - 1)
    food = d["food_per_day"] * days
    activity = d["activities"] * days
    # Keep costs illustrative and avoid implying live quotes.
    total = transport + stay + food + activity
    if total > req.budget:
        scale = req.budget / total
        food = round(food * scale)
        activity = round(activity * scale)
        total = transport + stay + food + activity
    daily = []
    for i in range(days):
        pool = d["indoor"] if rainy else d["outdoor"]
        items = []
        for j, item in enumerate(pool):
            item2 = dict(item)
            item2["id"] = f"day-{i+1}-stop-{j+1}"
            items.append(item2)
        daily.append({
            "day": i + 1,
            "date": (date.today() + timedelta(days=i)).isoformat(),
            "title": ["Discover", "Explore", "Collect memories"][i % 3] + f" {destination}",
            "activities": items,
        })
    budget_items = [
        {"name": "Transport", "amount": transport, "icon": "train"},
        {"name": "Stay", "amount": stay, "icon": "bed"},
        {"name": "Food", "amount": food, "icon": "utensils"},
        {"name": "Activities", "amount": activity, "icon": "ticket"},
    ]
    return {
        "destination": destination,
        "tagline": d["tagline"],
        "days": days,
        "budget": req.budget,
        "estimated_total": total,
        "remaining": req.budget - total,
        "budget_used_percent": min(100, round(total / req.budget * 100)),
        "budget_items": budget_items,
        "itinerary": daily,
        "rainy_simulation": rainy,
        "notice": "Illustrative estimates only. Confirm prices, opening hours, transport and weather before travel.",
    }

@app.get("/")
def root():
    return {"name": "T-WORLD API", "docs": "/docs", "health": "/api/health"}

@app.get("/api/health")
def health():
    return {"status": "ok", "service": "T-WORLD", "mode": "demo"}

@app.get("/api/destinations")
def destinations():
    return [{"name": name, "tagline": item["tagline"]} for name, item in DESTINATIONS.items()]

@app.post("/api/trip")
def generate_trip(req: TripRequest):
    return make_trip(req)

@app.post("/api/weather-event")
def weather_event(req: WeatherRequest):
    trip = make_trip(TripRequest(**req.model_dump()), rainy=True)
    trip["event"] = {
        "type": "heavy_rain",
        "label": "Heavy Rain — SIMULATION",
        "message": "Outdoor stops have been swapped for indoor or covered alternatives. This is a demo event, not a live weather alert.",
        "xp_awarded": 50,
    }
    return trip

@app.post("/api/chat")
def chat(req: ChatRequest):
    msg = req.message.lower()
    remaining = req.remaining if req.remaining is not None else req.budget
    if any(word in msg for word in ["budget", "cost", "cheap", "save", "money"]):
        answer = f"Budget Buddy tip: you have about ₹{max(0, remaining):,} remaining in this plan. Prioritize public transport, local meals, free attractions, and one paid highlight per day."
    elif any(word in msg for word in ["rain", "weather", "indoor"]):
        answer = "Try the Heavy Rain simulation button to replace outdoor activities with indoor or covered alternatives. The event is simulated, not a live forecast."
    elif any(word in msg for word in ["food", "eat", "lunch"]):
        answer = "Look for local tiffin centres and daily thalis, check displayed menus before ordering, and set a per-meal target to protect your trip budget."
    elif any(word in msg for word in ["hello", "hi", "hey"]):
        answer = f"Hey explorer! 🌍 I'm Questy, your demo travel buddy for {req.destination}. Tell me your budget, interests, or what you want to change."
    elif any(word in msg for word in ["plan", "itinerary", "change", "modify"]):
        answer = "I can help you adapt your route. Choose your destination and trip length, then regenerate the trip; use Heavy Rain simulation to test dynamic replanning."
    else:
        answer = f"Questy here! For {req.destination}, keep your daily spending limit visible, combine free highlights with one paid activity, and leave a small emergency buffer. This demo uses rule-based answers."
    return {"reply": answer, "mode": "rule-based-demo"}

@app.post("/api/quest/complete")
def complete_quest(req: QuestRequest):
    rewards = {
        "free-attractions": {"xp": 100, "coins": 30, "badge": "Freebie Finder"},
        "rain-adapt": {"xp": 50, "coins": 20, "badge": "Weather Wizard"},
        "budget-plan": {"xp": 75, "coins": 25, "badge": "Budget Guardian"},
        "local-food": {"xp": 60, "coins": 15, "badge": "Local Food Scout"},
    }
    reward = rewards.get(req.quest_id, {"xp": 40, "coins": 10, "badge": "Quest Explorer"})
    xp = req.current_xp + reward["xp"]
    return {
        "completed": True,
        "xp_gained": reward["xp"],
        "coins_gained": reward["coins"],
        "xp": xp,
        "coins": req.current_coins + reward["coins"],
        "level": 1 + xp // 250,
        "badge": reward["badge"],
    }
