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
const CategoryService_1 = __importDefault(require("../services/CategoryService"));
class CategoryController {
    constructor() {
        this.router = (0, express_1.Router)();
        this.categoryService = new CategoryService_1.default();
        this.getAll = this.getAll.bind(this);
        this.getByName = this.getByName.bind(this);
        this.create = this.create.bind(this);
        this.update = this.update.bind(this);
        this.delete = this.delete.bind(this);
        this.initializeRoutes();
    }
    initializeRoutes() {
        this.router.get('/', this.getAll);
        this.router.get('/:name', this.getByName);
        this.router.post('/', this.create);
        this.router.put('/:name', this.update);
        this.router.delete('/:name', this.delete);
        // Add more routes as needed
    }
    getAll(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield this.categoryService.getAll();
                res.status(200).send(JSON.stringify(data));
            }
            catch (error) {
                console.error(error);
                res.status(500).send(error);
            }
        });
    }
    getByName(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield this.categoryService.get(req.params.name);
                res.status(200).send(JSON.stringify(data));
            }
            catch (error) {
                console.error(error);
                res.status(500).send(error);
            }
        });
    }
    create(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield this.categoryService.create(req.body);
                res.status(201).send(JSON.stringify(data));
            }
            catch (error) {
                console.error(error);
                res.status(500).send(error);
            }
        });
    }
    update(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield this.categoryService.update(req.params.name, req.body);
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
    delete(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.categoryService.delete(req.params.name);
                res.status(204).send();
            }
            catch (error) {
                console.error(error);
                res.status(500).send(error);
            }
        });
    }
}
exports.default = CategoryController;
