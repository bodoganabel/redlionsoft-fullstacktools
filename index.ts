import {MongoClient} from 'mongodb'

 /**
* Connects to the MongoDB database from process.env.MONGODB_CONNECTION_STRING.
* 
* @throws {Error} If the MONGODB_CONNECTION_STRING environment variable is not defined.
* @returns {Promise<Db>} Returns a promise of the database object
*/
export const connectToMongoDatabase = async () => {
   // Check if the environment variable is defined
   if (!process.env.MONGODB_CONNECTION_STRING) {
       throw new Error('MONGODB_CONNECTION_STRING environment variable is not defined');
   }
   try {
       const client = await MongoClient.connect(process.env.MONGODB_CONNECTION_STRING);
       const db = client.db();
       console.log('Connected to the database');
       return db;
   } catch (error:any) {
       console.error('Error connecting to the database:', error.message);
       throw error;
   }
};
