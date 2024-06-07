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
const index_1 = require("../index");
const Attribute_1 = __importDefault(require("../models/Attribute"));
const AttributeValue_1 = __importDefault(require("../models/AttributeValue"));
const BaseService_1 = __importDefault(require("./BaseService"));
// Method for CRUD of an Attribute and AttributeValue
class AttributeService extends BaseService_1.default {
    constructor() {
        super(Attribute_1.default);
    }
    get attributeValueRepository() {
        if (!this.privateAttValueRepository) {
            this.privateAttValueRepository = index_1.DBConnection.getRepository(AttributeValue_1.default);
        }
        return this.privateAttValueRepository;
    }
    // Create a new Attribute
    createAttribute(attribute) {
        return __awaiter(this, void 0, void 0, function* () {
            const newAttribute = this.repository.create(attribute);
            return this.repository.save(newAttribute);
        });
    }
    // Create a new AttributeValue
    createAttributeValue(attributeValue) {
        return __awaiter(this, void 0, void 0, function* () {
            const newAttributeValue = this.attributeValueRepository.create(attributeValue);
            return this.attributeValueRepository.save(newAttributeValue);
        });
    }
    // Read an Attribute by id
    getAttribute(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const attribute = yield this.repository.findOne({ where: { id } });
            return attribute;
        });
    }
    // Read an AttributeValue by id
    getAttributeValue(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const attributeValue = yield this.attributeValueRepository.findOne({ where: { id } });
            return attributeValue;
        });
    }
    // Update an Attribute
    updateAttribute(id, attribute) {
        return __awaiter(this, void 0, void 0, function* () {
            const updatedAttribute = yield this.getAttribute(id);
            if (updatedAttribute) {
                this.repository.merge(updatedAttribute, attribute);
                return this.repository.save(updatedAttribute);
            }
            return null;
        });
    }
    // Update an AttributeValue
    updateAttributeValue(id, attributeValue) {
        return __awaiter(this, void 0, void 0, function* () {
            const updatedAttributeValue = yield this.getAttributeValue(id);
            if (updatedAttributeValue) {
                this.attributeValueRepository.merge(updatedAttributeValue, attributeValue);
                return this.attributeValueRepository.save(updatedAttributeValue);
            }
            return null;
        });
    }
    // Delete an Attribute
    deleteAttribute(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const attribute = yield this.getAttribute(id);
            if (attribute) {
                yield this.repository.remove(attribute);
            }
        });
    }
    // Delete an AttributeValue
    deleteAttributeValue(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const attributeValue = yield this.getAttributeValue(id);
            if (attributeValue) {
                yield this.attributeValueRepository.remove(attributeValue);
            }
        });
    }
    // get all Attributes
    getAllAttributes() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.repository.find();
        });
    }
    // get all attributes values by attribute
    getAllAttributeValuesByAttribute(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.attributeValueRepository.find({ where: { attribute: { id } } });
        });
    }
    // get all AttributeValues
    getAllAttributeValues() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.attributeValueRepository.find();
        });
    }
}
exports.default = AttributeService;
