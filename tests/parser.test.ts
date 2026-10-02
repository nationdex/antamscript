import { describe, it } from 'node:test'
import { tryParse } from '../source/internal/parser.ts'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { inspect } from 'util';

describe('Parsing Test', () => {
    const testFile = readFileSync(resolve(process.cwd(), 'examples/small.fsc'), { 'encoding': 'utf-8' })

    console.log(
        inspect(tryParse(testFile), false, null, true)
    )
})