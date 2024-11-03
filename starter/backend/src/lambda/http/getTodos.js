import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb'
import { createLogger } from '../../utils/logger.mjs'

const logger = createLogger('get_todo')

const dynamoDbClient = DynamoDBDocument.from(new DynamoDB())

const todosTable = process.env.TODOS_TABLE

export async function handler(event) {
  logger.info("Event is",{ event })

  // Assuming userId is available in the event object
  const userId = event.requestContext.authorizer?.principalId ?? "default_user";
  logger.info("User is ", { userId })

  const queryCommand = {
    TableName: todosTable,
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: {
      ':userId': userId
    }
  };

  const result = await dynamoDbClient.query(queryCommand);
  const items = result.Items;

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({ items })
  };
}
