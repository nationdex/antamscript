import * as p from 'peberminta'
import * as pc from 'peberminta/char'
import { createLexer, type Token } from 'leac';

// AST Types
type Text = { kind: 'text', value: string }
type Identifier = { kind: 'ident', name: string, mod: string }
type Callable = Omit<Identifier, 'kind'> & { kind: 'call', arguments: ASTNode[][] }
type ASTNode = { text: string } & (Text | Identifier | Callable)

// Lexer
const lex = createLexer([
    { name: 'escape', regex: /\\(.)/ },
    { name: 'call', regex: /\$([@#?!]?)([a-zA-Z][a-zA-Z0-9]*)\[/},
    { name: 'ident', regex: /\$([@#?!]?)([a-zA-Z][a-zA-Z0-9]*)/},
    { name: '[' },
    { name: ']' },
    { name: ';' },
    { name: 'text', regex: /[^$\[\]\\;]+/},
    { name: 'text', str: '$' }
])

function literal(name: string): p.Parser<Token, unknown, string> {
    return p.token(t => t.name === name ? t.text : undefined)
}

const IDENT_MODS = '@#?!'
function ident(name: string) {
    const mod = IDENT_MODS[IDENT_MODS.indexOf(name.at(1) as string)] || ''
    const offset = mod.length + 1
    const end = name.length - (name.endsWith('[') ? 1 : 0)

    return { name: name.slice(offset, end), mod }
}

// Parsers
const text_: p.Parser<Token, unknown, ASTNode>
    = p.token(t => t.name === 'text' ? { kind: 'text', value: t.text, text: t.text } : undefined)

const escape_: p.Parser<Token, unknown, ASTNode>
    = p.token(t => t.name === 'escape' ? { kind: 'text', value: t.text.slice(1), text: t.text } : undefined)

const ident_: p.Parser<Token, unknown, ASTNode>
    = p.token(t => t.name === 'ident' ? { kind: 'ident', text: t.text, ...ident(t.text) } : undefined)

const call_: p.Parser<Token, unknown, ASTNode>
    = p.abc(
        literal('call'),
        p.sepBy(
            p.recursive(() => program_),
            literal(';')
        ),
        p.option(literal(']'), ''),
        (name, inside, end) => {
            return { kind: 'call', ...ident(name), arguments: inside }
        }
    )

const program_ = p.choice(
    escape_,
    call_,
    ident_,
    p.map(
        p.many(text_),
        (texts) => texts.reduce(())
    )
)

export function tryParse(input: string) {
    const { tokens, complete } = lex(input)
    return {
        tokens: tokens,
        tree: p.tryParse(p.many(program_), tokens, {})
    }
}