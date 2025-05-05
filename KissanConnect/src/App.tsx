import { useEffect, useState } from "react";
import React from 'react';
import ReactDOM from "react-dom";
import Arweave from "arweave";
import { createNft, mplTokenMetadata } from '@metaplex-foundation/mpl-token-metadata';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { createGenericFile, createSignerFromKeypair, generateSigner, keypairIdentity, percentAmount, sol } from '@metaplex-foundation/umi';
import { mockStorage } from '@metaplex-foundation/umi-storage-mock';
import * as fs from 'fs';
import backgroundImage from "./pexels-kelly-1179532-2321837.jpg"; // Replace with your rural India image
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
import Verify from "./pages/verify"; // Import the new Verify component
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
import { app } from "./pages/config/config.js";
import { Web3Auth, decodeToken } from "@web3auth/single-factor-auth";
import { ADAPTER_EVENTS, CHAIN_NAMESPACES, IProvider, WEB3AUTH_NETWORK } from "@web3auth/base";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import ImageUploading from 'react-images-uploading';
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
import { createMint, getOrCreateAssociatedTokenAccount, mintTo, setAuthority, transfer } from "@solana/spl-token";

function Navbar() {
  const [linkHover, setLinkHover] = useState<{ [key: string]: boolean }>({});

  return (
    <nav style={{
      background: '#4a704a',
      padding: '0.75rem 1rem',
      borderBottom: '1px solid #6b8e6b'
    }}>
      <ul style={{
        display: 'flex',
        listStyle: 'none',
        margin: 0,
        padding: 0,
        gap: '1.5rem'
      }}>
        {['Home', 'verify', 'blogs', 'contact', 'user'].map((path) => (
          <li key={path}>
            <Link
              to={path === 'Home' ? '/' : `/${path}`}
              onMouseEnter={() => setLinkHover(prev => ({ ...prev, [path]: true }))}
              onMouseLeave={() => setLinkHover(prev => ({ ...prev, [path]: false }))}
              style={{
                color: '#e8f5e8',
                textDecoration: 'none',
                fontSize: '1rem',
                fontWeight: '500',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                transition: 'all 0.2s',
                ...(linkHover[path] && { background: '#6b8e6b', color: '#fff' })
              }}
            >
              {path === 'blogs' ? 'Help' : path.charAt(0).toUpperCase() + path.slice(1)}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

const privateKeyProvider = new SolanaPrivateKeyProvider({
  config: { chainConfig },
});

const web3auth = new Web3Auth({
  clientId,
  web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
  privateKeyProvider,
});

const verifier = "authenticator";

async function mintNFt(hash?: string): Promise<string> {
  const provider = web3auth.provider as IProvider;
  const solanaWallet = new SolanaWallet(provider);
  const accounts = await solanaWallet.requestAccounts();
  const connectionConfig: any = await solanaWallet.request({
    method: "solana_provider_config",
    params: [],
  });
  const connection = new Connection(connectionConfig.rpcTarget as string);
  const balance = await connection.getBalance(new PublicKey(accounts[0]));
  if (balance === 0) {
    throw new Error("Insufficient balance: Balance is zero");
  }
  console.log("Minting NFT with hash:", hash || "No hash provided");
  const pubKey = await solanaWallet.requestAccounts();
  console.log("pubkey", pubKey);
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
  if (hash) {
    const memoInstruction = {
      keys: [],
      programId: new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"),
      data: Buffer.from(hash, "utf8")
    };
    transaction.add(memoInstruction);
  }
  const signedTx = await solanaWallet.signTransaction(transaction);
  const txSignature = await connection.sendRawTransaction(signedTx.serialize());
  await connection.confirmTransaction(txSignature, "confirmed");
  console.log("Transaction signature:", txSignature);
  return txSignature;
}

function App() {
  const [provider, setProvider] = useState<IProvider | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [balance, setBalance] = useState(0);
  const [address, setAddress] = useState("");
  const [images, setImages] = useState<any[]>([]);
  const [private_key, set_private_key] = useState("");
  const [buttonHover, setButtonHover] = useState<{ [key: string]: boolean }>({});

  const onChange = (imageList: any[], addUpdateIndex: number | undefined) => {
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
    const loginRes = await signInWithGoogle();
    const idToken = await loginRes.user.getIdToken(true);
    const { payload } = decodeToken(idToken) as { payload: { sub: string } };
    const web3authProvider = await web3auth.connect({
      verifier,
      verifierId: payload.sub,
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
    if (!web3auth || !web3auth.provider) {
      return;
    }
    const publicKey = await web3auth.provider.request({ method: 'solanaPublicKey' });
    setAddress(String(publicKey));
    localStorage.setItem("address", "0x" + String(publicKey));
  };

  const getBalance = async () => {
    if (!provider) {
      return;
    }
    const solanaWallet = new SolanaWallet(provider);
    const accounts = await solanaWallet.requestAccounts();
    const connectionConfig: any = await solanaWallet.request({
      method: 'solana_provider_config',
      params: [],
    });
    const connection = new Connection(connectionConfig.rpcTarget as string);
    const balance = await connection.getBalance(new PublicKey(accounts[0]));
    setBalance(balance / LAMPORTS_PER_SOL);
    localStorage.setItem("balance", String(balance));
  };

  const get_aidrop = async () => {
    if (!provider) {
      return;
    }
    const solanaWallet = new SolanaWallet(provider);
    const accounts = await solanaWallet.requestAccounts();
    const publicKey = accounts[0];
    const connectionConfig: any = await solanaWallet.request({
      method: 'solana_provider_config',
      params: [],
    });
    const connection = new Connection(connectionConfig.rpcTarget as string);
    const solValue = 1;
    try {
      const fromAirDropSignature = await connection.requestAirdrop(
        new PublicKey(publicKey),
        solValue * LAMPORTS_PER_SOL
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

  const buttonBaseStyle = {
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    border: 'none',
    background: '#6b8e6b',
    color: 'white',
    fontSize: '0.875rem',
    fontWeight: '500' as const,
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    width: '100%',
    textAlign: 'center' as const
  };

  const buttonHoverStyle = {
    background: '#558855',
    boxShadow: '0 4px 8px rgba(0,0,0,0.15)'
  };

  const loggedInView = (
    <>
      <div style={{ minHeight: 'calc(100vh - 6rem)' }}>
        <div style={{
          background: '#3e5a3e',
          padding: '1rem',
          display: 'flex',
          alignItems: 'center',
          borderBottom: '1px solid #a3bffa'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            background: '#6b8e6b',
            borderRadius: '50%',
            marginRight: '1rem'
          }} />
          <h1 style={{
            fontSize: '1.75rem',
            fontWeight: '700',
            color: '#e8f5e8',
            margin: 0
          }}>
            KissanMap
          </h1>
        </div>
        <div style={{ display: 'flex', minHeight: 'calc(100vh - 6rem)' }}>
          <div style={{ flex: 1, padding: '2rem' }}>
            <BrowserRouter>
              <Navbar />
              <CartProvider>
                <Routes>
                  <Route path="/" element={<Layout />}>
                    <Route index element={<Home />} />
                    <Route path="verify" element={<Verify />} /> {/* New route for verify */}
                    <Route path="blogs" element={<Blogs />} />
                    <Route path="contact" element={<Contact />} />
                    <Route path="user" element={<User />} />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/cart" element={<Cart />} />
                  </Route>
                </Routes>
              </CartProvider>
            </BrowserRouter>
          </div>
          <div style={{ width: '250px', background: '#4a704a', color: '#e8f5e8', padding: '1rem', boxShadow: '-2px 0 5px rgba(0,0,0,0.2)' }}>
            <button
              onClick={logout}
              onMouseEnter={() => setButtonHover(prev => ({ ...prev, logout: true }))}
              onMouseLeave={() => setButtonHover(prev => ({ ...prev, logout: false }))}
              style={{
                ...buttonBaseStyle,
                ...(buttonHover.logout ? buttonHoverStyle : {})
              }}
            >
              Log Out
            </button>
            <button
              onClick={get_aidrop}
              onMouseEnter={() => setButtonHover(prev => ({ ...prev, airdrop: true }))}
              onMouseLeave={() => setButtonHover(prev => ({ ...prev, airdrop: false }))}
              style={{
                ...buttonBaseStyle,
                marginTop: '0.75rem',
                ...(buttonHover.airdrop ? buttonHoverStyle : {})
              }}
            >
              Get Airdrop
            </button>
            <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button
                onClick={getBalance}
                onMouseEnter={() => setButtonHover(prev => ({ ...prev, balance: true }))}
                onMouseLeave={() => setButtonHover(prev => ({ ...prev, balance: false }))}
                style={{
                  ...buttonBaseStyle,
                  ...(buttonHover.balance ? buttonHoverStyle : {})
                }}
              >
                Get Balance
              </button>
              {balance !== null && (
                <span style={{
                  fontSize: '0.875rem',
                  color: '#2f4f2f',
                  textAlign: 'center' as const,
                  padding: '0.5rem',
                  background: '#e8f5e8',
                  borderRadius: '8px',
                  display: 'block',
                  marginTop: '0.5rem'
                }}>
                  Balance: {balance} SOL
                </span>
              )}
            </div>
            <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button
                onClick={getAccounts}
                onMouseEnter={() => setButtonHover(prev => ({ ...prev, accounts: true }))}
                onMouseLeave={() => setButtonHover(prev => ({ ...prev, accounts: false }))}
                style={{
                  ...buttonBaseStyle,
                  ...(buttonHover.accounts ? buttonHoverStyle : {})
                }}
              >
                Get Public Key
              </button>
              {address && (
                <span style={{
                  fontSize: '0.875rem',
                  color: '#2f4f2f',
                  textAlign: 'center' as const,
                  padding: '0.5rem',
                  background: '#e8f5e8',
                  borderRadius: '8px',
                  display: 'block',
                  marginTop: '0.5rem',
                  wordBreak: 'break-all'
                }}>
                  Address: 0x{address}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );

  const unloggedInView = (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #c6e2c6,rgb(163, 250, 206))',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      position: 'relative'
    }}>
      <div style={{
        maxWidth: '1200px',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        overflow: 'hidden',
        height: '70vh'
      }}>
        <div style={{
          width: '50%',
          padding: '2rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '1.5rem', color: '#6b8e6b', marginBottom: '1rem' }}>KissanMap</span>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: '700',
            color: '#2f4f2f',
            marginBottom: '1rem',
            textAlign: 'center' as const
          }}>
            Welcome to KissanMap,<br />a land platform for rural India.
          </h1>
          <button
            onClick={login}
            id="login-btn"
            onMouseEnter={() => setButtonHover(prev => ({ ...prev, login: true }))}
            onMouseLeave={() => setButtonHover(prev => ({ ...prev, login: false }))}
            style={{
              ...buttonBaseStyle,
              padding: '1rem 2rem',
              fontSize: '1.25rem',
              ...(buttonHover.login ? buttonHoverStyle : {})
            }}
          >
            Login
          </button>
        </div>
        <div style={{
          width: '50%',
          height: '100%',
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative'
        }} />
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #c6e2c6, #a3bffa)' }}>
      {loggedIn ? loggedInView : unloggedInView}
    </div>
  );
}

export { web3auth, mintNFt };
export default App;