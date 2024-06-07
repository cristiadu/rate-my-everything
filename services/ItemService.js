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
const Item_1 = __importDefault(require("../models/Item"));
const BaseService_1 = __importDefault(require("./BaseService"));
// Method for CRUD of an Item, which is a model for an item.
class ItemService extends BaseService_1.default {
    constructor() {
        super(Item_1.default);
    }
    // Create a new Item
    create(item) {
        return __awaiter(this, void 0, void 0, function* () {
            const newItem = this.repository.create(item);
            return this.repository.save(newItem);
        });
    }
    // Read an Item by id
    get(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const item = yield this.repository.findOne({ where: { id } });
            return item;
        });
    }
    // Update an Item
    update(id, item) {
        return __awaiter(this, void 0, void 0, function* () {
            const updatedItem = yield this.get(id);
            if (updatedItem) {
                this.repository.merge(updatedItem, item);
                return this.repository.save(updatedItem);
            }
            return null;
        });
    }
    // Delete an Item
    delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const item = yield this.get(id);
            if (item) {
                yield this.repository.remove(item);
            }
        });
    }
    // get all Items
    getAll() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.repository.find();
        });
    }
    // get all Items by category
    getAllByCategory(category) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.repository.find({ where: { category: { name: category } } });
        });
    }
}
exports.default = ItemService;
