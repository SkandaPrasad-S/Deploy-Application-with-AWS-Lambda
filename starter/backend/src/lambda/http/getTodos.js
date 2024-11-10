import { TodosService } from '../../businessLogic/todos'
import { createLogger } from '../../utils/logger.mjs'

const logger = createLogger('getTodos')
const todosService = new TodosService(
  process.env.TODOS_TABLE,
  process.env.IMAGES_S3_BUCKET,
  parseInt(process.env.SIGNED_URL_EXPIRATION)
)

export async function handler(event) {
  logger.info('Processing event', { event })

  try {
    const userId = event.requestContext.authorizer?.principalId ?? 'default_user'
    logger.info('Fetching todos for user', { userId })

    const items = await todosService.getTodos(userId)

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ items })
    }
  } catch (error) {
    logger.error('Error fetching todos', { error })
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Could not fetch todos'
      })
    }
  }
}