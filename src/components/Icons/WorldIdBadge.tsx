import { classNames } from '@/lib/utils'
import Image, { ImageProps } from 'next/image'
import verifiedIcon from '@images/wid-badge.png'

type Props = Omit<ImageProps, 'src' | 'placeholder' | 'alt'> & { border?: string }

const WorldIdBadge = ({ border, ...props }: Props) => (
	<span className="flex items-center justify-center">
		{border && (
			<svg
				className={classNames(
					border,
					'absolute left-1/2 top-1/2 w-[34px] -mt-[2px] transform -translate-x-1/2 -translate-y-1/2'
				)}
				xmlns="http://www.w3.org/2000/svg"
				fill="currentColor"
				viewBox="0 0 26 26"
			>
				<path d="M8.382 2.244a6.938 6.938 0 0 1 9.236 0l1.626 1.451c.346.308.722.581 1.122.815l1.882 1.098a6.937 6.937 0 0 1 2.854 8.784l-.877 1.995c-.187.424-.33.866-.428 1.319l-.463 2.129a6.938 6.938 0 0 1-7.473 5.429l-2.168-.218a6.934 6.934 0 0 0-1.386 0l-2.168.218a6.938 6.938 0 0 1-7.473-5.429l-.463-2.13a6.937 6.937 0 0 0-.428-1.318l-.877-1.995a6.938 6.938 0 0 1 2.854-8.784L5.634 4.51c.4-.234.776-.507 1.122-.815l1.626-1.45Z" />
			</svg>
		)}
		<Image src={verifiedIcon} placeholder="blur" {...props} alt="Verified" />
	</span>
)

export default WorldIdBadge
