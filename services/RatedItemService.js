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
const RatedItem_1 = __importDefault(require("../models/RatedItem"));
const BaseService_1 = __importDefault(require("./BaseService"));
// Method for CRUD of a RatedItem, which is a model for a rated item.
class RatedItemService extends BaseService_1.default {
    constructor() {
        super(RatedItem_1.default);
    }
    // Create a new RatedItem
    create(ratedItem) {
        return __awaiter(this, void 0, void 0, function* () {
            const newRatedItem = this.repository.create(ratedItem);
            return this.repository.save(newRatedItem);
        });
    }
    // Read a RatedItem by id
    get(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const ratedItem = yield this.repository.findOne({ where: { id } });
            return ratedItem;
        });
    }
    // Update a RatedItem
    update(id, ratedItem) {
        return __awaiter(this, void 0, void 0, function* () {
            const updatedRatedItem = yield this.get(id);
            if (updatedRatedItem) {
                this.repository.merge(updatedRatedItem, ratedItem);
                return this.repository.save(updatedRatedItem);
            }
            return null;
        });
    }
    // Delete a RatedItem
    delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const ratedItem = yield this.get(id);
            if (ratedItem) {
                yield this.repository.remove(ratedItem);
            }
        });
    }
    // get all RatedItems
    getAll() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.repository.find();
        });
    }
    // get all RatedItems by user_id
    getAllByUserId(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.repository.find({ where: { user: { id: userId } } });
        });
    }
}
exports.default = RatedItemService;
