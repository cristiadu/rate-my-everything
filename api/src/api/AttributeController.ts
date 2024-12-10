// Create AttributeController that uses AttributeService to create attributes and attribute values.

import { Router, Request, Response } from 'express'
import AttributeService from '../services/AttributeService'

export default class AttributeController {
  public router = Router()

  private attributeService = new AttributeService()

  constructor() {
    this.getAllAttributes = this.getAllAttributes.bind(this)
    this.getAllAttributeValues = this.getAllAttributeValues.bind(this)
    this.getAllAttributeValuesByAttribute = this.getAllAttributeValuesByAttribute.bind(this)
    this.getAttribute = this.getAttribute.bind(this)
    this.getAttributeValue = this.getAttributeValue.bind(this)
    this.createAttribute = this.createAttribute.bind(this)
    this.createAttributeValue = this.createAttributeValue.bind(this)
    this.updateAttribute = this.updateAttribute.bind(this)
    this.updateAttributeValue = this.updateAttributeValue.bind(this)
    this.deleteAttribute = this.deleteAttribute.bind(this)
    this.deleteAttributeValue = this.deleteAttributeValue.bind(this)
    this.initializeRoutes()
  }

  public initializeRoutes() {
    this.router.get('/', this.getAllAttributes)
    this.router.get('/values', this.getAllAttributeValues)
    this.router.get('/values/:id', this.getAttributeValue)
    this.router.get('/:id', this.getAttribute)
    this.router.get('/:id/values', this.getAllAttributeValuesByAttribute)
    this.router.post('/', this.createAttribute)
    this.router.post('/values', this.createAttributeValue)
    this.router.put('/:id', this.updateAttribute)
    this.router.put('/values/:id', this.updateAttributeValue)
    this.router.delete('/:id', this.deleteAttribute)
    this.router.delete('/values/:id', this.deleteAttributeValue)
    // Add more routes as needed
  }

  public async getAllAttributes(req: Request, res: Response) {
    try {
      const data = await this.attributeService.getAllAttributes()
      res.status(200).send(JSON.stringify(data))
    } catch (error) {
      console.error(error)
      res.status(500).send(error)
    }
  }

  public async getAllAttributeValues(req: Request, res: Response) {
    try {
      const data = await this.attributeService.getAllAttributeValues()
      res.status(200).send(JSON.stringify(data))
    } catch (error) {
      console.error(error)
      res.status(500).send(error)
    }
  }

  public async getAllAttributeValuesByAttribute(req: Request, res: Response) {
    try {
      const data = await this.attributeService.getAllAttributeValuesByAttribute(parseInt(req.params.id, 10))
      res.status(200).send(JSON.stringify(data))
    } catch (error) {
      console.error(error)
      res.status(500).send(error)
    }
  }

  public async getAttribute(req: Request, res: Response) {
    try {
      const data = await this.attributeService.getAttribute(parseInt(req.params.id, 10))
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

  public async getAttributeValue(req: Request, res: Response) {
    try {
      const data = await this.attributeService.getAttributeValue(parseInt(req.params.id, 10))
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

  public async createAttribute(req: Request, res: Response) {
    try {
      const data = await this.attributeService.createAttribute(req.body)
      res.status(201).send(JSON.stringify(data))
    } catch (error) {
      console.error(error)
      res.status(500).send(error)
    }
  }

  public async createAttributeValue(req: Request, res: Response) {
    try {
      const data = await this.attributeService.createAttributeValue(req.body)
      res.status(201).send(JSON.stringify(data))
    } catch (error) {
      console.error(error)
      res.status(500).send('An internal server error occurred')
    }
  }

  public async updateAttribute(req: Request, res: Response) {
    try {
      const data = await this.attributeService.updateAttribute(parseInt(req.params.id, 10), req.body)
      if (data) {
        res.status(200).send(JSON.stringify(data))
      } else {
        res.status(404).send('Data not found')
      }
    } catch (error) {
      console.error(error)
      res.status(500).send('An internal server error occurred')
    }
  }

  public async updateAttributeValue(req: Request, res: Response) {
    try {
      const data = await this.attributeService.updateAttributeValue(parseInt(req.params.id, 10), req.body)
      if (data) {
        res.status(200).send(JSON.stringify(data))
      } else {
        res.status(404).send('Data not found')
      }
    } catch (error) {
      console.error(error)
      res.status(500).send('An internal server error occurred')
    }
  }

  public async deleteAttribute(req: Request, res: Response) {
    try {
      await this.attributeService.deleteAttribute(parseInt(req.params.id, 10))
      res.status(204).send()
    } catch (error) {
      console.error(error)
      res.status(500).send('An internal server error occurred')
    }
  }

  public async deleteAttributeValue(req: Request, res: Response) {
    try {
      await this.attributeService.deleteAttributeValue(parseInt(req.params.id, 10))
      res.status(204).send()
    } catch (error) {
      console.error(error)
      res.status(500).send('An internal server error occurred')
    }
  }
}
