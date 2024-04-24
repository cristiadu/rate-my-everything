import { Request, Response, Router } from 'express'
import CategoryService from '../services/CategoryService'

export default class CategoryController {
    public router = Router()

    private categoryService = new CategoryService()

    constructor() {
        this.getAll = this.getAll.bind(this)
        this.getByName = this.getByName.bind(this)
        this.create = this.create.bind(this)
        this.update = this.update.bind(this)
        this.delete = this.delete.bind(this)
        this.initializeRoutes()
    }

    public initializeRoutes() {
        this.router.get('/', this.getAll)
        this.router.get('/:name', this.getByName)
        this.router.post('/', this.create)
        this.router.put('/:name', this.update)
        this.router.delete('/:name', this.delete)
        // Add more routes as needed
      }

    public async getAll(req: Request, res: Response) {
        try {
            const data = await this.categoryService.getAll()
            res.status(200).send(JSON.stringify(data))
          } catch (error) {
            console.error(error)
            res.status(500).send(error)
          }
    }

    public async getByName(req: Request, res: Response) {
        try {
            const data = await this.categoryService.get(req.params.name)
            res.status(200).send(JSON.stringify(data))
          } catch (error) {
            console.error(error)
            res.status(500).send(error)
          }
    }

    public async create(req: Request, res: Response) {
        try {
            const data = await this.categoryService.create(req.body)
            res.status(201).send(JSON.stringify(data))
          } catch (error) {
            console.error(error)
            res.status(500).send(error)
          }
    }

    public async update(req: Request, res: Response) {
        try {
            const data = await this.categoryService.update(req.params.name, req.body)
            if (data) {
              res.status(200).send(JSON.stringify(data))
            } else {
              res.status(404).send('Data not found')
            }
          } catch (error) {
            console.error(error)
            res.status(500).send(error)
          }
    }

    public async delete(req: Request, res: Response) {
        try {
            await this.categoryService.delete(req.params.name)
            res.status(204).send()
          } catch (error) {
            console.error(error)
            res.status(500).send(error)
          }
    }
}
