import { makeCrud } from './crudFactory.js'; import Model from '../models/Section.js'; export const { create, list, get, getBySlug, update, remove } = makeCrud(Model,{searchFields:['key', 'title']});
