"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../index");
class BaseService {
    constructor(repositoryType) {
        this.privateRepository = null;
        this.repositoryType = repositoryType;
    }
    get repository() {
        if (!this.privateRepository) {
            this.privateRepository = index_1.DBConnection.getRepository(this.repositoryType);
        }
        return this.privateRepository;
    }
}
exports.default = BaseService;
