"use strict";
// Create AttributeController that uses AttributeService to create attributes and attribute values.
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
const AttributeService_1 = __importDefault(require("../services/AttributeService"));
class AttributeController {
    constructor() {
        this.router = (0, express_1.Router)();
        this.attributeService = new AttributeService_1.default();
        this.getAllAttributes = this.getAllAttributes.bind(this);
        this.getAllAttributeValues = this.getAllAttributeValues.bind(this);
        this.getAllAttributeValuesByAttribute = this.getAllAttributeValuesByAttribute.bind(this);
        this.getAttribute = this.getAttribute.bind(this);
        this.getAttributeValue = this.getAttributeValue.bind(this);
        this.createAttribute = this.createAttribute.bind(this);
        this.createAttributeValue = this.createAttributeValue.bind(this);
        this.updateAttribute = this.updateAttribute.bind(this);
        this.updateAttributeValue = this.updateAttributeValue.bind(this);
        this.deleteAttribute = this.deleteAttribute.bind(this);
        this.deleteAttributeValue = this.deleteAttributeValue.bind(this);
        this.initializeRoutes();
    }
    initializeRoutes() {
        this.router.get('/', this.getAllAttributes);
        this.router.get('/values', this.getAllAttributeValues);
        this.router.get('/values/:id', this.getAttributeValue);
        this.router.get('/:id', this.getAttribute);
        this.router.get('/:id/values', this.getAllAttributeValuesByAttribute);
        this.router.post('/', this.createAttribute);
        this.router.post('/values', this.createAttributeValue);
        this.router.put('/:id', this.updateAttribute);
        this.router.put('/values/:id', this.updateAttributeValue);
        this.router.delete('/:id', this.deleteAttribute);
        this.router.delete('/values/:id', this.deleteAttributeValue);
        // Add more routes as needed
    }
    getAllAttributes(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield this.attributeService.getAllAttributes();
                res.status(200).send(JSON.stringify(data));
            }
            catch (error) {
                console.error(error);
                res.status(500).send(error);
            }
        });
    }
    getAllAttributeValues(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield this.attributeService.getAllAttributeValues();
                res.status(200).send(JSON.stringify(data));
            }
            catch (error) {
                console.error(error);
                res.status(500).send(error);
            }
        });
    }
    getAllAttributeValuesByAttribute(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield this.attributeService.getAllAttributeValuesByAttribute(parseInt(req.params.id, 10));
                res.status(200).send(JSON.stringify(data));
            }
            catch (error) {
                console.error(error);
                res.status(500).send(error);
            }
        });
    }
    getAttribute(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield this.attributeService.getAttribute(parseInt(req.params.id, 10));
                if (data) {
                    res.status(200).send(JSON.stringify(data));
                }
                else {
                    res.status(404).send('Data not found');
                }
            }
            catch (error) {
                console.error(error);
                res.status(500).send(error);
            }
        });
    }
    getAttributeValue(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield this.attributeService.getAttributeValue(parseInt(req.params.id, 10));
                if (data) {
                    res.status(200).send(JSON.stringify(data));
                }
                else {
                    res.status(404).send('Data not found');
                }
            }
            catch (error) {
                console.error(error);
                res.status(500).send(error);
            }
        });
    }
    createAttribute(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield this.attributeService.createAttribute(req.body);
                res.status(201).send(JSON.stringify(data));
            }
            catch (error) {
                console.error(error);
                res.status(500).send(error);
            }
        });
    }
    createAttributeValue(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield this.attributeService.createAttributeValue(req.body);
                res.status(201).send(JSON.stringify(data));
            }
            catch (error) {
                console.error(error);
                res.status(500).send(error);
            }
        });
    }
    updateAttribute(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield this.attributeService.updateAttribute(parseInt(req.params.id, 10), req.body);
                if (data) {
                    res.status(200).send(JSON.stringify(data));
                }
                else {
                    res.status(404).send('Data not found');
                }
            }
            catch (error) {
                console.error(error);
                res.status(500).send(error);
            }
        });
    }
    updateAttributeValue(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield this.attributeService.updateAttributeValue(parseInt(req.params.id, 10), req.body);
                if (data) {
                    res.status(200).send(JSON.stringify(data));
                }
                else {
                    res.status(404).send('Data not found');
                }
            }
            catch (error) {
                console.error(error);
                res.status(500).send(error);
            }
        });
    }
    deleteAttribute(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.attributeService.deleteAttribute(parseInt(req.params.id, 10));
                res.status(204).send();
            }
            catch (error) {
                console.error(error);
                res.status(500).send(error);
            }
        });
    }
    deleteAttributeValue(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.attributeService.deleteAttributeValue(parseInt(req.params.id, 10));
                res.status(204).send();
            }
            catch (error) {
                console.error(error);
                res.status(500).send(error);
            }
        });
    }
}
exports.default = AttributeController;
