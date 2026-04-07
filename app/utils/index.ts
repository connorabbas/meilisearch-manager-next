import { twMerge } from 'tailwind-merge'

export const ptViewMerge = (
    globalPTProps = {} as any,
    selfPTProps = {} as any,
    datasets: any
) => {
    const { class: globalClass, ...globalRest } = globalPTProps
    const { class: selfClass, ...selfRest } = selfPTProps

    return {
        ...globalRest,
        ...selfRest,
        ...datasets,
        class: twMerge(globalClass, selfClass, datasets?.class),
    }
}

export const formatDate = (date: Date | string): string => {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}

export const formatBytes = (bytes: number): string => {
    if (!bytes || bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function maskedApiKey(
    key: string,
    visibleStart: number = 8,
    visibleEnd: number = 6
): string {
    if (!key || key.length <= visibleStart + visibleEnd) {
        return '******************'
    }
    const start = key.slice(0, visibleStart)
    const end = key.slice(-visibleEnd)

    return `${start}****${end}`
}

export function getStatusSeverity(status: string) {
    switch (status) {
    case 'succeeded':
        return 'success'
    case 'processing':
        return 'info'
    case 'enqueued':
        return 'secondary'
    case 'failed':
        return 'danger'
    case 'canceled':
        return 'warn'
    default:
        return 'secondary'
    }
}

export function looksLikeAnImageUrl(value: any) {
    if ('string' !== typeof value) {
        return false
    }
    if (!value.startsWith('http')) {
        return false
    }
    const url = new URL(value)
    const path = url.pathname.toLowerCase()

    const hasImageExtension =
        path.includes('.jpg') ||
        path.includes('.jpeg') ||
        path.includes('.gif') ||
        path.includes('.png') ||
        path.includes('.webp')

    const IMAGE_HOSTING_DOMAINS = [
        'i.imgur.com',
        'imgur.com',
        'i.redd.it',
        'pbs.twimg.com',
        'images.unsplash.com',
        'cdn.pixabay.com',
        'images.pexels.com',
        'storage.googleapis.com',
        'amazonaws.com',
        'cloudfront.net',
        'cdn.discordapp.com',
        'media.discordapp.net',
        'images.squarespace-cdn.com',
        'static.wixstatic.com',
        'framerusercontent.com',
        'imagedelivery.net',
        'res.cloudinary.com',
        'images.ctfassets.net'
    ]
    const isImageHost = IMAGE_HOSTING_DOMAINS.some(domain =>
        url.hostname === domain || url.hostname.endsWith(`.${domain}`)
    )

    return hasImageExtension || isImageHost
};

export function prefersDarkColorScheme() {
    if (window && window.matchMedia) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return false
}

export function readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()

        reader.onload = (event) => {
            if (event.target && typeof event.target.result === 'string') {
                resolve(event.target.result)
            } else {
                reject(new Error('Failed to read file as text.'))
            }
        }

        reader.onerror = (event) => {
            reject(event.target?.error || new Error('Failed to read file as text.'))
        }

        reader.readAsText(file)
    })
}
