import { makeCrud } from './crudFactory.js'; import Model from '../models/Page.js'; export const { create, list, get, getBySlug, update, remove } = makeCrud(Model,{searchFields:['title', 'slug']});
