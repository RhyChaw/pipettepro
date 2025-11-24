# Lab Manual Pipeline Architecture

## Overview

This document describes the architecture of the expanded "Scan Lab Manual → Step-by-Step Instructions" pipeline that transforms lab manuals and handwritten notes into structured content, quizzes, and simulation scenarios.

## Data Flow

```
User Upload → OCR/Text Extraction → Cleaning & Chunking → Storage → Quiz/Scenario Generation → Simulator/Quiz UI
```

## Components

### 1. Data Models (`app/types/`)

#### Notes (`notes.ts`)
- `ExtractedNote`: Complete note structure with sections, tags, metadata
- `NoteSection`: Individual sections (Materials, Equipment, Procedure Steps, etc.)
- `FileUploadMetadata`: Upload tracking information
- `ProcessingResult`: Result from OCR/processing pipeline

#### Quiz (`quiz.ts`)
- `GeneratedQuestion`: Question with type, difficulty, options, answer
- `GeneratedQuiz`: Complete quiz with questions and metadata
- `QuizResult`: User's quiz attempt results

#### Simulation (`simulation.ts`)
- `SimulatorStep`: Individual step in simulation (select pipette, aspirate, etc.)
- `SimulationScenario`: Complete scenario with steps, equipment, reagents
- `ScenarioPreview`: Preview with validation warnings

### 2. API Endpoints (`app/api/`)

#### `/api/scan/process` (POST)
- **Input**: File (PDF/DOC/image) or text string
- **Process**:
  1. OCR extraction (Gemini Vision API for images)
  2. Text cleaning (remove headers, footers, page numbers)
  3. Chunking into logical sections
- **Output**: `ProcessingResult` with raw text, cleaned text, and sections

#### `/api/notes/generate-quiz` (POST)
- **Input**: Note content and sections
- **Process**: Generate quiz questions using Gemini Pro
- **Output**: `GeneratedQuiz` with questions of various types

#### `/api/notes/generate-scenario` (POST)
- **Input**: Note content and sections
- **Process**: Convert lab procedure into simulator steps
- **Output**: `SimulationScenario` with ordered steps

#### `/api/notes/save` (POST/GET)
- **POST**: Save note to Firestore
- **GET**: Retrieve notes for user
- **Storage**: Firestore collection `students/{userId}/notes/{noteId}`

### 3. Frontend Pages

#### `/your-docs` (Scan Page)
- File upload or text input
- Processing status display
- Tabbed view: Sections / Cleaned Text / Raw Text
- Action buttons:
  - Save to Notes
  - Generate Quiz
  - Generate Scenario
- Modals for quiz and scenario preview

#### `/notes` (Notes Repository)
- List all user notes
- Search by title, content, tags
- Filter by tags
- Note detail modal
- Quick actions: Generate Quiz, Generate Scenario
- Delete notes

### 4. Integration Points

#### Simulator Integration
- Scenarios stored in `localStorage` as `pendingScenario`
- Simulator reads from localStorage on mount
- Steps executed in sequence with validation

#### Quiz Integration
- Generated quizzes passed via URL params
- Quiz component reads from query params
- Results stored in user profile

## ML/AI Workflow

### OCR → Chunking → Notes → Quiz → Simulation

1. **OCR/Text Extraction**
   - Images: Gemini Vision API
   - PDFs: (Requires additional setup - currently placeholder)
   - Direct text: Use as-is

2. **Text Cleaning**
   - Remove headers/footers
   - Remove page numbers
   - Normalize whitespace
   - Remove tables (if not relevant)

3. **Chunking**
   - Identify section types:
     - Materials
     - Equipment
     - Procedure Steps
     - Safety Notes
     - Calculations
     - Conceptual Theory
     - Troubleshooting
   - Extract section titles and content
   - Order sections logically

4. **Quiz Generation**
   - Analyze content for key concepts
   - Generate questions:
     - Multiple choice
     - Fill-in-the-blank
     - Short answer
     - Procedure ordering
     - Safety-related
     - Calculation-based
   - Assign difficulty levels
   - Generate explanations

5. **Scenario Generation**
   - Identify pipetting procedures
   - Extract:
     - Pipette types (p2, p10, p200, p1000)
     - Volumes
     - Source/target containers
     - Step sequence
   - Convert to simulator actions
   - Flag missing information

## Data Storage

### Firestore Structure

```
students/
  {userId}/
    notes/
      {noteId}/
        - title
        - rawText
        - cleanedText
        - sections[]
        - tags[]
        - date
        - createdAt
        - updatedAt
```

### LocalStorage

- `pendingScenario`: Current scenario to load in simulator
- `generatedQuiz_{id}`: Generated quiz data

## Error Handling

### API Errors
- Network failures: Retry with user notification
- API key missing: Server-side error response
- Invalid input: Validation error messages
- Parsing failures: Fallback to basic structure

### User Experience
- Loading states for all async operations
- Error messages displayed inline
- Success confirmations
- Graceful degradation

## Constraints & Safety

1. **No Hallucination**
   - Only use information explicitly in notes
   - Flag missing information
   - Ask for clarification when needed

2. **Unsafe Content Prevention**
   - Validate lab procedures
   - Check for dangerous chemicals/processes
   - Warn about safety concerns

3. **Format Validation**
   - Ensure simulator steps match expected format
   - Validate pipette IDs and volumes
   - Check container references

## Future Enhancements

1. **Enhanced OCR**
   - Better PDF parsing
   - Handwriting recognition improvements
   - Table extraction

2. **Advanced Features**
   - Multi-language support
   - Collaborative notes
   - Note versioning
   - Export to PDF/Word

3. **Analytics**
   - Track quiz performance
   - Scenario completion rates
   - Note usage statistics

4. **Integration**
   - LMS integration
   - Calendar integration
   - Reminder system

## Example JSON Structures

### Cleaned Notes
```json
{
  "rawText": "Full extracted text...",
  "cleanedText": "Cleaned text without headers...",
  "sections": [
    {
      "type": "procedure_steps",
      "title": "Pipetting Procedure",
      "content": "Step 1: Select pipette...",
      "order": 1
    }
  ]
}
```

### Simulator Steps
```json
{
  "steps": [
    {
      "id": "step-1",
      "type": "select_pipette",
      "order": 1,
      "instruction": "Select the p200 pipette",
      "pipetteId": "p200",
      "validationCriteria": {
        "pipette": "p200"
      }
    }
  ]
}
```

### Quiz Questions
```json
{
  "questions": [
    {
      "id": "q-1",
      "type": "multiple_choice",
      "difficulty": "Intermediate",
      "questionText": "What pipette should you use for 150 µL?",
      "options": ["p10", "p200", "p1000"],
      "correctAnswer": 1,
      "explanation": "p200 is designed for volumes 20-200 µL"
    }
  ]
}
```

