"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const AttributeValue_1 = __importDefault(require("./AttributeValue"));
const Category_1 = __importDefault(require("./Category"));
let Attribute = class Attribute {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Attribute.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Attribute.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Attribute.prototype, "valueType", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => Category_1.default, (category) => category.attributes),
    __metadata("design:type", Array)
], Attribute.prototype, "categories", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => AttributeValue_1.default, (attributeValue) => attributeValue.attribute),
    __metadata("design:type", Array)
], Attribute.prototype, "values", void 0);
Attribute = __decorate([
    (0, typeorm_1.Entity)()
], Attribute);
exports.default = Attribute;
