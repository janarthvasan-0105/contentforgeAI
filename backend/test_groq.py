from app.utils.llm import invoke_with_fallback
from langchain_core.messages import HumanMessage, SystemMessage

messages = [
    SystemMessage(content="You are a helpful assistant."),
    HumanMessage(content='Return ONLY valid JSON: {"message": "hello"}')
]

result = invoke_with_fallback(messages)
print(result)
