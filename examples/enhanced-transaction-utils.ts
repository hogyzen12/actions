// enhanced-transaction-utils.ts

import {
  clusterApiUrl,
  Connection,
  PublicKey,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
  ComputeBudgetProgram,
  SystemProgram,
  LAMPORTS_PER_SOL
} from '@solana/web3.js';
import axios from 'axios';
import bs58 from 'bs58';

const environment = process.env.ENVIRONMENT || 'development';

export const connection = new Connection('https://damp-fabled-panorama.solana-mainnet.quiknode.pro/186133957d30cece76e7cd8b04bce0c5795c164e/');

const JITO_URL = "https://mainnet.block-engine.jito.wtf/api/v1/transactions";
const TIP_ACCOUNTS = [
  { address: "juLesoSmdTcRtzjCzYzRoHrnF8GhVu6KCV7uxq7nJGp", amount: 100_000 },
  { address: "DttWaMuVvTiduZRnguLF7jNxTgiMBZ1hyAumKUiL2KRL", amount: 100_000 },
];

async function sendTransactionJito(serializedTransaction: Uint8Array): Promise<string> {
  const encodedTx = bs58.encode(serializedTransaction);
  const payload = {
    jsonrpc: "2.0",
    id: 1,
    method: "sendTransaction",
    params: [encodedTx],
  };

  try {
    const response = await axios.post(JITO_URL, payload, {
      headers: { "Content-Type": "application/json" },
    });
    return response.data.result;
  } catch (error) {
    console.error("Error:", error);
    throw new Error("Cannot send transaction!");
  }
}

export async function prepareTransaction(
  instructions: TransactionInstruction[],
  payer: PublicKey
): Promise<VersionedTransaction> {
  const blockhash = await connection
    .getLatestBlockhash({ commitment: 'max' })
    .then((res) => res.blockhash);
  const messageV0 = new TransactionMessage({
    payerKey: payer,
    recentBlockhash: blockhash,
    instructions
  }).compileToV0Message();
  return new VersionedTransaction(messageV0);
}

export async function prepareJitoDonateTransaction(
  sender: PublicKey,
  recipient: PublicKey,
  lamports: number
): Promise<VersionedTransaction> {
  const blockhash = await connection.getLatestBlockhash();

  const config = {
    units: 1000,
    microLamports: 100_000,
  };

  const instructions = [
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: config.microLamports }),
    ComputeBudgetProgram.setComputeUnitLimit({ units: config.units }),
    SystemProgram.transfer({
      fromPubkey: sender,
      toPubkey: recipient,
      lamports: lamports,
    }),
    ...TIP_ACCOUNTS.map((tip) =>
      SystemProgram.transfer({
        fromPubkey: sender,
        toPubkey: new PublicKey(tip.address),
        lamports: tip.amount,
      })
    ),
  ];

  const messageV0 = new TransactionMessage({
    payerKey: sender,
    recentBlockhash: blockhash.blockhash,
    instructions,
  }).compileToV0Message();

  return new VersionedTransaction(messageV0);
}

export async function sendJitoTransaction(transaction: VersionedTransaction): Promise<string> {
  const rawTransaction = transaction.serialize();
  return await sendTransactionJito(rawTransaction);
}