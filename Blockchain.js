const crypto = require('crypto');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

class Transaction
{
    /**
   * @param {string} fromAddress
   * @param {string} toAddress
   * @param {number} amount
   */
    constructor(fromAddress, toAddress, amount)
    {
        this.fromAddress = fromAddress;
        this.toAddress = toAddress;
        this.amount = amount;
        this.timestamp = Date.now();
    }

    calculateHash()
    {
        return crypto.createHash('sha256').update(this.fromAddress + this.toAddress + this.amount + this.timestamp).digest('hex');
    }

    /**
   * Signs a transaction with the given signingKey (which is an Elliptic keypair
   * object that contains a private key). The signature is then stored inside the
   * transaction object and later stored on the blockchain.
   *
   * @param {string} signingKey
   */
    signTransaction(signingKey)
    {
        // You can only send a transaction from the wallet that is linked to your
        // key. So here we check if the fromAddress matches your publicKey
        if(signingKey.getPublic('hex') !== this.fromAddress)
        {
            throw new Error('You cannot sign transactions for other wallets!');
        }

        // Calculate the hash of this transaction, sign it with the key
        // and store it inside the transaction object
        const hashTx = this.calculateHash();
        const sig = signingKey.sign(hashTx, 'base64');

        this.signature = sig.toDER('hex');
    }

    /**
   * Checks if the signature is valid (transaction has not been tampered with).
   * It uses the fromAddress as the public key.
   *
   * @returns {boolean}
   */
    isValid()
    {
        // If the transaction doesn't have a from address we assume it's a
        // mining reward and that it's valid. You could verify this in a
        // different way (special field for instance)
        if(this.fromAddress === null) return true;

        if(!this.signature || this.signature.length === 0)
        {
            throw new Error('No signature in this transaction');
        }

        const publicKey = ec.keyFromPublic(this.fromAddress, 'hex');
        return publicKey.verify(this.calculateHash(), this.signature);
    }
}

class Block
{

    /**
   * @param {number} timestamp
   * @param {Transaction[]} transactions
   * @param {string} previousHash
   */
    constructor(timestamp, transactions, previousHash = '')
    {
        this.timestamp = timestamp;
        this.transactions = transactions;
        this.previousHash = previousHash;
        this.hash = this.calculateHash();
        this.nonce = 0;      
    }

    /**
   * Returns the SHA256 of this block (by processing all the data stored
   * inside this block)
   *
   * @returns {string}
   */
    calculateHash()
    {
        return crypto.createHash('sha256').update(this.previousHash + this.timestamp + JSON.stringify(this.transactions) + this.nonce).digest('hex');
    }

    /**
   * Starts the mining process on the block. It changes the 'nonce' until the hash
   * of the block starts with enough zeros (= difficulty)
   *
   * @param {number} difficulty
   */
    mineBlock(difficulty)
    {
        while(this.hash.substring(0, difficulty) !== Array(difficulty + 1).join("0"))
        {
            this.nonce++;
            this.hash = this.calculateHash();
        }

        console.log("Block mined: " + this.hash);
    }

    /**
   * Validates all the transactions inside this block (signature + hash) and
   * returns true if everything checks out. False if the block is invalid.
   *
   * @returns {boolean}
   */
    hasValidTransactions()
    {
        for(const tx of this.transactions)
        {
            if(!tx.isValid())
            {
                return false;
            }
        }

        return true;
    }
}

//Proof of work, for this you have to prove that you put alot of computing power into making the block
//Also called mining, bitcoin for example reqires the block to begin with a certain amount of zeros

/**
 * Build a Blockchain class
 */
class Blockchain
{
    constructor()
    {
        this.chain = [this.createGenesisBlock()];
        this.difficulty = 2;
        this.pendingTransactions = [];
        this.miningReward = 100;
    }

    /**
     * @returns {Block}
     */
    createGenesisBlock()
    {
        return new Block(Date.parse("01/01/2020"), [], "0");
    }

    /**
   * Returns the latest block on our chain. Useful when you want to create a
   * new Block and you need the hash of the previous Block.
   *
   * @returns {Block[]}
   */
    getLatestBlock()
    {
        return this.chain[this.chain.length - 1];
    }

    //Note technically this block of code in the method could be changed to get you more reward return
    //However, crytocurrency is powered by a peer to peer network, so the nodes in the network will not allow this and will ignore the changes

