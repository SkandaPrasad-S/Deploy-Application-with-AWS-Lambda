import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb'
import { createLogger } from '../utils/logger.mjs'
import AWSXRay from 'aws-xray-sdk-core'

//tracing added here
const logger = createLogger('TodosAccess')
const dynamoDb = AWSXRay.captureAWSv3Client(new DynamoDB())
const dynamoDbClient = DynamoDBDocument.from(dynamoDb)

export class TodosAccess {
  constructor(todosTable) {
    this.todosTable = todosTable
  }

  async createTodo(todoItem) {
    await dynamoDbClient.put({
      TableName: this.todosTable,
      Item: todoItem
    })
    return todoItem
  }

  async getTodos(userId) {
    const result = await dynamoDbClient.query({
      TableName: this.todosTable,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    })
    return result.Items
  }

  async getTodoById(userId, todoId) {
    const result = await dynamoDbClient.get({
      TableName: this.todosTable,
      Key: {
        userId,
        todoId
      }
    })
    return result.Item
  }

  async updateTodo(userId, todoId, updateData) {
    const updateParams = {
      TableName: this.todosTable,
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
        ':name': updateData.name,
        ':dueDate': updateData.dueDate,
        ':done': updateData.done,
      },
      ReturnValues: 'ALL_NEW'
    }
    const result = await dynamoDbClient.update(updateParams)
    return result.Attributes
  }

  async deleteTodo(userId, todoId) {
    await dynamoDbClient.delete({
      TableName: this.todosTable,
      Key: {
        userId,
        todoId
      }
    })
  }

  async updateAttachmentUrl(userId, todoId, attachmentUrl) {
    await dynamoDbClient.update({
      TableName: this.todosTable,
      Key: {
        userId,
        todoId
      },
      UpdateExpression: 'set attachmentUrl = :attachmentUrl',
      ExpressionAttributeValues: {
        ':attachmentUrl': attachmentUrl
      }
    })
  }
}