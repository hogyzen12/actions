import {
  clusterApiUrl, Connection,
  PublicKey,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction
} from '@solana/web3.js';

const environment = process.env.ENVIRONMENT || 'development';

const rpcUrl =
  environment === 'production'
    ? process.env.RPC_URL || clusterApiUrl('https://damp-fabled-panorama.solana-mainnet.quiknode.pro/186133957d30cece76e7cd8b04bce0c5795c164e/')
    : process.env.RPC_URL || clusterApiUrl('devnet');

export const connection = new Connection(rpcUrl);

export async function prepareTransaction(
  instructions: TransactionInstruction[],
  payer: PublicKey
) {
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