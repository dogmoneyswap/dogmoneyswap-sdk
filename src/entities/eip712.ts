import { getMessage } from 'eip-712';
import { ethers } from 'ethers';
import { types, bentoTypes, name } from '../types';
import { BENTOBOX_ADDRESS, STOP_LIMIT_ORDER } from '../constants'
import { ChainId } from 'enums';

export interface Domain {
    name: string,
    chainId: ChainId,
    verifyingContract: string
}

export interface Message {
    maker: string,
    tokenIn: string,
    tokenOut: string,
    amountIn: string,
    amountOut: string,
    recipient: string,
    startTime: string,
    endTime: string,
    stopPrice: string,
    oracleAddress: string,
    oracleData: string
}

export interface BentoApprovalMessage {
    warning: string,
    user: string,
    masterContract: string,
    approved: boolean,
    nonce: number
}

export const getSignature = (message: Message, chainId: ChainId, privateKey: string) => {
    let domain: Domain = {
        name: name,
        chainId: chainId,
        verifyingContract: STOP_LIMIT_ORDER[chainId]
    }
    return sign({types, primaryType: "LimitOrder", domain, message}, privateKey);
}

export const getTypedData = (message: Message, chainId: ChainId) => {
    let domain: Domain = {
        name: name,
        chainId: chainId,
        verifyingContract: STOP_LIMIT_ORDER[chainId]
    }
    return { types, primaryType: "LimitOrder", domain, message };
}

export const getTypedDataBento = (message: BentoApprovalMessage, chainId: ChainId) => {
    let domain: Domain = {
        name: 'BentoBox V1',
        chainId: chainId,
        verifyingContract: BENTOBOX_ADDRESS[chainId]
    }
    return { types: bentoTypes, primaryType: "SetMasterContractApproval", domain, message };
}

export const getTypeHash = (typedData: any) => {
    let message = getMessage(typedData, true).toString('hex');
    return `0x${message}`;
}
  
const sign = (typedData: any, privateKey: string) => {
    let message = getMessage(typedData, true)
    const signingKey = new ethers.utils.SigningKey(privateKey);
    const { v, r, s } = signingKey.signDigest(message);
    return { v, r, s };
}

export const getSignatureWithProvider = async (message: Message, chainId: ChainId, provider: ethers.providers.Web3Provider):
Promise<{ v: number, r: string, s: string }> => {
    const typedData = getTypedData(message, chainId);
    const signature = await provider.send('eth_signTypedData_v4', [message.maker, JSON.stringify(typedData)]);
    const { v, r, s } = ethers.utils.splitSignature(signature);
    return { v, r, s };
}

export const getSignatureWithProviderBentobox = async (message: BentoApprovalMessage, chainId: ChainId, provider: ethers.providers.Web3Provider): 
Promise<{ v: number, r: string, s: string }> => {
    const typedData = getTypedDataBento(message, chainId);
    const signature = await provider.send('eth_signTypedData_v4', [message.user, JSON.stringify(typedData)]);
    const { v, r, s } = ethers.utils.splitSignature(signature);
    return { v, r, s };
}

export const getSignatureBento = async (bentoApproval: BentoApprovalMessage, chainId: ChainId, privateKey: string) => {
    let domain: Domain = {
        name: 'BentoBox V1',
        chainId: chainId,
        verifyingContract: BENTOBOX_ADDRESS[chainId]
    }
    return sign({types: bentoTypes, primaryType: "SetMasterContractApproval", domain, message: bentoApproval}, privateKey);
}