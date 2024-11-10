import { TodosAccess } from '../dataLayer/todosAccess'
import { AttachmentUtils } from '../dataLayer/attachmentUtils'
import { createLogger } from '../utils/logger.mjs'
import { v4 as uuidv4 } from 'uuid'

const logger = createLogger('Todos')
let todosAccess, attachmentUtils

export class TodosService {
  constructor(todosTable, bucketName, urlExpiration) {
    todosAccess = new TodosAccess(todosTable)
    attachmentUtils = new AttachmentUtils(bucketName, urlExpiration)
  }

  async createTodo(userId, createTodoRequest) {
    const todoId = uuidv4()
    const timestamp = new Date().toISOString()

    const newTodo = {
      todoId,
      userId,
      createdAt: timestamp,
      done: false,
      attachmentUrl: null,
      ...createTodoRequest
    }

    logger.info('Creating new todo item', { userId, todoId })
    return await todosAccess.createTodo(newTodo)
  }

  async getTodos(userId) {
    return await todosAccess.getTodos(userId)
  }

  async updateTodo(userId, todoId, updateTodoRequest) {
    // Verify todo exists
    const todo = await todosAccess.getTodoById(userId, todoId)
    if (!todo) {
      throw new Error('Todo not found')
    }

    logger.info('Updating todo item', { userId, todoId })
    return await todosAccess.updateTodo(userId, todoId, updateTodoRequest)
  }

  async deleteTodo(userId, todoId) {
    // Verify todo exists
    const todo = await todosAccess.getTodoById(userId, todoId)
    if (!todo) {
      throw new Error('Todo not found')
    }

    logger.info('Deleting todo item', { userId, todoId })
    await todosAccess.deleteTodo(userId, todoId)
  }

  async createAttachmentPresignedUrl(userId, todoId) {
    // Verify todo exists
    const todo = await todosAccess.getTodoById(userId, todoId)
    if (!todo) {
      throw new Error('Todo not found')
    }

    const attachmentId = uuidv4()
    const uploadUrl = await attachmentUtils.getUploadUrl(attachmentId)
    const attachmentUrl = attachmentUtils.getAttachmentUrl(attachmentId)

    // Update todo with attachment URL
    await todosAccess.updateAttachmentUrl(userId, todoId, attachmentUrl)

    return uploadUrl
  }
}