    /**
   * Takes all the pending transactions, puts them in a Block and starts the
   * mining process. It also adds a transaction to send the mining reward to
   * the given address.
   *
   * @param {string} miningRewardAddress
   */
    minePendingTransactions(miningRewardAddress)
    {
        const rewardTx = new Transaction(null, miningRewardAddress, this.miningReward);
        this.pendingTransactions.push(rewardTx);

        const block = new Block(Date.now(), this.pendingTransactions);
        block.mineBlock(this.difficulty);

        console.log('Block successfully mined!');
        this.chain.push(block);

        this.pendingTransactions = [];
        //Old Code
        /*this.pendingTransactions = [
            new Transaction(null, miningRewardAddress, this.miningReward)
        ];*/
    }

    /**
   * Add a new transaction to the list of pending transactions (to be added
   * next time the mining process starts). This verifies that the given
   * transaction is properly signed.
   *
   * @param {Transaction} transaction
   */
    addTransaction(transaction)
    {

        if(!transaction.fromAddress || !transaction.toAddress)
        {
            throw new Error('Transaction much include from and to address!');
        }

        //Verify the transaction
        if(!transaction.isValid())
        {
            throw new Error('Cannot add invalid transaction to the chain!');
        }

        if(transaction.amount <= 0)
        {
            throw new Error('Transaction amount should be higher than 0!');
        }

        //Make sure that the amount sent is not greater than existing balance
        if(this.getBalanceOfAddress(transaction.fromAddress) < transaction.amount)
        {
            //throw new Error('Not enough balance');
        }

        this.pendingTransactions.push(transaction);
        console.log('Transaction added: %s', transaction);
    }

    /**
   * Returns the balance of a given wallet address.
   *
   * @param {string} address
   * @returns {number} The balance of the wallet
   */
    getBalanceOfAddress(address)
    {
        let balance = 0;

        for(const block of this.chain)
        {
            for(const trans of block.transactions)
            {
                if(trans.fromAddress === address)
                {
                    balance -= trans.amount;
                }

                if(trans.toAddress === address)
                {
                    balance += trans.amount;
                }
            }                
        }
        console.log('getBalanceOfAddress: %s', balance);
        return balance;
    }


    // addBlock(newBlock)
    // {
    //     newBlock.previousHash = this.getLatestBlock().hash;
    //     newBlock.mineBlock(this.difficulty);
    //     //newBlock.hash = newBlock.calculateHash();
    //     this.chain.push(newBlock);
    // }

    /**
   * Returns a list of all transactions that happened
   * to and from the given wallet address.
   *
   * @param  {string} address
   * @return {Transaction[]}
   */
  getAllTransactionsForWallet(address) {
    const txs = [];

    for (const block of this.chain) {
      for (const tx of block.transactions) {
        if (tx.fromAddress === address || tx.toAddress === address) {
          txs.push(tx);
        }
      }
    }

    debug('get transactions for wallet count: %s', txs.length);
    return txs;
  }

  /**
   * Loops over all the blocks in the chain and verify if they are properly
   * linked together and nobody has tampered with the hashes. By checking
   * the blocks it also verifies the (signed) transactions inside of them.
   *
   * @returns {boolean}
   */
    isChainValid()
    {
        // Check if the Genesis block hasn't been tampered with by comparing
        // the output of createGenesisBlock with the first block on our chain
        const realGenesis = JSON.stringify(this.createGenesisBlock());

        if (realGenesis !== JSON.stringify(this.chain[0])) {
          return false;
        }

        // Check the remaining blocks on the chain to see if there hashes and
        // signatures are correct
        for(let i = 1; i < this.chain.length; i++)
        {
            const currentBlock = this.chain[i];
            //const previousBlock = this.chain[i - 1];

            if(!currentBlock.hasValidTransactions())
            {
                return false;
            }

            if(currentBlock.hash !== currentBlock.calculateHash())
            {
                return false;
            }

            //Old Code no reason to check previous block
            /*if(currentBlock.previousHash !== previousBlock.hash)
            {
                return false;
            }*/
        }

        return true;
    }
}

module.exports.Blockchain = Blockchain;
module.exports.Block = Block;
module.exports.Transaction = Transaction;