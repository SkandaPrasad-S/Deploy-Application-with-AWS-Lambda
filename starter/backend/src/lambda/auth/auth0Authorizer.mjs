import Axios from 'axios'
import jsonwebtoken from 'jsonwebtoken'
import { createLogger } from '../../utils/logger.mjs'

const logger = createLogger('auth')
const jwksUrl = 'https://dev-bfcwvysh3y6kk7zf.uk.auth0.com/.well-known/jwks.json'

export async function handler(event) {
  try {
    const jwtToken = await verifyToken(event.authorizationToken)

    logger.info('Token verified successfully', { sub: jwtToken.sub })
    return {
      principalId: jwtToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*'
          }
        ]
      }
    }
  } catch (e) {
    logger.error('User not authorized', { error: e.message })

    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    }
  }
}

async function verifyToken(authHeader) {
  const token = getToken(authHeader)
  const jwt = jsonwebtoken.decode(token, { complete: true })
  const kid = jwt?.header?.kid

  if (!kid) throw new Error('No Key ID found in token')

  const jwks = await Axios.get(jwksUrl)
  const signingKey = jwks.data.keys.find(key => key.kid === kid)

  if (!signingKey) throw new Error('Signing key not found in JWKS')

  const publicKey = getPublicKey(signingKey)
  
  // Verify the token using the public key and the RS256 algorithm
  return jsonwebtoken.verify(token, publicKey, { algorithms: ['RS256'] })
}

function getToken(authHeader) {
  if (!authHeader) throw new Error('No authentication header')

  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header')

  const split = authHeader.split(' ')
  const token = split[1]

  return token
}

function getPublicKey(signingKey) {
  // Convert the JWKS key to a PEM format for jsonwebtoken to use
  return `-----BEGIN CERTIFICATE-----\n${signingKey.x5c[0]}\n-----END CERTIFICATE-----`
}
