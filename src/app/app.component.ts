import { Component } from '@angular/core';
import * as EthereumWallet from "../../node_modules/ethereumjs-wallet";
import * as Hdkey from "../../node_modules/ethereumjs-wallet/hdkey";
import TransportU2F from "@ledgerhq/hw-transport-u2f";
import AppBtc from "@ledgerhq/hw-app-btc";
import AppEth from "@ledgerhq/hw-app-eth";
import * as BIP39 from "../../node_modules/bip39";
import * as Web3 from "../../node_modules/web3";
import * as contractABI from "../../node_modules/human-standard-token-abi";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {

  ledgerAddrList = [];

  ETHAddrListByL = [];
  ETHAddrListByM = [];
  ETHMnemonics: string;

  constructor() {
    this.initWallet();
  }

  createMnemonics() {
    const mnemonic = BIP39.generateMnemonic(256);
    this.ETHMnemonics = mnemonic;
  }

  getETHAddrByM(i) {
    const path = `m/44'/60'/0'/0/${i}`;
    const hdwallet = Hdkey.fromMasterSeed(BIP39.mnemonicToSeed(this.ETHMnemonics));
    const wallet = hdwallet.derivePath(path).getWallet();
    // const privKey = wallet.getPrivateKey().toString('hex');
    const address = `0x${wallet.getAddress().toString('hex')}`;

    return address;
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



  btnLedger(){
    async function getEtherAddress() {
      let transport;
      try {
        transport = await TransportU2F.create();
        let eth = new AppEth(transport);

        eth.getAddress("m/44'/1'/0'/0",false,false).then(function(publicKey) {
          console.log(JSON.stringify(publicKey));
        }).catch(function(err) {
          console.log(err);
        });
      } catch (e) {
        console.log(e);
      }
    } 
    getEtherAddress();
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
