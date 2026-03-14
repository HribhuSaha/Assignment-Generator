from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import tempfile
import pdfplumber
from dotenv import load_dotenv

load_dotenv()

from camel.models import ModelFactory
from camel.types import ModelPlatformType, ModelType
from camel.agents import ChatAgent

app = FastAPI()

# Allow CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the CAMEL Agent globally
model = None
chat_agent = None  # Renamed for clarity 
current_assignment_context = "" # Store the context for the floating chat

@app.on_event("startup")
async def startup_event():
    global model, chat_agent
    # We grab the API key from the environment variable we set earlier
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("WARNING: GEMINI_API_KEY environment variable is not set. The agent will not work.")
        return

    try:
        model = ModelFactory.create(
            model_platform=ModelPlatformType.GEMINI,
            model_type=ModelType.GEMINI_2_5_FLASH,
            model_config_dict={"temperature": 0.3}, # Slight variance for chat
        )
        # Initialize the persistent floating chat agent
        chat_agent = ChatAgent(
            model=model, 
            system_message="You are a helpful, extremely concise AI assistant powered by the CAMEL framework. Always respond using beautifully formatted Markdown. You assist teachers with creating assignments. If the teacher asks about the current assignment, base your answers on the provided context."
        )
        print("CAMEL Chat Agent successfully initialized!")
    except Exception as e:
        print(f"Failed to initialize CAMEL agent: {e}")


class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str

@app.post("/api/generate-assignment")
async def generate_assignment(
    title: str = Form(""),
    subject: str = Form(""),
    difficulty: str = Form("Medium"),
    totalMarks: str = Form(""),
    rubric: str = Form(""),
    questionType: str = Form("Mixed"),
    file: UploadFile = File(...)
):
    global current_assignment_context, model
    
    if not model:
        raise HTTPException(status_code=500, detail="AI Model is not initialized (missing API key?)")

    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    extracted_text = ""
    # Save the uploaded file temporarily to read it
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name

        # Extract text using pdfplumber
        with pdfplumber.open(tmp_path) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    extracted_text += text + "\n"
        
        # Clean up temp file
        os.unlink(tmp_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process PDF: {e}")

    if not extracted_text.strip():
        raise HTTPException(status_code=400, detail="Could not extract text from the provided PDF. It might be empty or scanned.")

    # Create a specific agent for assignment generation to ensure strict persona
    system_msg = (
        "You are an expert academic examiner. Your task is to generate a comprehensive, well-structured assignment based "
        "STRICTLY on the provided source text. Do not include external knowledge or topics not covered in the text.\n"
        f"Constraints:\n"
        f"- Title: {title}\n"
        f"- Subject: {subject}\n"
        f"- Difficulty: {difficulty}\n"
        f"- Total Marks: {totalMarks}\n"
        f"- Rubric/Marking Criteria: {rubric if rubric else 'Use standard appropriate marking'}\n"
        f"- Question Type(s): {questionType}\n\n"
        "Output Format:\n"
        "Return the assignment directly in beautifully formatted Markdown. Start directly with the assignment title as an H1. "
        "Include a 'Marking Scheme / Answers' section at the very end."
    )
    
    try:
        assignment_agent = ChatAgent(model=model, system_message=system_msg)
        prompt = f"Please generate the assignment based on the following source material:\n\n{extracted_text}"
        
        response = assignment_agent.step(prompt)
        generated_markdown = response.msgs[0].content
        
        # Save to global context for the interactive chat
        current_assignment_context = f"CURRENT ASSIGNMENT DATA: {generated_markdown}\n\nSOURCE MATERIAL SUMMARY (Excerpt): {extracted_text[:1000]}"
        
        return {"assignment": generated_markdown}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate assignment: {e}")


@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(req: ChatRequest):
    global chat_agent, current_assignment_context
    if not chat_agent:
        raise HTTPException(status_code=500, detail="Agent is not initialized (missing API key?)")
    
    try:
        # Inject context if we have an active assignment
        context_prompt = ""
        if current_assignment_context:
            context_prompt = f"[System Note: The user is currently viewing this generated assignment. You MUST use this context if they ask about 'the assignment', 'questions', etc.:\n<<{current_assignment_context[:3000]}>>]\n\n"
            
        final_prompt = f"{context_prompt}User Question: {req.message}"
            
        # Step the agent forward with the user's message
        response = chat_agent.step(final_prompt)
        # Extract the content from the response object
        content = response.msgs[0].content
        return {"response": content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "ok", "agent_loaded": chat_agent is not None}
