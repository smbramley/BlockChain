const {Blockchain, Transaction} = require('./blockchain');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

// Your private key
const myKey = ec.keyFromPrivate('4ad4d3e04fe2ec626bdfea19737b957f0986ea27353c1c1912753f3f015c1014');

// From that we cna calculate your public key (which doubles as your wallet address)
const myWalletAddress = myKey.getPublic('hex');

// Create new instance of Blockchain class
const jscoin = new Blockchain();

// Create a transaction & sign it with your key
const tx1 = new Transaction(myWalletAddress, 'public key goes here', 100);
tx1.signTransaction(myKey);
jscoin.addTransaction(tx1);

//jscoin.createTransaction(new Transaction('address1', 'address2', 100));
//jscoin.createTransaction(new Transaction('address2', 'address1', 50));

console.log('\n Starting the miner...');
// Mine Block
jscoin.minePendingTransactions(myWalletAddress);

// Create second Transaction
const tx2 = new Transaction(myWalletAddress, 'address1', 50);
tx2.signTransaction(myKey);
jscoin.addTransaction(tx2);

// Mine Block
jscoin.minePendingTransactions(myWalletAddress);

console.log('\nBalance of Shanes wallet is', jscoin.getBalanceOfAddress(myWalletAddress));
console.log('Is chain valid?', jscoin.isChainValid());

//***Test case */
/*console.log('\n Starting the miner...');
jscoin.minePendingTransactions('shanes-address');

console.log('\nBalance of shane is', jscoin.getBalanceOfAddress('shanes-address'));*/


/*console.log('Mining block 1...');
jscoin.addBlock(new Block(1, "12/01/2020", {amount: 4}));
console.log('Mining block 2...');
jscoin.addBlock(new Block(2, "12/03/2020", {amount: 10}));
console.log('Mining block 3...');
jscoin.addBlock(new Block(3, "12/05/2020", {amount: 11}));*/

/*Check to see if the chain is valid
console.log('Is blockchain valid? ' + jscoin.isChainValid());

Change the block and this will tamper with the value which will break the blockchain
jscoin.chain[1].transaction = {amount: 100};
jscoin.chain[1].hash = jscoin.chain[1].calculateHash();

console.log('Is blockchain valid? ' + jscoin.isChainValid());*/

//Display out the coins hashkey
//console.log(JSON.stringify(jscoin, null, 4));