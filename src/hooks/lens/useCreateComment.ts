import { ethers } from 'ethers'
import { omit } from '@/lib/utils'
import { useCallback } from 'react'
import toast from 'react-hot-toast'
import { toastOn } from '@/lib/toasts'
import { uploadJSON } from '@/lib/ipfs'
import { Metadata } from '@/types/metadata'
import { useMutation } from '@apollo/client'
import useWaitForAction from './useWaitForAction'
import LensHubProxy from '@/abis/LensHubProxy.json'
import { useProfile } from '@/context/ProfileContext'
import BROADCAST_MUTATION from '@/graphql/broadcast/broadcast'
import { ERROR_MESSAGE, LENSHUB_PROXY, RELAYER_ON } from '@/lib/consts'
import CREATE_COMMENT_SIG from '@/graphql/publications/create-comment-request'
import { useAccount, useContractWrite, useNetwork, useSignTypedData } from 'wagmi'
import { Mutation, MutationCreateCommentTypedDataArgs, RelayerResult } from '@/types/lens'

type CreateComment = {
	createComment: (comment: Metadata) => Promise<() => Promise<unknown>>
	loading: boolean
	error?: Error
}
type CreateCommentOptions = { onSuccess?: () => void; onIndex?: () => void }

const useCreateComment = (publicationId: number, { onSuccess, onIndex }: CreateCommentOptions = {}): CreateComment => {
	const { chain } = useNetwork()
	const { profile } = useProfile()
	const { isConnected } = useAccount()

	//#region Data Hooks
	const [getTypedData, { loading: dataLoading, error: dataError }] = useMutation<
		{
			createCommentTypedData: Mutation['createCommentTypedData']
		},
		MutationCreateCommentTypedDataArgs
	>(CREATE_COMMENT_SIG, {
		onError: error => toast.error(error.message ?? ERROR_MESSAGE),
	})
	const {
		signTypedDataAsync: signRequest,
		isLoading: sigLoading,
		error: sigError,
	} = useSignTypedData({
		onError: error => {
			toast.error(error.message ?? ERROR_MESSAGE)
		},
	})
	const {
		data: txData,
		writeAsync: sendTx,
		isLoading: txLoading,
		error: txError,
	} = useContractWrite({
		mode: 'recklesslyUnprepared',
		addressOrName: LENSHUB_PROXY,
		contractInterface: LensHubProxy,
		functionName: 'commentWithSig',
		onError: (error: any) => {
			toast.error(error?.data?.message ?? error?.message)
		},
		onSuccess: () => {
			onSuccess && onSuccess()
		},
	})
	const [broadcast, { data: broadcastResult, loading: gasslessLoading, error: gasslessError }] = useMutation<{
		broadcast: Mutation['broadcast']
	}>(BROADCAST_MUTATION, {
		onCompleted({ broadcast }) {
			if ('reason' in broadcast) return toast.error(broadcast.reason)

			onSuccess && onSuccess()
		},
		onError() {
			toast.error(ERROR_MESSAGE)
		},
	})
	//#endregion

	const { resolveOnAction } = useWaitForAction({
		onParse: onIndex,
		txHash: txData?.hash,
		txId: (broadcastResult?.broadcast as RelayerResult)?.txId as string,
	})

	const createComment = useCallback(
		async (post: Metadata) => {
			if (!isConnected) throw toast.error('Please connect your wallet first.')
			if (chain?.unsupported) throw toast.error('Please change your network.')
			if (!profile?.id) throw toast.error('Please create a Lens profile first.')

			const { id, typedData } = await toastOn(
				async () => {
					const ipfsCID = await uploadJSON(post)

					const {
						data: { createCommentTypedData },
					} = await getTypedData({
						variables: {
							request: {
								publicationId,
								profileId: profile.id,
								contentURI: `ipfs://${ipfsCID}`,
								collectModule: {
									freeCollectModule: {
										followerOnly: false,
									},
								},
								referenceModule: {
									followerOnlyReferenceModule: false,
								},
							},
						},
					})

					return createCommentTypedData
				},
				{
					loading: 'Getting signature details...',
					success: 'Signature is ready!',
					error: 'Something went wrong! Please try again later',
				}
			)

			const {
				profileId,
				contentURI,
				profileIdPointed,
				pubIdPointed,
				referenceModuleData,
				collectModule,
				collectModuleInitData,
				referenceModule,
				referenceModuleInitData,
				deadline,
			} = typedData.value

			const signature = await signRequest({
				domain: omit(typedData?.domain, '__typename'),
				types: omit(typedData?.types, '__typename'),
				value: omit(typedData?.value, '__typename'),
			})

			const { v, r, s } = ethers.utils.splitSignature(signature)

			if (RELAYER_ON) {
				const result = await toastOn(
					async () => {
						const {
							data: { broadcast: result },
						} = await broadcast({
							variables: {
								request: { id, signature },
							},
						})

						if ('reason' in result) throw result.reason

						return result
					},
					{ loading: 'Sending transaction...', success: 'Transaction sent!', error: ERROR_MESSAGE }
				)

				return resolveOnAction({ txId: result.txId })
			}

			const tx = await toastOn(
				() =>
					sendTx({
						recklesslySetUnpreparedArgs: {
							profileId,
							contentURI,
							profileIdPointed,
							pubIdPointed,
							referenceModuleData,
							collectModule,
							collectModuleInitData,
							referenceModule,
							referenceModuleInitData,
							sig: { v, r, s, deadline },
						},
					}),
				{ loading: 'Sending transaction...', success: 'Transaction sent!', error: ERROR_MESSAGE }
			)

			return resolveOnAction({ txHash: tx.hash })
		},
		[
			publicationId,
			isConnected,
			chain?.unsupported,
			profile?.id,
			getTypedData,
			signRequest,
			broadcast,
			sendTx,
			resolveOnAction,
		]
	)

	return {
		createComment,
		loading: dataLoading || sigLoading || txLoading || gasslessLoading,
		error: dataError || sigError || txError || gasslessError,
	}
}

export default useCreateComment
