"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DBConnection = void 0;
require("reflect-metadata");
const typeorm_1 = require("typeorm");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const body_parser_1 = __importDefault(require("body-parser"));
const RatedItem_1 = __importDefault(require("./models/RatedItem"));
const Item_1 = __importDefault(require("./models/Item"));
const User_1 = __importDefault(require("./models/User"));
const Attribute_1 = __importDefault(require("./models/Attribute"));
const AttributeValue_1 = __importDefault(require("./models/AttributeValue"));
const Category_1 = __importDefault(require("./models/Category"));
const RouterAuthConfig_1 = require("./routes/RouterAuthConfig");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(body_parser_1.default.json());
// eslint-disable-next-line import/prefer-default-export
exports.DBConnection = new typeorm_1.DataSource({
    name: 'default',
    type: 'postgres',
    url: process.env.DATABASE_URL,
    entities: [RatedItem_1.default, Item_1.default, User_1.default, Attribute_1.default, AttributeValue_1.default, Category_1.default],
    synchronize: true, // This will automatically create tables
    ssl: {
        rejectUnauthorized: false,
    },
});
exports.DBConnection.initialize()
    .then(() => {
    console.log('Data Source has been initialized!');
    app.use(RouterAuthConfig_1.authenticationFilter);
    // Use the routes
    RouterAuthConfig_1.routes.forEach((route) => app.use(route.path, route.controller()));
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
})
    .catch((err) => {
    console.error('Error during Data Source initialization', err);
});
