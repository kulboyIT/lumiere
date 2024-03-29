import Cookies from 'js-cookie'
import { useEffect } from 'react'
import toast from 'react-hot-toast'
import { toastOn } from '@/lib/toasts'
import { COOKIE_CONFIG } from '@/lib/apollo'
import { useProfile } from '@/context/ProfileContext'
import CHALLENGE_QUERY from '@/graphql/auth/challenge'
import { useLazyQuery, useMutation } from '@apollo/client'
import AUTHENTICATE_QUERY from '@/graphql/auth/authenticate'
import { useAccount, useDisconnect, useSignMessage } from 'wagmi'

const useLogin = (): {
	login: () => Promise<{ accessToken: string; refreshToken: string }>
	logout: () => Promise<void>
	isAuthenticated: boolean
	loading: boolean
	error?: Error
} => {
	const { address } = useAccount()
	const { disconnect } = useDisconnect()
	const { isAuthenticated, setAuthenticated } = useProfile()
	const [loadChallenge, { error: errorChallenge, loading: challengeLoading }] = useLazyQuery(CHALLENGE_QUERY, {
		fetchPolicy: 'no-cache',
	})
	const [authenticate, { error: errorAuthenticate, loading: authLoading }] = useMutation(AUTHENTICATE_QUERY)
	const { signMessageAsync: signMessage, isLoading: signLoading, error: errorSign } = useSignMessage()

	const login = async (): Promise<{ accessToken: string; refreshToken: string }> => {
		if (Cookies.get('accessToken') && Cookies.get('refreshToken')) {
			return { accessToken: Cookies.get('accessToken'), refreshToken: Cookies.get('refreshToken') }
		}

		const {
			data: {
				challenge: { text: challenge },
			},
		} = await loadChallenge({ variables: { address } })

		const signature = await signMessage({ message: challenge })
		return toastOn<{ accessToken: string; refreshToken: string }>(
			async () => {
				const {
					data: { authenticate: tokens },
				} = await authenticate({ variables: { address, signature } })

				Cookies.set('accessToken', tokens.accessToken, COOKIE_CONFIG)
				Cookies.set('refreshToken', tokens.refreshToken, COOKIE_CONFIG)
				setAuthenticated(true)

				return tokens
			},
			{ loading: 'Authenticating...', success: 'Signed in!', error: 'Something went wrong! Please try again.' }
		)
	}

	const logout = async () => {
		Cookies.remove('accessToken', COOKIE_CONFIG)
		Cookies.remove('refreshToken', COOKIE_CONFIG)
		setAuthenticated(false)
		toast.success('Logged out!')

		return disconnect()
	}

	useEffect(() => {
		if (!Cookies.get('accessToken') || (!Cookies.get('refreshToken') && address)) return

		setAuthenticated(true)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	return {
		login,
		logout,
		isAuthenticated,
		loading: challengeLoading || signLoading || authLoading,
		error: errorChallenge || errorSign || errorAuthenticate,
	}
}

export default useLogin
