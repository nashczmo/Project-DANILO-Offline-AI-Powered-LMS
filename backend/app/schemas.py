from pydantic import BaseModel, Field, field_validator


class LoginRequest(BaseModel):
    username: str = Field(min_length=1, max_length=255)
    password: str = Field(min_length=1, max_length=255)


class TutorRequest(BaseModel):
    question: str = Field(min_length=4)
    module_id: str | None = None
    course_id: str | None = None
    session_id: str | None = None
    response_mode: str = "normal"

    @field_validator("question")
    @classmethod
    def validate_safety(cls, value: str) -> str:
        unsafe_keywords = ["ignore previous", "bypass", "system prompt", "jailbreak", "nsfw"]
        val_lower = value.lower()
        if any(kw in val_lower for kw in unsafe_keywords):
            raise ValueError("Your question triggered our safety filters. Please rephrase.")
        return value

    @field_validator("response_mode")
    @classmethod
    def validate_response_mode(cls, value: str) -> str:
        mode = (value or "normal").strip().lower()
        if mode not in {"short", "normal", "detailed", "simplify", "step_by_step", "filipino", "reviewer", "quiz_me", "practice", "real_life"}:
            return "normal"
        return mode
