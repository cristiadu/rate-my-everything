"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const UserService_1 = __importDefault(require("../services/UserService"));
class LoginController {
    constructor() {
        this.router = (0, express_1.Router)();
        this.userService = new UserService_1.default();
        this.login = this.login.bind(this);
        this.initializeRoutes();
    }
    initializeRoutes() {
        this.router.post('/', this.login);
        // Add more routes as needed
    }
    login(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { username, password } = req.body;
                const jwtToken = yield this.userService.login(username, password);
                if (jwtToken) {
                    res.status(200).send(JSON.stringify({ token: jwtToken }));
                }
                else {
                    res.status(401).send('Invalid username or password');
                }
            }
            catch (error) {
                console.error(error);
                res.status(500).send(error);
            }
        });
    }
}
exports.default = LoginController;
