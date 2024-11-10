import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { createLogger } from '../../utils/logger.mjs'
import { v4 as uuidv4 } from 'uuid'

const logger = createLogger('generate_todo')

const dynamoDbClient = DynamoDBDocument.from(new DynamoDB())
const s3Client = new S3Client()
const urlExpiration = parseInt(process.env.SIGNED_URL_EXPIRATION)

const todosTable = process.env.TODOS_TABLE
const bucketName = process.env.IMAGES_S3_BUCKET

export async function handler(event) {
  const todoId = event.pathParameters.todoId
  const userId = event.requestContext.authorizer?.principalId ?? 'default_user'  // Ensure userId is retrieved from authorization context

  try {
    // First, check if the todo item exists in DynamoDB
    const result = await dynamoDbClient.get({
      TableName: todosTable,
      Key: {
        userId, // Use the userId from the context
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

    // Assuming the imageId should be based on the todoId or a related value
    const attachmentId = uuidv4()  // Generate a unique ID for the image

    // Generate a presigned URL for S3 upload
    const url = await getUploadUrl(attachmentId)

    // Update the DynamoDB item with the attachment URL
    await updateDynamoDBItem(userId, todoId, attachmentId)

    // Return the presigned URL
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        uploadUrl: url
      })
    }
  } catch (error) {
    logger.error('Error generating presigned URL', { error })
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Could not generate presigned URL'
      })
    }
  }
}

async function getUploadUrl(imageId) {
  try {
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: imageId
    })
    const url = await getSignedUrl(s3Client, command, {
      expiresIn: urlExpiration
    })
    return url
  } catch (error) {
    logger.error('Error generating presigned URL for S3', { error })
    throw new Error('Error generating presigned URL for S3')
  }
}

async function updateDynamoDBItem(userId, todoId, attachmentId) {
  try {
    const attachmentUrl = `https://${bucketName}.s3.amazonaws.com/${attachmentId}`

    await dynamoDbClient.update({
      TableName: todosTable,
      Key: {
        userId,
        todoId
      },
      UpdateExpression: 'set attachmentUrl = :attachmentUrl',
      ExpressionAttributeValues: {
        ':attachmentUrl': attachmentUrl
      }
    })

    logger.info(`Updated DynamoDB item for todoId ${todoId} with attachmentUrl: ${attachmentUrl}`)
  } catch (error) {
    logger.error('Error updating DynamoDB item', { error })
    throw new Error('Error updating DynamoDB item with attachmentUrl')
  }
}
