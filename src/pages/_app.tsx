import 'tailwindcss/tailwind.css'
import client from '@/lib/apollo'
import '@rainbow-me/rainbowkit/styles.css'
import { ApolloProvider } from '@apollo/client'
import 'react-loading-skeleton/dist/skeleton.css'
import { APP_NAME, IS_MAINNET } from '@/lib/consts'
import { SkeletonTheme } from 'react-loading-skeleton'
import { chain, createClient, WagmiConfig } from 'wagmi'
import { ProfileProvider } from '@/context/ProfileContext'
import { apiProvider, configureChains, getDefaultWallets, RainbowKitProvider } from '@rainbow-me/rainbowkit'

const { chains, provider } = configureChains(
	[IS_MAINNET ? chain.polygon : chain.polygonMumbai],
	[apiProvider.infura(process.env.NEXT_PUBLIC_INFURA_ID), apiProvider.fallback()]
)

const { connectors } = getDefaultWallets({ appName: APP_NAME, chains })
const wagmiClient = createClient({ autoConnect: true, connectors, provider })

const App = ({ Component, pageProps }) => {
	return (
		<WagmiConfig client={wagmiClient}>
			<RainbowKitProvider chains={chains}>
				<ApolloProvider client={client}>
					<SkeletonTheme baseColor="#00000010" highlightColor="#00000040" width={100}>
						<ProfileProvider>
							<Component {...pageProps} />
						</ProfileProvider>
					</SkeletonTheme>
				</ApolloProvider>
			</RainbowKitProvider>
		</WagmiConfig>
	)
}

export default App