import openai
from GioGPT import chat_with_gpt

#Generate input information:

workoutDays = input("How many days a week do you want to work out? ")
focus = input("What area would you like to work on throughout your workout plan? ")
activityLevel = input("How active are you on a weekly basis?(Light, Moderate, Active, Athlete) ")
age = input("How old are you? ")
location = input("Do you work out at the gym or at home, or a mix of both? ")

#Prompt GioGPT with the generation of the workout plan.

prompt = "Please generate a workout plan for me that spans" + workoutDays + "days and focuses on" + focus + "for a " + age + "year old, at this location: " + location + "while taking into account I am this" + activityLevel + "active, ONLY RESPOND WITH THE WORKOUT PLAN NOTHING ELSE"

#Print the response.
print(chat_with_gpt(prompt))
