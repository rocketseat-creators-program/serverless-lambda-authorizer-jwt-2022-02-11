const AWS = require('aws-sdk')
const { v4: uuidv4 } = require('uuid')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const dynamoDb = new AWS.DynamoDB.DocumentClient()
const JWT_SECRET = 'rocketseat-api-secret'
const USERS_TABLE = 'users'

const defaultResponse = {
  statusCode: 500,
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': true,
  },
  body: JSON.stringify({
    message: 'Ocorreu um erro',
  }),
}

// USERS
const createUser = async event => {
  try {
    const user = JSON.parse(event.body)
    const id = uuidv4()

    const { name, email, access, password } = user

    const newUser = {
      id,
      name,
      email,
      access,
      password: bcrypt.hashSync(password, 10),
    }

    const params = {
      TableName: USERS_TABLE,
      Item: newUser,
    }

    await dynamoDb.put(params).promise()

    return {
      ...defaultResponse,
      statusCode: 201,
      body: JSON.stringify(newUser),
    }
  } catch (err) {
    console.log(err)
    return defaultResponse
  }
}

const getUser = async event => {
  try {
    const { id } = event.pathParameters

    const params = {
      TableName: USERS_TABLE,
      Key: {
        id,
      },
    }

    const response = await dynamoDb.get(params).promise()

    if (!response || !response.Item) {
      return {
        ...defaultResponse,
        statusCode: 404,
        body: JSON.stringify({
          message: 'Usuário não encontrado',
        }),
      }
    }

    return {
      ...defaultResponse,
      statusCode: 200,
      body: JSON.stringify(response.Item),
    }
  } catch (err) {
    console.log(err)
    return defaultResponse
  }
}

const authenticateUser = async event => {
  try {
    const { email, password } = event.body

    const params = {
      TableName: USERS_TABLE,
      ExpressionAttributeNames: {
        '#e': 'email',
      },
      ExpressionAttributeValues: {
        ':email': email,
      },
      FilterExpression: '#e = :email',
    }

    const response = await dynamoDb.scan(params).promise()

    if (!response || !response.Items.length) {
      return {
        ...defaultResponse,
        statusCode: 404,
        body: JSON.stringify({
          message: 'Usuário/Senha inválido',
        }),
      }
    }

    const Item = response.Items[0]

    if (!bcrypt.compareSync(password, Item.password)) {
      return {
        ...defaultResponse,
        statusCode: 404,
        body: JSON.stringify({
          message: 'Usuário/Senha inválido',
        }),
      }
    }

    const tokenUser = {
      id: Item.id,
      name: Item.name,
      email: Item.email,
      access: Item.access,
    }

    let token = jwt.sign(tokenUser, JWT_SECRET, { expiresIn: '24h' })

    return {
      ...defaultResponse,
      statusCode: 200,
      body: JSON.stringify({
        token: token,
      }),
    }
  } catch (err) {
    console.log(err)
    return defaultResponse
  }
}

module.exports = {
  createUser,
  getUser,
  authenticateUser,
}
