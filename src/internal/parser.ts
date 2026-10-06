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
    // { name: '[' },
    { name: ']' },
    { name: ';' },
    { name: 'text', regex: /[^$\]\\;]+/},
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
type ParserState = {
    count_block: number
}
type Options = { __state: ParserState }
const text_: p.Parser<Token, unknown, ASTNode>
    = p.token(t => t.name === 'text' ? { kind: 'text', value: t.text, text: t.text } : undefined)

const escape_: p.Parser<Token, unknown, ASTNode>
    = p.token(t => t.name === 'escape' ? { kind: 'text', value: t.text.slice(1), text: t.text } : undefined)

const ident_: p.Parser<Token, unknown, ASTNode>
    = p.token(t => t.name === 'ident' ? { kind: 'ident', text: t.text, ...ident(t.text) } : undefined)

const call_: p.Parser<Token, Options, ASTNode>
    = p.abc(
        p.token((t, d) => {
            if (t.name !== 'call') return undefined
            d.options.__state.count_block += 1
            return t.text
        }),
        p.sepBy(
            p.recursive(() => p.many(program_)),
            literal(';')
        ),
        p.option(literal(']'), ''),
        (name, inside, end, data) => {
            data.options.__state.count_block -= 1
            return { kind: 'call', ...ident(name), arguments: inside } as ASTNode
        }
    )


const ue_tok_: p.Parser<Token, Options, ASTNode>
    = p.token((t, d) => {
        if (d.options.__state.count_block) return undefined
        if (!';]'.includes(t.name)) return undefined
        return { kind: 'text', value: t.text, text: t.text }
    })

const literal_ = p.map(
    p.many1(
        p.choice(
            escape_,
            text_,
            ue_tok_
        )
    ),
    (values) => values.reduce((perv, node) => {
        if (! perv) return;
        if (perv.kind === 'text' && node.kind === 'text') {
            perv.text += node.text;
            perv.value += node.value;
        }
        return perv
    }, values.shift())
)

const program_ =
    p.choice(
        literal_,
        call_,
        ident_,
    )

export function tryParse(input: string) {
    const { tokens, complete } = lex(input)
    return {
        tokens: tokens,
        tree: p.tryParse(p.many(program_), tokens, {
            __state: {
                count_block: 0
            }
        } as Options)
    }
}