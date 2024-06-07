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
const Category_1 = __importDefault(require("../models/Category"));
const BaseService_1 = __importDefault(require("./BaseService"));
// Method for CRUD of a Category, which is a model for a category.
class CategoryService extends BaseService_1.default {
    constructor() {
        super(Category_1.default);
    }
    // Create a new Category
    create(category) {
        return __awaiter(this, void 0, void 0, function* () {
            const newCategory = this.repository.create(category);
            return this.repository.save(newCategory);
        });
    }
    // Read a Category by name
    get(name) {
        return __awaiter(this, void 0, void 0, function* () {
            const category = yield this.repository.findOne({ where: { name } });
            return category;
        });
    }
    // Update a Category
    update(name, category) {
        return __awaiter(this, void 0, void 0, function* () {
            const updatedCategory = yield this.get(name);
            if (updatedCategory) {
                this.repository.merge(updatedCategory, category);
                return this.repository.save(updatedCategory);
            }
            return null;
        });
    }
    // Delete a Category
    delete(name) {
        return __awaiter(this, void 0, void 0, function* () {
            const category = yield this.get(name);
            if (category) {
                yield this.repository.remove(category);
            }
        });
    }
    // get all Categories
    getAll() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.repository.find();
        });
    }
}
exports.default = CategoryService;
