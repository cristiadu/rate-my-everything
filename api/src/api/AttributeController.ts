import { Router, Request, Response } from 'express'
import AttributeService from '@/services/AttributeService'
import { NewApiError } from '@/models/APIError'

export default class AttributeController {
  public router = Router()

  private attributeService = new AttributeService()

  constructor() {
    this.initializeRoutes()
  }

  public initializeRoutes() {
    this.router.get('/', (req, res) => this.getAllAttributes(req, res))
    this.router.get('/values', (req, res) => this.getAllAttributeValues(req, res))
    this.router.get('/values/:id', (req, res) => this.getAttributeValue(req, res))
    this.router.get('/:id', (req, res) => this.getAttribute(req, res))
    this.router.get('/:id/values', (req, res) => this.getAllAttributeValuesByAttribute(req, res))
    this.router.post('/', (req, res) => this.createAttribute(req, res))
    this.router.post('/values', (req, res) => this.createAttributeValue(req, res))
    this.router.put('/:id', (req, res) => this.updateAttribute(req, res))
    this.router.put('/values/:id', (req, res) => this.updateAttributeValue(req, res))
    this.router.delete('/:id', (req, res) => this.deleteAttribute(req, res))
    this.router.delete('/values/:id', (req, res) => this.deleteAttributeValue(req, res))
  }

  public async getAllAttributes(req: Request, res: Response) {
    try {
      const data = await this.attributeService.getAllAttributes()
      res.status(200).json(data)
    } catch (error) {
      console.error(error)
      res.status(500).json(NewApiError('INTERNAL_ERROR', 500, 'An internal server error occurred'))
    }
  }

  public async getAllAttributeValues(req: Request, res: Response) {
    try {
      const data = await this.attributeService.getAllAttributeValues()
      res.status(200).json(data)
    } catch (error) {
      console.error(error)
      res.status(500).json(NewApiError('INTERNAL_ERROR', 500, 'An internal server error occurred'))
    }
  }

  public async getAllAttributeValuesByAttribute(req: Request, res: Response) {
    try {
      const data = await this.attributeService.getAllAttributeValuesByAttribute(parseInt(req.params.id, 10))
      res.status(200).json(data)
    } catch (error) {
      console.error(error)
      res.status(500).json(NewApiError('INTERNAL_ERROR', 500, 'An internal server error occurred'))
    }
  }

  public async getAttribute(req: Request, res: Response) {
    try {
      const data = await this.attributeService.getAttribute(parseInt(req.params.id, 10))
      if (data) {
        res.status(200).json(data)
      } else {
        res.status(404).json(NewApiError('RESOURCE_NOT_FOUND', 404, 'Data not found'))
      }
    } catch (error) {
      console.error(error)
      res.status(500).json(NewApiError('INTERNAL_ERROR', 500, 'An internal server error occurred'))
    }
  }

  public async getAttributeValue(req: Request, res: Response) {
    try {
      const data = await this.attributeService.getAttributeValue(parseInt(req.params.id, 10))
      if (data) {
        res.status(200).json(data)
      } else {
        res.status(404).json(NewApiError('RESOURCE_NOT_FOUND', 404, 'Data not found'))
      }
    } catch (error) {
      console.error(error)
      res.status(500).json(NewApiError('INTERNAL_ERROR', 500, 'An internal server error occurred'))
    }
  }

  public async createAttribute(req: Request, res: Response) {
    try {
      const data = await this.attributeService.createAttribute(req.body)
      res.status(201).json(data)
    } catch (error) {
      console.error(error)
      res.status(500).json(NewApiError('INTERNAL_ERROR', 500, 'An internal server error occurred'))
    }
  }

  public async createAttributeValue(req: Request, res: Response) {
    try {
      const data = await this.attributeService.createAttributeValue(req.body)
      res.status(201).json(data)
    } catch (error) {
      console.error(error)
      res.status(500).json(NewApiError('INTERNAL_ERROR', 500, 'An internal server error occurred'))
    }
  }

  public async updateAttribute(req: Request, res: Response) {
    try {
      const data = await this.attributeService.updateAttribute(parseInt(req.params.id, 10), req.body)
      if (data) {
        res.status(200).json(data)
      } else {
        res.status(404).json(NewApiError('RESOURCE_NOT_FOUND', 404, 'Data not found'))
      }
    } catch (error) {
      console.error(error)
      res.status(500).json(NewApiError('INTERNAL_ERROR', 500, 'An internal server error occurred'))
    }
  }

  public async updateAttributeValue(req: Request, res: Response) {
    try {
      const data = await this.attributeService.updateAttributeValue(parseInt(req.params.id, 10), req.body)
      if (data) {
        res.status(200).json(data)
      } else {
        res.status(404).json(NewApiError('RESOURCE_NOT_FOUND', 404, 'Data not found'))
      }
    } catch (error) {
      console.error(error)
      res.status(500).json(NewApiError('INTERNAL_ERROR', 500, 'An internal server error occurred'))
    }
  }

  public async deleteAttribute(req: Request, res: Response) {
    try {
      await this.attributeService.deleteAttribute(parseInt(req.params.id, 10))
      res.status(204).send()
    } catch (error) {
      console.error(error)
      res.status(500).json(NewApiError('INTERNAL_ERROR', 500, 'An internal server error occurred'))
    }
  }

  public async deleteAttributeValue(req: Request, res: Response) {
    try {
      await this.attributeService.deleteAttributeValue(parseInt(req.params.id, 10))
      res.status(204).send()
    } catch (error) {
      console.error(error)
      res.status(500).json(NewApiError('INTERNAL_ERROR', 500, 'An internal server error occurred'))
    }
  }
}
