import { Component, OnInit } from '@angular/core';
import * as EthereumWallet from "../../node_modules/ethereumjs-wallet";
import * as EthereumUtil from "../../node_modules/ethereumjs-util";
import * as EthereumTx from "../../node_modules/ethereumjs-tx";
import * as Hdkey from "../../node_modules/ethereumjs-wallet/hdkey";
import TransportU2F from "@ledgerhq/hw-transport-u2f";
import AppBtc from "@ledgerhq/hw-app-btc";
import AppEth from "@ledgerhq/hw-app-eth";
import * as BIP39 from "../../node_modules/bip39";
import * as Web3 from "../../node_modules/web3";
import * as contractABI from "../../node_modules/human-standard-token-abi";
import {Buffer} from 'buffer';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit{

  web3;

  ledgerAddrList = [];

  ETHAddrListByL = [];
  ETHAddrListByM = [];
  ETHMnemonics: string;

  inputPrivKey: string = '';
  ETHAddrByPrivKey: string = '';

  inputAddrForGetBalance: string = '';
  ETHBalance: number = 0;

  promisify(inner) {
    return new Promise((resolve, reject) =>
      inner((err, res) => {
        if (err) {
          reject(err);
        } else {
          resolve(res);
        }
      })
    );;
  }
  async getETHBalance() {
    var wei, balance
    wei = this.promisify(cb => this.web3.eth.getBalance(this.inputAddrForGetBalance, cb))
    try {
      this.ETHBalance = this.web3.fromWei(await wei, 'ether')
    } catch (error) {
      console.log("getETHBalance", error);
    }
  }

  ERC20 = {
    tokenContract: null,
    balance: null,
    decimals: null,
    symbol: null,
    name: null,
    adjustedBalance: null
  };
  inputAddrForGetERC20Balance: string = '';
  inputContractAddrForGetERC20Balance: string = '';

  async getERC20Balance() {
    this.ERC20.tokenContract = this.web3.eth.contract(contractABI).at(this.inputContractAddrForGetERC20Balance);
    console.log("this.ERC20.tokenContract", this.ERC20.tokenContract);

    this.ERC20.decimals = await this.promisify(cb => this.ERC20.tokenContract.decimals(cb))
    this.ERC20.balance = await this.promisify(cb => this.ERC20.tokenContract.balanceOf(this.inputAddrForGetERC20Balance, cb))
    this.ERC20.name = await this.promisify(cb => this.ERC20.tokenContract.name(cb))
    this.ERC20.symbol = await this.promisify(cb => this.ERC20.tokenContract.symbol(cb))

    try {
      this.ERC20.adjustedBalance = Math.round(this.ERC20.balance / Math.pow(10, this.ERC20.decimals)).toFixed(18);
      console.log("ERC20", this.ERC20);
    } catch (error) {
      console.log("getERC20Balance", error);
    }
  }

  customERC20TokenAddr: string = '';
  customERC20Token = {
    tokenContract: null,
    contractAddress: null,
    decimals: null,
    name: null,
    symbol: null
  }
  // 커스텀토큰 정보가져오기
  async getERCCustomTokenInfo() {
    this.customERC20Token.tokenContract = this.web3.eth.contract(contractABI).at(this.customERC20TokenAddr);
    this.customERC20Token.contractAddress = this.customERC20TokenAddr;
    this.customERC20Token.decimals = await this.promisify(cb => this.customERC20Token.tokenContract.decimals(cb))
    this.customERC20Token.name = await this.promisify(cb => this.customERC20Token.tokenContract.name(cb))
    this.customERC20Token.symbol = await this.promisify(cb => this.customERC20Token.tokenContract.symbol(cb))
    console.log("getERCCustomTokenInfo", this.customERC20Token)
    return this.customERC20Token;
  }

  ngOnInit() {
  }

  constructor() {
    this.initWallet();
    // https://mainnet.infura.io/u29i5wfNC2grMvfyA8MD
    // https://ropsten.infura.io/W1ye2T5XIKnOrX4IiAkR
    // this.web3 = new Web3(new Web3.providers.HttpProvider("https://mainnet.infura.io/u29i5wfNC2grMvfyA8MD"));
    this.web3 = new Web3(new Web3.providers.HttpProvider("https://ropsten.infura.io/W1ye2T5XIKnOrX4IiAkR"));
  }

  OpenETHWalletByPrivKey() {
    const fixturekey = Buffer.from(this.inputPrivKey, 'hex')
    const wallet = EthereumWallet.fromPrivateKey(fixturekey);
    this.ETHAddrByPrivKey = wallet.getAddressString();
  }

  createMnemonics() {
    const mnemonic = BIP39.generateMnemonic(256);
    this.ETHMnemonics = mnemonic;
  }

  getETHAddrByM(i) {
    const path = `m/44'/60'/0'/0/${i}`;
    const hdwallet = Hdkey.fromMasterSeed(BIP39.mnemonicToSeed(this.ETHMnemonics));
    const wallet = hdwallet.derivePath(path).getWallet();
    const privKey = wallet.getPrivateKey().toString('hex');
    const address = `0x${wallet.getAddress().toString('hex')}`;
    const walletInfo = {
      privKey : privKey,
      address :  address
    };
    return walletInfo;
  }

  //5개의 eth주소를 array로
  getETHAddrListByM(j) {
    let array = [];
    for (let i = 5 * j; i < 5 * (j + 1); i++) {
      const data = this.getETHAddrByM(i);
      array.push(data);
    }
    this.ETHAddrListByM = array;
    // return  array;
  };

  async getETHAddrByL(i) {
    let transport = await TransportU2F.create(5000, true);
    let eth = new AppEth(transport);
    
    const path = "m/44'/60'/0'/" + i;
    // const path = "m/44'/1'/0'/0/" + i;
    let addr;
    await eth.getAddress(path, false, false).then(res => {
      addr = res;
      addr.BIPPath = path;
      console.log(path, addr);
    })
    return addr;
  }

  //5개의 eth주소를 array로 by ledger
  async getETHAddrListByL(j) {
    let array = [];
    for (let i = 5 * j; i < 5 * (j + 1); i++) {
      const data = await this.getETHAddrByL(i);
      console.log("getETHAddrListByL", data);
      array.push(data);
    }
    console.log("getETHAddrListByL", array);
    this.ETHAddrListByL = array;
        // return array;
  };

  getETHAddrByLBtn () {
    this.getETHAddrListByL(1);
  }

  getETHAddrByMBtn() {
    this.getETHAddrListByM(1);
  }


  privKeyForSendETH: string = '';
  fromAddrForSendETH: string = '';
  toAddrForSendETH: string = '';
  amountForSendETH: number = null;
  GweiForSendETH: number = null;
  gasLimitForSendETH: number = null;

  sendBtn() {
    console.log("send", this.privKeyForSendETH, this.fromAddrForSendETH, this.toAddrForSendETH, this.amountForSendETH, this.GweiForSendETH, this.gasLimitForSendETH)
    this.sendETHByPrivKey(this.privKeyForSendETH, this.fromAddrForSendETH, this.toAddrForSendETH, this.amountForSendETH, this.GweiForSendETH, this.gasLimitForSendETH);
  }

  async sendETHByPrivKey(privKey: string, fromAddress: String, toAddress: String, amount: number, Gwei: number, gasLimit: number) {
    let txid, privateKey, decimal, nonce, gasPrice, to, value, data, chainId, txParams, tx, serializedTx, signedTransactionData
    privateKey = Buffer.from(privKey, 'hex')
    // Gwei = 15;
    decimal = 18;
    // gasLimit = 21000

    txParams = {
      nonce: this.web3.eth.getTransactionCount(fromAddress),
      gasPrice: this.web3.toHex(Gwei * 1000000000),
      gasLimit: this.web3.toHex(gasLimit),
      to: toAddress,
      value: this.web3.toHex(amount * Math.pow(10, decimal)),
      data: '',
      // data : contract.transfer.getData("0xCb...", 10, {from: "0x26..."}),
      chainId: 3
    }

    tx = new EthereumTx(txParams)
    tx.sign(privateKey)
    serializedTx = tx.serialize()
    signedTransactionData = '0x' + serializedTx.toString('hex');

    txid =await this.promisify(cb => this.web3.eth.sendRawTransaction(signedTransactionData, cb))

    try {
      console.log('Success! Txid', txid)
    } catch (error) {
      console.log('sendTransaction', error)
    }
  }




  privKeyForSendERC20: string = '';
  fromAddrForSendERC20: string = '';
  toAddrForSendERC20: string = '';
  amountForSendERC20: number = null;
  GweiForSendERC20: number = null;
  gasLimitForSendERC20: number = null;
  contractAddrForSendERC20: string = '';

  sendERC20Btn() {
    this.sendERC20ByPrivKey(this.privKeyForSendERC20, this.fromAddrForSendERC20, this.toAddrForSendERC20, this.amountForSendERC20,
      this.GweiForSendERC20, this.gasLimitForSendERC20, this.contractAddrForSendERC20);
  } 

  async sendERC20ByPrivKey(privKey: string, fromAddress: String, toAddress: String, amount: number, Gwei: number, gasLimit: number, contractAddress: string) {

    let txid, privateKey, decimal, nonce, gasPrice, to, value, chainId, txParams, tx, serializedTx, signedTransactionData
    privateKey = Buffer.from(privKey, 'hex')
    decimal = 18;

    let contract = this.web3.eth.contract(contractABI).at(contractAddress);
    let data = contract.transfer.getData(contractAddress, amount, { from: fromAddress });


    txParams = {
      nonce: this.web3.eth.getTransactionCount(fromAddress),
      gasPrice: this.web3.toHex(Gwei * 1000000000),
      gasLimit: this.web3.toHex(gasLimit),
      to: toAddress,
      value: 0,
      data: data,
      chainId: 3
    }

    tx = new EthereumTx(txParams)
    tx.sign(privateKey)
    serializedTx = tx.serialize()
    signedTransactionData = '0x' + serializedTx.toString('hex');

    txid = await this.promisify(cb => this.web3.eth.sendRawTransaction(signedTransactionData, cb))

    try {
      console.log('sendERC20ByPrivKey Success! Txid', txid)
    } catch (error) {
      console.log('sendERC20ByPrivKey', error)
    }
  }


  connectLedger() {
    this.getLedgerAddrArray(0);
  }

  initWallet() {
    let walletjs = EthereumWallet.generate();
    let privKey = walletjs.getPrivateKeyString();
    let pubKey = walletjs.getPublicKeyString();
    console.log("privKey", privKey, pubKey);
  }

  // 주소 가져오기
  async getAddress(i) {
    const transport = await TransportU2F.create(5000, true);
    const appBtc = new AppBtc(transport);
    const o = await appBtc.getWalletPublicKey("44'/88'/0'/0/" + i);
    console.log("getWalletPublicKey:", o);
    return o;
  }

  //5개의 퀀텀주소를 array로
  async getLedgerAddrArray(j) {
    let array = [];
    for (let i = 5 * j; i < 5 * (j + 1); i++) {
      const data = await this.getAddress(i);
      array.push(data);
    }
    console.log("getLedgerAddrArray", array);
    this.ledgerAddrList = array;
    // return array;
  };

  // ledger 사용가능 체크
  async checkLedgerSupport() {
    const transport = await TransportU2F.create(5000, true);
  }

  async getAddrByBip44Path(bip44path) {
    const transport = await TransportU2F.create(5000, true);
    const appBtc = new AppBtc(transport);
    const o = await appBtc.getWalletPublicKey(bip44path);
    console.log("getWalletPublicKey:", o);
    return o;
  }

  // 트랜잭션 서명
  async signByLedger(txidRawArray, txOutRaw, address) {
    const transport = await TransportU2F.create(5000, true);
    const appBtc = new AppBtc(transport);
    let txArray = [];
    let addrArray = [];
    for (let i = 0; i < txidRawArray.length; i++) {
      let tmp = [];
      let tx = appBtc.splitTransaction(txidRawArray[i].rawTx);
      tmp.push(tx);
      tmp.push(txidRawArray[i].n);
      //[tx1, 1]
      txArray.push(tmp);
      addrArray.push(address);
    }//[[tx1, 1], [tx2, 0]],

    let txOut = appBtc.splitTransaction(txOutRaw);
    let outputScript = appBtc.serializeTransactionOutputs(txOut).toString('hex');

    const result = await appBtc.createPaymentTransactionNew(
      txArray,
      addrArray,
      undefined,
      outputScript
    );
    console.log("result: " + result);
    return result;
  }

}
