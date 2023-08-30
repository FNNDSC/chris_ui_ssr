import { MongoClient } from "mongodb";
import { MONGO_URL } from "$env/static/private";

const client = new MongoClient(MONGO_URL);

export async function start_mongo() {
  console.log("Starting....");
  await client.connect();
}

export default client.db();
