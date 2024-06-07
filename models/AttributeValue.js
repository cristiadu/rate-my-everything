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
const Item_1 = __importDefault(require("./Item"));
const Attribute_1 = __importDefault(require("./Attribute"));
let AttributeValue = class AttributeValue {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], AttributeValue.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Item_1.default, (item) => item.attributes),
    (0, typeorm_1.JoinColumn)({ name: 'item_id' }) // This line names the column as 'item_id '
    ,
    __metadata("design:type", Item_1.default)
], AttributeValue.prototype, "item", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Attribute_1.default, (attribute) => attribute.values),
    (0, typeorm_1.JoinColumn)({ name: 'attribute_id' }) // This line names the column as 'attribute_id'
    ,
    __metadata("design:type", Attribute_1.default)
], AttributeValue.prototype, "attribute", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], AttributeValue.prototype, "value", void 0);
AttributeValue = __decorate([
    (0, typeorm_1.Entity)()
], AttributeValue);
exports.default = AttributeValue;
