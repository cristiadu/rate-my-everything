"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticationFilter = exports.routes = exports.unprotectedRoutes = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const RatedItemController_1 = __importDefault(require("../api/RatedItemController"));
const UserController_1 = __importDefault(require("../api/UserController"));
const AttributeController_1 = __importDefault(require("../api/AttributeController"));
const ItemController_1 = __importDefault(require("../api/ItemController"));
const CategoryController_1 = __importDefault(require("../api/CategoryController"));
const UserRole_1 = __importDefault(require("../models/UserRole"));
const LoginController_1 = __importDefault(require("../api/LoginController"));
exports.unprotectedRoutes = new Set([
    '/api/login',
    '/api/login/register',
    // Add more unprotected routes as needed
]);
exports.routes = [
    { path: '/api/ratings', controller: () => new RatedItemController_1.default().router, roles: [UserRole_1.default.USER, UserRole_1.default.ADMIN] },
    { path: '/api/users', controller: () => new UserController_1.default().router, roles: [UserRole_1.default.ADMIN] },
    { path: '/api/login', controller: () => new LoginController_1.default().router, roles: [] },
    { path: '/api/attributes', controller: () => new AttributeController_1.default().router, roles: [UserRole_1.default.ADMIN] },
    { path: '/api/items', controller: () => new ItemController_1.default().router, roles: [UserRole_1.default.USER, UserRole_1.default.ADMIN] },
    { path: '/api/categories', controller: () => new CategoryController_1.default().router, roles: [UserRole_1.default.USER, UserRole_1.default.ADMIN] },
    // Add more routes as needed
];
function authenticationFilter(req, res, next) {
    // Check if the route is unprotected
    if (exports.unprotectedRoutes.has(req.path)) {
        return next();
    }
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    if (authHeader == null || !authHeader.startsWith('Bearer ') || token == null) {
        return res.sendStatus(401); // if the auth header is missing or not in the correct format
    }
    jsonwebtoken_1.default.verify(token, 'your-secret-key', (err, user) => {
        if (err) {
            return res.sendStatus(401);
        }
        // Find the route that matches the request
        const route = exports.routes.find((currentRoute) => req.path.startsWith(currentRoute.path));
        // Check if the user has one of the required roles
        if (!route || !route.roles.some((role) => user.roles.includes(role))) {
            return res.sendStatus(403); // Forbidden
        }
        req.user = user;
        return next(); // pass the execution off to whatever request the client intended
    });
    return res.sendStatus(500); // invalid status
}
exports.authenticationFilter = authenticationFilter;
