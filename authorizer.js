const jwt = require('jsonwebtoken')

const JWT_SECRET = 'rocketseat-api-secret'
const principalId = 'lambdaAuthorizer'

module.exports.handler = async (event) => {
  const authorization = event.authorizationToken
  const methodArn = event.methodArn

  console.log('Event', event)

  if (!authorization) {
    return generateAuthResponse(principalId, 'Deny', methodArn)
  }

  try {
    const token = authorization.replace('Bearer ', '')

    const decoded = jwt.verify(token, JWT_SECRET)
    console.log('Allow', decoded)

    return generateAuthResponse(principalId, 'Allow', methodArn)
  } catch (err) {
    console.log('Throw', err)
    return generateAuthResponse(principalId, 'Deny', methodArn)
  }
}

function generateAuthResponse (principalId, effect, methodArn) {
  const policyDocument = generatePolicyDocument(effect, methodArn)

  return {
    principalId,
    policyDocument,
  }
}

function generatePolicyDocument (effect, methodArn) {
  if (!effect || !methodArn) return null

  const policyDocument = {
    Version: '2012-10-17',
    Statement: [{
      Action: 'execute-api:invoke',
      Effect: effect,
      Resource: methodArn,
    }],
  }

  console.log('Result', policyDocument)

  return policyDocument
}
