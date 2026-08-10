import os


# 자동 테스트가 개발자의 실제 OpenAI 키를 읽어 비용을 발생시키지 않도록 격리한다.
os.environ["OPENAI_API_KEY"] = ""
os.environ["INTERNAL_API_KEY"] = ""
