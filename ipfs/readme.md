# How to run the deploy scripts

All the IPFS-related command will be run from the local `go-ipfs` module, so that it will not conflict with any user environment. However it can be rather slow, so be patient!

Source:
- The [IPFS CLI quick start documentation](https://docs.ipfs.io/how-to/command-line-quick-start/)
- The [IPFS CLI complete documentation](https://docs.ipfs.io/reference/cli/)
- The [Pinata Pinning service API Documentation](https://docs.pinata.cloud/api-pinning/pinning-services-api)

---

## 0: Initialize the IPFS repository
First, we initialize our IPFS node:
```sh
## Start from the root directory of this project ##

# export everytime you reset your terminal, or once in a .rc file
export IPFS_PATH=`pwd`/ipfs/.go-ipfs
cd ipfs/

npx go-ipfs init
```

## 1: Run the local IPFS node

In another terminal, we will run the IPFS daemon to take our node online:
```sh
## Start from the root directory of this project ##

# export everytime you reset your terminal, or once in a .rc file
export IPFS_PATH=`pwd`/ipfs/.go-ipfs
npx go-ipfs daemon
```

## 2: Deploy the data on IPFS

We will first deploy our images, which will be pointed by the NFT's metadata.
```sh
## Start from the root directory of this project ##

# export everytime you reset your terminal, or once in a .rc file
export IPFS_PATH=`pwd`/ipfs/.go-ipfs
cd ipfs/

# NB: the -r option will create all images passed in the path into the IFPS node,
# however we only want ONE folder to contain all our data.
npx go-ipfs add -r images/
# Save the directory CID for the next commands.

# Images have been added to our IPFS node, but we need to 'pin' them: to be permanently accessible.
# We will use pinata.cloud services for that, see the following script:
node pin_to_pinata.mjs <Directory CID>
```
