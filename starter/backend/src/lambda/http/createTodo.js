import { TodosService } from '../../businessLogic/todos'
import { createLogger } from '../../utils/logger.mjs'

const logger = createLogger('createTodo')
const todosService = new TodosService(
  process.env.TODOS_TABLE,
  process.env.IMAGES_S3_BUCKET,
  parseInt(process.env.SIGNED_URL_EXPIRATION)
)

export async function handler(event) {
  try {
    const newTodo = JSON.parse(event.body)
    const userId = event.requestContext.authorizer?.principalId ?? 'default_user'

    logger.info('Creating new todo item', { userId, newTodo })
    const newItem = await todosService.createTodo(userId, newTodo)

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ newItem })
    }
  } catch (error) {
    logger.error('Error creating todo item', { error })
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Could not create todo item'
      })
    }
  }
}