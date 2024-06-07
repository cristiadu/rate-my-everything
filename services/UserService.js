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
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const BaseService_1 = __importDefault(require("./BaseService"));
// create user service based on RatedItemService.ts in this directory
class UserService extends BaseService_1.default {
    constructor() {
        super(User_1.default);
    }
    create(user) {
        return __awaiter(this, void 0, void 0, function* () {
            const newUser = this.repository.create(user);
            return this.repository.save(newUser);
        });
    }
    getById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.repository.findOne({ where: { id } });
            return user || null;
        });
    }
    update(id, user) {
        return __awaiter(this, void 0, void 0, function* () {
            const existingUser = yield this.getById(id);
            if (existingUser) {
                this.repository.merge(user, existingUser);
                return this.repository.save(user);
            }
            return null;
        });
    }
    delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.getById(id);
            if (user) {
                yield this.repository.remove(user);
            }
        });
    }
    getAll() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.repository.find();
        });
    }
    getByUsername(username) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.repository.findOne({ where: { username } });
            return user || null;
        });
    }
    // login method
    login(username, password) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.repository.findOne({ where: { username } });
            if (user && user.password === password) {
                // Payload that will be included in the token
                const payload = { username: user.username, id: user.id, roles: user.roles };
                // Secret key used to sign the token
                const secretKey = 'your-secret-key';
                // Options for the token
                const options = { expiresIn: '3d' };
                // Generate the token
                const token = jsonwebtoken_1.default.sign(payload, secretKey, options);
                return token;
            }
            return null;
        });
    }
}
exports.default = UserService;
