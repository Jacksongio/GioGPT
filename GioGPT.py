import openai


#API Key
openai.api_key = "Enter your API key here"

def chat_with_gpt(prompt):
    response = openai.ChatCompletion.create(
        model = "gpt-4-turbo", messages = [{"role":"user", "content": prompt}]
    )

    return response.choices[0].message.content.strip()

if __name__ == "__main__":
    while True:
        user_input = input("You: ")
        if user_input.lower() in ["quit","exit","bye"]:
            break

        response = chat_with_gpt(user_input)
        print("GioGPT: ", response)
