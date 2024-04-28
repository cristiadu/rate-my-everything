import 'reflect-metadata'
import jwt from 'jsonwebtoken'

import { DataSource } from 'typeorm'
import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'

import RatedItem from './models/RatedItem'
import Item from './models/Item'
import User from './models/User'
import Attribute from './models/Attribute'
import AttributeValue from './models/AttributeValue'
import Category from './models/Category'

import RatedItemController from './api/RatedItemController'
import UserController from './api/UserController'
import AttributeController from './api/AttributeController'
import ItemController from './api/ItemController'
import CategoryController from './api/CategoryController'
import { UserRole } from './models/UserRole'

const app = express()
app.use(cors())
app.use(bodyParser.json())

// eslint-disable-next-line import/prefer-default-export
export const DBConnection: DataSource = new DataSource({
  name: 'default',
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [RatedItem, Item, User, Attribute, AttributeValue, Category],
  synchronize: true, // This will automatically create tables
  ssl: {
    rejectUnauthorized: false,
  },
})

DBConnection.initialize()
  .then(() => {
    console.log('Data Source has been initialized!')
  })
  .catch((err) => {
    console.error('Error during Data Source initialization', err)
  })

const unprotectedRoutes = new Set([
  '/api/users/login',
  '/api/users/register',
  // Add more unprotected routes as needed
]);

const routes = [
  { path: '/api/ratings', controller: new RatedItemController().router, roles: [UserRole.USER, UserRole.ADMIN] },
  { path: '/api/users', controller: new UserController().router, roles: [UserRole.ADMIN] },
  { path: '/api/attributes', controller: new AttributeController().router, roles: [UserRole.ADMIN] },
  { path: '/api/items', controller: new ItemController().router, roles: [UserRole.USER, UserRole.ADMIN] },
  { path: '/api/categories', controller: new CategoryController().router, roles: [UserRole.USER, UserRole.ADMIN] },
  // Add more routes as needed
];

function authenticationFilter(req: any, res: any, next: any) {
  // Check if the route is unprotected
  if (unprotectedRoutes.has(req.path)) {
    return next();
  }

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) {
    return res.sendStatus(401); // if there isn't any token
  }

  jwt.verify(token, 'your-secret-key', (err: any, user: any) => {
    if (err) {
      return res.sendStatus(401);
    }

    // Find the route that matches the request
    const route = routes.find(route => req.path.startsWith(route.path));
    // Check if the user has one of the required roles
    if (route && route.roles.some(role => user.roles.includes(role))) {
      req.user = user;
      next(); // pass the execution off to whatever request the client intended
    } else {
      res.sendStatus(403); // Forbidden
    }
  });
}
app.use(authenticationFilter);

// Use the routes
routes.forEach(route => app.use(route.path, route.controller));

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
