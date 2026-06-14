import os
import io
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from google import genai
from google.genai import types
from PIL import Image
from pydantic import BaseModel

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

try:
    client = genai.Client()
except Exception as e:
    print("Gemini client initialization failed.")

class MealAnalysis(BaseModel):
    meal_name: str
    estimated_weight_grams: int
    calories: int
    protein_grams: int

@app.post("/analyze-meal")
async def analyze_meal(file: UploadFile = File(...)):
    if not os.environ.get("GEMINI_API_KEY"):
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY missing.")

    try:
        image_bytes = await file.read()
        image = Image.open(io.BytesIO(image_bytes))
        
        prompt = """
        Analyze this image of a meal. Estimate the food items present, 
        their total calories, and total protein content in grams. 
        Be realistic and precise based on standard nutritional data.
        """
        
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=[image, prompt],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=MealAnalysis,
            ),
        )
        return {"status": "success", "data": response.text}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- YEH NAYA CODE ADD KIYA HAI ---
# Server automatic index.html aur static files ko standard path se load karega
@app.get("/", response_class=HTMLResponse)
async def read_index():
    with open("index.html", "r", encoding="utf-8") as f:
        return f.read()

app.mount("/", StaticFiles(directory="."), name="static")