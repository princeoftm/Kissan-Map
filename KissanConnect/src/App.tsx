import { useEffect, useState } from "react";
import React from 'react';
import ReactDOM from "react-dom";
import Arweave from "arweave";
import { createNft,mplTokenMetadata } from '@metaplex-foundation/mpl-token-metadata'
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { createGenericFile, createSignerFromKeypair, generateSigner, keypairIdentity, percentAmount, sol } from '@metaplex-foundation/umi';
import { mockStorage } from '@metaplex-foundation/umi-storage-mock';
import * as fs from 'fs';
import backgroundimage from "./pexels-kelly-1179532-2321837.jpg";
import { Outlet, Link } from "react-router-dom";

import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";
import Layout from "./pages/Layout";
import Home from "./pages/Home";
import Contact from "./pages/Contact";
import User from "./pages/user";
import { chainConfig } from "./pages/config/config.js";
import {
  Card,
  Typography,
  List,
  ListItem,
  ListItemPrefix,
  ListItemSuffix,
  Chip,
} from "@material-tailwind/react";
import {
  PresentationChartBarIcon,
  ShoppingBagIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  InboxIcon,
  PowerIcon,
} from "@heroicons/react/24/solid";
import {app} from "./pages/config/config.js";
// IMP START - Quick Start
import { Web3Auth, decodeToken } from "@web3auth/single-factor-auth";
import { ADAPTER_EVENTS, CHAIN_NAMESPACES, IProvider, WEB3AUTH_NETWORK } from "@web3auth/base";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import ImageUploading from 'react-images-uploading';
// IMP END - Quick Start
import Web3 from "web3";
import {
	SolanaPrivateKeyProvider,
	SolanaWallet,
} from '@web3auth/solana-provider';
import {
	Connection,
	Keypair,
	LAMPORTS_PER_SOL,
	PublicKey,
	SystemProgram,
	Transaction,
  clusterApiUrl,
} from '@solana/web3.js';

// Firebase libraries for custom authentication
import { initializeApp } from "firebase/app";
import { GoogleAuthProvider, getAuth, signInWithPopup, UserCredential } from "firebase/auth";

import "./App.css";

import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import NavDropdown from 'react-bootstrap/NavDropdown';
import { clientId } from "./pages/config/config.js";
import Checkout from "./pages/checkout";
import Blogs from "./pages/Addproduct";
import Cart from "./pages/Cart";
import { CartProvider } from "./pages/CartContext";
import { createMint, getOrCreateAssociatedTokenAccount, mintTo, setAuthority, transfer } from  "@solana/spl-token";
// IMP START - SDK Initialization
// IMP START - Dashboard Registration
// IMP END - Dashboard Registration

// IMP START - Verifier Creation
const verifier = "authenticator";
// IMP END - Verifier Creation



function Navbar() {
  return (
    <nav className="navbar">
      <ul className="navbar-links">
        <li><Link to="/">Home</Link></li>
        <li><Link to="/blogs">Add a product here</Link></li>
        <li><Link to="/contact">Contact</Link></li>
        <li><Link to="/user">User</Link></li>
      </ul>
    </nav>
  );
}
const privateKeyProvider = new SolanaPrivateKeyProvider({
  config: { chainConfig },
});

const web3auth = new Web3Auth({
  clientId, // Get your Client ID from Web3Auth Dashboard
  web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
  privateKeyProvider,
});

// IMP END - SDK Initialization

// IMP START - Auth Provider Login
// Your web app's Firebase configuration

// IMP END - Auth Provider Login
async function mintNFt(){
  const provider=web3auth.provider;
  const solanaWallet = new SolanaWallet(provider!);

  const accounts = await solanaWallet.requestAccounts();

  // Request connection configuration
  const connectionConfig: any = await solanaWallet.request({
    method: "solana_provider_config",
    params: [],
  });

  // Create a new connection using the RPC target from the config
  const connection = new Connection(connectionConfig.rpcTarget);

  // Fetch the balance for the first account (public key)
  const balance = await connection.getBalance(new PublicKey(accounts[0]));
  if (balance === 0) {
    throw new Error("Insufficient balance: Balance is zero");
  }

  // Proceed with NFT minting logic
  console.log("Minting NFT...");
  // Add your minting logic here
  const pubKey = await solanaWallet.requestAccounts();
  console.log("pubkey",pubKey);
  const { blockhash } = await connection.getLatestBlockhash("finalized");
  const TransactionInstruction = SystemProgram.transfer({
    fromPubkey: new PublicKey(pubKey[0]),
    toPubkey: new PublicKey(pubKey[0]),
    lamports: 0.01 * LAMPORTS_PER_SOL,
  });
  const transaction = new Transaction({
    recentBlockhash: blockhash,
    feePayer: new PublicKey(pubKey[0]),
  }).add(TransactionInstruction);
  
  const signedTx = await solanaWallet.signTransaction(transaction);
  console.log(signedTx);
}

