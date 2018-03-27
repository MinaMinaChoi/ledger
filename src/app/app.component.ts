import { Component } from '@angular/core';
import * as EthereumWallet from "../../node_modules/ethereumjs-wallet";
import * as HDKey from "../../node_modules/ethereumjs-wallet/hdkey";
import TransportU2F from "@ledgerhq/hw-transport-u2f";
import AppBtc from "@ledgerhq/hw-app-btc";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  ledgerAddrList = [];

  constructor() {
    this.initWallet();
  }

  connectLedger() {
    this.getLedgerAddrArray(0);

  }

  initWallet() {
    let walletjs = EthereumWallet.generate();
    let privKey = walletjs.getPrivateKeyString();
    let pubKey = walletjs.getPublicKeyString();
    console.log("privKey", privKey, pubKey, HDKey);
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
  };
}
