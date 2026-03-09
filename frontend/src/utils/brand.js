export function getBrandDetails(name, type = 'bank') {
    if (!name) return { color: '#E2E8F0', text: '#475569', initial: '?' }

    const norm = name.toLowerCase().trim()

    if (type === 'bank' || type === 'card') {
        const brands = [
            { keys: ['nubank', 'nu'], color: '#8A05BE', text: '#FFFFFF', initial: 'Nu' },
            { keys: ['itaú', 'itau'], color: '#EC7000', text: '#FFFFFF', initial: 'it' },
            { keys: ['bradesco'], color: '#CC092F', text: '#FFFFFF', initial: 'br' },
            { keys: ['santander'], color: '#EC0000', text: '#FFFFFF', initial: 'st' },
            { keys: ['banco do brasil', 'bb'], color: '#FDEF14', text: '#0038A8', initial: 'bb' },
            { keys: ['caixa'], color: '#005CA9', text: '#F08B1D', initial: 'cx' },
            { keys: ['c6', 'c6 bank'], color: '#242424', text: '#FFFFFF', initial: 'c6' },
            { keys: ['inter', 'banco inter'], color: '#FF7A00', text: '#FFFFFF', initial: 'in' },
            { keys: ['xp', 'xp investimentos'], color: '#1B1C1D', text: '#FFD700', initial: 'XP' },
            { keys: ['btg', 'btg pactual'], color: '#002753', text: '#FFFFFF', initial: 'bt' },
            { keys: ['mercado pago', 'ml', 'mercado livre'], color: '#009EE3', text: '#FFFFFF', initial: 'mp' },
            { keys: ['picpay'], color: '#11C76F', text: '#FFFFFF', initial: 'pp' },
            { keys: ['pagbank', 'pagseguro'], color: '#11B072', text: '#FFFFFF', initial: 'pg' },
            { keys: ['neon'], color: '#00E4A1', text: '#000000', initial: 'ne' },
            { keys: ['next'], color: '#00FF5F', text: '#000000', initial: 'nx' },
            { keys: ['sicredi'], color: '#00A859', text: '#FFFFFF', initial: 'si' },
            { keys: ['sicoob'], color: '#003641', text: '#00C389', initial: 'sc' },
            { keys: ['pan', 'banco pan'], color: '#00A1FC', text: '#FFFFFF', initial: 'pn' },
            { keys: ['digio'], color: '#001D4A', text: '#FFFFFF', initial: 'dg' },
            { keys: ['bv', 'banco bv'], color: '#FF0000', text: '#FFFFFF', initial: 'bv' },
            { keys: ['original'], color: '#00D749', text: '#000000', initial: 'og' },
            { keys: ['safra'], color: '#001A3B', text: '#D4AF37', initial: 'sf' },
        ]

        for (const brand of brands) {
            if (brand.keys.some(k => norm.includes(k))) {
                return { color: brand.color, text: brand.text, initial: brand.initial, isKnown: true }
            }
        }
    }

    // Fallback for tags/unrecognized names: generate a stable deterministic color
    let hash = 0
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }

    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase()
    const hex = '#' + '00000'.substring(0, 6 - c.length) + c

    // Simple contrast logic to determine text color (black vs white)
    const r = parseInt(hex.substr(1, 2), 16)
    const g = parseInt(hex.substr(3, 2), 16)
    const b = parseInt(hex.substr(5, 2), 16)
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000
    const textColor = (yiq >= 128) ? '#1E293B' : '#FFFFFF'

    return { color: hex, text: textColor, initial: name.substring(0, 2).toUpperCase(), isKnown: false }
}
