import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { v4 as uuidv4 } from 'uuid'
import { createLogger } from '../../utils/logger.mjs'

const logger = createLogger('get_todo')

const dynamoDbClient = DynamoDBDocument.from(dynamoDb)
const s3Client = new S3Client()

const todosTable = process.env.TODOS_TABLE
const bucketName = process.env.IMAGES_S3_BUCKET


export async function handler(event) {

  /*
  What the body has
  {
    "name": "Buy bread",
    "dueDate": "2022-12-12"
  }  
  {
  What it needs to be stored as in dynamo db
      {
        "todoId":"605525c4-d36c-1234-b3ff-65b853344123",
        "userId":"google-oauth2|115783759495544745774",
        "attachmentUrl":"https://serverless-c4-todo-images.s3.amazonaws.com/605525c4-1234-4d23-b3ff-65b853344123",
        "dueDate":"2022-12-12",
        "createdAt":"2022-11-28T22:04:08.613Z",
        "name":"Buy bread",
        "done":false
      }
  */
  try {
    const newTodo = JSON.parse(event.body);
    logger.info("Event is", { event });
    const userId = event.requestContext.authorizer?.principalId ?? "default_user";
    logger.info("User is ", { userId });
    const todoId = uuidv4();
    const timestamp = new Date().toISOString();
    const newItem = {
      timestamp,
      todoId, // Make sure this matches the key used in your DynamoDB table schema
      userId,
      done: false,
      attachmentUrl: `https://${bucketName}.s3.amazonaws.com/${todoId}`,
      ...newTodo,
    };
    logger.info("Storing new item: ", { newItem });

    // Store the new item in DynamoDB
    await dynamoDbClient.put({
      TableName: todosTable, // Corrected variable name to match the defined constant
      Item: newItem,
    });

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ newItem })
    }; 

    // Generate the upload URL

  } catch (error) {
    logger.error("Error creating todo item", { error });
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: "Could not create todo item",
      }),
    };
  }
}

