import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb'
import { createLogger } from '../../utils/logger.mjs'

const logger = createLogger('delete_todo')

const dynamoDbClient = DynamoDBDocument.from(new DynamoDB())

const todosTable = process.env.TODOS_TABLE

export async function handler(event) {
  const todoId = event.pathParameters.todoId
  const userId = event.requestContext.authorizer?.principalId ?? 'default_user'

  logger.info('Attempting to delete todo item', { userId, todoId })

  try {
    // Step 1: Check if the todo item exists
    const result = await dynamoDbClient.get({
      TableName: todosTable,
      Key: {
        userId,
        todoId
      }
    })

    if (!result.Item) {
      // Step 2: If the item doesn't exist, return 404
      logger.warn('Todo item not found', { userId, todoId })
      return {
        statusCode: 404,
        headers: {
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: `Todo item with todoId ${todoId} not found for user ${userId}`
        })
      }
    }

    // Step 3: If the item exists, delete it from DynamoDB
    await dynamoDbClient.delete({
      TableName: todosTable,
      Key: {
        userId,
        todoId
      }
    })

    // Step 4: Return success response
    logger.info('Todo item deleted successfully', { userId, todoId })
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: `Todo item with todoId ${todoId} successfully deleted`
      })
    }
  } catch (error) {
    // Error handling
    logger.error('Error deleting todo item', { error })
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Could not delete todo item'
      })
    }
  }
}
