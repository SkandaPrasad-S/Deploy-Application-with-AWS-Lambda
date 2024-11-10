import { TodosService } from '../../businessLogic/todos'
import { createLogger } from '../../utils/logger.mjs'

const logger = createLogger('updateTodo')
const todosService = new TodosService(
  process.env.TODOS_TABLE,
  process.env.IMAGES_S3_BUCKET,
  parseInt(process.env.SIGNED_URL_EXPIRATION)
)

export async function handler(event) {
  const todoId = event.pathParameters.todoId
  const userId = event.requestContext.authorizer?.principalId ?? 'default_user'
  const updatedTodo = JSON.parse(event.body)

  logger.info('Updating todo', { userId, todoId, updatedTodo })

  try {
    const updatedItem = await todosService.updateTodo(userId, todoId, updatedTodo)

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        updatedItem
      })
    }
  } catch (error) {
    logger.error('Error updating todo', { error })
    
    if (error.message === 'Todo not found') {
      return {
        statusCode: 404,
        headers: {
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: `Todo with ID ${todoId} not found`
        })
      }
    }

    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Could not update todo'
      })
    }
  }
}