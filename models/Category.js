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
const Attribute_1 = __importDefault(require("./Attribute"));
const Item_1 = __importDefault(require("./Item"));
let Category = class Category {
};
__decorate([
    (0, typeorm_1.PrimaryColumn)(),
    __metadata("design:type", String)
], Category.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => Attribute_1.default, (attribute) => attribute.categories),
    __metadata("design:type", Array)
], Category.prototype, "attributes", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Item_1.default, (item) => item.category),
    __metadata("design:type", Array)
], Category.prototype, "items", void 0);
Category = __decorate([
    (0, typeorm_1.Entity)()
], Category);
exports.default = Category;
