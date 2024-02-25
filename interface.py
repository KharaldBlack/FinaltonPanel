import pymongo
import sys
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from pydantic import BaseModel
from typing import Dict

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

try:
    client = pymongo.MongoClient("mongodb://127.0.0.1:27017")
except pymongo.errors.ConfigurationError:
    print("An Invalid URI host error was received. Is your Atlas host name correct in your connection string?")
    sys.exit(1)

db = client["finaltonTest"]

def get_data_from_database():
    data = {}
    collections = db.list_collection_names()
    for collection_name in collections:
        collection = db[collection_name]
        documents = list(collection.find({}, {"_id": 0}))
        data[collection_name] = documents
    return data

def delete_record(collection, arguments):
    result = collection.delete_one(arguments)
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Record not found")

def update_record(collection, arguments):
    oldName = {"name": arguments.pop("oldName", None)}
    update = {"$set": reformat_data(arguments)}
    result = collection.update_one(oldName, update)
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Record not found")

def insert_record(collection, arguments):
    record = reformat_data(arguments)
    result = collection.insert_one(record)
    if result.inserted_count == 0:
        raise HTTPException(status_code=404, detail="Record not inserted")

def reformat_data(data):
    new_data = {"name": data["name"]}
    new_data["content"] = {key: value for key, value in data.items() if key not in ["name", "contentType"]}
    new_data["contentType"] = data["contentType"]
    return new_data

@app.get("/elements")
def read_root():
    data = get_data_from_database()
    return data

class Action(BaseModel):
    arguments: Dict
    collectionName: str
    command: str

@app.post("/action/")
def perform_action(action: Action):
    collection = db[action.collectionName]
    if action.command == "delete":
        delete_record(collection, action.arguments)
    if action.command == "update":
        update_record(collection, action.arguments)
    if action.command == "add":
        insert_record(collection, action.arguments)
    else:
        raise HTTPException(status_code=400, detail="Unknown command")
    return {"message": f"Action '{action.command}' performed successfully for record '{action.arguments}' in collection '{action.collectionName}'"}

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8001)
