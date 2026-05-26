import { Parser } from 'json2csv'; export const toCsv=(rows,fields)=>new Parser({fields}).parse(rows);
