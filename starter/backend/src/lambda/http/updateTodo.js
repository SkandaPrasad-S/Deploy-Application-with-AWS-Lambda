import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb'
import { createLogger } from '../../utils/logger.mjs'

const logger = createLogger('update_todo')

const dynamoDbClient = DynamoDBDocument.from(new DynamoDB())

const todosTable = process.env.TODOS_TABLE

export async function handler(event) {
  const todoId = event.pathParameters.todoId
  const userId = event.requestContext.authorizer?.principalId ?? 'default_user'
  
  // Parse the updated todo information from the request body
  const updatedTodo = JSON.parse(event.body)
  const { name, dueDate, done } = updatedTodo

  logger.info('Updating todo item', { userId, todoId, updatedTodo })

  try {
    // First, check if the todo item exists
    const result = await dynamoDbClient.get({
      TableName: todosTable,
      Key: {
        userId,
        todoId
      }
    })

    if (!result.Item) {
      // If the item doesn't exist, return 404
      return {
        statusCode: 404,
        headers: {
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: `Todo with todoId ${todoId} not found`
        })
      }
    }

    // If the item exists, update it
    const updateParams = {
      TableName: todosTable,
      Key: {
        userId,
        todoId
      },
      UpdateExpression: 'SET #name = :name, #dueDate = :dueDate, #done = :done',
      ExpressionAttributeNames: {
        '#name': 'name', 
        '#dueDate': 'dueDate',
        '#done': 'done',
      },
      ExpressionAttributeValues: {
        ':name': name,
        ':dueDate': dueDate,
        ':done': done,
      },
      ReturnValues: 'ALL_NEW',  // Return the updated item
    }

    const updateResult = await dynamoDbClient.update(updateParams)

    // Return the updated item
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        updatedItem: updateResult.Attributes
      })
    }
  } catch (error) {
    logger.error('Error updating todo item', { error })
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Could not update todo item'
      })
    }
  }
}
