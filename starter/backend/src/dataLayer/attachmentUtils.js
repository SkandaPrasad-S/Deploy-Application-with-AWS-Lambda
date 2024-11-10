import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { createLogger } from '../utils/logger.mjs'

const logger = createLogger('AttachmentUtils')
const s3Client = new S3Client()

export class AttachmentUtils {
  constructor(bucketName, urlExpiration) {
    this.bucketName = bucketName
    this.urlExpiration = urlExpiration
  }

  async getUploadUrl(imageId) {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: imageId
    })
    return getSignedUrl(s3Client, command, {
      expiresIn: this.urlExpiration
    })
  }

  getAttachmentUrl(attachmentId) {
    return `https://${this.bucketName}.s3.amazonaws.com/${attachmentId}`
  }
}