function App() {
  const [provider, setProvider] = useState<IProvider | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [balance, setBalance] = useState(0);  // Add state for balance
  const [address,setAddress]=useState("");
  const [images, setImages] = React.useState([]);
  const [private_key,set_private_key]=useState("");

  // Firebase Initialisation
  const onChange = (imageList:any , addUpdateIndex:any ) => {
    // data for submit
    console.log(imageList, addUpdateIndex);
    setImages(imageList);
  };
    

  useEffect(() => {
    const init = async () => {
      try {
        await web3auth.init();
        setProvider(web3auth.provider);

        if (web3auth.status === ADAPTER_EVENTS.CONNECTED) {
          setLoggedIn(true);
        }
      } catch (error) {
        console.error(error);
      }
    };

    init();
  }, []);

  const signInWithGoogle = async (): Promise<UserCredential> => {
    try {
      const auth = getAuth(app);
      const googleProvider = new GoogleAuthProvider();
      const res = await signInWithPopup(auth, googleProvider);
      console.log(res);
      return res;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };


  const login = async () => {
    if (!web3auth) {
      return;
    }
    // login with firebase
    const loginRes = await signInWithGoogle();
    // get the id token from firebase
    const idToken = await loginRes.user.getIdToken(true);
    const { payload } = decodeToken(idToken);

    const web3authProvider = await web3auth.connect({
      verifier,
      verifierId: (payload as any).sub,
      idToken,
    });

    if (web3authProvider) {
      setLoggedIn(true);
      setProvider(web3authProvider);
    }
    await getBalance();
    await getAccounts();
  };
  const arweave = Arweave.init({
    host: 'arweave.net',
    port: 443,
    protocol: 'https',
  });

  const getUserInfo = async () => {
    const user = await web3auth.getUserInfo();
  };
  const getAccounts = async () => {
		if (!web3auth) {
			return;
		}
		const publicKey = await web3auth?.provider?.request({method: 'solanaPublicKey',});
    setAddress(String(publicKey));
    localStorage.setItem("address","0x"+String(publicKey));

  };

  const getBalance = async () => {
    if (!provider) {
			return;
		}
		const solanaWallet = new SolanaWallet(provider);
		// Get user's Solana public address
		const accounts = await solanaWallet.requestAccounts();

		const connectionConfig: any = await solanaWallet.request({
			method: 'solana_provider_config',
			params: [],
		});

		const connection = new Connection(connectionConfig.rpcTarget);

		// Fetch the balance for the specified public key
		const balance = await connection.getBalance(new PublicKey(accounts[0]));
    setBalance(balance/LAMPORTS_PER_SOL);
    localStorage.setItem("balance",String(balance));
  };
  const get_aidrop = async () => {
    if (!provider) {
      return;
    }
  
    const solanaWallet = new SolanaWallet(provider);
  
    // Get user's Solana public address
    const accounts = await solanaWallet.requestAccounts();
    const publicKey = accounts[0]; // Solana public key
  
    const connectionConfig: any = await solanaWallet.request({
      method: 'solana_provider_config',
      params: [],
    });
  
    const connection = new Connection(connectionConfig.rpcTarget);
  
    // Request an airdrop of 1 SOL (example value)
    const solValue = 1; // You can change this value to the desired airdrop amount
  
    try {
      const fromAirDropSignature = await connection.requestAirdrop(
        new PublicKey(publicKey), // User's public key
        solValue * LAMPORTS_PER_SOL // Convert SOL to lamports
      );
  
      await connection.confirmTransaction(fromAirDropSignature);
    } catch (error) {
      console.error('Airdrop failed', error);
    }
  };
  
  const logout = async () => {
    await web3auth.logout();
    setProvider(null);
    setLoggedIn(false);
  };




  const loggedInView = (
    <>
      <div className="flex-container">
        <div>
        <BrowserRouter>
      <Navbar />
      <CartProvider>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="blogs" element={<Blogs />} />
          <Route path="contact" element={<Contact />} />
          <Route path="user" element={<User />} />
          <Route path="/checkout" element={<Checkout />} />  {/* Checkout page */}
          <Route path="/cart" element={<Cart />} />  {/* Cart page */}

        </Route>
      </Routes>
      </CartProvider>
    </BrowserRouter>
        </div>
        <div>
        <div className="sidebar">
        <button onClick={logout} className="sidebar-item">Log Out</button>
        <button onClick={getUserInfo} className="sidebar-item">Get User Info</button>
        <button onClick={get_aidrop} className="sidebar-item">Get Airdrop</button>
        <div className="balance-container">
        <button onClick={getBalance} className="sidebar-item">Get Balance</button>
          {balance !== null && <span className="balance-display">Balance: {balance} SOL</span>}
        </div>
        <div className="balance-container">
        <button onClick={getAccounts} className="sidebar-item">Get Public Key</button>
          {balance !== null && <span className="balance-display">Address: {"0x"+address}</span>}
        </div>
        </div>
        </div>    
    </div>
    </>
  );

  const unloggedInView = (
    <body>
    <h1 className="center-text">KISK</h1>
    <button  onClick={login} className="card" id="login-btn">
      Login
    </button>
    </body>
  );

  return (
    <div className="container">
      <h1 className="title">
        <a target="_blank" rel="noreferrer">
        Kissanconnect
        </a>{" "}
      </h1>

      <div className="grid">{loggedIn ? loggedInView : unloggedInView}</div>

    </div>
  );
}
export { web3auth,mintNFt};
export default App;