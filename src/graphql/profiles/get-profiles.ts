import { gql } from '@apollo/client'

const GET_PROFILES = gql`
	query ($address: EthereumAddress!) {
		profiles(request: { ownedBy: [$address], limit: 5 }) {
			items {
				id
				isDefault
				handle
				name
				bio
				isDefault
				onChainIdentity {
					worldcoin {
						isHuman
					}
				}
				stats {
					totalFollowers
					totalPosts
				}
				followModule {
					... on FeeFollowModuleSettings {
						type
						amount {
							asset {
								name
								address
							}
							value
						}
						recipient
					}
					... on ProfileFollowModuleSettings {
						type
					}
					... on RevertFollowModuleSettings {
						type
					}
				}
				picture {
					__typename
					... on NftImage {
						contractAddress
						tokenId
						uri
						verified
					}
					... on MediaSet {
						original {
							url
							mimeType
						}
					}
				}
				coverPicture {
					__typename
					... on NftImage {
						contractAddress
						tokenId
						uri
						verified
					}
					... on MediaSet {
						original {
							url
							mimeType
						}
					}
				}
				attributes {
					key
					traitType
					value
				}
			}
		}
	}
`

export default GET_PROFILES
