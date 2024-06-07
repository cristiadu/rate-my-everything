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
const RatedItem_1 = __importDefault(require("./RatedItem"));
const Category_1 = __importDefault(require("./Category"));
const AttributeValue_1 = __importDefault(require("./AttributeValue"));
let Item = class Item {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Item.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Item.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Item.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Category_1.default, (category) => category.items),
    (0, typeorm_1.JoinColumn)({ name: 'category' }) // This line names the column as 'category'
    ,
    __metadata("design:type", Category_1.default)
], Item.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => RatedItem_1.default, (ratedItem) => ratedItem.item),
    __metadata("design:type", Array)
], Item.prototype, "ratings", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => AttributeValue_1.default, (attributeValue) => attributeValue.item),
    __metadata("design:type", Array)
], Item.prototype, "attributes", void 0);
Item = __decorate([
    (0, typeorm_1.Entity)()
], Item);
exports.default = Item;
