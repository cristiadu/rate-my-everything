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
const class_validator_1 = require("class-validator");
const User_1 = __importDefault(require("./User"));
const Item_1 = __importDefault(require("./Item"));
let RatedItem = class RatedItem {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], RatedItem.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Item_1.default, (item) => item.ratings),
    (0, typeorm_1.JoinColumn)({ name: 'item_id' }) // This line names the column as 'item_id '
    ,
    __metadata("design:type", Item_1.default)
], RatedItem.prototype, "item", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 4, scale: 2 }),
    (0, class_validator_1.Min)(0.0),
    (0, class_validator_1.Max)(10.0),
    __metadata("design:type", Number)
], RatedItem.prototype, "rating", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.default, (user) => user.ratedItems),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }) // This line names the column as 'user_id'
    ,
    __metadata("design:type", User_1.default)
], RatedItem.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], RatedItem.prototype, "notes", void 0);
RatedItem = __decorate([
    (0, typeorm_1.Entity)()
], RatedItem);
exports.default = RatedItem;
