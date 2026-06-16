import os
import io
from typing import List
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from google import genai
from google.genai import types
from PIL import Image
from pydantic import BaseModel

app = FastAPI()

# Secure absolute CORS integration configuration
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
async def analyze_meal(files: List[UploadFile] = File(...)):
    if not os.environ.get("GEMINI_API_KEY"):
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY environment configuration missing.")

    try:
        image_parts = []
        for file in files:
            file_bytes = await file.read()
            if not file_bytes:
                continue
            image = Image.open(io.BytesIO(file_bytes))
            image_parts.append(image)
        
        if not image_parts:
            raise HTTPException(status_code=400, detail="Empty payload checklist or no images received.")
            
        prompt = """
        Analyze all the uploaded meal images together. 
        Combine the food items present across ALL images, calculate the aggregate total calories, 
        and aggregate total protein content in grams for the entire combination of food shown.
        Be realistic and precise based on standard nutritional data.
        """
        
        # Multimodal pipeline array assembly matching google-genai specs
        contents = image_parts + [prompt]
        
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=contents,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=MealAnalysis,
            ),
        )
        return {"status": "success", "data": response.text}
        
    except Exception as e:
        print(f"Operational Exception Caught: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
