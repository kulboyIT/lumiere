import { Media, MediaSet, NftImage, Post } from '@/types/lens'

export const includesImage = (media: MediaSet[]): boolean => {
	return media.some(({ original: { mimeType } }) => mimeType.startsWith('image'))
}

export const getPostCover = (post: Post): string => {
	if (!post) return
	if (post.metadata.cover) return normalizeUrl(post.metadata.cover.original.url)
	if (includesImage(post.metadata.media)) return getImageUrl(post.metadata.media)
}

export const getImageUrl = (media: MediaSet[]): string => {
	const image = media.find(({ original: { mimeType } }) => mimeType.startsWith('image'))?.original

	if (!image) return
	return normalizeUrl(image.url, image.mimeType)
}

export const resolveImageUrl = (media: MediaSet | NftImage): string => {
	if (media?.__typename == 'NftImage') return normalizeUrl(media?.uri)

	return normalizeUrl(media?.original?.url)
}

export const getVideo = (media: MediaSet[]): Media | null => {
	if (!media) return
	const video = media.find(({ original: { mimeType } }) => mimeType.startsWith('video'))?.original

	if (!video) return
	return { ...video, url: normalizeUrl(video.url, video.mimeType) }
}

export const normalizeUrl = (url: string, mimeType?: string): string => {
	if (!url) return null
	const parsed = new URL(url)

	if (parsed.host === 'ipfs.infura.io') parsed.host = 'lens.infura-ipfs.io'
	if (parsed.protocol == 'ipfs:') {
		return `https://lens.infura-ipfs.io/ipfs/${parsed.hostname != '' ? parsed.hostname : parsed.pathname.slice(2)}`
	}

	return parsed.toString()
}
