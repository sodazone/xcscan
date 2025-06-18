import { decodeFunctionData } from "viem";

const abi = [
	{
		anonymous: false,
		inputs: [
			{ indexed: false, internalType: "uint8", name: "version", type: "uint8" },
		],
		name: "Initialized",
		type: "event",
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: "address",
				name: "previousOwner",
				type: "address",
			},
			{
				indexed: true,
				internalType: "address",
				name: "newOwner",
				type: "address",
			},
		],
		name: "OwnershipTransferred",
		type: "event",
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: false,
				internalType: "address",
				name: "account",
				type: "address",
			},
		],
		name: "Paused",
		type: "event",
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: false,
				internalType: "address",
				name: "account",
				type: "address",
			},
		],
		name: "Unpaused",
		type: "event",
	},
	{
		inputs: [
			{ internalType: "address", name: "_assetAddress", type: "address" },
		],
		name: "getCurrencyIdByAssetAddress",
		outputs: [{ internalType: "bytes2", name: "", type: "bytes2" }],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [
			{ internalType: "address", name: "_assetAddress", type: "address" },
			{ internalType: "uint256", name: "_vAssetAmount", type: "uint256" },
		],
		name: "getTokenByVToken",
		outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [
			{ internalType: "address", name: "_assetAddress", type: "address" },
			{ internalType: "uint256", name: "_assetAmount", type: "uint256" },
		],
		name: "getVTokenByToken",
		outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [
			{ internalType: "address", name: "_SlxAddress", type: "address" },
			{ internalType: "address", name: "_SovereignAddress", type: "address" },
		],
		name: "initialize",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [],
		name: "owner",
		outputs: [{ internalType: "address", name: "", type: "address" }],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [],
		name: "pause",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [],
		name: "paused",
		outputs: [{ internalType: "bool", name: "", type: "bool" }],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [],
		name: "rateInfo",
		outputs: [
			{ internalType: "uint8", name: "mintRate", type: "uint8" },
			{ internalType: "uint8", name: "redeemRate", type: "uint8" },
		],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [],
		name: "renounceOwnership",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [
			{ internalType: "uint8", name: "_mintRate", type: "uint8" },
			{ internalType: "uint8", name: "_redeemRate", type: "uint8" },
		],
		name: "setRate",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [
			{ internalType: "bytes2", name: "_currencyId", type: "bytes2" },
			{ internalType: "uint256", name: "_assetAmount", type: "uint256" },
			{ internalType: "uint256", name: "_vAssetAmount", type: "uint256" },
		],
		name: "setTokenAmount",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [],
		name: "slxAddress",
		outputs: [{ internalType: "address", name: "", type: "address" }],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [],
		name: "sovereignAddress",
		outputs: [{ internalType: "address", name: "", type: "address" }],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [{ internalType: "bytes2", name: "", type: "bytes2" }],
		name: "tokenPool",
		outputs: [
			{ internalType: "uint256", name: "assetAmount", type: "uint256" },
			{ internalType: "uint256", name: "vAssetAmount", type: "uint256" },
		],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [{ internalType: "address", name: "newOwner", type: "address" }],
		name: "transferOwnership",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [],
		name: "unpause",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
];

const currencies = {
	"0x0001": {
		symbol: "BNC",
		mill: 1_000_000_000_000n,
	},
	"0x0800": {
		symbol: "xcDOT",
		mill: 10_000_000_000n,
	},
	"0x0801": {
		symbol: "GLMR",
		mill: 5_000_000_000_000_000_000n,
	},
	"0x0803": {
		symbol: "ASTR",
		mill: 5_000_000_000_000_000_000n,
	},
	"0x0804": {
		symbol: "FIL",
		mill: 1_000_000_000_000_000_000n,
	},
	"0x0808": {
		symbol: "MANTA",
		mill: 1_000_000_000_000_000_000n,
	},
	"0x0900": {
		symbol: "vDOT",
		mill: 8_000_000_000n,
	},
	"0x0901": {
		symbol: "vGLMR",
		mill: 4_000_000_000_000_000_000n,
	},
	"0x0903": {
		symbol: "vASTR",
		mill: 4_000_000_000_000_000_000n,
	},
	"0x0904": {
		symbol: "vFIL",
		mill: 800_000_000_000_000_000n,
	},
	"0x0908": {
		symbol: "vMANTA",
		mill: 1_000_000_000_000_000_000n,
	},
};

export function decodeXcmOracleData(data) {
	const { functionName, args } = decodeFunctionData({
		abi,
		data,
	});

	if (functionName === "setTokenAmount") {
		const currencyId = args[0];
		console.log(args);
		const currency = currencies[currencyId];
		const vCurrency = currencies[currencyId.replace("0x08", "0x09")];
		const amount = args[1] / currency.mill;
		const vAmount = args[2] / vCurrency.mill;

		return `<div class="flex flex-col space-y-1">
              <span>${functionName}</span>
              <span>${currency.symbol}:${vCurrency.symbol}</span>
              <span>${amount}:${vAmount}</span>
              </div>`;
	}
	return `<div>${functionName} ${JSON.stringify(args)}</div>`;
}
